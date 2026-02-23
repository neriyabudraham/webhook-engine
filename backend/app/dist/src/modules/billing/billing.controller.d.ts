import { PrismaService } from '../../prisma.service';
import { BillingService } from './billing.service';
export declare class BillingController {
    private prisma;
    private billingService;
    private readonly logger;
    constructor(prisma: PrismaService, billingService: BillingService);
    getLinks(): Promise<{}>;
    updateLinks(req: any, body: any): Promise<{
        success: boolean;
    }>;
    verifyPaymentStatus(req: any): Promise<{
        success: boolean;
        plan: "FREE" | "PRO" | "ENTERPRISE";
        limit: number;
        paymentId: number;
    } | {
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message?: undefined;
    }>;
    handleSumitWebhook(body: any): Promise<{
        success: boolean;
        plan: "FREE" | "PRO" | "ENTERPRISE";
        limit: number;
        paymentId: number;
    } | {
        success: boolean;
        reason: string;
    }>;
}
