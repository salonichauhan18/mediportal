import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UHIDEngine {
  constructor(private prisma: PrismaService) {}

  async generate(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });

    if (!branch) {
      throw new Error('Invalid Branch ID');
    }

    const year = new Date().getFullYear();
    const count = await this.prisma.patient.count({
      where: {
        branchId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const sequence = (count + 1).toString().padStart(4, '0');
    return `${branch.code}-${year}-${sequence}`;
  }
}
