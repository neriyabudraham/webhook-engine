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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const prisma_service_1 = require("../../prisma.service");
let AdminController = class AdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    checkAdmin(req) {
        if (req.user.role !== 'ADMIN')
            throw new common_1.ForbiddenException('Admins only');
    }
    async getAllUsers(req) {
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
            sourcesCount: u._count.sources,
            eventsCount: u.sources.reduce((sum, s) => sum + s._count.events, 0)
        }));
    }
    async deleteUser(req, id) {
        this.checkAdmin(req);
        await this.prisma.delivery.deleteMany({ where: { event: { source: { userId: id } } } });
        await this.prisma.event.deleteMany({ where: { source: { userId: id } } });
        await this.prisma.filter.deleteMany({ where: { destination: { source: { userId: id } } } });
        await this.prisma.destination.deleteMany({ where: { source: { userId: id } } });
        await this.prisma.source.deleteMany({ where: { userId: id } });
        await this.prisma.user.delete({ where: { id } });
        return { success: true };
    }
    async updateUser(req, id, body) {
        this.checkAdmin(req);
        return this.prisma.user.update({ where: { id }, data: body });
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map