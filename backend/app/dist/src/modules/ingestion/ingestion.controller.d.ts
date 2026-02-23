import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma.service';
export declare class IngestionController {
    private prisma;
    private webhookQueue;
    constructor(prisma: PrismaService, webhookQueue: Queue);
    handleWebhook(slug: string, body: any, headers: any): Promise<{
        status: string;
        reason: string;
        eventId?: undefined;
    } | {
        status: string;
        eventId: string;
        reason?: undefined;
    }>;
}
