import { Controller, Get, Delete, Patch, Post, UseGuards, Request, ForbiddenException, Param, Body, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  private checkAdmin(req) {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admins only');
  }

  @Get('users')
  async getAllUsers(@Request() req) {
    this.checkAdmin(req);
    
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sources: true } },
        sources: { select: { _count: { select: { events: true } } } }
      }
    });

    return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        plan: u.plan,
        createdAt: u.createdAt,
        usageCount: u.usageCount,
        monthlyLimit: u.monthlyLimit,
        // apiKey הוסר מכאן כי הוא לא קיים יותר
        sourcesCount: u._count.sources,
        eventsCount: u.sources.reduce((sum, s) => sum + s._count.events, 0)
    }));
  }

  @Delete('users/:id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    this.checkAdmin(req);
    await this.prisma.delivery.deleteMany({ where: { event: { source: { userId: id } } } });
    await this.prisma.event.deleteMany({ where: { source: { userId: id } } });
    await this.prisma.filter.deleteMany({ where: { destination: { source: { userId: id } } } });
    await this.prisma.destination.deleteMany({ where: { source: { userId: id } } });
    await this.prisma.source.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  @Patch('users/:id')
  async updateUser(@Request() req, @Param('id') id: string, @Body() body: any) {
    this.checkAdmin(req);
    return this.prisma.user.update({ where: { id }, data: body });
  }

  @Post('impersonate/:id')
  async impersonateUser(@Request() req, @Param('id') id: string) {
    this.checkAdmin(req);
    
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    
    // Generate token for the target user (use 'sub' to match JWT strategy)
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      impersonatedBy: req.user.userId
    });
    
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }
}
