import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { TelemedicineStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TelemedicineService {
  private readonly logger = new Logger(TelemedicineService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Initializes a telemedicine session for an appointment.
   */
  async initSession(appointmentId: string, doctorId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { 
        patient: { include: { user: true } },
        doctor: { include: { user: true } }
      },
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    // Create a unique meeting room (In production, this would call a WebRTC provider API)
    const roomId = `mediportal-call-${uuidv4().substring(0, 8)}`;
    const roomUrl = `https://meet.mediportal.com/${roomId}`;

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        telemedicineRoom: roomUrl,
        telemedicineStatus: 'DOCTOR_JOINED',
      },
    });

    // Notify the patient
    await this.notificationService.sendPushNotification(
      appointment.patient.userId,
      '👨‍⚕️ Doctor is Ready',
      `Dr. ${appointment.doctor?.user?.name || doctorId} is waiting for you in the virtual consultation room.`,
      { type: 'TELEMEDICINE_START', appointmentId, roomUrl }
    );

    return updated;
  }

  /**
   * Updates the status of a live call.
   */
  async updateStatus(appointmentId: string, status: TelemedicineStatus) {
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { telemedicineStatus: status },
    });
  }

  /**
   * Ends a session and logs duration.
   */
  async endSession(appointmentId: string, durationSeconds: number) {
    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        telemedicineStatus: 'COMPLETED',
        callDuration: durationSeconds,
      },
    });
  }
}
