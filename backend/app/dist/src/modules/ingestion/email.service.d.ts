import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Queue } from 'bullmq';
export declare class EmailIngestionService implements OnModuleInit {
    private prisma;
    private webhookQueue;
    private server;
    constructor(prisma: PrismaService, webhookQueue: Queue);
    onModuleInit(): void;
    private formatAddress;
    private getSafeFilename;
    private uploadFile;
    handleData(stream: any, session: any, callback: any): Promise<any>;
}
