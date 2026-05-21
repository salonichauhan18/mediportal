import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';

@Injectable()
export class ClaimsCronService {
  private readonly logger = new Logger(ClaimsCronService.name);

  constructor(
    private prisma: PrismaService,
    private geminiService: GeminiService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processClaims() {
    this.logger.log('Starting Auto-Adjudication RPA Job...');

    // Fetch up to 50 DRAFT claims
    const claims = await this.prisma.insuranceClaim.findMany({
      where: { claimStatus: 'DRAFT' },
      take: 50,
      include: {
        invoice: {
          include: {
            items: true,
            appointment: { include: { clinicalNote: true } }
          }
        }
      }
    });

    if (claims.length === 0) {
      this.logger.log('No DRAFT claims found to process.');
      return;
    }

    this.logger.log(`Found ${claims.length} claims for AI Audit.`);

    for (const claim of claims) {
      await this.auditAndAdjudicateClaim(claim);
    }
  }

  private async auditAndAdjudicateClaim(claim: any) {
    try {
      // 1. Move to AUDITING
      await this.prisma.insuranceClaim.update({
        where: { id: claim.id },
        data: { claimStatus: 'AUDITING' }
      });

      // 2. Perform AI Audit
      const clinicalNote = claim.invoice.appointment?.clinicalNote;
      const content = `Clinical Note: ${clinicalNote ? JSON.stringify(clinicalNote) : 'None provided'}\n\nInvoice Line Items: ${JSON.stringify(claim.invoice.items)}`;
      
      const auditResult = await this.geminiService.generateClinicalInsight('CLAIM_AUDITOR', content);

      // 3. Adjudication Formula
      // Score = (Confidence_AI * 0.7) + (Patient_History * 0.3)
      // Patient_History is mocked to 0.9 for this sprint
      const aiConfidence = auditResult.confidenceScore || 0;
      const adjudicationScore = (aiConfidence * 0.7) + (0.9 * 0.3);

      const claimAmount = parseFloat(claim.claimAmount);
      const isAutoApproved = auditResult.readyToSubmit && adjudicationScore > 0.85 && claimAmount < 500;

      const idempotencyKey = `audit_${claim.id}`;

      // Check for idempotency
      const existingLog = await this.prisma.insuranceActionLog.findUnique({
        where: { idempotencyKey }
      });

      if (existingLog) {
        this.logger.warn(`Idempotency key ${idempotencyKey} already exists. Skipping.`);
        return;
      }

      if (isAutoApproved) {
        // Auto-Submit
        await this.prisma.$transaction(async (tx) => {
          await tx.insuranceClaim.update({
            where: { id: claim.id },
            data: { 
              claimStatus: 'SUBMITTED', 
              aiConfidenceScore: adjudicationScore 
            }
          });

          await tx.insuranceActionLog.create({
            data: {
              claimId: claim.id,
              action: 'AUTO_SUBMIT',
              details: `Claim auto-submitted. Score: ${adjudicationScore.toFixed(2)}. AI Confidence: ${aiConfidence.toFixed(2)}. Amount: $${claimAmount}`,
              idempotencyKey
            }
          });
        });

        // Simulate External Carrier Handshake
        setTimeout(async () => {
          const isPaid = Math.random() > 0.1; // 90% chance of payment for submitted claims
          await this.prisma.insuranceClaim.update({
            where: { id: claim.id },
            data: { claimStatus: isPaid ? 'PAID' : 'REJECTED' }
          });
          this.logger.log(`External Carrier Handshake: Claim ${claim.id} -> ${isPaid ? 'PAID' : 'REJECTED'}`);
        }, 10000);

      } else {
        // Rejected / Needs Manual Review
        await this.prisma.$transaction(async (tx) => {
          await tx.insuranceClaim.update({
            where: { id: claim.id },
            data: { 
              claimStatus: 'REJECTED', 
              aiConfidenceScore: adjudicationScore,
              rejectionReason: auditResult.discrepancies || 'Failed auto-adjudication threshold.'
            }
          });

          await tx.insuranceActionLog.create({
            data: {
              claimId: claim.id,
              action: 'AI_REJECTED',
              details: `Claim rejected by AI. Score: ${adjudicationScore.toFixed(2)}. Reason: ${auditResult.discrepancies}`,
              idempotencyKey
            }
          });
        });
      }

    } catch (err) {
      this.logger.error(`Error processing claim ${claim.id}: ${err.message}`);
      // Revert to DRAFT so it can be retried
      await this.prisma.insuranceClaim.update({
        where: { id: claim.id },
        data: { claimStatus: 'DRAFT' }
      });
    }
  }
}
