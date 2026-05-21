import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabOrderDto, SubmitLabResultDto, UpdateLabOrderStatusDto } from './dto/orders.dto';
import { LabOrderStatus, LabInterpretation } from '@prisma/client';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  async create(doctorId: string, dto: CreateLabOrderDto) {
    const { patientId, appointmentId, tests, priority, notes } = dto;

    return this.prisma.labOrder.create({
      data: {
        patientId,
        doctorId,
        appointmentId,
        priority: priority || 'ROUTINE',
        notes,
        tests: {
          create: tests,
        },
      },
      include: {
        tests: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async getPatientHistory(patientId: string) {
    return this.prisma.labOrder.findMany({
      where: { patientId },
      include: {
        tests: true,
        doctor: { include: { user: { select: { name: true } } } },
        technician: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getQueue(branchId: string) {
    return this.prisma.labOrder.findMany({
      where: {
        patient: { branchId },
        status: { not: 'CANCELLED' },
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        tests: true,
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: [
        { priority: 'desc' }, // STAT first
        { createdAt: 'asc' },
      ],
    });
  }

  async updateOrderStatus(orderId: string, technicianId: string, dto: UpdateLabOrderStatusDto) {
    return this.prisma.labOrder.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        technicianId,
      },
    });
  }

  async submitTestResult(testId: string, technicianId: string, dto: SubmitLabResultDto) {
    const existingTest = await this.prisma.labTest.findUnique({
      where: { id: testId },
    });

    if (!existingTest) throw new BadRequestException('Test not found');
    if (existingTest.isVerified) throw new BadRequestException('Cannot update a verified result');

    const interpretation = this.autoInterpret(dto);

    const test = await this.prisma.labTest.update({
      where: { id: testId },
      data: {
        resultValue: dto.resultValue,
        valueNumeric: dto.valueNumeric,
        unit: dto.unit,
        referenceRange: dto.referenceRange,
        minRange: dto.minRange,
        maxRange: dto.maxRange,
        minCritical: dto.minCritical,
        maxCritical: dto.maxCritical,
        interpretation,
        attachmentUrl: dto.attachmentUrl,
        isVerified: dto.isVerified || false,
        verifiedById: dto.isVerified ? technicianId : null,
        verifiedAt: dto.isVerified ? new Date() : null,
        status: 'COMPLETED',
        performedAt: new Date(),
      },
      include: { labOrder: { include: { tests: true } } },
    });

    // Check if all tests in the order are completed
    const allCompleted = test.labOrder.tests.every((t) => t.status === 'COMPLETED');

    if (allCompleted) {
      await this.prisma.labOrder.update({
        where: { id: test.labOrderId },
        data: { status: 'COMPLETED' },
      });
    }

    return test;
  }

  private autoInterpret(dto: SubmitLabResultDto): LabInterpretation {
    const { valueNumeric, minRange, maxRange, minCritical, maxCritical } = dto;
    
    if (valueNumeric === undefined || valueNumeric === null) return 'NORMAL';

    // Critical checking (Highest priority)
    if (minCritical !== undefined && minCritical !== null && valueNumeric < minCritical) return 'CRITICAL';
    if (maxCritical !== undefined && maxCritical !== null && valueNumeric > maxCritical) return 'CRITICAL';

    // Abnormal checking
    if (minRange !== undefined && minRange !== null && valueNumeric < minRange) return 'ABNORMAL';
    if (maxRange !== undefined && maxRange !== null && valueNumeric > maxRange) return 'ABNORMAL';

    return 'NORMAL';
  }
}
