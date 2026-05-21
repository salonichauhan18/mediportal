import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VitalsInput } from '@mediportal/shared-types';

@Injectable()
export class VitalsService {
  constructor(private prisma: PrismaService) {}

  async recordVitals(staffId: string, dto: VitalsInput) {
    const { patientId, height, weight, bloodPressure, pulseRate, temperature, spO2 } = dto;

    let bmi: number | undefined;
    if (height && weight) {
      // BMI = kg / m^2
      const heightInMeters = height / 100;
      bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
    }

    return this.prisma.vitals.create({
      data: {
        patientId,
        staffId,
        height,
        weight,
        bmi,
        bloodPressure,
        pulseRate,
        temperature,
        spO2,
      },
    });
  }

  async getHistory(patientId: string) {
    return this.prisma.vitals.findMany({
      where: { patientId },
      orderBy: { recordedAt: 'desc' },
      take: 20, // Limit to last 20 recordings for trending
    });
  }
}
