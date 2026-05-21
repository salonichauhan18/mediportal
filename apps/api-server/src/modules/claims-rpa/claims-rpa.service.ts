import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClaimsRpaService {
  constructor(private prisma: PrismaService) {}

  async getPipelineStats() {
    const claims = await this.prisma.insuranceClaim.groupBy({
      by: ['claimStatus'],
      _count: { id: true }
    });
    
    const total = await this.prisma.insuranceClaim.count();
    
    const stats = {
      TOTAL: total,
      AUDITING: 0,
      SUBMITTED: 0,
      SETTLED: 0,
      REJECTED: 0
    };

    claims.forEach(c => {
      if (c.claimStatus === 'AUDITING') stats.AUDITING = c._count.id;
      if (c.claimStatus === 'SUBMITTED') stats.SUBMITTED = c._count.id;
      if (c.claimStatus === 'PAID') stats.SETTLED = c._count.id;
      if (c.claimStatus === 'REJECTED') stats.REJECTED = c._count.id;
    });

    return stats;
  }

  async getManualReviewQueue() {
    return this.prisma.insuranceClaim.findMany({
      where: {
        OR: [
          { claimStatus: 'REJECTED' },
          { claimStatus: 'DRAFT', aiConfidenceScore: { lt: 0.85 } }
        ]
      },
      include: {
        invoice: {
          include: { patient: { select: { user: { select: { name: true } } } } }
        },
        provider: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async manualOverride(claimId: string, status: 'SUBMITTED' | 'PAID', reason: string, staffId: string) {
    const claim = await this.prisma.insuranceClaim.findUnique({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');

    await this.prisma.insuranceActionLog.create({
      data: {
        claimId,
        action: 'MANUAL_REVIEW',
        details: `Manual override to ${status}. Reason: ${reason}. By Staff: ${staffId}`
      }
    });

    return this.prisma.insuranceClaim.update({
      where: { id: claimId },
      data: { claimStatus: status }
    });
  }
}
