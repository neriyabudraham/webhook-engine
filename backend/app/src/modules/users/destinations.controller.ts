import { Controller, Get, Post, Body, UseGuards, Request, Param, Delete, Patch, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma.service';

@Controller('my/destinations')
@UseGuards(AuthGuard(['jwt', 'api-key'])) 
export class DestinationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getMyDestinations(@Request() req) {
    return this.prisma.destination.findMany({
      where: { source: { userId: req.user.userId } },
      include: { 
        source: { select: { id: true, name: true, slug: true, type: true } }, 
        filters: true 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Get(':id')
  async getDestDetails(@Request() req, @Param('id') id: string) {
    const dest = await this.prisma.destination.findFirst({
      where: { id, source: { userId: req.user.userId } },
      include: { 
        source: { select: { id: true, name: true, slug: true, type: true } }, // מידע שהפרונט צריך
        filters: true,
        _count: { select: { deliveries: true } } // הספירה שהייתה חסרה
      }
    });
    if (!dest) throw new NotFoundException('Destination not found');
    return dest;
  }

  @Post()
  async createDestination(@Request() req, @Body() body: any) {
    const source = await this.prisma.source.findFirst({ where: { id: body.sourceId, userId: req.user.userId } });
    if (!source) throw new NotFoundException('Source not found');

    const dest = await this.prisma.destination.create({
      data: {
        sourceId: body.sourceId,
        url: body.url,
        method: body.method || 'POST',
        headers: body.headers || {},
        delay: body.delay ? parseInt(body.delay) : 0,
        // אם נשלח טקסט של קוד - שמור אותו. אם נשלחו פילטרים - נקה אותו.
        rules: (body.filters && body.filters.length > 0) ? null : (body.rules || body.filterCode),
        rulesDescription: body.rulesDescription,
        filters: {
            create: body.filters || []
        }
      },
      include: { filters: true }
    });
    return { success: true, id: dest.id };
  }

  @Patch(':id')
  async updateDestination(@Request() req, @Param('id') id: string, @Body() body: any) {
    const dest = await this.prisma.destination.findFirst({ where: { id, source: { userId: req.user.userId } } });
    if (!dest) throw new NotFoundException('Destination not found');

    // מחיקת פילטרים ישנים אם המשתמש בחר לעדכן אותם
    if (body.filters) {
        await this.prisma.filter.deleteMany({ where: { destinationId: id } });
    }

    // לוגיקה לקביעת תוכן ה-Rules
    // אם המשתמש שולח פילטרים רגילים, נאפס את ה-Rules המתקדמים כדי למנוע בלבול
    let rulesContent = body.rules || body.filterCode;
    if (body.filters && body.filters.length > 0) {
        rulesContent = null; 
    }

    // אם לא נשלח שום דבר חדש לגבי rules, נשמור על הקיים (אלא אם עברנו לפילטרים רגילים)
    if (rulesContent === undefined && !body.filters) {
        rulesContent = dest.rules;
    }

    const updateData: any = {
        url: body.url,
        method: body.method,
        delay: body.delay !== undefined ? parseInt(body.delay) : undefined,
        headers: body.headers,
        rules: rulesContent,
        rulesDescription: body.rulesDescription,
    };

    if (body.filters) {
        updateData.filters = { create: body.filters };
    }

    return this.prisma.destination.update({
        where: { id },
        data: updateData,
        include: { filters: true }
    });
  }

  @Delete(':id')
  async deleteDestination(@Request() req, @Param('id') id: string) {
    const dest = await this.prisma.destination.findFirst({ where: { id, source: { userId: req.user.userId } } });
    if (!dest) throw new NotFoundException('Not found');

    await this.prisma.filter.deleteMany({ where: { destinationId: id } });
    await this.prisma.delivery.deleteMany({ where: { destinationId: id } });
    await this.prisma.destination.delete({ where: { id } });
    return { success: true };
  }
}