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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let MailService = MailService_1 = class MailService {
    constructor() {
        this.logger = new common_1.Logger(MailService_1.name);
        this.logger.warn(">>> HARDCODED CREDENTIALS LOADED <<<");
        this.transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: "office@neriyabudraham.co.il",
                pass: "zmnkndnvxrswopnq",
            },
        });
    }
    async sendVerificationEmail(to, token) {
        const domain = "https://webhook.botomat.co.il";
        const url = `${domain}/verify.html?token=${token}`;
        const html = this.getHtmlTemplate("אימות חשבון חדש", "ברוכים הבאים ל-WebhookEngine! שמחים שהצטרפתם.", "כדי להתחיל להשתמש במערכת, יש לאמת את כתובת המייל שלכם.", url, "אמת את החשבון שלי");
        await this.sendMail(to, "אימות חשבון - WebhookEngine", html);
    }
    async sendResetEmail(to, token) {
        const domain = "https://webhook.botomat.co.il";
        const url = `${domain}/reset-password.html?token=${token}`;
        const html = this.getHtmlTemplate("איפוס סיסמה", "קיבלנו בקשה לאיפוס הסיסמה לחשבונך.", "אם לא ביקשת זאת, ניתן להתעלם ממייל זה. אם כן, לחץ על הכפתור למטה:", url, "אפס סיסמה כעת");
        await this.sendMail(to, "איפוס סיסמה - WebhookEngine", html);
    }
    async sendMail(to, subject, htmlContent) {
        try {
            this.logger.log(`Attempting to send email to ${to}...`);
            const info = await this.transporter.sendMail({
                from: '"WebhookEngine" <office@neriyabudraham.co.il>',
                to,
                subject,
                html: htmlContent,
            });
            this.logger.log(`✅ SUCCESS! Email sent to ${to}. ID: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`❌ FAILED to send email to ${to}`);
            this.logger.error(error);
        }
    }
    getHtmlTemplate(title, subtitle, body, link, btnText) {
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
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map