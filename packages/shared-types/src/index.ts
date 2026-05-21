import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PATIENT"])
});

export type User = z.infer<typeof UserSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const PatientRegistrationSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  branchId: z.string().uuid("Invalid Branch ID"),
  contact: z.string().min(10, "Valid contact number required"),
  emergencyContact: z.string().min(10, "Valid emergency contact required"),
});

export type PatientRegistrationInput = z.infer<typeof PatientRegistrationSchema>;

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface PatientRegistrationResponse {
  id: string;
  uhid: string;
  userId: string;
  branchId: string;
  dob: string;
  gender: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const AppointmentStatusSchema = z.enum(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentTypeSchema = z.enum(["OPD", "FOLLOW_UP", "TELECONSULTATION"]);
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;

export const DayOfWeekSchema = z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);
export type DayOfWeek = z.infer<typeof DayOfWeekSchema>;

export const TelemedicineStatusSchema = z.enum(["NONE", "PATIENT_WAITING", "DOCTOR_JOINED", "IN_PROGRESS", "COMPLETED", "DISCONNECTED"]);
export type TelemedicineStatus = z.infer<typeof TelemedicineStatusSchema>;

export const WearableMetricTypeSchema = z.enum(["HEART_RATE", "STEPS", "SLEEP", "SPO2", "BLOOD_GLUCOSE"]);
export type WearableMetricType = z.infer<typeof WearableMetricTypeSchema>;

export const CreateAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  branchId: z.string().uuid(),
  startTime: z.string().datetime(),
  type: AppointmentTypeSchema,
  notes: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export interface Slot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
  patient?: {
    user: {
      name: string;
      email: string;
    };
    uhid: string;
  };
  telemedicineStatus: TelemedicineStatus;
  telemedicineRoom?: string;
  callDuration?: number;
  doctor?: {
    user: {
      name: string;
    };
  };
}

export const ClinicalNoteStatusSchema = z.enum(["DRAFT", "FINALIZED"]);
export type ClinicalNoteStatus = z.infer<typeof ClinicalNoteStatusSchema>;

export const VitalsSchema = z.object({
  patientId: z.string().uuid(),
  height: z.number().min(10).max(300).optional(),
  weight: z.number().min(0.5).max(500).optional(),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Invalid BP format (e.g. 120/80)").optional(),
  pulseRate: z.number().min(20).max(300).optional(),
  temperature: z.number().min(90).max(115).optional(),
  spO2: z.number().min(30).max(100).optional(),
});

export type VitalsInput = z.infer<typeof VitalsSchema>;

export const ClinicalNoteSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  status: ClinicalNoteStatusSchema.default("DRAFT"),
});

export type ClinicalNoteInput = {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  status?: "DRAFT" | "FINALIZED";
};

export interface VitalsResponse {
  id: string;
  patientId: string;
  staffId: string;
  height?: number;
  weight?: number;
  bmi?: number;
  bloodPressure?: string;
  pulseRate?: number;
  temperature?: number;
  spO2?: number;
  recordedAt: string;
}

export interface ClinicalNoteResponse {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  status: ClinicalNoteStatus;
  finalizedAt?: string;
  createdAt: string;
  doctor?: {
    user: {
      name: string;
    };
  };
}

export const PrescriptionStatusSchema = z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]);
export type PrescriptionStatus = z.infer<typeof PrescriptionStatusSchema>;

export const PrescriptionItemSchema = z.object({
  drugName: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
});

export type PrescriptionItemInput = z.infer<typeof PrescriptionItemSchema>;

export const PrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  items: z.array(PrescriptionItemSchema).min(1),
  notes: z.string().optional(),
  status: PrescriptionStatusSchema.default("ACTIVE"),
});

export type PrescriptionInput = {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  items: PrescriptionItemInput[];
  notes?: string;
  status?: PrescriptionStatus;
};

export const LabOrderStatusSchema = z.enum(["PENDING", "COLLECTED", "PROCESSING", "COMPLETED", "CANCELLED"]);
export type LabOrderStatus = z.infer<typeof LabOrderStatusSchema>;

export const LabPrioritySchema = z.enum(["ROUTINE", "STAT"]);
export type LabPriority = z.infer<typeof LabPrioritySchema>;

export const LabTestSchema = z.object({
  testName: z.string().min(1),
  instructions: z.string().optional(),
});

