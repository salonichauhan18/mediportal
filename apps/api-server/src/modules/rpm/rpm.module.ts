import { Module } from '@nestjs/common';
import { RpmService } from './rpm.service';
import { RpmController } from './rpm.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, AiModule, NotificationModule],
  controllers: [RpmController],
  providers: [RpmService],
  exports: [RpmService],
})
export class RpmModule {}
