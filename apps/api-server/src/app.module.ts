import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentModule } from './modules/appointments/appointment.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { EhrModule } from './modules/ehr/ehr.module';
import { BillingModule } from './modules/billing/billing.module';
import { StorageModule } from './modules/storage/storage.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SocketModule } from './modules/socket/socket.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { TelemedicineModule } from './modules/telemedicine/telemedicine.module';
import { RpmModule } from './modules/rpm/rpm.module';
import { InteropModule } from './modules/interop/interop.module';
import { CacheModule } from './modules/cache/cache.module';
import { BedModule } from './modules/beds/bed.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './modules/health/health.controller';
import { GeneticModule } from './modules/genetic/genetic.module';
import { ClaimsRpaModule } from './modules/claims-rpa/claims-rpa.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    PatientsModule,
    AppointmentModule,
    AvailabilityModule,
    EhrModule,
    BillingModule,
    StorageModule,
    PharmacyModule,
    ReportsModule,
    SocketModule,
    MessagingModule,
    AiModule,
    NotificationModule,
    TelemedicineModule,
    RpmModule,
    InteropModule,
    CacheModule,
    BedModule,
    GeneticModule,
    ClaimsRpaModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    TerminusModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
