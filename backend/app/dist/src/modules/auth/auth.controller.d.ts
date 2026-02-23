import { AuthService } from './auth.service';
import { Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signIn(body: any): Promise<{
        access_token: string;
        user: {
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    signUp(body: any): Promise<{
        message: string;
    }>;
    verifyEmail(token: string, res: Response): Promise<void>;
    forgotPassword(body: any): Promise<{
        message: string;
    }>;
    validateToken(token: string): Promise<{
        valid: boolean;
    }>;
    resetPassword(body: any): Promise<{
        message: string;
    }>;
}
