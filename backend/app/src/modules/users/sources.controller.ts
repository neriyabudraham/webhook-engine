import { Controller, Post, Body, UseGuards, Request, Get, Delete, Patch, Param, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Controller('my/sources')
@UseGuards(AuthGuard('jwt'))
export class SourcesController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async createSource(@Request() req, @Body() body: { name: string, type?: 'WEBHOOK' | 'EMAIL' }) {
    let cleanName = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (cleanName.length < 2) cleanName = 'source'; 
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const finalSlug = `${cleanName}-${randomSuffix}`;

    const source = await this.prisma.source.create({
      data: { 
          name: body.name, 
          slug: finalSlug, 
          userId: req.user.userId,
          type: body.type || 'WEBHOOK' // תמיכה בסוג
      },
    });
    return source;
  }

  @Get()
  async getMySources(@Request() req) {
    return this.prisma.source.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { events: true } }, destinations: { include: { filters: true } } }
    });
  }

  // שאר הפונקציות (Get details, Update, Delete) נשארות אותו דבר...
  @Get(':id')
  async getSourceDetails(@Request() req, @Param('id') id: string) {
    const source = await this.prisma.source.findFirst({ where: { id, userId: req.user.userId }, include: { _count: { select: { events: true } }, destinations: { include: { filters: true } } } });
    if (!source) throw new NotFoundException('Source not found');
    return source;
  }
  @Patch(':id')
  async updateSource(@Request() req, @Param('id') id: string, @Body() body: { name: string }) {
    return this.prisma.source.update({ where: { id, userId: req.user.userId }, data: { name: body.name } });
  }
  @Delete(':id')
  async deleteSource(@Request() req, @Param('id') id: string) {
    const source = await this.prisma.source.findFirst({ where: { id, userId: req.user.userId } });
    if (!source) throw new NotFoundException('Source not found');
    await this.prisma.delivery.deleteMany({ where: { event: { sourceId: id } } });
    await this.prisma.event.deleteMany({ where: { sourceId: id } });
    await this.prisma.filter.deleteMany({ where: { destination: { sourceId: id } } });
    await this.prisma.destination.deleteMany({ where: { sourceId: id } });
    await this.prisma.source.delete({ where: { id } });
    return { success: true };
  }
}
