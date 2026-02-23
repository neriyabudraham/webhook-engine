import { Controller, Get, Post, UseGuards, Request, Param, NotFoundException, Query, Body, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('my/events')
@UseGuards(AuthGuard('jwt'))
export class EventsController {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhook-processing') private webhookQueue: Queue,
  ) {}

  @Get()
  async getEvents(@Request() req, @Query('limit') limitStr: string, @Query('sourceId') sourceId: string, @Query('search') search: string) {
    const limit = limitStr ? parseInt(limitStr) : 50;
    const userId = req.user.userId;

    // --- לוגיקת חיפוש עומק (Deep Search) ---
    // אם המשתמש הקליד משהו בחיפוש, אנחנו משתמשים ב-SQL ישיר
    // כדי לחפש בתוך הטקסט של ה-JSON (דבר ש-Prisma רגיל מתקשה לעשות)
    if (search && search.trim().length > 0) {
        const searchTerm = `%${search}%`;
        
        try {
            const events = await this.prisma.$queryRaw`
                SELECT e.*, s.name as "sourceName", s.slug as "sourceSlug"
                FROM events e
                JOIN sources s ON e."sourceId" = s.id
                WHERE s."userId" = ${userId}
                AND (${sourceId}::text IS NULL OR e."sourceId" = ${sourceId})
                AND (
                    e.payload::text ILIKE ${searchTerm} 
                    OR e.id::text ILIKE ${searchTerm}
                )
                ORDER BY e."createdAt" DESC
                LIMIT ${limit}
            `;
            
            return { data: events };
        } catch (e) {
            console.error("Search Error:", e);
            // במקרה של שגיאה בחיפוש, נחזיר רשימה ריקה כדי לא להפיל את האתר
            return { data: [] };
        }
    }

    // --- לוגיקה רגילה (ללא חיפוש) ---
    const whereClause: any = {
        source: { userId: userId }
    };
    if (sourceId) whereClause.sourceId = sourceId;

    const events = await this.prisma.event.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        source: { select: { name: true, slug: true } },
        deliveries: { select: { status: true, createdAt: true } }
      }
    });
    
    return { data: events };
  }

  @Post('send-custom')
  async sendCustomEvent(@Request() req, @Body() body: { sourceId: string; payload: any }) {
    // Verify source ownership
    const source = await this.prisma.source.findFirst({
      where: { id: body.sourceId, userId: req.user.userId }
    });
    
    if (!source) throw new ForbiddenException('Source not found or not owned by user');

    // Create new event with custom payload
    const newEvent = await this.prisma.event.create({
      data: {
        sourceId: body.sourceId,
        payload: {
          ...body.payload,
          _custom: {
            createdAt: new Date().toISOString(),
            manual: true
          }
        },
        headers: { source: 'manual', createdBy: req.user.userId }
      }
    });

    // Increment usage counter
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { usageCount: { increment: 1 } }
    });

    // Add to processing queue
    await this.webhookQueue.add('process-webhook', {
      eventId: newEvent.id,
      sourceId: newEvent.sourceId
    }, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true
    });

    return { success: true, message: 'Custom event created', eventId: newEvent.id };
  }

  @Get(':id')
  async getEventDetails(@Request() req, @Param('id') id: string) {
    const event = await this.prisma.event.findFirst({
      where: { 
        id: id, 
        source: { userId: req.user.userId } 
      },
      include: { 
        source: { select: { name: true, slug: true } }, 
        deliveries: { 
          include: { destination: true } 
        } 
      }
    });

    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  @Post(':id/replay')
  async replayEvent(@Request() req, @Param('id') id: string) {
    // Find original event and verify ownership
    const originalEvent = await this.prisma.event.findFirst({
      where: { 
        id: id, 
        source: { userId: req.user.userId } 
      },
      include: { source: true }
    });

    if (!originalEvent) throw new NotFoundException('Event not found');

    // Create new event with same payload (marked as replay)
    const newEvent = await this.prisma.event.create({
      data: {
        sourceId: originalEvent.sourceId,
        payload: {
          ...(originalEvent.payload as any),
          _replay: {
            originalEventId: originalEvent.id,
            replayedAt: new Date().toISOString()
          }
        },
        headers: originalEvent.headers
      }
    });

    // Increment usage counter
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { usageCount: { increment: 1 } }
    });

    // Add to processing queue
    await this.webhookQueue.add('process-webhook', {
      eventId: newEvent.id,
      sourceId: newEvent.sourceId
    }, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true
    });

    return { success: true, message: 'Event replayed', newEventId: newEvent.id };
  }
}