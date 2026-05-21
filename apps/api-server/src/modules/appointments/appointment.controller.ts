import { Controller, Post, Body, Patch, Param, Get, Query, UseGuards } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, AppointmentStatus } from '@prisma/client';

@ApiTags('appointments')
@Controller('appointments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Book a new appointment' })
  async create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentService.create(dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update appointment status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus) {
    return this.appointmentService.updateStatus(id, status);
  }

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get appointments for dashboard' })
  async getDashboard(
    @Query('doctorId') doctorId?: string,
    @Query('branchId') branchId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentService.getDashboard(doctorId, branchId, date ? new Date(date) : undefined);
  }
}
