import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('availability')
@Controller('availability')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('slots')
  @ApiOperation({ summary: 'Get available time slots for a doctor' })
  async getSlots(
    @Query('doctorId') doctorId: string,
    @Query('branchId') branchId: string,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getAvailableSlots(doctorId, branchId, new Date(date));
  }
}
