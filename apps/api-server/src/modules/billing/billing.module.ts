import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PDFService } from './pdf.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, PDFService],
  exports: [BillingService],
})
export class BillingModule {}
