import { Controller, Post, Param, Body, Headers, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma.service';

@Controller('webhook')
export class IngestionController {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhook-processing') private webhookQueue: Queue,
  ) {}

  @Post(':slug')
  async handleWebhook(
    @Param('slug') slug: string,
    @Body() body: any,
    @Headers() headers: any,
  ) {
    // 1. שליפת המקור + נתוני משתמש (כולל ROLE)
    const source = await this.prisma.source.findUnique({
      where: { slug },
      select: { 
        id: true, 
        active: true, 
        userId: true,
        user: { select: { usageCount: true, monthlyLimit: true, role: true } } // הוספנו את role
      }
    });

    if (!source) throw new NotFoundException('Source not found');
    
    if (!source.active) {
        return { status: 'ignored', reason: 'source_inactive' };
    }

    // 2. --- בדיקת מגבלה (רק אם לא מנהל) ---
    if (source.user.role !== 'ADMIN') {
        if (source.user.usageCount >= source.user.monthlyLimit) {
          console.warn(`Limit reached for user ${source.userId}`);
          throw new HttpException({
            status: 'error',
            code: 'LIMIT_REACHED',
            message: 'Monthly event limit exceeded.'
          }, HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    // 3. שמירת האירוע
    const event = await this.prisma.event.create({
      data: {
        sourceId: source.id,
        payload: body,
        headers: headers,
      },
    });

    // 4. עדכון מונה (גם למנהל אנחנו סופרים, אבל לא חוסמים)
    try {
        await this.prisma.user.update({
            where: { id: source.userId },
            data: { usageCount: { increment: 1 } }
        });
    } catch (e) { console.error(e); }

    // 5. שליחה לתור
    await this.webhookQueue.add('process-webhook', {
      eventId: event.id,
      sourceId: source.id
    }, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true
    });

    return { status: 'accepted', eventId: event.id };
  }
}
