import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BedStatus, AdmissionStatus, BedType } from '@prisma/client';
import { SocketGateway } from '../socket/socket.gateway';

@Injectable()
export class BedService {
  private readonly logger = new Logger(BedService.name);

  constructor(private prisma: PrismaService, private socketGateway: SocketGateway) {}

  async autoSuggestBed(branchId: string, patientId: string, requiredType?: 'ICU' | 'GENERAL' | 'SEMI_PRIVATE', triageSeverity?: 'RED' | 'YELLOW' | 'GREEN') {
    let bedTypeToAssign = requiredType || BedType.GENERAL;

    if (triageSeverity) {
      if (triageSeverity === 'RED') bedTypeToAssign = BedType.ICU;
      else if (triageSeverity === 'YELLOW') bedTypeToAssign = BedType.SEMI_PRIVATE;
      else if (triageSeverity === 'GREEN') bedTypeToAssign = BedType.GENERAL;
    }

    // We use a transaction to ensure we don't double-book a bed during a high-concurrency surge.
    return this.prisma.$transaction(async (tx) => {
      // 1. Find a vacant bed of the requested type
      const vacantBed = await tx.bedMaster.findFirst({
        where: {
          branchId,
          bedType: bedTypeToAssign,
          status: BedStatus.VACANT,
        },
        orderBy: { roomNumber: 'asc' }, // Simple assignment logic
      });

      if (!vacantBed) {
        throw new NotFoundException(`No vacant ${bedTypeToAssign} beds available in this branch.`);
      }

      // 2. Mark bed as occupied
      const updatedBed = await tx.bedMaster.update({
        where: { id: vacantBed.id },
        data: { status: BedStatus.OCCUPIED },
      });

      // 3. Create the inpatient admission record
      const admission = await tx.inpatientAdmission.create({
        data: {
          patientId,
          bedId: updatedBed.id,
          status: AdmissionStatus.ADMITTED,
        },
      });

      this.logger.log(`Patient ${patientId} auto-assigned to Bed ${updatedBed.id} (Room ${updatedBed.roomNumber})`);

      // Broadcast the real-time update
      this.socketGateway.sendToBranch(branchId, 'occupancyUpdate', { bedId: updatedBed.id, status: BedStatus.OCCUPIED });

      return { bed: updatedBed, admission };
    });
  }

  async getOccupancy(branchId: string) {
    const beds = await this.prisma.bedMaster.findMany({
      where: { branchId },
      include: {
        admissions: {
          where: { status: AdmissionStatus.ADMITTED },
          include: { patient: { select: { id: true, user: { select: { name: true } } } } }
        }
      }
    });

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === BedStatus.OCCUPIED).length;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    return {
      beds,
      stats: {
        total: totalBeds,
        occupied: occupiedBeds,
        vacant: totalBeds - occupiedBeds,
        occupancyRate: occupancyRate.toFixed(2)
      }
    };
  }

  async getHistoricalAdmissionData(branchId: string): Promise<string> {
    // In a real production system, this would run complex aggregation queries over historical data.
    // For this simulation, we'll provide a generated summary that simulates winter surge trends.
    const currentStats = await this.getOccupancy(branchId);
    return `
    Current Occupancy: ${currentStats.stats.occupancyRate}% (${currentStats.stats.occupied}/${currentStats.stats.total} beds).
    Historical Trends (Simulated):
    - Last 7 days: 45 admissions (mostly respiratory).
    - Last 14 days: 85 admissions.
    - Year-over-Year trend: 15% increase in respiratory cases during winter months (Nov-Jan).
    - Emergency Triage (RED): 5 cases in the last 48 hours.
    `;
  }
}
