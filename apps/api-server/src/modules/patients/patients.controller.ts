import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('patients')
@Controller('patients')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PatientsController {
  constructor(private readonly patientService: PatientService) {}

  @Post('register')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Register a new patient and generate UHID' })
  async register(@Body() dto: CreatePatientDto) {
    return this.patientService.create(dto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DOCTOR, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'List all registered patients (Branch filtered if provided)' })
  async findAll(@Query('branchId') branchId?: string) {
    return this.patientService.findAll(branchId);
  }
}
