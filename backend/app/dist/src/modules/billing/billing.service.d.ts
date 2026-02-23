import { PrismaService } from '../../prisma.service';
export declare class BillingService {
    private prisma;
    private readonly logger;
    private readonly SUMIT_API_URL;
    private readonly COMPANY_ID;
    private readonly API_KEY;
    constructor(prisma: PrismaService);
    syncMissedPayments(): Promise<void>;
    verifyPayment(userEmail: string, userId: string): Promise<{
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
    processWebhook(data: any): Promise<{
        success: boolean;
        plan: "FREE" | "PRO" | "ENTERPRISE";
        limit: number;
        paymentId: number;
    } | {
        success: boolean;
        reason: string;
    }>;
    private getCustomerDetails;
    private updateUserPlan;
}
