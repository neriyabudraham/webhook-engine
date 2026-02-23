import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async getProfile(@Request() req) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        usageCount: true,    // חשוב לדאשבורד
        monthlyLimit: true,  // חשוב לדאשבורד
        createdAt: true
      }
    });
    return user;
  }
}
