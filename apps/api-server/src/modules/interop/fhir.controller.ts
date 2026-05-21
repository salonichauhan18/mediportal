import { Controller, Get, Post, Param, Query, Body, UseGuards, Res, NotFoundException } from '@nestjs/common';
import { FhirService } from './fhir.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Response } from 'express';

@Controller('v1/fhir')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FhirController {
  constructor(private readonly fhirService: FhirService) {}

  @Get('Patient')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getPatientByIdentifier(@Query('identifier') identifier: string) {
    const patient = await this.fhirService.searchPatient(identifier);
    if (!patient) throw new NotFoundException('FHIR Patient not found');
    return patient;
  }

  @Get('Patient/:id/$everything')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async getPatientEverything(@Param('id') id: string) {
    const bundle = await this.fhirService.getPatientBundle(id);
    if (!bundle) throw new NotFoundException('Patient record not found');
    return bundle;
  }

  @Get('Patient/:id/download')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  async downloadBundle(@Param('id') id: string, @Res() res: Response) {
    const bundle = await this.fhirService.getPatientBundle(id);
    if (!bundle) throw new NotFoundException('Patient record not found');

    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Content-Disposition', `attachment; filename=patient_fhir_${id}.json`);
    return res.send(JSON.stringify(bundle, null, 2));
  }

  @Post('Observation')
  @Roles(UserRole.ADMIN, UserRole.LAB_TECHNICIAN)
  async receiveObservation(@Body() observation: any) {
    // This is a stub for receiving external lab results via FHIR
    // In production, would validate against FHIR R4 StructureDefinition
    return {
      resourceType: 'OperationOutcome',
      issue: [{ severity: 'information', code: 'informational', diagnostics: 'Observation received and queued for clinical validation' }]
    };
  }
}
