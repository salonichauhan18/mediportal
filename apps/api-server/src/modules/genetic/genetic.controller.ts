import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { GeneticService } from './genetic.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('genetic')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class GeneticController {
  constructor(private readonly geneticService: GeneticService) {}

  @Get('patients/:patientId/profiles')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getProfiles(@Param('patientId') patientId: string, @Req() req: any) {
    // Extract staffId from the authenticated user's staff record.
    // Assuming req.user contains the user info with a staff relation or ID.
    // For simplicity, we just use req.user.id. In a real app, resolve the staff.id.
    const staffId = req.user.staff?.id || req.user.id;
    return this.geneticService.getPatientProfiles(patientId, staffId);
  }

  @Post('patients/:patientId/profiles')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async addProfile(
    @Param('patientId') patientId: string, 
    @Req() req: any, 
    @Body() body: { markerName: string; result: string; clinicalSignificance?: string }
  ) {
    const staffId = req.user.staff?.id || req.user.id;
    return this.geneticService.addGeneticProfile(patientId, staffId, body);
  }

  @Post('patients/:patientId/consent')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST)
  async updateConsent(@Param('patientId') patientId: string, @Body() body: { consent: boolean }) {
    return this.geneticService.updateConsent(patientId, body.consent);
  }

  @Get('patients/:patientId/consent')
  @Roles(UserRole.DOCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.NURSE, UserRole.RECEPTIONIST)
  async getConsent(@Param('patientId') patientId: string) {
    return this.geneticService.getConsentStatus(patientId);
  }
}
