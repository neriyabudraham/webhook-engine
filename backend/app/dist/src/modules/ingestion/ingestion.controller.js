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
exports.IngestionController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../prisma.service");
let IngestionController = class IngestionController {
    constructor(prisma, webhookQueue) {
        this.prisma = prisma;
        this.webhookQueue = webhookQueue;
    }
    async handleWebhook(slug, body, headers) {
        const source = await this.prisma.source.findUnique({
            where: { slug },
            select: {
                id: true,
                active: true,
                userId: true,
                user: { select: { usageCount: true, monthlyLimit: true, role: true } }
            }
        });
        if (!source)
            throw new common_1.NotFoundException('Source not found');
        if (!source.active) {
            return { status: 'ignored', reason: 'source_inactive' };
        }
        if (source.user.role !== 'ADMIN') {
            if (source.user.usageCount >= source.user.monthlyLimit) {
                console.warn(`Limit reached for user ${source.userId}`);
                throw new common_1.HttpException({
                    status: 'error',
                    code: 'LIMIT_REACHED',
                    message: 'Monthly event limit exceeded.'
                }, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        const event = await this.prisma.event.create({
            data: {
                sourceId: source.id,
                payload: body,
                headers: headers,
            },
        });
        try {
            await this.prisma.user.update({
                where: { id: source.userId },
                data: { usageCount: { increment: 1 } }
            });
        }
        catch (e) {
            console.error(e);
        }
        await this.webhookQueue.add('process-webhook', {
            eventId: event.id,
            sourceId: source.id
        }, {
            attempts: 3,
            backoff: 5000,
            removeOnComplete: true
        });
        return { status: 'accepted', eventId: event.id };
    }
};
exports.IngestionController = IngestionController;
__decorate([
    (0, common_1.Post)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], IngestionController.prototype, "handleWebhook", null);
exports.IngestionController = IngestionController = __decorate([
    (0, common_1.Controller)('webhook'),
    __param(1, (0, bullmq_1.InjectQueue)('webhook-processing')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], IngestionController);
//# sourceMappingURL=ingestion.controller.js.map