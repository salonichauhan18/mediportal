import {
  Controller, Post, Body, Get, Param, UseGuards, Req, Query, BadRequestException,
} from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('pharmacy')
@Controller('pharmacy')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PharmacyController {
  constructor(
    private readonly pharmacyService: PharmacyService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveStaff(req: any) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new BadRequestException('User is not a staff member');
    return staff;
  }

  // ─── Medicine Catalog ───

  @Get('medicines')
  @ApiOperation({ summary: 'Search medicine catalog' })
  async getMedicines(@Query('search') search?: string) {
    return this.pharmacyService.getMedicines(search);
  }

  @Post('medicines')
  @Roles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add medicine to catalog' })
  async createMedicine(@Body() dto: any) {
    return this.pharmacyService.createMedicine(dto);
  }

  // ─── Inventory ───

  @Get('inventory/stock')
  @Roles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BILLING_ADMIN)
  @ApiOperation({ summary: 'Get stock status for branch (with low-stock flags)' })
  async getStockStatus(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.pharmacyService.getStockStatus(branchId || staff.branchId);
  }

  @Get('inventory/expiry-watch')
  @Roles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get batches expiring within N days' })
  async getExpiryWatch(
    @Req() req: any,
    @Query('days') days: string = '60',
    @Query('branchId') branchId?: string,
  ) {
    const staff = await this.resolveStaff(req);
    return this.pharmacyService.getExpiryWatch(branchId || staff.branchId, parseInt(days));
  }

  @Get('inventory/:medicineId/available')
  @ApiOperation({ summary: 'Get available FEFO-sorted batches for a medicine' })
  async getAvailableBatches(@Req() req: any, @Param('medicineId') medicineId: string) {
    const staff = await this.resolveStaff(req);
    return this.pharmacyService.getAvailableBatches(medicineId, staff.branchId);
  }

  // ─── Purchase (Stock-In) ───

  @Post('purchase')
  @Roles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Receive a purchase order and stock-in items' })
  async receivePurchase(@Req() req: any, @Body() dto: any) {
    const staff = await this.resolveStaff(req);
    return this.pharmacyService.receivePurchase(
      staff.id,
      staff.branchId,
      dto.supplier,
      dto.items,
      dto.notes,
    );
  }

  // ─── Sales / Dispensing ───

  @Post('sale')
  @Roles(UserRole.PHARMACIST, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BILLING_ADMIN)
  @ApiOperation({ summary: 'Dispense medicines via FEFO and create invoice items' })
  async processSale(@Req() req: any, @Body() dto: any) {
    const staff = await this.resolveStaff(req);
    return this.pharmacyService.processSale(
      staff.id,
      staff.branchId,
      dto.items,
      dto.patientId,
    );
  }
}