export const LabOrderSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  tests: z.array(LabTestSchema).min(1),
  priority: LabPrioritySchema.default("ROUTINE"),
  notes: z.string().optional(),
  status: LabOrderStatusSchema.default("PENDING"),
});

export type LabTestInput = z.infer<typeof LabTestSchema>;

export type LabOrderInput = {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  tests: LabTestInput[];
  priority?: LabPriority;
  notes?: string;
  status?: LabOrderStatus;
};

export interface PrescriptionResponse {
  id: string;
  patientId: string;
  doctorId: string;
  status: PrescriptionStatus;
  items: Array<PrescriptionItemInput & { id: string }>;
  notes?: string;
  createdAt: string;
  doctor?: { user: { name: string } };
}

export const LabResultInputSchema = z.object({
  resultValue: z.string().min(1),
  valueNumeric: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  referenceRange: z.string().optional().nullable(),
  minRange: z.number().optional().nullable(),
  maxRange: z.number().optional().nullable(),
  minCritical: z.number().optional().nullable(),
  maxCritical: z.number().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  isVerified: z.boolean().optional(),
});

export type LabResultInput = z.infer<typeof LabResultInputSchema>;

export interface LabOrderResponse {
  id: string;
  patientId: string;
  doctorId: string;
  technicianId?: string | null;
  status: LabOrderStatus;
  priority: LabPriority;
  tests: Array<{ 
    id: string; 
    testName: string; 
    instructions?: string | null;
    resultValue?: string | null;
    valueNumeric?: number | null;
    unit?: string | null;
    referenceRange?: string | null;
    interpretation?: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | null;
    attachmentUrl?: string | null;
    isVerified?: boolean;
    status: string;
    performedAt?: string | null;
  }>;
  notes?: string;
  createdAt: string;
  doctor?: { user: { name: string } };
  technician?: { user: { name: string } } | null;
}

export const InvoiceStatusSchema = z.enum(["UNPAID", "PARTIAL", "PAID", "CANCELLED"]);
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const ClaimStatusSchema = z.enum(["PENDING", "APPROVED", "SETTLED", "REJECTED"]);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const PaymentMethodSchema = z.enum(["CASH", "CARD", "UPI", "INSURANCE"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const ServiceCategorySchema = z.enum(["CONSULTATION", "LAB", "ROOM", "OTHER"]);
export type ServiceCategory = z.infer<typeof ServiceCategorySchema>;

export const ServiceMasterSchema = z.object({
  name: z.string().min(1),
  basePrice: z.number().min(0),
  taxPercentage: z.number().min(0),
  category: ServiceCategorySchema,
  branchId: z.string().uuid()
});
export type ServiceMasterInput = z.infer<typeof ServiceMasterSchema>;

export const CreateInvoiceItemSchema = z.object({
  serviceName: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
  taxPercentage: z.number().min(0).default(0), // Provide percentage here, backend computes taxAmount
});
export type CreateInvoiceItemInput = z.infer<typeof CreateInvoiceItemSchema>;

export const GenerateInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  branchId: z.string().uuid(),
  appointmentId: z.string().uuid().optional(),
  items: z.array(CreateInvoiceItemSchema).min(1),
  discount: z.number().min(0).default(0),
});
export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceSchema>;

export const ProcessPaymentSchema = z.object({
  amount: z.number().min(0.01),
  paymentMethod: PaymentMethodSchema,
  referenceNumber: z.string().optional()
});
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  patientId: string;
  branchId: string;
  appointmentId?: string | null;
  subTotal: string;
  taxTotal: string;
  discount: string;
  grandTotal: string;
  status: InvoiceStatus;
  items: Array<{
    id: string;
    serviceName: string;
    quantity: number;
    unitPrice: string;
    taxAmount: string;
    totalAmount: string;
  }>;
  transactions: Array<{
    id: string;
    amount: string;
    paymentMethod: PaymentMethod;
    referenceNumber?: string | null;
    createdAt: string;
  }>;
  createdAt: string;
  finalizedAt?: string | null;
}

export interface WearableMetric {
  id: string;
  patientId: string;
  type: WearableMetricType;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  createdAt: string;
}

export interface BulkWearableMetricInput {
  metrics: Array<{
    type: WearableMetricType;
    value: number;
    unit: string;
    timestamp: string;
    source: string;
  }>;
}