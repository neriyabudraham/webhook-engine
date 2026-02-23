import { Module } from '@nestjs/common';
import { WebhookProcessor } from './webhook.processor';
import { PrismaService } from '../../prisma.service';

@Module({
  providers: [WebhookProcessor, PrismaService],
})
export class ProcessorModule {}
