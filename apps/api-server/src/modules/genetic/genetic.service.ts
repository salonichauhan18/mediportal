import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeneticService {
  constructor(private prisma: PrismaService) {}

  async getPatientProfiles(patientId: string, staffId: string, reason?: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!patient.hasGeneticConsent) {
      throw new ForbiddenException('Patient has not provided consent for genetic data access.');
    }

    // Log the access
    await this.prisma.geneticDataAccessLog.create({
      data: {
        patientId,
        staffId,
        reason: reason || 'Routine clinical review'
      }
    });

    return this.prisma.geneticProfile.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async addGeneticProfile(patientId: string, staffId: string, data: { markerName: string; result: string; clinicalSignificance?: string }) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!patient.hasGeneticConsent) {
      throw new ForbiddenException('Cannot upload genetic data without patient consent.');
    }

    // Log the upload access
    await this.prisma.geneticDataAccessLog.create({
      data: {
        patientId,
        staffId,
        reason: `Uploaded new genetic marker: ${data.markerName}`
      }
    });

    return this.prisma.geneticProfile.create({
      data: {
        patientId,
        markerName: data.markerName,
        result: data.result,
        clinicalSignificance: data.clinicalSignificance
      }
    });
  }

  async updateConsent(patientId: string, consentStatus: boolean) {
    return this.prisma.patient.update({
      where: { id: patientId },
      data: { hasGeneticConsent: consentStatus },
      select: { id: true, hasGeneticConsent: true }
    });
  }

  async getConsentStatus(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      select: { hasGeneticConsent: true }
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
