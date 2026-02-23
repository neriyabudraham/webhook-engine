import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      tls: { rejectUnauthorized: false }
    });
  }

  private getTemplate(title: string, bodyContent: string) {
    return `<div style="background:#f3f4f6;padding:40px;font-family:sans-serif;text-align:right;direction:rtl"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:20px"><h1 style="color:#4f46e5">WebhookEngine</h1><h2>${title}</h2>${bodyContent}</div></div>`;
  }

  async sendVerificationEmail(to: string, token: string) {
    // הקישור מפנה לשרת שלנו, שיאמת ויפנה לדף הכניסה
    const link = `https://webhook.botomat.co.il/auth/verify-email?token=${token}`;
    const html = this.getTemplate('אימות כתובת אימייל', `<p>תודה שנרשמת!</p><p>כדי להפעיל את החשבון, לחץ על הכפתור:</p><a href="${link}" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block">אמת חשבון</a>`);
    
    try {
        await this.transporter.sendMail({ from: '"WebhookEngine Security" <' + process.env.MAIL_USER + '>', to, subject: 'אימות חשבון', html });
        console.log('Verification email sent to ' + to);
    } catch (e) { console.error('Email error:', e); }
  }

  async sendResetEmail(to, token) {
    const link = `https://webhook.botomat.co.il/reset-password.html?token=${token}`;
    await this.transporter.sendMail({ from: process.env.MAIL_USER, to, subject: 'איפוס סיסמה', html: this.getTemplate('איפוס סיסמה', `<a href="${link}">לחץ לאיפוס</a>`) });
  }
  
  async sendPasswordChangedEmail(to) { /* ... קוד קיים ... */ }
}
