import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { BedService } from './bed.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('beds')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BedController {
  constructor(private readonly bedService: BedService) {}

  @Post('auto-suggest')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async autoSuggestBed(@Body() body: { branchId: string; patientId: string; requiredType: 'ICU' | 'GENERAL' | 'SEMI_PRIVATE' }) {
    return this.bedService.autoSuggestBed(body.branchId, body.patientId, body.requiredType);
  }

  @Get('occupancy/:branchId')
  @Roles(UserRole.NURSE, UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getOccupancy(@Param('branchId') branchId: string) {
    return this.bedService.getOccupancy(branchId);
  }
}
