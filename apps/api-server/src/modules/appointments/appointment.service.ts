import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus, AppointmentType } from '@prisma/client';
import { addMinutes, isBefore } from 'date-fns';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    const { patientId, doctorId, branchId, startTime, type, notes } = dto;
    const start = new Date(startTime);

    // 1. Basic validation
    if (isBefore(start, new Date())) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    // 2. Fetch Doctor Slot Duration
    const availability = await this.prisma.doctorAvailability.findFirst({
      where: {
        staffId: doctorId,
        branchId,
        dayOfWeek: this.getPrismaDayOfWeek(start.getDay()),
      },
    });

    if (!availability) {
      throw new BadRequestException('Doctor is not available at this branch on this day');
    }

    const end = addMinutes(start, availability.slotDuration);

    // 3. Conflict Prevention (Atomic Check)
    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId,
        branchId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException('This slot is already booked');
    }

    // 4. Create Appointment
    return this.prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        branchId,
        startTime: start,
        endTime: end,
        type,
        status: 'CONFIRMED',
        notes,
      },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      }
    });
  }

  async updateStatus(id: string, status: AppointmentStatus) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
    });
  }

  async getDashboard(doctorId?: string, branchId?: string, date?: Date) {
    const startOfDay = new Date(date || new Date());
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date || new Date());
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        branchId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  private getPrismaDayOfWeek(day: number): any {
    const days = [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    ];
    return days[day];
  }
}
