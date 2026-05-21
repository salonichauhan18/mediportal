import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AiController } from './ai.controller';
import { ThrottlerModule } from '@nestjs/throttler';
import { BedModule } from '../beds/bed.module';
import { PredictiveCronService } from './predictive-cron.service';
import { CacheModule } from '../cache/cache.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [BedModule, CacheModule, PrismaModule],
  controllers: [AiController],
  providers: [GeminiService, PredictiveCronService],
  exports: [GeminiService],
})
export class AiModule {}
