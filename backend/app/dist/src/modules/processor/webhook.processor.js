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
var WebhookProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../../prisma.service");
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let WebhookProcessor = WebhookProcessor_1 = class WebhookProcessor extends bullmq_1.WorkerHost {
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhookProcessor_1.name);
    }
    async process(job) {
        var _a;
        const { eventId, sourceId } = job.data;
        const event = await this.prisma.event.findUnique({ where: { id: eventId } });
        const source = await this.prisma.source.findUnique({
            where: { id: sourceId },
            include: { destinations: { include: { filters: true } } },
        });
        if (!source || !event)
            return;
        const context = { body: event.payload, headers: event.headers };
        for (const destination of source.destinations) {
            if (destination.filters.length > 0 && !this.checkSimpleFilters(context, destination.filters))
                continue;
            if (destination.rules && !this.evaluateRules(destination.rules, context)) {
                this.logger.log(`Skipping dest ${destination.id} due to advanced rules`);
                continue;
            }
            if (destination.delay > 0) {
                this.logger.log(`Waiting ${destination.delay}s...`);
                await new Promise(r => setTimeout(r, destination.delay * 1000));
            }
            const startTime = Date.now();
            let status = 0;
            let responseBody = '';
            try {
                const response = await (0, axios_1.default)({
                    method: destination.method || 'POST',
                    url: destination.url,
                    data: event.payload,
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000,
                });
                status = response.status;
                responseBody = JSON.stringify(response.data).substring(0, 1000);
            }
            catch (error) {
                status = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) || 500;
                responseBody = error.message;
            }
            await this.prisma.delivery.create({
                data: {
                    destinationId: destination.id,
                    eventId: event.id,
                    status: status,
                    duration: Date.now() - startTime,
                    responseBody: responseBody
                }
            });
        }
    }
    checkSimpleFilters(context, filters) {
        for (const filter of filters) {
            const val = this.getValueByPath(context, filter.key);
            if (filter.operator === 'EQUALS' && val != filter.value)
                return false;
            if (filter.operator === 'CONTAINS' && !JSON.stringify(val).includes(filter.value))
                return false;
        }
        return true;
    }
    evaluateRules(rules, context) {
        if (!rules)
            return true;
        if (rules['$or'] && Array.isArray(rules['$or'])) {
            return rules['$or'].some(rule => this.evaluateRules(rule, context));
        }
        if (rules['$and'] && Array.isArray(rules['$and'])) {
            return rules['$and'].every(rule => this.evaluateRules(rule, context));
        }
        for (const key in rules) {
            if (key.startsWith('$'))
                continue;
            const actualVal = this.getValueByPath(context, key);
            const condition = rules[key];
            if (condition && typeof condition === 'object' && condition['$regex']) {
                if (!new RegExp(condition['$regex']).test(actualVal))
                    return false;
            }
            else if (actualVal != condition) {
                return false;
            }
        }
        return true;
    }
    getValueByPath(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = WebhookProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('webhook-processing'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map