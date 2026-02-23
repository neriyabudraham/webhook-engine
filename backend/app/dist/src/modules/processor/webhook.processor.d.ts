import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma.service';
export declare class WebhookProcessor extends WorkerHost {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(job: Job<any, any, string>): Promise<any>;
    private checkSimpleFilters;
    private evaluateRules;
    private getValueByPath;
}
