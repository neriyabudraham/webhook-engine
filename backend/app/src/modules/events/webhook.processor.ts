import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma.service';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios'; // הוספנו את זה
import { firstValueFrom } from 'rxjs';

@Processor('webhook-processing')
export class WebhookProcessor extends WorkerHost {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { eventId, sourceId } = job.data;
    console.log(`🔄 Processing webhook event: ${eventId}`);

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    const destinations = await this.prisma.destination.findMany({ 
        where: { sourceId },
        include: { filters: true }
    });

    if (!destinations.length) {
        console.log('⚠️ No destinations found for source');
        return;
    }

    for (const dest of destinations) {
        let match = true;
        if (dest.filters && dest.filters.length > 0) {
            for (const filter of dest.filters) {
                const payloadValue = this.getValueByPath(event.payload, filter.key);
                if (!this.checkCondition(payloadValue, filter.operator, filter.value)) {
                    match = false;
                    break;
                }
            }
        }

        if (!match) {
            console.log(`Skipping destination ${dest.url} (Filter mismatch)`);
            continue;
        }

        if (dest.delay > 0) {
            await new Promise(r => setTimeout(r, dest.delay * 1000));
        }

        const startTime = Date.now();
        let status = 0;
        let responseBody = '';

        try {
            console.log(`🚀 Sending to ${dest.url}...`);
            // התיקון: הגדרת הטיפוס כ-AxiosResponse
            const res: AxiosResponse = await firstValueFrom(
                this.httpService.post(dest.url, event.payload, { 
                    headers: dest.headers as any || {},
                    validateStatus: () => true 
                })
            );
            status = res.status;
            responseBody = JSON.stringify(res.data).substring(0, 1000); 
            console.log(`✅ Sent! Status: ${status}`);
        } catch (err) {
            console.error(`❌ Failed to send: ${err.message}`);
            status = 500;
            responseBody = err.message;
        }

        await this.prisma.delivery.create({
            data: {
                destinationId: dest.id,
                eventId: event.id,
                status: status,
                responseBody: responseBody,
                duration: Date.now() - startTime
            }
        });
    }
  }

  private getValueByPath(obj: any, path: string) {
      return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
  }

  private checkCondition(val: any, op: string, target: string) {
      if (val === undefined || val === null) return op === 'NOT_EXISTS';
      const strVal = String(val);
      switch(op) {
          case 'EQUALS': return strVal == target;
          case 'CONTAINS': return strVal.includes(target);
          case 'NOT_CONTAINS': return !strVal.includes(target);
          case 'REGEX': return new RegExp(target).test(strVal);
          case 'EXISTS': return true;
          default: return false;
      }
  }
}
