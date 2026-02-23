import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { BullModule } from '@nestjs/bullmq';

// ייבוא כל המודולים
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { ProcessorModule } from './modules/processor/processor.module'; // החזרתי אותו!
import { DestinationsModule } from './modules/destinations/destinations.module';
import { EventsModule } from './modules/events/events.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';
import { BillingModule } from './modules/billing/billing.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    // תיקון ה-Redis וה-Env (חובה)
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST') || 'redis',
          port: parseInt(configService.get('REDIS_PORT') || '6379'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // רשימת המודולים המקורית שלך
    AuthModule, 
    UsersModule, 
    IngestionModule, 
    ProcessorModule, // <--- הנה הוא חזר
    DestinationsModule, 
    EventsModule, 
    AiModule, 
    AdminModule, 
    BillingModule,
    MailModule
  ],
  providers: [PrismaService],
})
export class AppModule {}
