import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma.service';
import { HttpService } from '@nestjs/axios';
export declare class WebhookProcessor extends WorkerHost {
    private prisma;
    private httpService;
    constructor(prisma: PrismaService, httpService: HttpService);
    process(job: Job<any, any, string>): Promise<any>;
    private getValueByPath;
    private checkCondition;
}
