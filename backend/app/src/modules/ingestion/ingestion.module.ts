import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { EmailIngestionService } from './email.service';
import { BullModule } from '@nestjs/bullmq';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'webhook-processing',
    }),
  ],
  controllers: [IngestionController],
  providers: [PrismaService, EmailIngestionService], // הוספנו את EmailIngestionService
})
export class IngestionModule {}
