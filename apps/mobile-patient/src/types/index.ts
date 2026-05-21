export interface Appointment {
  id: string;
  appointmentTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  reason: string;
  staff: {
    user: { name: string };
    specialty: string;
    department?: { name: string };
  };
  branch: {
    name: string;
    address: string;
  };
}

export interface Vital {
  id: string;
  recordedAt: string;
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
}

export interface LabOrder {
  id: string;
  createdAt: string;
  status: string;
  tests: LabTest[];
  reportAttachmentUrl?: string;
}

export interface LabTest {
  id: string;
  testName: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  flag?: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  isVerified: boolean;
}

export interface Prescription {
  id: string;
  createdAt: string;
  diagnosis: string;
  items: PrescriptionItem[];
  staff: { user: { name: string } };
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'FINALIZED' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  totalAmount: number;
  pdfUrl?: string;
  createdAt: string;
}

export interface Patient {
  id: string;
  uhid: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
}
