import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Hospital
  const hospital = await prisma.hospital.upsert({
    where: { gstin: '27AABCM1234F1Z5' },
    update: {},
    create: {
      name: 'MediPortal Enterprise Hospitals',
      gstin: '27AABCM1234F1Z5',
    },
  });

  // 2. Create Branches
  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-1-uuid' }, // Using fixed ID for seeding or name
    update: {},
    create: {
      id: 'branch-1-uuid',
      name: 'Main Plaza Branch',
      code: 'LON',
      address: '123 Medical Way, Downtown',
      contact: '+1-800-MED-MAIN',
      hospitalId: hospital.id,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 'branch-2-uuid' },
    update: {},
    create: {
      id: 'branch-2-uuid',
      name: 'Seattle North Branch',
      code: 'SEA',
      address: '456 Healthcare St, Northside',
      contact: '+1-800-MED-NORTH',
      hospitalId: hospital.id,
    },
  });

  // 3. Create Super Admin
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mediportal.com' },
    update: {},
    create: {
      email: 'admin@mediportal.com',
      password: adminPassword,
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
    },
  });

  // 4. Create Departments for Branch 1
  const depts = ['Cardiology', 'Neurology', 'Pediatrics', 'Radiology', 'Emergency'];
  for (const deptName of depts) {
    await prisma.department.create({
      data: {
        name: deptName,
        branchId: branch1.id,
      },
    });
  }

  // 5. Create a Mock Doctor
  const docPassword = await bcrypt.hash('Doctor@123', 10);
  const docUser = await prisma.user.upsert({
    where: { email: 'sarah.j@mediportal.com' },
    update: {},
    create: {
      email: 'sarah.j@mediportal.com',
      password: docPassword,
      name: 'Dr. Sarah Johnson',
      role: 'DOCTOR',
    },
  });

  const cardioDept = await prisma.department.findFirst({
    where: { name: 'Cardiology', branchId: branch1.id },
  });

  await prisma.staff.upsert({
    where: { userId: docUser.id },
    update: {},
    create: {
      userId: docUser.id,
      branchId: branch1.id,
      departmentId: cardioDept?.id,
      specialty: 'Interventional Cardiology',
    },
  });

  // 6. Create Doctor Availability (Monday to Friday, 9 AM to 5 PM)
  const days: any[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const staff = await prisma.staff.findFirst({ where: { user: { email: 'sarah.j@mediportal.com' } } });
  
  if (staff) {
    for (const day of days) {
      await prisma.doctorAvailability.upsert({
        where: { id: `avail-${staff.id}-${day}` },
        update: {},
        create: {
          id: `avail-${staff.id}-${day}`,
          staffId: staff.id,
          branchId: branch1.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          slotDuration: 30,
        },
      });
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
