import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ClinicalNoteStatus } from '@prisma/client';

export class RecordVitalsDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 175, required: false })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiProperty({ example: 70, required: false })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({ example: '120/80', required: false })
  @IsString()
  @IsOptional()
  bloodPressure?: string;

  @ApiProperty({ example: 72, required: false })
  @IsNumber()
  @IsOptional()
  pulseRate?: number;

  @ApiProperty({ example: 98.6, required: false })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({ example: 98, required: false })
  @IsNumber()
  @IsOptional()
  spO2?: number;
}

export class CreateClinicalNoteDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'appointment-uuid', required: false })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ example: 'Patient complains of chest pain', required: false })
  @IsString()
  @IsOptional()
  subjective?: string;

  @ApiProperty({ example: 'BP is elevated', required: false })
  @IsString()
  @IsOptional()
  objective?: string;

  @ApiProperty({ example: 'Suspected Hypertension', required: false })
  @IsString()
  @IsOptional()
  assessment?: string;

  @ApiProperty({ example: 'Start on ACE inhibitors', required: false })
  @IsString()
  @IsOptional()
  plan?: string;

  @ApiProperty({ enum: ClinicalNoteStatus, default: 'DRAFT' })
  @IsEnum(ClinicalNoteStatus)
  @IsOptional()
  status?: ClinicalNoteStatus;
}
