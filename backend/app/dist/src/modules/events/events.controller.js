"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const prisma_service_1 = require("../../prisma.service");
let EventsController = class EventsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getEvents(req) {
        return this.prisma.event.findMany({
            where: {
                source: { userId: req.user.userId }
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                source: { select: { name: true, slug: true } },
                deliveries: { select: { status: true, createdAt: true } }
            }
        });
    }
    async getEventDetails(req, id) {
        const event = await this.prisma.event.findFirst({
            where: {
                id: id,
                source: { userId: req.user.userId }
            },
            include: {
                source: { select: { name: true, slug: true } },
                deliveries: {
                    include: { destination: true }
                }
            }
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        return event;
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EventsController.prototype, "getEventDetails", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)('my/events'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsController);
//# sourceMappingURL=events.controller.js.map