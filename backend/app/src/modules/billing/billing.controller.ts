import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private prisma: PrismaService,
    private billingService: BillingService
  ) {}

  @Get('links')
  async getLinks() {
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { in: ['link_basic', 'link_pro', 'link_enterprise'] } }
    });
    return settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
  }

  @Post('links')
  @UseGuards(AuthGuard('jwt'))
  async updateLinks(@Request() req, @Body() body: any) {
    // בדיקת אדמין (הקוד הקודם שעובד)
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.role !== 'ADMIN') throw new ForbiddenException('Admins only');

    const links = ['link_basic', 'link_pro', 'link_enterprise'];
    for (const key of links) {
      if (body[key]) {
        await this.prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(body[key]) },
          create: { key, value: String(body[key]) }
        });
      }
    }
    return { success: true };
  }

  @Post('verify')
  @UseGuards(AuthGuard('jwt'))
  async verifyPaymentStatus(@Request() req) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return await this.billingService.verifyPayment(req.user.email, userId);
  }

  // --- ה-Webhook החדש (פתוח ל-Sumit) ---
  @Post('webhook')
  async handleSumitWebhook(@Body() body: any) {
    // כאן Sumit שולחים לנו את המידע
    // מומלץ: להוסיף בדיקת חתימה או IP אם Sumit תומכים בזה לאבטחה
    this.logger.log('Webhook hit!');
    return await this.billingService.processWebhook(body);
  }
}
