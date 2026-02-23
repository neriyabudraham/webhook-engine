import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { PrismaService } from '../../prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { WebhookProcessor } from './webhook.processor';
import { HttpModule } from '@nestjs/axios'; // חובה בשביל ה-Processor החדש

@Module({
  imports: [
    HttpModule, // <--- הוספנו את זה
    BullModule.registerQueue({
      name: 'webhook-processing',
    }),
  ],
  controllers: [EventsController],
  providers: [PrismaService, WebhookProcessor], // מוודאים שהמעבד רשום כאן
  exports: [BullModule] 
})
export class EventsModule {}
