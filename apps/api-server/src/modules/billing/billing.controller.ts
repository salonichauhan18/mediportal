import {
  Controller, Post, Body, Get, Param, Patch, UseGuards, Req, Res, Query, BadRequestException,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import { PDFService } from './pdf.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';

@ApiTags('billing')
@Controller('billing')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly pdfService: PDFService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── Helper: resolve staff from JWT ───
  private async resolveStaff(req: any) {
    const staff = await this.prisma.staff.findUnique({ where: { userId: req.user.id } });
    if (!staff) throw new BadRequestException('User is not a staff member');
    return staff;
  }

  // ─── Service Catalog ───

  @Get('services')
  @Roles(UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get service catalog for a branch' })
  async getServices(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.billingService.getServiceCatalog(branchId || staff.branchId);
  }

  @Post('services')
  @Roles(UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new billable service' })
  async createService(@Body() dto: any) {
    return this.billingService.createService(dto);
  }

  // ─── Invoice CRUD ───

  @Post('invoices')
  @Roles(UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Generate a new invoice' })
  async generateInvoice(@Req() req: any, @Body() dto: any) {
    const staff = await this.resolveStaff(req);
    return this.billingService.generateInvoice(staff.id, dto, req.user.role);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details' })
  async getInvoice(@Param('id') id: string) {
    return this.billingService.getInvoiceById(id);
  }

  @Get('patients/:patientId/invoices')
  @ApiOperation({ summary: 'Get all invoices for a patient' })
  async getPatientInvoices(@Param('patientId') patientId: string) {
    return this.billingService.getPatientInvoices(patientId);
  }

  @Get('pending')
  @Roles(UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get pending invoices for the branch' })
  async getPendingInvoices(@Req() req: any, @Query('branchId') branchId?: string) {
    const staff = await this.resolveStaff(req);
    return this.billingService.getPendingInvoices(branchId || staff.branchId);
  }

  // ─── Payments ───

  @Post('invoices/:id/pay')
  @Roles(UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Process a payment against an invoice' })
  async processPayment(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const staff = await this.resolveStaff(req);
    return this.billingService.processPayment(id, staff.id, dto);
  }

  // ─── PDF ───

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Download invoice as PDF' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.billingService.getInvoiceById(id);
    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  // ─── Insurance Claims ───

  @Post('invoices/:id/claims')
  @Roles(UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Link an insurance claim to an invoice' })
  async createClaim(@Param('id') invoiceId: string, @Body() dto: any) {
    return this.billingService.createClaim(
      invoiceId, dto.providerId, dto.policyNumber, dto.claimAmount,
    );
  }

  @Patch('claims/:id')
  @Roles(UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update insurance claim status' })
  async updateClaimStatus(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    const staff = await this.resolveStaff(req);
    return this.billingService.updateClaimStatus(id, staff.id, dto.claimStatus, dto.approvedAmount);
  }
}
