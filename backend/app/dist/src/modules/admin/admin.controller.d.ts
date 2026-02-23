import { PrismaService } from '../../prisma.service';
export declare class AdminController {
    private prisma;
    constructor(prisma: PrismaService);
    private checkAdmin;
    getAllUsers(req: any): Promise<{
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        plan: import(".prisma/client").$Enums.PlanTier;
        createdAt: Date;
        usageCount: number;
        monthlyLimit: number;
        sourcesCount: number;
        eventsCount: number;
    }[]>;
    deleteUser(req: any, id: string): Promise<{
        success: boolean;
    }>;
    updateUser(req: any, id: string, body: any): Promise<{
        id: string;
        email: string;
        resetToken: string | null;
        password: string;
        name: string | null;
        role: import(".prisma/client").$Enums.Role;
        plan: import(".prisma/client").$Enums.PlanTier;
        monthlyLimit: number;
        usageCount: number;
        billingCycleStart: Date;
        resetTokenExpiry: Date | null;
        isVerified: boolean;
        verificationToken: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
