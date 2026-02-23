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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../../prisma.service");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let WebhookProcessor = class WebhookProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, httpService) {
        super();
        this.prisma = prisma;
        this.httpService = httpService;
    }
    async process(job) {
        const { eventId, sourceId } = job.data;
        console.log(`🔄 Processing webhook event: ${eventId}`);
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        const destinations = await this.prisma.destination.findMany({
            where: { sourceId },
            include: { filters: true }
        });
        if (!destinations.length) {
            console.log('⚠️ No destinations found for source');
            return;
        }
        for (const dest of destinations) {
            let match = true;
            if (dest.filters && dest.filters.length > 0) {
                for (const filter of dest.filters) {
                    const payloadValue = this.getValueByPath(event.payload, filter.key);
                    if (!this.checkCondition(payloadValue, filter.operator, filter.value)) {
                        match = false;
                        break;
                    }
                }
            }
            if (!match) {
                console.log(`Skipping destination ${dest.url} (Filter mismatch)`);
                continue;
            }
            if (dest.delay > 0) {
                await new Promise(r => setTimeout(r, dest.delay * 1000));
            }
            const startTime = Date.now();
            let status = 0;
            let responseBody = '';
            try {
                console.log(`🚀 Sending to ${dest.url}...`);
                const res = await (0, rxjs_1.firstValueFrom)(this.httpService.post(dest.url, event.payload, {
                    headers: dest.headers || {},
                    validateStatus: () => true
                }));
                status = res.status;
                responseBody = JSON.stringify(res.data).substring(0, 1000);
                console.log(`✅ Sent! Status: ${status}`);
            }
            catch (err) {
                console.error(`❌ Failed to send: ${err.message}`);
                status = 500;
                responseBody = err.message;
            }
            await this.prisma.delivery.create({
                data: {
                    destinationId: dest.id,
                    eventId: event.id,
                    status: status,
                    responseBody: responseBody,
                    duration: Date.now() - startTime
                }
            });
        }
    }
    getValueByPath(obj, path) {
        return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
    }
    checkCondition(val, op, target) {
        if (val === undefined || val === null)
            return op === 'NOT_EXISTS';
        const strVal = String(val);
        switch (op) {
            case 'EQUALS': return strVal == target;
            case 'CONTAINS': return strVal.includes(target);
            case 'NOT_CONTAINS': return !strVal.includes(target);
            case 'REGEX': return new RegExp(target).test(strVal);
            case 'EXISTS': return true;
            default: return false;
        }
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = __decorate([
    (0, bullmq_1.Processor)('webhook-processing'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        axios_1.HttpService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map