import { Controller, Post, Body, Get, Param, UseGuards, Req, Put, Patch, BadRequestException } from '@nestjs/common';
import { VitalsService } from './vitals.service';
import { ClinicalNoteService } from './clinical-note.service';
import { PrescriptionService } from './prescription.service';
import { LabService } from './lab.service';
import { RecordVitalsDto, CreateClinicalNoteDto } from './dto/clinical.dto';
import { CreatePrescriptionDto, CreateLabOrderDto, SubmitLabResultDto, UpdateLabOrderStatusDto } from './dto/orders.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('ehr')
@Controller('ehr')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class EhrController {
  constructor(
    private readonly vitalsService: VitalsService,
    private readonly clinicalNoteService: ClinicalNoteService,
    private readonly prescriptionService: PrescriptionService,
    private readonly labService: LabService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('vitals')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({ summary: 'Record patient vitals' })
  async recordVitals(@Req() req: any, @Body() dto: RecordVitalsDto) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new Error('User is not a staff member');
    return this.vitalsService.recordVitals(staff.id, dto);
  }

  @Get('patients/:id/vitals')
  @ApiOperation({ summary: 'Get patient vitals history' })
  async getVitalsHistory(@Param('id') id: string) {
    return this.vitalsService.getHistory(id);
  }

  @Post('clinical-notes')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create/Save a clinical note (SOAP)' })
  async createNote(@Req() req: any, @Body() dto: CreateClinicalNoteDto) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new Error('User is not a staff member');
    return this.clinicalNoteService.create(staff.id, dto as any);
  }

  @Patch('clinical-notes/:id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update a clinical note (Draft)' })
  async updateNote(@Param('id') id: string, @Req() req: any, @Body() dto: Partial<CreateClinicalNoteDto>) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new Error('User is not a staff member');
    return this.clinicalNoteService.update(id, staff.id, dto as any);
  }

  @Get('patients/:id/timeline')
  @ApiOperation({ summary: 'Get clinical history timeline' })
  async getTimeline(@Param('id') id: string) {
    return this.clinicalNoteService.getTimeline(id);
  }

  @Post('prescriptions')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a new medication prescription' })
  async createPrescription(@Req() req: any, @Body() dto: CreatePrescriptionDto) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new Error('User is not a staff member');
    return this.prescriptionService.create(staff.id, dto);
  }

  @Get('patients/:id/prescriptions')
  @ApiOperation({ summary: 'Get patient prescription history' })
  async getPrescriptionHistory(@Param('id') id: string) {
    return this.prescriptionService.getPatientHistory(id);
  }

  @Post('lab-orders')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create a new laboratory order' })
  async createLabOrder(@Req() req: any, @Body() dto: CreateLabOrderDto) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new Error('User is not a staff member');
    return this.labService.create(staff.id, dto);
  }

  @Get('patients/:id/lab-orders')
  @ApiOperation({ summary: 'Get patient laboratory history' })
  async getLabHistory(@Param('id') id: string) {
    return this.labService.getPatientHistory(id);
  }

  // --- Lab Technician Endpoints ---

  @Get('lab/queue')
  @Roles(UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get lab orders queue for the branch' })
  async getLabQueue(@Req() req: any) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new Error('User is not a staff member');
    return this.labService.getQueue(staff.branchId);
  }

  @Patch('lab/orders/:id/status')
  @Roles(UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update lab order status' })
  async updateLabStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLabOrderStatusDto) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new Error('User is not a staff member');
    return this.labService.updateOrderStatus(id, staff.id, dto);
  }

  @Patch('lab/tests/:testId/result')
  @Roles(UserRole.LAB_TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Submit result for a specific test' })
  async submitLabResult(@Req() req: any, @Param('testId') testId: string, @Body() dto: SubmitLabResultDto) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new BadRequestException('User is not a staff member');
    return this.labService.submitTestResult(testId, staff.id, dto);
  }
}
