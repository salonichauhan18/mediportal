import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BedService } from '../beds/bed.service';
import { GeminiService } from './gemini.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../socket/notification.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class PredictiveCronService {
  private readonly logger = new Logger(PredictiveCronService.name);

  constructor(
    private bedService: BedService,
    private geminiService: GeminiService,
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Run every hour in production, but for demo purposes we can use a shorter interval or just rely on manual trigger if needed.
  // We'll set it to run daily at midnight here: CronExpression.EVERY_DAY_AT_MIDNIGHT
  // To allow easier testing, we'll run it every 15 minutes.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkBedCapacityThresholds() {
    this.logger.log('Running scheduled check for Bed Capacity Thresholds...');
    
    // In a real multi-tenant/multi-branch scenario, we'd iterate over all active branches.
    // Assuming 'default-branch' or we fetch branches from DB.
    const branches = await this.prisma.branch.findMany();
    
    for (const branch of branches) {
      try {
        const statsData = await this.bedService.getOccupancy(branch.id);
        const { occupancyRate } = statsData.stats;
        
        // Only run expensive AI forecast if occupancy is already somewhat high or if we want daily reports.
        // Let's run it if occupancy > 70% to predict if it will hit 85%.
        if (parseFloat(occupancyRate) > 70) {
          const historicalDataSummary = await this.bedService.getHistoricalAdmissionData(branch.id);
          const prompt = `Analyze the following historical admission and appointment data for Branch ${branch.id}:\n${historicalDataSummary}`;
          
          const forecastResponse = await this.geminiService.generateClinicalInsight('INFLOW_PREDICTION', prompt);
          
          // The AI response might contain a suggestion like "Predicted to exceed 85% capacity within 48 hours".
          // We can parse the response or confidence score. If AI indicates critical surge:
          const text = forecastResponse.suggestion.toLowerCase();
          
          if (text.includes('exceed') || text.includes('critical') || text.includes('surge') || parseFloat(occupancyRate) >= 85) {
             // Find Admins to notify
             const admins = await this.prisma.staff.findMany({
               where: {
                 branchId: branch.id,
                 user: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } }
               }
             });
             
             for (const admin of admins) {
              await this.notificationService.createNotification({
                 staffId: admin.id,
                 title: 'Critical Resource Alert: High Bed Occupancy',
                 content: `Current occupancy is at ${occupancyRate}%. AI Forecast indicates a continued surge. ${forecastResponse.suggestion.substring(0, 100)}...`,
                 type: 'CRITICAL_LAB', // Using an existing type for now
                 link: '/admin/beds'
               });
             }
             this.logger.warn(`Triggered Critical Resource Alert for Branch ${branch.id}. Occupancy: ${occupancyRate}%`);
          }
        }
      } catch (error) {
        this.logger.error(`Error running capacity check for branch ${branch.id}: ${error.message}`);
      }
    }
  }
}
