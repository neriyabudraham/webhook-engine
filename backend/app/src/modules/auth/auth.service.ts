import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('משתמש לא נמצא');
    
    // בדיקת אימות
    if (!user.isVerified) throw new UnauthorizedException('החשבון טרם אומת. בדוק את תיבת המייל שלך.');

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) throw new UnauthorizedException('סיסמה שגויה');

    const payload = { sub: user.id, email: user.email, plan: user.plan, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: { name: user.name, email: user.email, role: user.role }
    };
  }

  async register(email: string, pass: string, name: string) {
    // 1. הכנת הנתונים
    const hashedPassword = await bcrypt.hash(pass, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 2. בדיקה האם המשתמש כבר קיים
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
        // תרחיש א': משתמש קיים ומאומת -> שגיאה
        if (existingUser.isVerified) {
            throw new ConflictException('המייל כבר רשום במערכת');
        }

        // תרחיש ב': משתמש קיים אך לא מאומת -> עדכון ושליחה חוזרת
        // אנחנו מעדכנים גם סיסמה ושם, למקרה שהמשתמש ניסה להירשם מחדש עם פרטים מתוקנים
        try {
            await this.prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    name: name,
                    verificationToken: verificationToken
                }
            });

            // שליחת מייל חוזרת
            await this.mailService.sendVerificationEmail(email, verificationToken);
            return { message: 'המייל קיים אך לא אומת. מייל אימות נשלח שנית.' };
        } catch (e) {
            throw new InternalServerErrorException('שגיאה בעדכון משתמש קיים');
        }
    }

    // תרחיש ג': משתמש חדש לגמרי -> יצירה
    try {
      const user = await this.prisma.user.create({
        data: { 
            email, 
            password: hashedPassword, 
            name, 
            plan: 'FREE',
            isVerified: false, // לא מאומת בהתחלה
            verificationToken 
        }
      });
      
      // שליחת המייל
      await this.mailService.sendVerificationEmail(email, verificationToken);
      
      return { message: 'Registration successful. Please check your email to verify.' };
      
    } catch (error) {
      // בגלל שכבר בדקנו findUnique למעלה, שגיאה כאן היא חריגה
      throw new InternalServerErrorException('שגיאה בהרשמה');
    }
  }
  
  async verifyEmail(token: string) {
      const user = await this.prisma.user.findFirst({ where: { verificationToken: token } });
      if (!user) throw new BadRequestException('טוקן לא תקין');
      
      await this.prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true, verificationToken: null }
      });
      return true;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Sent' }; // Fake success for security
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await this.prisma.user.update({ where: { email }, data: { resetToken, resetTokenExpiry } });
    await this.mailService.sendResetEmail(email, resetToken);
    return { message: 'Sent' };
  }
  
  async validateResetToken(token: string) {
    const user = await this.prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
    return { valid: !!user };
  }

  async resetPassword(token: string, newPass: string) {
    const user = await this.prisma.user.findFirst({ where: { resetToken: token, resetTokenExpiry: { gt: new Date() } } });
    if (!user) throw new BadRequestException('פג תוקף');
    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null } });
    return { message: 'Success' };
  }
}