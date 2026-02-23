import { PrismaService } from '../../prisma.service';
export declare class UserController {
    private prisma;
    constructor(prisma: PrismaService);
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
        plan: import(".prisma/client").$Enums.PlanTier;
        monthlyLimit: number;
        usageCount: number;
        createdAt: Date;
    }>;
}
