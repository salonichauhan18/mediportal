import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from 'decimal.js';
import { InvoiceStatus, PaymentMethod, UserRole } from '@prisma/client';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

interface CreateInvoiceItemDto {
  serviceName: string;
  quantity: number;
  unitPrice: number;
  taxPercentage: number;
}

interface GenerateInvoiceDto {
  patientId: string;
  branchId: string;
  appointmentId?: string;
  items: CreateInvoiceItemDto[];
  discount?: number;
}

interface ProcessPaymentDto {
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
}

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates a unique, sequential invoice number per branch.
   * Format: INV-{BranchCode}-{YYYYMMDD}-{Sequence}
   */
  private async generateInvoiceNumber(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new BadRequestException('Branch not found');

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    const count = await this.prisma.invoice.count({
      where: {
        branchId,
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        },
      },
    });

    return `INV-${branch.code}-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Core tax math engine using Decimal.js for floating-point safety.
   * 
   * For each item:
   *   lineSubtotal = unitPrice * quantity
   *   taxAmount    = (lineSubtotal * taxPercentage) / 100
   *   totalAmount  = lineSubtotal + taxAmount
   * 
   * Invoice totals:
   *   subTotal   = SUM(lineSubtotal)
   *   taxTotal   = SUM(taxAmount)
   *   grandTotal = subTotal + taxTotal - discount
   */
  private calculateTotals(items: CreateInvoiceItemDto[], discount: number = 0) {
    let subTotal = new Decimal(0);
    let taxTotal = new Decimal(0);

    const computedItems = items.map((item) => {
      const price = new Decimal(item.unitPrice);
      const qty = new Decimal(item.quantity);
      const taxPct = new Decimal(item.taxPercentage);

      const lineSubtotal = price.mul(qty);
      const taxAmount = lineSubtotal.mul(taxPct).div(100);
      const totalAmount = lineSubtotal.plus(taxAmount);

      subTotal = subTotal.plus(lineSubtotal);
      taxTotal = taxTotal.plus(taxAmount);

      return {
        serviceName: item.serviceName,
        quantity: item.quantity,
        unitPrice: lineSubtotal.div(qty).toDecimalPlaces(2).toNumber(),
        taxAmount: taxAmount.toDecimalPlaces(2).toNumber(),
        totalAmount: totalAmount.toDecimalPlaces(2).toNumber(),
      };
    });

    const discountDec = new Decimal(discount);
    const grandTotal = subTotal.plus(taxTotal).minus(discountDec);

    return {
      computedItems,
      subTotal: subTotal.toDecimalPlaces(2).toNumber(),
      taxTotal: taxTotal.toDecimalPlaces(2).toNumber(),
      discount: discountDec.toDecimalPlaces(2).toNumber(),
      grandTotal: grandTotal.toDecimalPlaces(2).toNumber(),
    };
  }

  /**
   * Generates a new invoice for a patient.
   * Only BILLING_ADMIN, ADMIN, or SUPER_ADMIN can apply discounts > 0.
   */
  async generateInvoice(staffId: string, dto: GenerateInvoiceDto, userRole: UserRole) {
    // Guard: Only privileged roles may apply discounts
    if (dto.discount && dto.discount > 0) {
      if (!(([UserRole.BILLING_ADMIN, UserRole.ADMIN, UserRole.SUPER_ADMIN] as UserRole[]).includes(userRole))) {
        throw new ForbiddenException('Only BILLING_ADMIN or ADMIN can apply discounts');
      }
    }

    const invoiceNumber = await this.generateInvoiceNumber(dto.branchId);
    const { computedItems, subTotal, taxTotal, discount, grandTotal } = this.calculateTotals(dto.items, dto.discount);

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: dto.patientId,
        branchId: dto.branchId,
        appointmentId: dto.appointmentId,
        subTotal,
        taxTotal,
        discount,
        grandTotal,
        baseAmount: grandTotal,
        createdById: staffId,
        items: {
          create: computedItems,
        },
      },
      include: {
        items: true,
        patient: { include: { user: { select: { name: true } } } },
        branch: { include: { hospital: true } },
        transactions: true,
      },
    });

    return invoice;
  }

  /**
   * Process a payment against an invoice.
   * Creates a Transaction ledger entry and updates invoice status.
   */
  async processPayment(invoiceId: string, staffId: string, dto: ProcessPaymentDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { transactions: true },
    });

    if (!invoice) throw new BadRequestException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('Invoice is already fully paid');
    if (invoice.status === 'CANCELLED') throw new BadRequestException('Cannot pay a cancelled invoice');

    const paymentAmount = new Decimal(dto.amount);
    const totalPaid = invoice.transactions.reduce(
      (acc, t) => acc.plus(new Decimal(t.amount.toString())),
      new Decimal(0),
    );
    const outstanding = new Decimal(invoice.grandTotal.toString()).minus(totalPaid);

    if (paymentAmount.gt(outstanding)) {
      throw new BadRequestException(
        `Payment amount ₹${paymentAmount.toFixed(2)} exceeds outstanding balance ₹${outstanding.toFixed(2)}`,
      );
    }

    // Determine new invoice status
    const newTotalPaid = totalPaid.plus(paymentAmount);
    const grandTotal = new Decimal(invoice.grandTotal.toString());
    let newStatus: InvoiceStatus;

    if (newTotalPaid.gte(grandTotal)) {
      newStatus = 'PAID';
    } else {
      newStatus = 'PARTIAL';
    }

    // Atomic: create transaction + update invoice status
    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          invoiceId,
          amount: paymentAmount.toNumber(),
          paymentMethod: dto.paymentMethod,
          referenceNumber: dto.referenceNumber,
          receivedById: staffId,
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          finalizedAt: newStatus === 'PAID' ? new Date() : undefined,
        },
      }),
    ]);

    return {
      transaction,
      invoiceStatus: newStatus,
      outstanding: outstanding.minus(paymentAmount).toFixed(2),
    };
  }

  /**
   * Get all invoices for a specific patient.
   */
  async getPatientInvoices(patientId: string) {
    return this.prisma.invoice.findMany({
      where: { patientId },
      include: {
        items: true,
        transactions: true,
        createdBy: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single invoice with full details (for PDF generation).
   */
  async getInvoiceById(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        transactions: true,
        patient: { include: { user: { select: { name: true, email: true } } } },
        branch: { include: { hospital: true } },
        claims: { include: { provider: true } },
        createdBy: { include: { user: { select: { name: true } } } },
      },
    });

    if (!invoice) throw new BadRequestException('Invoice not found');
    return invoice;
  }

  /**
   * Get all pending (unbilled or partial) invoices for the branch.
   */
  async getPendingInvoices(branchId: string) {
    return this.prisma.invoice.findMany({
      where: {
        branchId,
        status: { in: ['UNPAID', 'PARTIAL'] },
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        items: true,
        transactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch the ServiceMaster catalog for a branch.
   */
  async getServiceCatalog(branchId: string) {
    return this.prisma.serviceMaster.findMany({
      where: { branchId },
      orderBy: { category: 'asc' },
    });
  }

  /**
   * Create a new service in the catalog.
   */
  async createService(data: { name: string; basePrice: number; taxPercentage: number; category: any; branchId: string }) {
    return this.prisma.serviceMaster.create({ data });
  }

  /**
   * Link an insurance claim to an existing invoice.
   */
  async createClaim(invoiceId: string, providerId: string, policyNumber: string, claimAmount: number) {
    return this.prisma.insuranceClaim.create({
      data: {
        invoiceId,
        providerId,
        policyNumber,
        claimAmount,
      },
      include: { provider: true },
    });
  }

  /**
   * Update claim status (e.g., APPROVED with an approved amount).
   * If settled, record an INSURANCE transaction on the invoice.
   */
  async updateClaimStatus(
    claimId: string,
    staffId: string,
    status: string,
    approvedAmount?: number,
  ) {
    const claim = await this.prisma.insuranceClaim.update({
      where: { id: claimId },
      data: {
        claimStatus: status as any,
        approvedAmount: approvedAmount ?? undefined,
      },
    });

    // If SETTLED, automatically record the insurance payment as a Transaction
    if (status === 'SETTLED' && approvedAmount && approvedAmount > 0) {
      await this.processPayment(claim.invoiceId, staffId, {
        amount: approvedAmount,
        paymentMethod: 'INSURANCE',
        referenceNumber: `CLAIM-${claimId}`,
      });
    }

    return claim;
  }
}
