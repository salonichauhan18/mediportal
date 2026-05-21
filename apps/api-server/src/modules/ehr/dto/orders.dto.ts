import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional, IsArray, ValidateNested, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionStatus, LabOrderStatus, LabPriority } from '@prisma/client';

export class PrescriptionItemDto {
  @ApiProperty({ example: 'Amoxicillin' })
  @IsString()
  @IsNotEmpty()
  drugName: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: 'TID (Three times a day)' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ example: '7 days' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiProperty({ example: 'Take after meals', required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'appointment-uuid', required: false })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ type: [PrescriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];

  @ApiProperty({ example: 'Follow up in 1 week', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: PrescriptionStatus, default: 'ACTIVE' })
  @IsEnum(PrescriptionStatus)
  @IsOptional()
  status?: PrescriptionStatus;
}

export class LabTestDto {
  @ApiProperty({ example: 'Complete Blood Count (CBC)' })
  @IsString()
  @IsNotEmpty()
  testName: string;

  @ApiProperty({ example: 'Fasting required', required: false })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateLabOrderDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'appointment-uuid', required: false })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ type: [LabTestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabTestDto)
  tests: LabTestDto[];

  @ApiProperty({ enum: LabPriority, default: 'ROUTINE' })
  @IsEnum(LabPriority)
  @IsOptional()
  priority?: LabPriority;

  @ApiProperty({ example: 'Suspected anemic infection', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateLabOrderStatusDto {
  @ApiProperty({ enum: LabOrderStatus })
  @IsEnum(LabOrderStatus)
  @IsNotEmpty()
  status: LabOrderStatus;
}

export class SubmitLabResultDto {
  @ApiProperty({ example: '12.5' })
  @IsString()
  @IsNotEmpty()
  resultValue: string;

  @ApiProperty({ example: 12.5, required: false })
  @IsNumber()
  @IsOptional()
  valueNumeric?: number;

  @ApiProperty({ example: 'mg/dL', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: '70 - 110', required: false })
  @IsString()
  @IsOptional()
  referenceRange?: string;

  @ApiProperty({ example: 70, required: false })
  @IsNumber()
  @IsOptional()
  minRange?: number;

  @ApiProperty({ example: 110, required: false })
  @IsNumber()
  @IsOptional()
  maxRange?: number;

  @ApiProperty({ example: 40, required: false })
  @IsNumber()
  @IsOptional()
  minCritical?: number;

  @ApiProperty({ example: 180, required: false })
  @IsNumber()
  @IsOptional()
  maxCritical?: number;

  @ApiProperty({ example: 'https://s3.amazonaws.com/reports/abc.pdf', required: false })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;
}
