import { Module } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientsController } from './patients.controller';
import { UHIDEngine } from './uhid.engine';

@Module({
  providers: [PatientService, UHIDEngine],
  controllers: [PatientsController],
  exports: [PatientService],
})
export class PatientsModule {}
