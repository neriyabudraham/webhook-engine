import { Injectable, OnModuleInit } from '@nestjs/common';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { PrismaService } from '../../prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';

@Injectable()
export class EmailIngestionService implements OnModuleInit {
  private server: SMTPServer;

  constructor(
    private prisma: PrismaService,
    @InjectQueue('webhook-processing') private webhookQueue: Queue,
  ) {}

  onModuleInit() {
    this.server = new SMTPServer({
      authOptional: true,
      onData: (stream, session, callback) => this.handleData(stream, session, callback),
      disabledCommands: ['AUTH'],
      size: 30 * 1024 * 1024 // 30MB limit
    });

    this.server.listen(2525, () => {
      console.log('📧 SMTP Server listening on port 2525');
    });
  }

  // פונקציית עזר למניעת שגיאות TypeScript בכתובות
  private formatAddress(address: any): string {
    if (!address) return '';
    // אם זה מערך (הרבה נמענים), נחבר אותם עם פסיק
    if (Array.isArray(address)) {
        return address.map(a => a.text).join(', ');
    }
    // אם זה בודד, נחזיר את הטקסט שלו
    return address.text || '';
  }

  // יצירת שם קובץ בטוח
  private getSafeFilename(originalName: string): string {
    const ext = originalName.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `file_${timestamp}_${random}.${ext}`;
  }

  private async uploadFile(buffer: Buffer, originalFilename: string, contentType: string): Promise<string | null> {
    try {
        const formData = new FormData();
        const blob = new Blob([buffer as any], { type: contentType });
        
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
            if (typeof data === 'string' && data.startsWith('http')) finalUrl = data;
            else if (data.url) finalUrl = data.url;
            else if (data.link) finalUrl = data.link;
            else if (data.file) {
                if (typeof data.file === 'string') finalUrl = data.file;
                else if (data.file.url) finalUrl = data.file.url;
            }
            else if (data.data && data.data.url) finalUrl = data.data.url;

            if (finalUrl) return finalUrl;
            return null;
        } catch (e) {
            return null;
        }

    } catch (e) {
        console.error('❌ Error uploading file:', e);
        return null;
    }
  }

  async handleData(stream, session, callback) {
    try {
      const parsed = await simpleParser(stream);
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

      // העלאת קבצים
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

      // חילוץ פרטי שולח נקיים
      const senderName = parsed.from?.value?.[0]?.name || '';
      const senderEmail = parsed.from?.value?.[0]?.address || '';

      // --- בניית ה-JSON הנקי ל-n8n ---
      const cleanPayload = {
          // מידע ראשי
          subject: parsed.subject,
          text: parsed.text ? parsed.text.trim() : '', 
          
          // אובייקט שולח מסודר
          sender: {
              name: senderName,
              email: senderEmail,
              full: this.formatAddress(parsed.from) // שימוש בפונקציית העזר
          },

          // מערך קבצים (נקי, עם URL ושם מקורי)
          attachments: attachments,
          
          // דגל עזר לאוטומציות
          hasAttachments: attachments.length > 0,

          // מטא-דאטה טכני
          meta: {
              date: parsed.date,
              messageId: parsed.messageId,
              to: this.formatAddress(parsed.to),      // שימוש בפונקציית העזר (פותר את ה-TS Error)
              replyTo: this.formatAddress(parsed.replyTo), // כנ"ל
              clientIp: session.remoteAddress
          }
      };

      const event = await this.prisma.event.create({
        data: {
          sourceId: source.id,
          payload: cleanPayload as any,
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
    } catch (err) {
      console.error('Error parsing email', err);
      callback(new Error('Internal Error'));
    }
  }
}
