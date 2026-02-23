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
exports.SourcesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const prisma_service_1 = require("../../prisma.service");
const crypto = require("crypto");
let SourcesController = class SourcesController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSource(req, body) {
        let cleanName = body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        if (cleanName.length < 2)
            cleanName = 'source';
        const randomSuffix = crypto.randomBytes(3).toString('hex');
        const finalSlug = `${cleanName}-${randomSuffix}`;
        const source = await this.prisma.source.create({
            data: {
                name: body.name,
                slug: finalSlug,
                userId: req.user.userId,
                type: body.type || 'WEBHOOK'
            },
        });
        return source;
    }
    async getMySources(req) {
        return this.prisma.source.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { events: true } }, destinations: { include: { filters: true } } }
        });
    }
    async getSourceDetails(req, id) {
        const source = await this.prisma.source.findFirst({ where: { id, userId: req.user.userId }, include: { _count: { select: { events: true } }, destinations: { include: { filters: true } } } });
        if (!source)
            throw new common_1.NotFoundException('Source not found');
        return source;
    }
    async updateSource(req, id, body) {
        return this.prisma.source.update({ where: { id, userId: req.user.userId }, data: { name: body.name } });
    }
    async deleteSource(req, id) {
        const source = await this.prisma.source.findFirst({ where: { id, userId: req.user.userId } });
        if (!source)
            throw new common_1.NotFoundException('Source not found');
        await this.prisma.delivery.deleteMany({ where: { event: { sourceId: id } } });
        await this.prisma.event.deleteMany({ where: { sourceId: id } });
        await this.prisma.filter.deleteMany({ where: { destination: { sourceId: id } } });
        await this.prisma.destination.deleteMany({ where: { sourceId: id } });
        await this.prisma.source.delete({ where: { id } });
        return { success: true };
    }
};
exports.SourcesController = SourcesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SourcesController.prototype, "createSource", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SourcesController.prototype, "getMySources", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SourcesController.prototype, "getSourceDetails", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SourcesController.prototype, "updateSource", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SourcesController.prototype, "deleteSource", null);
exports.SourcesController = SourcesController = __decorate([
    (0, common_1.Controller)('my/sources'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SourcesController);
//# sourceMappingURL=sources.controller.js.map