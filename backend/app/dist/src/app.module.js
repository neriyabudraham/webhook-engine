"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("./prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const ingestion_module_1 = require("./modules/ingestion/ingestion.module");
const processor_module_1 = require("./modules/processor/processor.module");
const destinations_module_1 = require("./modules/destinations/destinations.module");
const events_module_1 = require("./modules/events/events.module");
const ai_module_1 = require("./modules/ai/ai.module");
const admin_module_1 = require("./modules/admin/admin.module");
const billing_module_1 = require("./modules/billing/billing.module");
const mail_module_1 = require("./modules/mail/mail.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST') || 'redis',
                        port: parseInt(configService.get('REDIS_PORT') || '6379'),
                        password: configService.get('REDIS_PASSWORD'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            ingestion_module_1.IngestionModule,
            processor_module_1.ProcessorModule,
            destinations_module_1.DestinationsModule,
            events_module_1.EventsModule,
            ai_module_1.AiModule,
            admin_module_1.AdminModule,
            billing_module_1.BillingModule,
            mail_module_1.MailModule
        ],
        providers: [prisma_service_1.PrismaService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map