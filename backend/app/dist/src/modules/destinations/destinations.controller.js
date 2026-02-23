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
exports.DestinationsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const prisma_service_1 = require("../../prisma.service");
let DestinationsController = class DestinationsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyDestinations(req) {
        return this.prisma.destination.findMany({
            where: { source: { userId: req.user.userId } },
            include: { source: { select: { id: true, name: true, slug: true } }, filters: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async getDestinationDetails(req, id) {
        const dest = await this.prisma.destination.findFirst({
            where: { id, source: { userId: req.user.userId } },
            include: { source: { select: { id: true, name: true, slug: true } }, filters: true, _count: { select: { deliveries: true } } }
        });
        if (!dest)
            throw new common_1.NotFoundException('Destination not found');
        return dest;
    }
    async createDestination(req, body) {
        const { sourceId, url, method, filters, delay } = body;
        const source = await this.prisma.source.findFirst({ where: { id: sourceId, userId: req.user.userId } });
        if (!source)
            throw new common_1.NotFoundException('Source access denied');
        const destination = await this.prisma.destination.create({ data: { sourceId: source.id, url, method: method || 'POST', delay: delay || 0 } });
        if (filters && filters.length > 0) {
            await this.prisma.filter.createMany({ data: filters.map(f => ({ destinationId: destination.id, key: f.key, operator: f.operator, value: f.value })) });
        }
        return { message: 'Created', id: destination.id };
    }
    async updateDestination(req, id, body) {
        const { url, method, delay, filters, rules, rulesDescription } = body;
        const existing = await this.prisma.destination.findFirst({ where: { id, source: { userId: req.user.userId } } });
        if (!existing)
            throw new common_1.NotFoundException('Not found');
        await this.prisma.destination.update({
            where: { id },
            data: {
                url, method,
                delay: delay !== undefined ? parseInt(delay) : undefined,
                rules,
                rulesDescription
            }
        });
        if (filters) {
            await this.prisma.filter.deleteMany({ where: { destinationId: id } });
            if (filters.length > 0) {
                await this.prisma.filter.createMany({ data: filters.map(f => ({ destinationId: id, key: f.key, operator: f.operator, value: f.value })) });
            }
        }
        return { success: true };
    }
    async deleteDestination(req, id) {
        const dest = await this.prisma.destination.findFirst({ where: { id, source: { userId: req.user.userId } } });
        if (!dest)
            throw new common_1.NotFoundException('Not found');
        await this.prisma.filter.deleteMany({ where: { destinationId: id } });
        await this.prisma.delivery.deleteMany({ where: { destinationId: id } });
        await this.prisma.destination.delete({ where: { id } });
        return { success: true };
    }
};
exports.DestinationsController = DestinationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "getMyDestinations", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "getDestinationDetails", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "createDestination", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "updateDestination", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "deleteDestination", null);
exports.DestinationsController = DestinationsController = __decorate([
    (0, common_1.Controller)('my/destinations'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DestinationsController);
//# sourceMappingURL=destinations.controller.js.map