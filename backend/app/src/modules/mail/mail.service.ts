import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.logger.warn(">>> HARDCODED CREDENTIALS LOADED <<<");
    
    this.transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, 
      auth: {
        user: "office@neriyabudraham.co.il",
        pass: "zmnkndnvxrswopnq", // הסיסמה שלך
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const domain = "https://webhook.botomat.co.il";
    // שים לב: אנחנו מפנים לקובץ verify.html שצריך להיות קיים בפרונט
    const url = `${domain}/verify.html?token=${token}`;
    
    const html = this.getHtmlTemplate(
      "אימות חשבון חדש",
      "ברוכים הבאים ל-WebhookEngine! שמחים שהצטרפתם.",
      "כדי להתחיל להשתמש במערכת, יש לאמת את כתובת המייל שלכם.",
      url,
      "אמת את החשבון שלי"
    );

    await this.sendMail(to, "אימות חשבון - WebhookEngine", html);
  }

  async sendResetEmail(to: string, token: string) {
    const domain = "https://webhook.botomat.co.il";
    // כאן אנחנו מפנים לקובץ ה-Vue ששלחת לי (נקרא לו reset-password.html)
    const url = `${domain}/reset-password.html?token=${token}`;
    
    const html = this.getHtmlTemplate(
      "איפוס סיסמה",
      "קיבלנו בקשה לאיפוס הסיסמה לחשבונך.",
      "אם לא ביקשת זאת, ניתן להתעלם ממייל זה. אם כן, לחץ על הכפתור למטה:",
      url,
      "אפס סיסמה כעת"
    );
    
    await this.sendMail(to, "איפוס סיסמה - WebhookEngine", html);
  }

  private async sendMail(to: string, subject: string, htmlContent: string) {
    try {
      this.logger.log(`Attempting to send email to ${to}...`);
      
      const info = await this.transporter.sendMail({
        from: '"WebhookEngine" <office@neriyabudraham.co.il>',
        to,
        subject,
        html: htmlContent, // שימוש ב-HTML במקום טקסט רגיל
      });
      
      this.logger.log(`✅ SUCCESS! Email sent to ${to}. ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`❌ FAILED to send email to ${to}`);
      this.logger.error(error);
    }
  }

  // פונקציה ליצירת תבנית מייל מעוצבת
  private getHtmlTemplate(title: string, subtitle: string, body: string, link: string, btnText: string) {
    return `
    <!DOCTYPE html>
    <html lang="he" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background-color: #4f46e5; padding: 20px; text-align: center; color: white; }
        .content { padding: 30px; text-align: right; color: #374151; line-height: 1.6; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0; font-size: 24px;">WebhookEngine</h1>
        </div>
        <div class="content">
          <h2 style="color: #111827; margin-top: 0;">${title}</h2>
          <p style="font-size: 16px;"><strong>${subtitle}</strong></p>
          <p>${body}</p>
          <div style="text-align: center;">
            <a href="${link}" class="btn">${btnText}</a>
          </div>
          <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
            אם הכפתור לא עובד, העתק את הקישור לדפדפן:<br>
            <a href="${link}" style="color: #4f46e5;">${link}</a>
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} WebhookEngine. כל הזכויות שמורות.
        </div>
      </div>
    </body>
    </html>
    `;
  }
}