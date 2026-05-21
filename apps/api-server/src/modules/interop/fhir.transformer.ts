import { Patient, Vitals, WearableMetric, ClinicalNote, LabOrder } from '@prisma/client';

export class FhirTransformer {
  static transformPatient(patient: any): any {
    return {
      resourceType: 'Patient',
      id: patient.id,
      identifier: [
        {
          system: 'https://mediportal.com/uhid',
          value: patient.uhid,
        },
      ],
      name: [
        {
          text: patient.user?.name,
          family: patient.user?.name?.split(' ').pop(),
          given: [patient.user?.name?.split(' ')[0]],
        },
      ],
      gender: patient.gender?.toLowerCase() || 'unknown',
      birthDate: patient.dob ? patient.dob.toISOString().split('T')[0] : undefined,
      meta: {
        lastUpdated: patient.updatedAt.toISOString(),
      },
    };
  }

  static transformObservation(metric: Vitals | WearableMetric): any {
    const isVitals = 'bloodPressure' in metric;
    
    let code = '';
    let display = '';
    let system = 'http://loinc.org';

    // Simple mapping for common vitals
    const type = (metric as any).type || 'VITALS';
    switch (type) {
      case 'HEART_RATE':
      case 'pulseRate':
        code = '8867-4';
        display = 'Heart rate';
        break;
      case 'STEPS':
        code = '55423-8';
        display = 'Number of steps in 24 hour Measured';
        break;
      case 'SPO2':
      case 'spO2':
        code = '2708-6';
        display = 'Oxygen saturation in Arterial blood by Pulse oximetry';
        break;
      case 'weight':
        code = '29463-7';
        display = 'Body weight';
        break;
      default:
        code = 'unknown';
        display = type;
    }

    return {
      resourceType: 'Observation',
      id: metric.id,
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            },
          ],
        },
      ],
      code: {
        coding: [{ system, code, display }],
      },
      subject: { reference: `Patient/${metric.patientId}` },
      effectiveDateTime: (metric as any).timestamp?.toISOString() || (metric as any).recordedAt?.toISOString(),
      valueQuantity: {
        value: (metric as any).value || (metric as any).pulseRate || (metric as any).weight,
        unit: (metric as any).unit || (type === 'weight' ? 'kg' : 'bpm'),
        system: 'http://unitsofmeasure.org',
      },
    };
  }

  static transformLabOrder(order: any): any {
    return {
      resourceType: 'ServiceRequest',
      id: order.id,
      status: order.status === 'CANCELLED' ? 'revoked' : 'active',
      intent: 'order',
      priority: order.priority === 'STAT' ? 'stat' : 'routine',
      code: {
        text: order.tests?.map((t: any) => t.testName).join(', '),
      },
      subject: { reference: `Patient/${order.patientId}` },
      authoredOn: order.createdAt.toISOString(),
      requester: { reference: `Practitioner/${order.doctorId}` },
      note: order.notes ? [{ text: order.notes }] : undefined,
    };
  }

  static transformClinicalNote(note: any): any {
    return {
      resourceType: 'DocumentReference',
      id: note.id,
      status: 'current',
      docStatus: note.status === 'FINALIZED' ? 'final' : 'preliminary',
      type: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '11506-3',
            display: 'Provider-unspecified Progress note',
          },
        ],
      },
      subject: { reference: `Patient/${note.patientId}` },
      date: note.createdAt.toISOString(),
      author: [{ reference: `Practitioner/${note.doctorId}` }],
      content: [
        {
          attachment: {
            contentType: 'text/plain',
            data: Buffer.from(`${note.subjective}\n${note.objective}\n${note.assessment}\n${note.plan}`).toString('base64'),
          },
        },
      ],
    };
  }
}
