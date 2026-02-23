import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  
  private readonly SUMIT_API_URL = process.env.SUMIT_API_URL || 'https://api.sumit.co.il';
  private readonly COMPANY_ID = process.env.SUMIT_COMPANY_ID; 
  private readonly API_KEY = process.env.SUMIT_API_KEY;

  constructor(private prisma: PrismaService) {}

  // --- מנגנון רשת ביטחון (Cron Job) ---
  // רץ אוטומטית כל 5 דקות כדי לתפוס פספוסים
  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncMissedPayments() {
    this.logger.log('🔄 Running background payment sync (Safety Net)...');
    
    if (!this.COMPANY_ID || !this.API_KEY) return;

    try {
      const dateFrom = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const dateTo = new Date().toISOString();

      const response = await axios.post(`${this.SUMIT_API_URL}/billing/payments/list/`, {
        Credentials: { CompanyID: this.COMPANY_ID, APIKey: this.API_KEY },
        Date_From: dateFrom,
        Date_To: dateTo,
        Valid: true,
        StartIndex: 0
      });

      if (response.data.Status !== 0) return;

      const payments = response.data.Data.Payments || [];
      this.logger.log(`🔍 Found ${payments.length} recent payments in Sumit.`);

      for (const payment of payments) {
        let userId = payment.CustomData || payment.CustomData_1 || payment.ExternalIdentifier;
        
        if (!userId) {
            const customer = await this.getCustomerDetails(payment.CustomerID);
            if (customer && customer.Email) {
                const user = await this.prisma.user.findUnique({ where: { email: customer.Email } });
                if (user) userId = user.id;
            }
        }

        if (userId) {
            await this.updateUserPlan(userId, payment.Amount, payment.ID);
        }
      }
    } catch (e) {
        this.logger.error('Background sync failed', e);
    }
  }

  // --- פונקציה לאימות יזום (מהדפדפן) ---
  async verifyPayment(userEmail: string, userId: string) {
    if (!this.COMPANY_ID || !this.API_KEY) return { success: false, message: 'Config error' };

    try {
        const dateFrom = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const dateTo = new Date().toISOString();
        const res = await axios.post(`${this.SUMIT_API_URL}/billing/payments/list/`, {
            Credentials: { CompanyID: this.COMPANY_ID, APIKey: this.API_KEY },
            Date_From: dateFrom, Date_To: dateTo, Valid: true, StartIndex: 0
        });
        
        const payments = res.data.Data?.Payments || [];
        for (const p of payments) {
            const customer = await this.getCustomerDetails(p.CustomerID);
            // בדיקה כפולה: לפי מזהה ב-CustomData או לפי אימייל
            const isIdMatch = (p.CustomData === userId || p.CustomData_1 === userId);
            const isEmailMatch = (customer && customer.Email === userEmail);

            if (isIdMatch || isEmailMatch) {
                return await this.updateUserPlan(userId, p.Amount, p.ID);
            }
        }
        return { success: false, message: 'Not found yet' };
    } catch (e) { return { success: false }; }
  }

  // --- פונקציה לטיפול ב-Webhook (החלק שהיה חסר) ---
  async processWebhook(data: any) {
    this.logger.log('Webhook received: ' + JSON.stringify(data));

    const userId = data.CustomData || data.CustomData_1 || data.ExternalIdentifier;
    const amount = parseFloat(data.Amount || data.TotalAmount || '0');
    const paymentId = data.PaymentID || data.ID;

    if (!userId) return { success: false, reason: 'no_user_id' };
    
    // בדיקה שהמשתמש קיים
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, reason: 'user_not_found' };

    return await this.updateUserPlan(userId, amount, paymentId);
  }

  // --- עזרים ---
  private async getCustomerDetails(sumitCustomerId: number) {
    try {
      const response = await axios.post(`${this.SUMIT_API_URL}/crm/customers/get/`, {
        Credentials: { CompanyID: this.COMPANY_ID, APIKey: this.API_KEY },
        CustomerID: sumitCustomerId
      });
      return response.data.Data;
    } catch (e) { return null; }
  }

  private async updateUserPlan(userId: string, amount: number, paymentId: number) {
    let plan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE';
    let limit = 10000;

    if (amount >= 200) { plan = 'ENTERPRISE'; limit = 10000000; }
    else if (amount >= 50) { plan = 'PRO'; limit = 1000000; }
    else if (amount >= 10) { plan = 'PRO'; limit = 100000; }

    await this.prisma.user.update({
      where: { id: userId },
      data: { plan, monthlyLimit: limit }
    });

    this.logger.log(`✅ User ${userId} upgraded to ${plan}`);
    return { success: true, plan, limit, paymentId };
  }
}
