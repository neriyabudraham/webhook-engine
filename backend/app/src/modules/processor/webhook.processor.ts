import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma.service';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import * as vm from 'vm';

@Processor('webhook-processing')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(private prisma: PrismaService) { super(); }

  async process(job: Job<any, any, string>): Promise<any> {
    const { eventId, sourceId } = job.data;
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const source = await this.prisma.source.findUnique({
      where: { id: sourceId },
      include: { destinations: { include: { filters: true } } },
    });

    if (!source || !event) return;
    
    // --- תיקון קריטי: זיהוי וקילוף מעטפה (Unwrap) ---
    // וואטסאפ ומערכות מסוימות שולחות את המידע בתוך אובייקט עוטף.
    // אנחנו בודקים אם יש payload בתוך payload.
    let realPayload = event.payload;
    if (realPayload && typeof realPayload === 'object' && 'payload' in realPayload && 'event' in realPayload) {
        // מצאנו מעטפה! מקלפים אותה.
        realPayload = realPayload['payload'];
    }

    // בניית קונטקסט שמשתמש במידע המקולף (האמיתי)
    const context = { 
        event: {
            payload: realPayload, 
            headers: event.headers,
            query: (event.payload as any)['query'] || {} 
        },
        body: realPayload,
        headers: event.headers
    };

    for (const destination of source.destinations) {
      // 1. בדיקת חוקים מתקדמים (Code Rules)
      if (destination.rules) {
          const isAllowed = this.evaluateRules(destination.rules, context, destination.url);
          
          if (!isAllowed) {
              console.log(`🚫 Blocked by Filter (Advanced): ${destination.url}`);
              continue; // דילוג ליעד הבא
          } else {
              console.log(`✅ Passed Filter (Advanced): ${destination.url}`);
          }
      } 
      // 2. בדיקת חוקים פשוטים (GUI Filters - תמיכה לאחור)
      else if (destination.filters && destination.filters.length > 0) {
          if (!this.checkSimpleFilters(context.body, destination.filters)) {
              console.log(`🚫 Blocked by Filter (Simple): ${destination.url}`);
              continue;
          }
      }

      // 3. השהייה (Delay) אם מוגדרת
      if (destination.delay > 0) {
          await new Promise(r => setTimeout(r, destination.delay * 1000));
      }

      // 4. ביצוע השליחה
      const startTime = Date.now();
      let status = 0;
      let responseBody = '';

      try {
        const response = await axios({
          method: destination.method || 'POST',
          url: destination.url,
          data: event.payload, // שולחים ליעד את המידע המקורי והמלא (כמו שהוא הגיע)
          headers: destination.headers ? destination.headers as any : { 'Content-Type': 'application/json' },
          timeout: 10000,
        });
        status = response.status;
        responseBody = JSON.stringify(response.data).substring(0, 1000);
      } catch (error) {
        status = error.response?.status || 500;
        responseBody = error.message;
      }

      // שמירת לוג המשלוח
      await this.prisma.delivery.create({
        data: {
          destinationId: destination.id,
          eventId: event.id,
          status: status,
          duration: Date.now() - startTime,
          responseBody: responseBody
        }
      });
    }
  }

  // --- מנוע הרצת החוקים ---
  private evaluateRules(rules: any, context: any, destUrl: string): boolean {
    if (!rules) return true; // אם אין חוקים, הכל עובר

    // מקרה א': המשתמש כתב קוד JavaScript (סטרינג)
    if (typeof rules === 'string') {
        try {
            const script = new vm.Script(rules);
            const sandboxContext = vm.createContext(context); 
            const result = script.runInContext(sandboxContext);
            
            // לוג דיאגנוסטיקה
            // מציג מה יצא מהפילטר וגם דוגמית מהמידע עליו הוא רץ
            const payloadPreview = JSON.stringify(context.event.payload).substring(0, 100);
            console.log(`[Eval] Rule: "${rules}" | Result: ${result} | Payload Start: ${payloadPreview}...`);
            
            return !!result; 
        } catch (e) {
            console.error(`[Eval Error] Rule execution failed on ${destUrl}: ${e.message}`);
            return false; // במקרה שגיאה - חוסמים
        }
    }

    // מקרה ב': JSON Object - פילטרי JSON
    if (typeof rules === 'object') {
        if (rules['$or'] && Array.isArray(rules['$or'])) return rules['$or'].some(rule => this.evaluateRules(rule, context, destUrl));
        if (rules['$and'] && Array.isArray(rules['$and'])) return rules['$and'].every(rule => this.evaluateRules(rule, context, destUrl));

        for (const key in rules) {
          if (key.startsWith('$')) continue;
          
          const condition = rules[key];
          
          // תמיכה בחיפוש טקסט מלא (_fullText)
          if (key === '_fullText') {
            const fullText = JSON.stringify(context.body);
            if (condition && typeof condition === 'object' && condition['$regex']) {
              if (!new RegExp(condition['$regex'], 'i').test(fullText)) return false;
            } else if (!fullText.includes(String(condition))) {
              return false;
            }
            continue;
          }
          
          const actualVal = this.getValueByPath(context.body, key);
          if (condition && typeof condition === 'object' && condition['$regex']) {
            if (!new RegExp(condition['$regex'], 'i').test(String(actualVal))) return false;
          } else if (actualVal != condition) {
            return false;
          }
        }
        return true;
    }
    return false;
  }

  private getValueByPath(obj: any, path: string) {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  }

  private checkSimpleFilters(obj: any, filters: any[]): boolean {
    for (const filter of filters) {
      const val = this.getValueByPath(obj, filter.key);
      if (filter.operator === 'EQUALS' && val != filter.value) return false;
      if (filter.operator === 'CONTAINS' && !JSON.stringify(val).includes(filter.value)) return false;
    }
    return true;
  }
}