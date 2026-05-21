import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingService } from '../billing/billing.service';
import { Decimal } from 'decimal.js';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

@Injectable()
export class PharmacyService {
  constructor(
    private prisma: PrismaService,
    private billingService: BillingService,
  ) {}

  // ─── Medicine Catalog ───────────────────────────────────────────────────────

  async createMedicine(data: {
    name: string;
    composition?: string;
    hsnCode?: string;
    category: any;
    manufacturer?: string;
    minThreshold?: number;
  }) {
    return this.prisma.medicineMaster.create({ data });
  }

  async getMedicines(search?: string) {
    return this.prisma.medicineMaster.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: { batches: { where: { quantity: { gt: 0 } } } },
      orderBy: { name: 'asc' },
    });
  }

  // ─── Inventory/Stock Status ─────────────────────────────────────────────────

  async getStockStatus(branchId: string) {
    const medicines = await this.prisma.medicineMaster.findMany({
      include: {
        batches: {
          where: { branchId },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return medicines.map((med) => {
      const totalQty = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      const isLowStock = totalQty <= med.minThreshold;
      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const hasNearExpiry = med.batches.some(
        (b) => b.expiryDate <= thirtyDays && b.quantity > 0,
      );
      return { ...med, totalQty, isLowStock, hasNearExpiry };
    });
  }

  // ─── Expiry Watch ─────────────────────────────────────────────────────────

  async getExpiryWatch(branchId: string, daysAhead: number = 60) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return this.prisma.pharmacyBatch.findMany({
      where: {
        branchId,
        expiryDate: { lte: cutoff },
        quantity: { gt: 0 },
      },
      include: { medicine: true },
      orderBy: { expiryDate: 'asc' },
    });
  }

  // ─── Available Batches (FEFO) ────────────────────────────────────────────────

  async getAvailableBatches(medicineId: string, branchId: string) {
    const now = new Date();
    return this.prisma.pharmacyBatch.findMany({
      where: {
        medicineId,
        branchId,
        expiryDate: { gt: now }, // Expiry guard
        quantity: { gt: 0 },
      },
      orderBy: { expiryDate: 'asc' }, // FEFO: earliest-expiry-first
    });
  }

  // ─── Purchase Order (Stock-In) ────────────────────────────────────────────

  async receivePurchase(
    staffId: string,
    branchId: string,
    supplier: string,
    items: Array<{
      medicineId: string;
      batchNumber: string;
      expiryDate: string;
      mrp: number;
      salePrice: number;
      purchasePrice: number;
      quantity: number;
    }>,
    notes?: string,
  ) {
    const now = new Date();

    // Validate: no expired batches on purchase entry
    for (const item of items) {
      if (new Date(item.expiryDate) <= now) {
        throw new BadRequestException(
          `Batch ${item.batchNumber} has an expiry date in the past`,
        );
      }
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `Quantity for batch ${item.batchNumber} must be positive`,
        );
      }
    }

    const totalAmount = items.reduce(
      (sum, i) => new Decimal(sum).plus(new Decimal(i.purchasePrice).mul(i.quantity)).toNumber(),
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      // Create purchase order record
      const po = await tx.purchaseOrder.create({
        data: {
          supplier,
          branchId,
          notes,
          totalAmount,
          receivedById: staffId,
        },
      });

      // Upsert batches & write audit logs
      for (const item of items) {
        const batch = await tx.pharmacyBatch.upsert({
          where: {
            // Use compound unique — batchNumber per medicine per branch
            id: `${item.medicineId}-${item.batchNumber}-${branchId}`,
          },
          create: {
            id: `${item.medicineId}-${item.batchNumber}-${branchId}`,
            medicineId: item.medicineId,
            branchId,
            batchNumber: item.batchNumber,
            expiryDate: new Date(item.expiryDate),
            mrp: item.mrp,
            salePrice: item.salePrice,
            purchasePrice: item.purchasePrice,
            quantity: item.quantity,
          },
          update: {
            quantity: { increment: item.quantity },
          },
        });

        await tx.inventoryAudit.create({
          data: {
            batchId: batch.id,
            auditType: 'STOCK_IN',
            quantity: item.quantity,
            reason: `Purchase from ${supplier} (PO: ${po.id})`,
            performedById: staffId,
          },
        });
      }

      return po;
    });
  }

  // ─── FEFO Dispensing Engine ──────────────────────────────────────────────────

  /**
   * FEFO Logic:
   * For each requested medicine, sort available non-expired batches by expiryDate ASC.
   * Deduct from the earliest batch first. If that batch runs out, cascade to the next.
   * All deductions + audit entries happen atomically in a single $transaction.
   * Links to an Invoice via BillingService if patientId provided.
   */
  async processSale(
    staffId: string,
    branchId: string,
    items: Array<{ medicineId: string; quantity: number }>,
    patientId?: string,
  ) {
    const now = new Date();

    // Pre-validation: check stock before opening transaction
    for (const reqItem of items) {
      const batches = await this.getAvailableBatches(reqItem.medicineId, branchId);
      const totalAvail = batches.reduce((s, b) => s + b.quantity, 0);
      if (totalAvail < reqItem.quantity) {
        const med = await this.prisma.medicineMaster.findUnique({
          where: { id: reqItem.medicineId },
        });
        throw new BadRequestException(
          `Insufficient stock for "${med?.name}". Available: ${totalAvail}, Requested: ${reqItem.quantity}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const invoiceItems: Array<{
        serviceName: string;
        quantity: number;
        unitPrice: number;
        taxPercentage: number;
      }> = [];

      for (const reqItem of items) {
        let remaining = reqItem.quantity;

        const batches = await tx.pharmacyBatch.findMany({
          where: {
            medicineId: reqItem.medicineId,
            branchId,
            expiryDate: { gt: now },
            quantity: { gt: 0 },
          },
          orderBy: { expiryDate: 'asc' }, // FEFO
          include: { medicine: true },
        });

        for (const batch of batches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.quantity, remaining);

          await tx.pharmacyBatch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deduct } },
          });

          await tx.inventoryAudit.create({
            data: {
              batchId: batch.id,
              auditType: 'STOCK_OUT',
              quantity: deduct,
              reason: `Dispensed to patient${patientId ? ` ${patientId}` : ''}`,
              performedById: staffId,
            },
          });

          invoiceItems.push({
            serviceName: `${batch.medicine.name} (Batch: ${batch.batchNumber})`,
            quantity: deduct,
            unitPrice: Number(batch.salePrice),
            taxPercentage: 12, // GST 12% on drugs
          });

          remaining -= deduct;
        }
      }

      return { dispensed: true, invoiceItems };
    });
  }
}
