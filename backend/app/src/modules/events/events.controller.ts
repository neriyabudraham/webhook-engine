import { Controller, Get, UseGuards, Request, Param, NotFoundException, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';

@Controller('my/events')
@UseGuards(AuthGuard('jwt'))
export class EventsController {
  constructor(private prisma: PrismaService) {}

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
}