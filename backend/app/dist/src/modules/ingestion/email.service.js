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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailIngestionService = void 0;
const common_1 = require("@nestjs/common");
const smtp_server_1 = require("smtp-server");
const mailparser_1 = require("mailparser");
const prisma_service_1 = require("../../prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const crypto = require("crypto");
let EmailIngestionService = class EmailIngestionService {
    constructor(prisma, webhookQueue) {
        this.prisma = prisma;
        this.webhookQueue = webhookQueue;
    }
    onModuleInit() {
        this.server = new smtp_server_1.SMTPServer({
            authOptional: true,
            onData: (stream, session, callback) => this.handleData(stream, session, callback),
            disabledCommands: ['AUTH'],
            size: 30 * 1024 * 1024
        });
        this.server.listen(2525, () => {
            console.log('📧 SMTP Server listening on port 2525');
        });
    }
    formatAddress(address) {
        if (!address)
            return '';
        if (Array.isArray(address)) {
            return address.map(a => a.text).join(', ');
        }
        return address.text || '';
    }
    getSafeFilename(originalName) {
        const ext = originalName.split('.').pop() || 'bin';
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `file_${timestamp}_${random}.${ext}`;
    }
    async uploadFile(buffer, originalFilename, contentType) {
        try {
            const formData = new FormData();
            const blob = new Blob([buffer], { type: contentType });
            const safeName = this.getSafeFilename(originalFilename);
            formData.append('file', blob, safeName);
            const uploadUrl = 'https://files.neriyabudraham.co.il/upload';
            console.log(`📤 Uploading safe-name: ${safeName} (Original: ${originalFilename})...`);
            const response = await fetch(uploadUrl, { method: 'POST', body: formData });
            const responseText = await response.text();
            if (!response.ok) {
                console.error(`❌ Upload failed [${response.status}]: `, responseText);
                return null;
            }
            try {
                const data = JSON.parse(responseText);
                let finalUrl = null;
                if (typeof data === 'string' && data.startsWith('http'))
                    finalUrl = data;
                else if (data.url)
                    finalUrl = data.url;
                else if (data.link)
                    finalUrl = data.link;
                else if (data.file) {
                    if (typeof data.file === 'string')
                        finalUrl = data.file;
                    else if (data.file.url)
                        finalUrl = data.file.url;
                }
                else if (data.data && data.data.url)
                    finalUrl = data.data.url;
                if (finalUrl)
                    return finalUrl;
                return null;
            }
            catch (e) {
                return null;
            }
        }
        catch (e) {
            console.error('❌ Error uploading file:', e);
            return null;
        }
    }
    async handleData(stream, session, callback) {
        var _a, _b, _c, _d, _e, _f;
        try {
            const parsed = await (0, mailparser_1.simpleParser)(stream);
            const recipient = session.envelope.rcptTo[0].address;
            const slug = recipient.split('@')[0];
            console.log(`📧 Email received for slug: ${slug}`);
            const source = await this.prisma.source.findUnique({
                where: { slug },
                include: { user: true }
            });
            if (!source || !source.active || source.type !== 'EMAIL') {
                return callback();
            }
            let attachments = [];
            if (parsed.attachments && parsed.attachments.length > 0) {
                for (const att of parsed.attachments) {
                    const url = await this.uploadFile(att.content, att.filename, att.contentType);
                    attachments.push({
                        url: url,
                        originalName: att.filename,
                        mimeType: att.contentType,
                        size: att.size
                    });
                }
            }
            const senderName = ((_c = (_b = (_a = parsed.from) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.name) || '';
            const senderEmail = ((_f = (_e = (_d = parsed.from) === null || _d === void 0 ? void 0 : _d.value) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.address) || '';
            const cleanPayload = {
                subject: parsed.subject,
                text: parsed.text ? parsed.text.trim() : '',
                sender: {
                    name: senderName,
                    email: senderEmail,
                    full: this.formatAddress(parsed.from)
                },
                attachments: attachments,
                hasAttachments: attachments.length > 0,
                meta: {
                    date: parsed.date,
                    messageId: parsed.messageId,
                    to: this.formatAddress(parsed.to),
                    replyTo: this.formatAddress(parsed.replyTo),
                    clientIp: session.remoteAddress
                }
            };
            const event = await this.prisma.event.create({
                data: {
                    sourceId: source.id,
                    payload: cleanPayload,
                    headers: {
                        source: 'email',
                        senderIp: session.remoteAddress
                    }
                }
            });
            await this.prisma.user.update({
                where: { id: source.userId },
                data: { usageCount: { increment: 1 } }
            });
            await this.webhookQueue.add('process-webhook', {
                eventId: event.id,
                sourceId: source.id
            });
            callback();
        }
        catch (err) {
            console.error('Error parsing email', err);
            callback(new Error('Internal Error'));
        }
    }
};
exports.EmailIngestionService = EmailIngestionService;
exports.EmailIngestionService = EmailIngestionService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('webhook-processing')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], EmailIngestionService);
//# sourceMappingURL=email.service.js.map