import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Controller('my/api-keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeysController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getKeys(@Request() req) {
    return this.prisma.apiKey.findMany({ 
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' }
    });
  }

  @Post()
  async createKey(@Request() req, @Body() body: { name: string }) {
    const key = 'wk_' + crypto.randomBytes(16).toString('hex');
    return this.prisma.apiKey.create({
      data: {
        userId: req.user.userId,
        name: body.name || 'מפתח כללי',
        key: key
      }
    });
  }

  @Delete(':id')
  async deleteKey(@Request() req, @Param('id') id: string) {
    await this.prisma.apiKey.deleteMany({ 
        where: { id, userId: req.user.userId } 
    });
    return { success: true };
  }
}
