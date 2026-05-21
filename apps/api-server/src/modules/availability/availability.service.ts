import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  addMinutes, 
  format, 
  parse, 
  isBefore, 
  isAfter, 
  isSameMinute, 
  isWithinInterval,
  getDay 
} from 'date-fns';

export interface Slot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getAvailableSlots(staffId: string, branchId: string, date: Date): Promise<Slot[]> {
    const dayOfWeek = this.getPrismaDayOfWeek(getDay(date));
    
    // 1. Fetch Availability
    const availability = await this.prisma.doctorAvailability.findFirst({
      where: {
        staffId,
        branchId,
        dayOfWeek,
      },
    });

    if (!availability) {
      return [];
    }

    // 2. Fetch Existing Appointments for the day
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId: staffId,
        branchId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] },
        startTime: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
        },
      },
    });

    // 3. Generate Slots
    const slots: Slot[] = [];
    const [startHour, startMin] = availability.startTime.split(':').map(Number);
    const [endHour, endMin] = availability.endTime.split(':').map(Number);

    let current = new Date(date);
    current.setHours(startHour, startMin, 0, 0);

    const end = new Date(date);
    end.setHours(endHour, endMin, 0, 0);

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, availability.slotDuration);
      
      if (isAfter(slotEnd, end)) break;

      const isBooked = appointments.some(app => {
        const appStart = new Date(app.startTime);
        const appEnd = new Date(app.endTime);
        
        // Slot overlaps if:
        // (SlotStart < AppEnd) AND (SlotEnd > AppStart)
        return isBefore(current, appEnd) && isAfter(slotEnd, appStart);
      });

      slots.push({
        startTime: format(current, 'HH:mm'),
        endTime: format(slotEnd, 'HH:mm'),
        isAvailable: !isBooked,
      });

      current = slotEnd;
    }

    return slots;
  }

  private getPrismaDayOfWeek(day: number): any {
    const days = [
      'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    ];
    return days[day];
  }
}
