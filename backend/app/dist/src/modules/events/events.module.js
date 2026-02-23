"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsModule = void 0;
const common_1 = require("@nestjs/common");
const events_controller_1 = require("./events.controller");
const prisma_service_1 = require("../../prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const webhook_processor_1 = require("./webhook.processor");
const axios_1 = require("@nestjs/axios");
let EventsModule = class EventsModule {
};
exports.EventsModule = EventsModule;
exports.EventsModule = EventsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            bullmq_1.BullModule.registerQueue({
                name: 'webhook-processing',
            }),
        ],
        controllers: [events_controller_1.EventsController],
        providers: [prisma_service_1.PrismaService, webhook_processor_1.WebhookProcessor],
        exports: [bullmq_1.BullModule]
    })
], EventsModule);
//# sourceMappingURL=events.module.js.map