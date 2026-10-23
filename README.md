# Dental Clinic Management System

A complete, production-ready Dentist Clinic Management System with a secure backend, modern frontend, and fully functional database layer.

## Features

### Core Modules

1. **User Management**
   - Role-based access control (8 roles: Admin, Receptionist, Doctor, Nurse, Dentist Assistant, Dentist, Specialist, Patient)
   - User CRUD operations with activation/deactivation
   - Staff profile management

2. **Scheduling & Appointments**
   - Full calendar view with drag-and-drop
   - Appointment booking with conflict detection
   - Recurring appointments support
   - Status tracking (Scheduled, Confirmed, Completed, Cancelled, No-Show)

3. **Patient Portal**
   - Patient registration and profile management
   - Medical history tracking
   - Appointment viewing and booking
   - Billing history access
   - Secure messaging

4. **Treatments Module**
   - Treatment catalog with categories
   - Treatment plans per patient
   - Progress notes and documentation
   - Before/after photo management

5. **Finance & Billing**
   - Invoice generation and management
   - Payment processing with multiple methods
   - Insurance claim tracking
   - Financial reports and analytics

6. **Admin Backend**
   - Dashboard with KPIs
   - Clinic settings management
   - Audit logs
   - System configuration

7. **Doctor Backend**
   - Patient list with medical history
   - Daily schedule view
   - Treatment notes
   - Prescription management

8. **System Requirements**
   - Responsive design (mobile, tablet, desktop)
   - Real-time notifications
   - Data export capabilities
   - Audit trail logging

## Tech Stack

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (access + refresh tokens)
- **Validation**: express-validator
- **Security**: bcryptjs, CORS, Helmet

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **Notifications**: Sonner

## Project Structure

```
dental-clinic/
├── dental-clinic-backend/     # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth & RBAC middleware
│   │   ├── routes/            # API routes
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # JWT, password utils
│   │   └── index.ts           # Entry point
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   └── package.json
│
└── app/                       # React + Vite Frontend
    ├── src/
    │   ├── api/               # API clients
    │   ├── components/        # UI components
    │   ├── contexts/          # React contexts (Auth)
    │   ├── hooks/             # Custom hooks
    │   ├── lib/               # Utilities
    │   ├── pages/             # Route pages
    │   ├── types/             # TypeScript types
    │   └── App.tsx            # Main app
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd dental-clinic-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed the database:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:399`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Default Login Credentials

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dentalclinic.com | admin123 |
| Receptionist | receptionist@dentalclinic.com | receptionist123 |
| Doctor | doctor@dentalclinic.com | doctor123 |
| Patient | patient@example.com | patient123 |

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new patient
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User Management
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Toggle user status

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `GET /api/appointments/available-slots` - Get available time slots

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `GET /api/patients/:id/appointments` - Get patient appointments
- `GET /api/patients/:id/invoices` - Get patient invoices
- `GET /api/patients/portal` - Get patient portal data

### Billing
- `GET /api/billing/invoices` - List invoices
- `POST /api/billing/invoices` - Create invoice
- `GET /api/billing/invoices/:id` - Get invoice details
- `PUT /api/billing/invoices/:id` - Update invoice
- `POST /api/billing/payments` - Record payment
- `GET /api/billing/financial-summary` - Get financial reports

### Treatments
- `GET /api/treatments` - List treatments
- `POST /api/treatments` - Create treatment
- `GET /api/treatments/categories` - Get treatment categories
- `GET /api/treatments/plans` - Get treatment plans

### Messages
- `GET /api/messages` - List messages
- `GET /api/messages/contacts` - List allowed recipients for current user
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark as read

### Messaging Defaults (example)
- `MESSAGING_ENABLED=true` - master switch for in-app messaging
- `MESSAGING_ALLOW_PATIENT_TO_STAFF=true` - patient -> staff conversations
- `MESSAGING_ALLOW_STAFF_TO_PATIENT=true` - staff -> patient conversations
- `MESSAGING_DEFAULT_SIGNATURE="Thanks, Dental Clinic Team"` - optional default signature template

## Authentication Flow

The system uses JWT tokens with automatic refresh:

1. User logs in with email/password
2. Server returns access token (short-lived) and refresh token (long-lived)
3. Access token is used for API requests
4. When access token expires, refresh token is used to get a new one
5. Both tokens are stored in memory (never in localStorage for security)

## Role-Based Access Control

Routes are protected based on user roles:

- **Admin**: Full access to all features
- **Receptionist**: Appointments, patients, billing
- **Doctor**: Patients, appointments, treatments, prescriptions
- **Nurse**: Patient care, appointments assistance
- **Dentist Assistant**: Chairside assistance, inventory
- **Dentist**: Patient treatments, appointments
- **Specialist**: Specialized treatments, referrals
- **Patient**: Portal access only (own data)

## Development

### Running Tests
```bash
# Backend
cd dental-clinic-backend
npm test

# Frontend
cd app
npm test
```

### Building for Production
```bash
# Backend
cd dental-clinic-backend
npm run build
npm start

# Frontend
cd app
npm run build
```

### Database Migrations
```bash
cd dental-clinic-backend
npx prisma migrate dev --name migration_name
npx prisma generate
```

## License

MIT License

## Support

For issues and feature requests, please use the GitHub issue tracker.
