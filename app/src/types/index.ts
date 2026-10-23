// ============== ENUMS ==============

export const Role = {
  ADMIN: 'ADMIN',
  RECEPTIONIST: 'RECEPTIONIST',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  DENTIST_ASSISTANT: 'DENTIST_ASSISTANT',
  DENTIST: 'DENTIST',
  SPECIALIST: 'SPECIALIST',
  PATIENT: 'PATIENT',
} as const;

export type RoleType = typeof Role[keyof typeof Role];

export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  IN_PROGRESS: 'IN_PROGRESS',
} as const;

export type AppointmentStatusType = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export const AppointmentType = {
  CLEANING: 'CLEANING',
  CHECKUP: 'CHECKUP',
  CONSULTATION: 'CONSULTATION',
  ROOT_CANAL: 'ROOT_CANAL',
  FILLING: 'FILLING',
  CROWN: 'CROWN',
  BRIDGE: 'BRIDGE',
  IMPLANT: 'IMPLANT',
  EXTRACTION: 'EXTRACTION',
  SURGERY: 'SURGERY',
  ORTHODONTICS: 'ORTHODONTICS',
  WHITENING: 'WHITENING',
  EMERGENCY: 'EMERGENCY',
  FOLLOW_UP: 'FOLLOW_UP',
} as const;

export type AppointmentTypeType = typeof AppointmentType[keyof typeof AppointmentType];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  CHECK: 'CHECK',
  BANK_TRANSFER: 'BANK_TRANSFER',
  INSURANCE: 'INSURANCE',
  ONLINE: 'ONLINE',
} as const;

export type PaymentMethodType = typeof PaymentMethod[keyof typeof PaymentMethod];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
} as const;

export type GenderType = typeof Gender[keyof typeof Gender];

export const MessageStatus = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
} as const;

export type MessageStatusType = typeof MessageStatus[keyof typeof MessageStatus];

export const ToothNotation = {
  UNIVERSAL: 'UNIVERSAL',
  FDI: 'FDI',
} as const;

export type ToothNotationType = typeof ToothNotation[keyof typeof ToothNotation];

export const ToothTreatmentStatus = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ToothTreatmentStatusType = typeof ToothTreatmentStatus[keyof typeof ToothTreatmentStatus];

export const PrescriptionStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type PrescriptionStatusType = typeof PrescriptionStatus[keyof typeof PrescriptionStatus];

// ============== USER TYPES ==============

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: RoleType;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  patientProfile?: Patient;
  staffProfile?: Staff;
}

export interface Staff {
  id: string;
  userId: string;
  employeeId: string;
  hireDate: string;
  specialization?: string;
  licenseNumber?: string;
  department?: string;
  biography?: string;
  avatarUrl?: string;
  isAvailable: boolean;
  workingHours?: any;
  schedules?: Schedule[];
}

export interface Schedule {
  id: string;
  staffId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// ============== PATIENT TYPES ==============

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth?: string;
  gender?: GenderType;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceGroupNumber?: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  notes?: string;
  assignedDoctorId?: string | null;
  assignedDoctor?: {
    id: string;
    user?: Pick<User, 'firstName' | 'lastName' | 'role'>;
  } | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  prescriptions?: Prescription[];
  _count?: {
    appointments: number;
    invoices: number;
  };
}

// ============== APPOINTMENT TYPES ==============

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  assistantId?: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  type: AppointmentTypeType;
  status: AppointmentStatusType;
  notes?: string;
  reason?: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: Patient & { user?: User };
  doctor?: Staff & { user?: User };
  assistant?: Staff & { user?: User };
  treatments?: AppointmentTreatment[];
  treatmentNotes?: TreatmentNote[];
  invoice?: Invoice;
}

export interface AppointmentTreatment {
  id: string;
  appointmentId: string;
  treatmentId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  notes?: string;
  createdAt: string;
  treatment?: Treatment;
  appointment?: {
    appointmentDate: string;
    status: AppointmentStatusType;
  };
}

export interface TreatmentNote {
  id: string;
  appointmentId: string;
  doctorId: string;
  note: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  doctor?: Staff & { user?: User };
}

// ============== TREATMENT TYPES ==============

export interface TreatmentCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    treatments: number;
  };
}

export interface Treatment {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  cost?: number;
  code?: string;
  isActive: boolean;
  requiresConsultation: boolean;
  createdAt: string;
  updatedAt: string;
  category?: TreatmentCategory;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  name: string;
  description?: string;
  totalCost: number;
  status: string;
  startDate?: string;
  endDate?: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient & { user?: User };
  items?: TreatmentPlanItem[];
}

export interface TreatmentPlanItem {
  id: string;
  treatmentPlanId: string;
  treatmentId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  scheduledDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  treatment?: Treatment;
}

// ============== TOOTH TREATMENTS ==============

export interface ToothTreatment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  toothNumber: string;
  notation: ToothNotationType;
  surfaces: string[];
  diagnosis?: string;
  treatmentType: string;
  notes?: string;
  status: ToothTreatmentStatusType;
  cost?: number;
  createdAt: string;
  updatedAt: string;
  patient?: Patient & { user?: User };
  doctor?: Staff & { user?: User };
  appointment?: { appointmentDate: string; status: AppointmentStatusType };
  attachments?: ToothTreatmentAttachment[];
}

export interface ToothTreatmentAttachment {
  id: string;
  treatmentId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  prescribedById: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number | null;
  refills: number;
  instructions?: string;
  startDate?: string | null;
  endDate?: string | null;
  status: PrescriptionStatusType;
  createdAt: string;
  updatedAt: string;
  prescribedBy?: Staff & { user?: Pick<User, 'firstName' | 'lastName' | 'role'> };
}

// ============== BILLING TYPES ==============

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: PaymentStatusType;
  notes?: string;
  insuranceClaimId?: string;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: Patient & { user?: User };
  createdBy?: Pick<User, 'firstName' | 'lastName' | 'role'>;
  items?: InvoiceItem[];
  payments?: Payment[];
  appointment?: Appointment;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  treatmentId?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  patientId: string;
  amount: number;
  method: PaymentMethodType;
  reference?: string;
  notes?: string;
  paymentDate: string;
  processedBy?: string;
  createdAt: string;
  patient?: Patient & { user?: User };
  invoice?: Invoice;
}

// ============== MESSAGE TYPES ==============

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  status: MessageStatusType;
  isRead: boolean;
  readAt?: string;
  parentId?: string;
  createdAt: string;
  sender?: User;
  recipient?: User;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt?: string;
  data?: any;
  createdAt: string;
}

// ============== AUTH TYPES ==============

export interface LoginInput {
  email: string;
  password: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  tokens: Tokens;
}

// ============== API RESPONSE ==============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ============== DASHBOARD TYPES ==============

export interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  newPatientsThisMonth: number;
  pendingPayments: number;
  todayRevenue: number;
  recentAppointments?: Appointment[];
  recentPatients?: Patient[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  status: AppointmentStatusType;
  patientId: string;
  doctorId: string;
  type: AppointmentTypeType;
}
