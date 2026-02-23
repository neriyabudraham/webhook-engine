"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma.service");
const mail_service_1 = require("../mail/mail.service");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
let AuthService = class AuthService {
    constructor(prisma, jwtService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.mailService = mailService;
    }
    async login(email, pass) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.UnauthorizedException('משתמש לא נמצא');
        if (!user.isVerified)
            throw new common_1.UnauthorizedException('החשבון טרם אומת. בדוק את תיבת המייל שלך.');
        const isMatch = await bcrypt.compare(pass, user.password);
        if (!isMatch)
            throw new common_1.UnauthorizedException('סיסמה שגויה');
        const payload = { sub: user.id, email: user.email, plan: user.plan, role: user.role };
        return {
            access_token: await this.jwtService.signAsync(payload),
            user: { name: user.name, email: user.email, role: user.role }
        };
    }
    async register(email, pass, name) {
        const hashedPassword = await bcrypt.hash(pass, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const existingUser = await this.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            if (existingUser.isVerified) {
                throw new common_1.ConflictException('המייל כבר רשום במערכת');
            }
            try {
                await this.prisma.user.update({
                    where: { email },
                    data: {
                        password: hashedPassword,
                        name: name,
                        verificationToken: verificationToken
                    }
                });
                await this.mailService.sendVerificationEmail(email, verificationToken);
                return { message: 'המייל קיים אך לא אומת. מייל אימות נשלח שנית.' };
            }
            catch (e) {
                throw new common_1.InternalServerErrorException('שגיאה בעדכון משתמש קיים');
            }
        }
        try {
            const user = await this.prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                    plan: 'FREE',
                    isVerified: false,
                    verificationToken
                }
            });
            await this.mailService.sendVerificationEmail(email, verificationToken);
            return { message: 'Registration successful. Please check your email to verify.' };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('שגיאה בהרשמה');
        }
    }
    async verifyEmail(token) {
        const user = await this.prisma.user.findFirst({ where: { verificationToken: token } });
        if (!user)
            throw new common_1.BadRequestException('טוקן לא תקין');
        await this.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, verificationToken: null }
        });
        return true;
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return { message: 'Sent' };
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        await this.prisma.user.update({ where: { email }, data: { resetToken, resetTokenExpiry } });
        await this.mailService.sendResetEmail(email, resetToken);
        return { message: 'Sent' };
    }
    async validateResetToken(token) {
        const user = await this.prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
        return { valid: !!user };
    }
    async resetPassword(token, newPass) {
        const user = await this.prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
        if (!user)
            throw new common_1.BadRequestException('פג תוקף');
        const hashedPassword = await bcrypt.hash(newPass, 10);
        await this.prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null } });
        return { message: 'Success' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map