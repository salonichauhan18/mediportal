import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/orders.dto';

@Injectable()
export class PrescriptionService {
  constructor(private prisma: PrismaService) {}

  async create(doctorId: string, dto: CreatePrescriptionDto) {
    const { patientId, appointmentId, items, notes, status } = dto;

    return this.prisma.prescription.create({
      data: {
        patientId,
        doctorId,
        appointmentId,
        notes,
        status: status || 'ACTIVE',
        items: {
          create: items,
        },
      },
      include: {
        items: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async getPatientHistory(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      include: {
        items: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
