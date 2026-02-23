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
var BillingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const prisma_service_1 = require("../../prisma.service");
const billing_service_1 = require("./billing.service");
let BillingController = BillingController_1 = class BillingController {
    constructor(prisma, billingService) {
        this.prisma = prisma;
        this.billingService = billingService;
        this.logger = new common_1.Logger(BillingController_1.name);
    }
    async getLinks() {
        const settings = await this.prisma.systemSetting.findMany({
            where: { key: { in: ['link_basic', 'link_pro', 'link_enterprise'] } }
        });
        return settings.reduce((acc, curr) => (Object.assign(Object.assign({}, acc), { [curr.key]: curr.value })), {});
    }
    async updateLinks(req, body) {
        const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user || user.role !== 'ADMIN')
            throw new common_1.ForbiddenException('Admins only');
        const links = ['link_basic', 'link_pro', 'link_enterprise'];
        for (const key of links) {
            if (body[key]) {
                await this.prisma.systemSetting.upsert({
                    where: { key },
                    update: { value: String(body[key]) },
                    create: { key, value: String(body[key]) }
                });
            }
        }
        return { success: true };
    }
    async verifyPaymentStatus(req) {
        var _a, _b, _c;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.sub) || ((_c = req.user) === null || _c === void 0 ? void 0 : _c.userId);
        return await this.billingService.verifyPayment(req.user.email, userId);
    }
    async handleSumitWebhook(body) {
        this.logger.log('Webhook hit!');
        return await this.billingService.processWebhook(body);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)('links'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getLinks", null);
__decorate([
    (0, common_1.Post)('links'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updateLinks", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "verifyPaymentStatus", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "handleSumitWebhook", null);
exports.BillingController = BillingController = BillingController_1 = __decorate([
    (0, common_1.Controller)('billing'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map