import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from 'decimal.js';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getRevenueMetrics(branchId: string, startDate: Date, endDate: Date) {
    const invoices = await this.prisma.invoice.groupBy({
      by: ['status'],
      where: {
        branchId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        grandTotal: true,
        taxTotal: true,
        discount: true,
      },
    });

    const transactions = await this.prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        invoice: {
          branchId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return {
      invoices,
      transactions,
    };
  }

  async getOperationalMetrics(branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [appointments, patients, footfall] = await Promise.all([
      this.prisma.appointment.count({
        where: { branchId, startTime: { gte: today } },
      }),
      this.prisma.patient.count({
        where: { branchId },
      }),
      this.prisma.appointment.count({
        where: { branchId, startTime: { gte: today }, status: 'COMPLETED' },
      }),
    ]);

    return {
      appointments,
      totalPatients: patients,
      dailyFootfall: footfall,
    };
  }

  async getPharmacyMetrics(branchId: string) {
    const inventory = await this.prisma.pharmacyBatch.aggregate({
      where: { branchId, quantity: { gt: 0 } },
      _sum: {
        quantity: true,
      },
    });

    // Simple COGS approximation from STOCK_OUT audits
    const cogs = await this.prisma.inventoryAudit.aggregate({
      where: {
        batch: { branchId },
        auditType: 'STOCK_OUT',
      },
      _sum: {
        quantity: true,
      },
    });

    return {
      totalStockUnits: inventory._sum.quantity || 0,
      totalDispensedUnits: cogs._sum.quantity || 0,
    };
  }

  async getPatientDemographics(branchId: string) {
    const genders = await this.prisma.patient.groupBy({
      by: ['gender'],
      where: { branchId },
      _count: {
        _all: true,
      },
    });

    return {
      genders,
    };
  }

  async getDepartmentPerformance(branchId: string) {
    const appointments = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { branchId },
      _count: {
        _all: true,
      },
    });

    // In a real app, we'd join with Staff -> Department
    // For now, return the doctor-wise split
    return appointments;
  }

  async getRecentActivity(branchId: string, limit: number = 10) {
    return this.prisma.transaction.findMany({
      where: { invoice: { branchId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        invoice: {
          include: {
            patient: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async getCommandCenterMetrics(branchId: string) {
    // 1. Clinical: Triage distribution from AI logs
    const triageLogs = await this.prisma.clinicalAiLog.findMany({
      where: { taskType: 'TRIAGE' },
      select: { response: true }
    });

    const triageDistribution = { RED: 0, YELLOW: 0, GREEN: 0 };
    triageLogs.forEach(log => {
      try {
        const parsed = JSON.parse(log.response);
        const level = parsed.urgencyLevel?.toUpperCase();
        if (level === 'RED') triageDistribution.RED++;
        else if (level === 'YELLOW') triageDistribution.YELLOW++;
        else if (level === 'GREEN') triageDistribution.GREEN++;
      } catch (e) {}
    });

    // 2. Operational: Bed occupancy metrics
    const totalBeds = await this.prisma.bedMaster.count({ where: { branchId } });
    const occupiedBeds = await this.prisma.bedMaster.count({ where: { branchId, status: 'OCCUPIED' } });
    
    // Mocked 7-day forecast vs actual
    const bedForecast = [
      { day: 'Mon', actual: 45, forecast: 48 },
      { day: 'Tue', actual: 52, forecast: 50 },
      { day: 'Wed', actual: 48, forecast: 55 },
      { day: 'Thu', actual: 61, forecast: 58 },
      { day: 'Fri', actual: 55, forecast: 60 },
      { day: 'Sat', actual: 72, forecast: 65 },
      { day: 'Sun', actual: 68, forecast: 70 },
    ];

    // 3. Genomic: Total count of active GeneticProfile markers
    const genomicShields = await this.prisma.geneticProfile.count();

    // 4. Financial: RPA settlement success rate and "Saved Revenue"
    const totalClaims = await this.prisma.insuranceClaim.count();
    const settledClaims = await this.prisma.insuranceClaim.count({ where: { claimStatus: 'PAID' } });
    const autoActions = await this.prisma.insuranceActionLog.count({ where: { action: 'AUTO_SUBMIT' } });
    
    // Mock: $50 saved per auto-approval
    const savedRevenue = autoActions * 50;

    return {
      clinical: {
        triage: triageDistribution,
        totalTriaged: triageLogs.length
      },
      operational: {
        totalBeds,
        occupiedBeds,
        occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0,
        forecast: bedForecast
      },
      genomic: {
        totalShields: genomicShields
      },
      financial: {
        totalClaims,
        settledClaims,
        settlementRate: totalClaims > 0 ? (settledClaims / totalClaims) * 100 : 0,
        savedRevenue,
        autoSubmissionRate: totalClaims > 0 ? (autoActions / totalClaims) * 100 : 0
      }
    };
  }
}
