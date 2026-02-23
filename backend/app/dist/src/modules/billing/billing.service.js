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
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = require("axios");
let BillingService = BillingService_1 = class BillingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BillingService_1.name);
        this.SUMIT_API_URL = process.env.SUMIT_API_URL || 'https://api.sumit.co.il';
        this.COMPANY_ID = process.env.SUMIT_COMPANY_ID;
        this.API_KEY = process.env.SUMIT_API_KEY;
    }
    async syncMissedPayments() {
        this.logger.log('🔄 Running background payment sync (Safety Net)...');
        if (!this.COMPANY_ID || !this.API_KEY)
            return;
        try {
            const dateFrom = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            const dateTo = new Date().toISOString();
            const response = await axios_1.default.post(`${this.SUMIT_API_URL}/billing/payments/list/`, {
                Credentials: { CompanyID: this.COMPANY_ID, APIKey: this.API_KEY },
                Date_From: dateFrom,
                Date_To: dateTo,
                Valid: true,
                StartIndex: 0
            });
            if (response.data.Status !== 0)
                return;
            const payments = response.data.Data.Payments || [];
            this.logger.log(`🔍 Found ${payments.length} recent payments in Sumit.`);
            for (const payment of payments) {
                let userId = payment.CustomData || payment.CustomData_1 || payment.ExternalIdentifier;
                if (!userId) {
                    const customer = await this.getCustomerDetails(payment.CustomerID);
                    if (customer && customer.Email) {
                        const user = await this.prisma.user.findUnique({ where: { email: customer.Email } });
                        if (user)
                            userId = user.id;
                    }
                }
                if (userId) {
                    await this.updateUserPlan(userId, payment.Amount, payment.ID);
                }
            }
        }
        catch (e) {
            this.logger.error('Background sync failed', e);
        }
    }
    async verifyPayment(userEmail, userId) {
        var _a;
        if (!this.COMPANY_ID || !this.API_KEY)
            return { success: false, message: 'Config error' };
        try {
            const dateFrom = new Date(Date.now() - 10 * 60 * 1000).toISOString();
            const dateTo = new Date().toISOString();
            const res = await axios_1.default.post(`${this.SUMIT_API_URL}/billing/payments/list/`, {
                Credentials: { CompanyID: this.COMPANY_ID, APIKey: this.API_KEY },
                Date_From: dateFrom, Date_To: dateTo, Valid: true, StartIndex: 0
            });
            const payments = ((_a = res.data.Data) === null || _a === void 0 ? void 0 : _a.Payments) || [];
            for (const p of payments) {
                const customer = await this.getCustomerDetails(p.CustomerID);
                const isIdMatch = (p.CustomData === userId || p.CustomData_1 === userId);
                const isEmailMatch = (customer && customer.Email === userEmail);
                if (isIdMatch || isEmailMatch) {
                    return await this.updateUserPlan(userId, p.Amount, p.ID);
                }
            }
            return { success: false, message: 'Not found yet' };
        }
        catch (e) {
            return { success: false };
        }
    }
    async processWebhook(data) {
        this.logger.log('Webhook received: ' + JSON.stringify(data));
        const userId = data.CustomData || data.CustomData_1 || data.ExternalIdentifier;
        const amount = parseFloat(data.Amount || data.TotalAmount || '0');
        const paymentId = data.PaymentID || data.ID;
        if (!userId)
            return { success: false, reason: 'no_user_id' };
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return { success: false, reason: 'user_not_found' };
        return await this.updateUserPlan(userId, amount, paymentId);
    }
    async getCustomerDetails(sumitCustomerId) {
        try {
            const response = await axios_1.default.post(`${this.SUMIT_API_URL}/crm/customers/get/`, {
                Credentials: { CompanyID: this.COMPANY_ID, APIKey: this.API_KEY },
                CustomerID: sumitCustomerId
            });
            return response.data.Data;
        }
        catch (e) {
            return null;
        }
    }
    async updateUserPlan(userId, amount, paymentId) {
        let plan = 'FREE';
        let limit = 10000;
        if (amount >= 200) {
            plan = 'ENTERPRISE';
            limit = 10000000;
        }
        else if (amount >= 50) {
            plan = 'PRO';
            limit = 1000000;
        }
        else if (amount >= 10) {
            plan = 'PRO';
            limit = 100000;
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { plan, monthlyLimit: limit }
        });
        this.logger.log(`✅ User ${userId} upgraded to ${plan}`);
        return { success: true, plan, limit, paymentId };
    }
};
exports.BillingService = BillingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingService.prototype, "syncMissedPayments", null);
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map