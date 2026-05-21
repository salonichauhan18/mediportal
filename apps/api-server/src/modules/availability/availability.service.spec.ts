import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AvailabilityService - Slot Generation', () => {
  let service: AvailabilityService;
  let prisma: PrismaService;

  const mockPrisma = {
    doctorAvailability: {
      findFirst: jest.fn(),
    },
    appointment: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should generate 30-minute slots correctly for a 9am-12pm shift', async () => {
    mockPrisma.doctorAvailability.findFirst.mockResolvedValue({
      startTime: '09:00',
      endTime: '12:00',
      slotDuration: 30,
    });
    mockPrisma.appointment.findMany.mockResolvedValue([]);

    const slots = await service.getAvailableSlots('doc-1', 'branch-1', new Date('2026-05-04'));

    expect(slots).toHaveLength(6);
    expect(slots[0]).toEqual({ startTime: '09:00', endTime: '09:30', isAvailable: true });
    expect(slots[5]).toEqual({ startTime: '11:30', endTime: '12:00', isAvailable: true });
  });

  it('should mark slots as unavailable if they conflict with an appointment', async () => {
    mockPrisma.doctorAvailability.findFirst.mockResolvedValue({
      startTime: '09:00',
      endTime: '11:00',
      slotDuration: 30,
    });
    
    // Booking at 09:30
    mockPrisma.appointment.findMany.mockResolvedValue([
      {
        startTime: new Date('2026-05-04T09:30:00'),
        endTime: new Date('2026-05-04T10:00:00'),
      },
    ]);

    const slots = await service.getAvailableSlots('doc-1', 'branch-1', new Date('2026-05-04'));

    expect(slots[0].isAvailable).toBe(true);  // 09:00
    expect(slots[1].isAvailable).toBe(false); // 09:30 - BOOKED
    expect(slots[2].isAvailable).toBe(true);  // 10:00
  });

  it('should return empty slots if no availability is defined', async () => {
    mockPrisma.doctorAvailability.findFirst.mockResolvedValue(null);
    const slots = await service.getAvailableSlots('doc-1', 'branch-1', new Date('2026-05-04'));
    expect(slots).toEqual([]);
  });
});
