import { Role, AppointmentStatus, AppointmentType, PaymentStatus, PaymentMethod, Gender, TreatmentCategory, MessageStatus, PrescriptionStatus } from '@prisma/client';

// ============== AUTH TYPES ==============

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: Role;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// ============== USER TYPES ==============

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  isActive?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
}

export interface UserFilter {
  role?: Role;
  isActive?: boolean;
  search?: string;
}

// ============== PATIENT TYPES ==============

export interface CreatePatientInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
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
}

export interface UpdatePatientInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
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
}

export interface CreatePrescriptionInput {
  patientId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  refills?: number;
  instructions?: string;
  startDate?: Date;
  endDate?: Date;
  status?: PrescriptionStatus;
}

export interface UpdatePrescriptionInput {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  refills?: number;
  instructions?: string;
  startDate?: Date;
  endDate?: Date;
  status?: PrescriptionStatus;
}

// ============== APPOINTMENT TYPES ==============

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  assistantId?: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  notes?: string;
  reason?: string;
}

export interface UpdateAppointmentInput {
  patientId?: string;
  doctorId?: string;
  assistantId?: string;
  appointmentDate?: Date;
  startTime?: string;
  endTime?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  notes?: string;
  reason?: string;
}

export interface AppointmentFilter {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
}

// ============== TREATMENT TYPES ==============

export interface CreateTreatmentInput {
  categoryId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  cost?: number;
  code?: string;
  isActive?: boolean;
  requiresConsultation?: boolean;
}

export interface UpdateTreatmentInput {
  categoryId?: string;
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  cost?: number;
  code?: string;
  isActive?: boolean;
  requiresConsultation?: boolean;
}

export interface CreateTreatmentPlanInput {
  patientId: string;
  name: string;
  description?: string;
  items: {
    treatmentId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    scheduledDate?: Date;
    notes?: string;
  }[];
}

// ============== BILLING TYPES ==============

export interface CreateInvoiceInput {
  patientId: string;
  appointmentId?: string;
  dueDate: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    treatmentId?: string;
  }[];
  taxAmount?: number;
  discountAmount?: number;
  notes?: string;
}

export interface CreatePaymentInput {
  invoiceId?: string;
  patientId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paymentDate?: Date;
}

export interface PaymentFilter {
  patientId?: string;
  status?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
}

// ============== MESSAGE TYPES ==============

export interface CreateMessageInput {
  recipientId: string;
  subject: string;
  content: string;
  parentId?: string;
}

// ============== DASHBOARD TYPES ==============

export interface DashboardStats {
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  pendingPayments: number;
  monthlyRevenue: number;
  recentAppointments: any[];
  recentPatients: any[];
}

// ============== API RESPONSE TYPES ==============

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
