import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { RpmService } from './rpm.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, WearableMetricType } from '@prisma/client';
import { BulkWearableMetricInput } from '@mediportal/shared-types';

@Controller('rpm')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class RpmController {
  constructor(private readonly rpmService: RpmService) {}

  @Post('sync')
  @Roles(UserRole.PATIENT)
  async syncMetrics(@Req() req: any, @Body() input: BulkWearableMetricInput) {
    // In real scenario, patientId comes from req.user.patient.id
    // For now, assuming patient is linked to user
    const patient = await (this.rpmService as any).prisma.patient.findUnique({
      where: { userId: req.user.id }
    });
    return this.rpmService.bulkSync(patient.id, input);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  async getMetrics(
    @Param('patientId') patientId: string,
    @Query('type') type: WearableMetricType,
    @Query('days') days: number = 7
  ) {
    return this.rpmService.getPatientMetrics(patientId, type, days);
  }

  @Get('insights/:patientId')
  @Roles(UserRole.DOCTOR)
  async getAiInsights(@Param('patientId') patientId: string) {
    // Generate fresh insights using Gemini
    const metrics = await this.rpmService.getPatientMetrics(patientId, undefined, 7);
    const summary = metrics.length > 0 
      ? `Data summary: ${metrics.length} points over 7 days.`
      : "No data available.";
      
    const prompt = `Analyze the last 7 days of wearable data for patient. ${summary}. 
    Highlight any downward trends in activity or sleep. 
    Format: "INSIGHT: [Trend] | CLINICAL_IMPLICATION: [Meaning]"`;

    const insight = await (this.rpmService as any).gemini.generateClinicalInsight('TREND_ANALYSIS', prompt, { patientId });
    return insight.suggestion;
  }
}
