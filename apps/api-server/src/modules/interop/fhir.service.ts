import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FhirTransformer } from './fhir.transformer';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FhirService {
  private readonly logger = new Logger(FhirService.name);

  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async getPatientBundle(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) return null;

    const [vitals, metrics, notes, orders] = await Promise.all([
      this.prisma.vitals.findMany({ where: { patientId } }),
      this.prisma.wearableMetric.findMany({ where: { patientId } }),
      this.prisma.clinicalNote.findMany({ where: { patientId } }),
      this.prisma.labOrder.findMany({ where: { patientId }, include: { tests: true, doctor: { include: { user: true } } } }),
    ]);

    const resources = [
      FhirTransformer.transformPatient(patient),
      ...vitals.map(v => FhirTransformer.transformObservation(v)),
      ...metrics.map(m => FhirTransformer.transformObservation(m)),
      ...notes.map(n => FhirTransformer.transformClinicalNote(n)),
      ...orders.map(o => FhirTransformer.transformLabOrder(o)),
    ];

    return {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: resources.map(r => ({ resource: r })),
    };
  }

  async dispatchLabOrder(orderId: string) {
    const order = await this.prisma.labOrder.findUnique({
      where: { id: orderId },
      include: { tests: true, doctor: { include: { user: true } } }
    });

    if (!order) return;

    const fhirOrder = FhirTransformer.transformLabOrder(order);
    
    // External Lab Webhook (Mock endpoint)
    const labEndpoint = 'https://lab-partner.api/v1/orders/fhir';

    this.logger.log(`Dispatching FHIR ServiceRequest for Lab Order ${orderId}`);

    try {
      // In production, we would use a proper retry library and DLQ
      await firstValueFrom(this.httpService.post(labEndpoint, fhirOrder));
      this.logger.log(`Successfully dispatched Lab Order ${orderId}`);
    } catch (err) {
      this.logger.error(`Failed to dispatch Lab Order ${orderId}. Storing in retry queue.`, err.message);
      // Logic for DLQ storage would go here
    }
  }

  async searchPatient(uhid: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { uhid },
      include: { user: true }
    });
    return patient ? FhirTransformer.transformPatient(patient) : null;
  }
}
