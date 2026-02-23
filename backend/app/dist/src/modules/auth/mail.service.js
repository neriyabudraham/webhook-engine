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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
let MailService = class MailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', port: 587, secure: false,
            auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
            tls: { rejectUnauthorized: false }
        });
    }
    getTemplate(title, bodyContent) {
        return `<div style="background:#f3f4f6;padding:40px;font-family:sans-serif;text-align:right;direction:rtl"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;padding:20px"><h1 style="color:#4f46e5">WebhookEngine</h1><h2>${title}</h2>${bodyContent}</div></div>`;
    }
    async sendVerificationEmail(to, token) {
        const link = `https://webhook.botomat.co.il/auth/verify-email?token=${token}`;
        const html = this.getTemplate('אימות כתובת אימייל', `<p>תודה שנרשמת!</p><p>כדי להפעיל את החשבון, לחץ על הכפתור:</p><a href="${link}" style="background:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block">אמת חשבון</a>`);
        try {
            await this.transporter.sendMail({ from: '"WebhookEngine Security" <' + process.env.MAIL_USER + '>', to, subject: 'אימות חשבון', html });
            console.log('Verification email sent to ' + to);
        }
        catch (e) {
            console.error('Email error:', e);
        }
    }
    async sendResetEmail(to, token) {
        const link = `https://webhook.botomat.co.il/reset-password.html?token=${token}`;
        await this.transporter.sendMail({ from: process.env.MAIL_USER, to, subject: 'איפוס סיסמה', html: this.getTemplate('איפוס סיסמה', `<a href="${link}">לחץ לאיפוס</a>`) });
    }
    async sendPasswordChangedEmail(to) { }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map