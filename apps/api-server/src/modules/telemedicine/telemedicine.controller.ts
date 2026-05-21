import { Controller, Post, Body, Param, Patch, UseGuards, Req } from '@nestjs/common';
import { TelemedicineService } from './telemedicine.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, TelemedicineStatus } from '@prisma/client';

@Controller('telemedicine')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  @Post('init/:appointmentId')
  @Roles(UserRole.DOCTOR)
  async initSession(@Param('appointmentId') appointmentId: string, @Req() req: any) {
    return this.telemedicineService.initSession(appointmentId, req.user.id);
  }

  @Patch('status/:appointmentId')
  async updateStatus(
    @Param('appointmentId') appointmentId: string,
    @Body('status') status: TelemedicineStatus
  ) {
    return this.telemedicineService.updateStatus(appointmentId, status);
  }

  @Post('end/:appointmentId')
  async endSession(
    @Param('appointmentId') appointmentId: string,
    @Body('duration') duration: number
  ) {
    return this.telemedicineService.endSession(appointmentId, duration);
  }
}
