import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UHIDEngine } from './uhid.engine';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class PatientService {
  constructor(
    private prisma: PrismaService,
    private uhidEngine: UHIDEngine,
  ) {}

  async create(dto: CreatePatientDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Default password if not provided
    const password = dto.password || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. Generate UHID
      const uhid = await this.uhidEngine.generate(dto.branchId);

      // 2. Create User
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          name: dto.name,
          role: UserRole.PATIENT,
        },
      });

      // 3. Create Patient Profile
      const patient = await tx.patient.create({
        data: {
          uhid,
          userId: user.id,
          branchId: dto.branchId,
          dob: new Date(dto.dob),
          gender: dto.gender,
        },
      });

      return {
        ...patient,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        temporaryPassword: dto.password ? undefined : password,
      };
    });
  }

  async findAll(branchId?: string) {
    return this.prisma.patient.findMany({
      where: branchId ? { branchId } : {},
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
