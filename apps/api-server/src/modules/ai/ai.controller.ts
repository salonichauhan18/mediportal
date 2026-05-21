import { Controller, Post, Body, UseGuards, Get, Query } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { BedService } from '../beds/bed.service';
import { CacheService } from '../cache/cache.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ai')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AiController {
  constructor(
    private readonly geminiService: GeminiService, 
    private readonly bedService: BedService,
    private readonly cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('summarize-encounter')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async summarizeEncounter(@Body() body: { subjective: string; objective: string; uhid: string; doctorId: string }) {
    const content = `Subjective: ${body.subjective}\nObjective: ${body.objective}`;
    return this.geminiService.generateClinicalInsight('SUMMARIZATION', content, {
      uhid: body.uhid,
      doctorId: body.doctorId,
    });
  }

  @Post('suggest-codes')
  @Roles(UserRole.DOCTOR, UserRole.BILLING_ADMIN, UserRole.ADMIN)
  async suggestCodes(@Body() body: { assessment: string; uhid: string; doctorId: string }) {
    return this.geminiService.generateClinicalInsight('CODING', body.assessment, {
      uhid: body.uhid,
      doctorId: body.doctorId,
    });
  }

  @Post('explain-report')
  async explainReport(@Body() body: { labResults: string; uhid: string; patientId: string }) {
    return this.geminiService.generateClinicalInsight('EXPLANATION', body.labResults, {
      uhid: body.uhid,
      patientId: body.patientId,
    });
  }

  @Post('triage')
  async triageSymptoms(@Body() body: { symptoms: string; duration: string; severity: string; uhid: string; patientId: string }) {
    const content = `Symptoms: ${body.symptoms}\nDuration: ${body.duration}\nSeverity: ${body.severity}`;
    return this.geminiService.generateClinicalInsight('TRIAGE', content, {
      uhid: body.uhid,
      patientId: body.patientId,
    });
  }

  @Post('analyze-trends')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN)
  async analyzeTrends(@Body() body: { patientId: string; parameter: 'heartRate' | 'systolicBP' | 'glucose' | 'spO2'; uhid: string; doctorId: string }) {
    // In a real app, we'd fetch this from the DB. 
    // For now, we simulate the fetch or use the GeminiService to handle logic if we pass DB service.
    // Let's assume we pass a summary of data.
    return this.geminiService.generateClinicalInsight('TREND_ANALYSIS', `Analyze trends for ${body.parameter} for patient ${body.uhid}`, {
      uhid: body.uhid,
      doctorId: body.doctorId,
    });
  }

  @Post('parse-complex-report')
  @Roles(UserRole.DOCTOR, UserRole.LAB_TECHNICIAN)
  async parseComplexReport(@Body() body: { rawReport: string; uhid: string; doctorId: string }) {
    return this.geminiService.generateClinicalInsight('COMPLEX_PARSING', body.rawReport, {
      uhid: body.uhid,
      doctorId: body.doctorId,
    });
  }

  @Post('predict-occupancy')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async predictOccupancy(@Body() body: { branchId: string }) {
    const historicalDataSummary = await this.bedService.getHistoricalAdmissionData(body.branchId);
    const prompt = `Analyze the following historical admission and appointment data for Branch ${body.branchId}:\n${historicalDataSummary}`;
    return this.geminiService.generateClinicalInsight('INFLOW_PREDICTION', prompt, {
      // Pass metadata if necessary
    });
  }

  @Post('check-dgi')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async checkDgi(@Body() body: { drugName: string; patientId: string }) {
    const { drugName, patientId } = body;

    const markers = await this.prisma.geneticProfile.findMany({
      where: { patientId },
      select: { markerName: true, result: true, clinicalSignificance: true }
    });

    if (markers.length === 0) {
      return { safetyScore: 'Safe', reasoning: 'No genetic markers on file.', confidenceScore: 1 };
    }

    const markersStr = markers.map(m => `${m.markerName}:${m.result}`).sort().join('|');
    const cacheKey = `dgi:${drugName.toLowerCase()}:${markersStr}`;

    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const content = `Drug: ${drugName}\nPatient Markers:\n${JSON.stringify(markers, null, 2)}`;
    
    const result = await this.geminiService.generateClinicalInsight('PHARMACOGENOMICS', content, { patientId });
    
    await this.cacheService.set(cacheKey, result, 3600); 

    return result;
  }

  @Post('audit-claim')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BILLING_ADMIN)
  async auditClaim(@Body() body: { claimId: string }) {
    const { claimId } = body;

    const claim = await this.prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      include: {
        invoice: {
          include: {
            items: true,
            appointment: {
              include: {
                clinicalNote: true
              }
            }
          }
        }
      }
    });

    if (!claim) {
      return { readyToSubmit: false, confidenceScore: 0, discrepancies: 'Claim not found.' };
    }

    const clinicalNote = claim.invoice.appointment?.clinicalNote;
    const invoiceItems = claim.invoice.items;

    const content = `Clinical Note: ${clinicalNote ? JSON.stringify(clinicalNote) : 'None provided'}\n\nInvoice Line Items: ${JSON.stringify(invoiceItems)}`;
    
    const result = await this.geminiService.generateClinicalInsight('CLAIM_AUDITOR', content);

    return result;
  }
}
