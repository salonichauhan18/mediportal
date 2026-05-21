import { Module } from '@nestjs/common';
import { ClaimsRpaService } from './claims-rpa.service';
import { ClaimsRpaController } from './claims-rpa.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { ClaimsCronService } from './claims-cron.service';

@Module({
  imports: [PrismaModule, AiModule],
  providers: [ClaimsRpaService, ClaimsCronService],
  controllers: [ClaimsRpaController],
})
export class ClaimsRpaModule {}
