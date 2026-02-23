import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma.service';

export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: string;
    path?: string;
    contentType?: string;
  }>;
}

@Injectable()
export class OutboundService {
  private transporter;
  private readonly logger = new Logger(OutboundService.name);

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'office@neriyabudraham.co.il',
        pass: 'zmnkndnvxrswopnq',
      },
    });
  }

  async sendEmail(userId: string, dto: SendEmailDto): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    if (user.usageCount >= user.monthlyLimit) {
      throw new ForbiddenException('Monthly email limit reached');
    }

    const recipients = Array.isArray(dto.to) ? dto.to : [dto.to];
    const recipientCount = recipients.length;

    try {
      const info = await this.transporter.sendMail({
        from: dto.from || `"${user.name || 'WebhookEngine'}" <office@neriyabudraham.co.il>`,
        to: recipients.join(', '),
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
        replyTo: dto.replyTo,
        attachments: dto.attachments,
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { usageCount: { increment: recipientCount } },
      });

      await this.prisma.outboundEmail.create({
        data: {
          userId,
          to: recipients,
          subject: dto.subject,
          status: 'SENT',
          messageId: info.messageId,
        },
      });

      this.logger.log(`✉️ Email sent to ${recipients.join(', ')} by user ${userId}`);

      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);

      await this.prisma.outboundEmail.create({
        data: {
          userId,
          to: recipients,
          subject: dto.subject,
          status: 'FAILED',
          error: error.message,
        },
      });

      return { success: false, error: error.message };
    }
  }

  async getOutboundHistory(userId: string, limit = 50) {
    return this.prisma.outboundEmail.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
