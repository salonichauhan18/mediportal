import { Controller, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveStaff(req: any) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new BadRequestException('User is not a staff member');
    return staff;
  }

  @Get('revenue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.BILLING_ADMIN)
  @ApiOperation({ summary: 'Get revenue analytics' })
  async getRevenue(
    @Req() req: any,
    @Query('startDate') start: string,
    @Query('endDate') end: string,
    @Query('branchId') branchId?: string,
  ) {
    const staff = await this.resolveStaff(req);
    const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = end ? new Date(end) : new Date();

    return this.reportsService.getRevenueMetrics(branchId || staff.branchId, startDate, endDate);
  }

  @Get('operations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get operational KPIs' })
  async getOperations(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.reportsService.getOperationalMetrics(branchId || staff.branchId);
  }

  @Get('pharmacy')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PHARMACIST, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get pharmacy inventory value and COGS' })
  async getPharmacy(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.reportsService.getPharmacyMetrics(branchId || staff.branchId);
  }

  @Get('demographics')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get patient demographic split' })
  async getDemographics(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.reportsService.getPatientDemographics(branchId || staff.branchId);
  }

  @Get('activity')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get recent system activity' })
  async getActivity(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.reportsService.getRecentActivity(branchId || staff.branchId);
  }

  @Get('command-center')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get unified command center metrics' })
  async getCommandCenter(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.reportsService.getCommandCenterMetrics(branchId || staff.branchId);
  }
}
