import { Module } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { ClinicalNoteService } from './clinical-note.service';
import { PrescriptionService } from './prescription.service';
import { LabService } from './lab.service';
import { EhrController } from './ehr.controller';

@Module({
  providers: [VitalsService, ClinicalNoteService, PrescriptionService, LabService],
  controllers: [EhrController],
  exports: [VitalsService, ClinicalNoteService, PrescriptionService, LabService],
})
export class EhrModule {}
