import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { NotificationService } from '../notifications/notification.service';
import { BulkWearableMetricInput, WearableMetricType } from '@mediportal/shared-types';

@Injectable()
export class RpmService {
  private readonly logger = new Logger(RpmService.name);

  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
    private notificationService: NotificationService,
  ) {}

  async bulkSync(patientId: string, input: BulkWearableMetricInput) {
    this.logger.log(`Syncing ${input.metrics.length} metrics for patient ${patientId}`);

    // Bulk insert metrics
    const metrics = await this.prisma.wearableMetric.createMany({
      data: input.metrics.map(m => ({
        patientId,
        type: m.type,
        value: m.value,
        unit: m.unit,
        timestamp: new Date(m.timestamp),
        source: m.source,
      })),
    });

    // Trigger AI analysis in background
    this.analyzeData(patientId, input.metrics);

    return metrics;
  }

  async analyzeData(patientId: string, metrics: any[]) {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true },
      });

      if (!patient) return;

      // Filter for heart rate anomalies
      const heartRates = metrics.filter(m => m.type === 'HEART_RATE');
      if (heartRates.length > 0) {
        const averageHr = heartRates.reduce((acc, m) => acc + m.value, 0) / heartRates.length;
        
        if (averageHr > 100) { // Simple threshold check before AI
          const prompt = `Analyze heart rate data for Patient ${patient.uhid}. 
          Latest readings average ${averageHr} bpm.
          Data points: ${JSON.stringify(heartRates.slice(-10))}
          If this indicates Tachycardia Risk or another anomaly, explain why and flag as High Priority.
          Format: "RISK: [Type] | RATIONALE: [Reason] | ACTION: [Recommendation]"`;

          const analysis = await this.gemini.generateClinicalInsight('TREND_ANALYSIS', prompt, {
            uhid: patient.uhid,
            patientId,
          });
          
          if (analysis.suggestion.includes('RISK:')) {
            // Find doctor
            const lastAppointment = await this.prisma.appointment.findFirst({
               where: { patientId },
               orderBy: { startTime: 'desc' }
            });

            if (lastAppointment) {
              await this.notificationService.sendPushNotification(
                lastAppointment.doctorId,
                '🚨 RPM Alert: Tachycardia Risk',
                `AI detected anomaly for Patient ${patient.uhid}: ${analysis.substring(0, 100)}...`,
                { type: 'RPM_ALERT', patientId, uhid: patient.uhid }
              );
            }
          }
        }
      }
    } catch (err) {
      this.logger.error('AI RPM Analysis failed', err);
    }
  }

  async getPatientMetrics(patientId: string, type?: WearableMetricType, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.wearableMetric.findMany({
      where: {
        patientId,
        ...(type && { type }),
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });
  }
}
