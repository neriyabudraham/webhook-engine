import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { MailService } from '../mail/mail.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private mailService;
    constructor(prisma: PrismaService, jwtService: JwtService, mailService: MailService);
    login(email: string, pass: string): Promise<{
        access_token: string;
        user: {
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    register(email: string, pass: string, name: string): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<boolean>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    validateResetToken(token: string): Promise<{
        valid: boolean;
    }>;
    resetPassword(token: string, newPass: string): Promise<{
        message: string;
    }>;
}
