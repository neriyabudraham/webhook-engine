import { Controller, Post, Get, UseGuards, Request, Body, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OutboundService, SendEmailDto } from './outbound.service';

@Controller('my/outbound')
@UseGuards(AuthGuard('jwt'))
export class OutboundController {
  constructor(private outboundService: OutboundService) {}

  @Post('send')
  async sendEmail(@Request() req, @Body() dto: SendEmailDto) {
    return this.outboundService.sendEmail(req.user.userId, dto);
  }

  @Get('history')
  async getHistory(@Request() req, @Query('limit') limit: string) {
    return this.outboundService.getOutboundHistory(
      req.user.userId,
      limit ? parseInt(limit) : 50
    );
  }
}
