import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalNoteInput } from '@mediportal/shared-types';
import { ClinicalNoteStatus } from '@prisma/client';

@Injectable()
export class ClinicalNoteService {
  constructor(private prisma: PrismaService) {}

  async create(doctorId: string, dto: ClinicalNoteInput) {
    const { patientId, appointmentId, subjective, objective, assessment, plan, status } = dto;

    return this.prisma.clinicalNote.create({
      data: {
        patientId,
        doctorId,
        appointmentId,
        subjective,
        objective,
        assessment,
        plan,
        status: status as ClinicalNoteStatus,
        finalizedAt: status === 'FINALIZED' ? new Date() : null,
      },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      }
    });
  }

  async update(id: string, doctorId: string, dto: Partial<ClinicalNoteInput>) {
    const note = await this.prisma.clinicalNote.findUnique({ where: { id } });

    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }

    if (note.status === 'FINALIZED') {
      throw new ForbiddenException('Cannot edit a finalized clinical note. Please create an amendment instead.');
    }

    if (note.doctorId !== doctorId) {
      throw new ForbiddenException('You can only edit your own notes');
    }

    return this.prisma.clinicalNote.update({
      where: { id },
      data: {
        ...dto,
        status: dto.status as ClinicalNoteStatus,
        finalizedAt: dto.status === 'FINALIZED' ? new Date() : note.finalizedAt,
      },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      }
    });
  }

  async getTimeline(patientId: string) {
    return this.prisma.clinicalNote.findMany({
      where: { patientId },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        appointment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
