import { Module } from '@nestjs/common';
import { OutboundController } from './outbound.controller';
import { OutboundService } from './outbound.service';
import { PrismaService } from '../../prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [OutboundController],
  providers: [OutboundService, PrismaService],
})
export class OutboundModule {}
