# Dental Clinic Management System - Backend

A comprehensive backend API for a Dental Clinic Management System built with Node.js, Express, TypeScript, Prisma, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with access/refresh tokens and role-based access control
- **User Management**: Full CRUD operations with role assignment and user activation
- **Patient Management**: Complete patient profiles with medical history and insurance
- **Appointment Scheduling**: Calendar management with conflict detection
- **Treatment Catalog**: Treatment management with categories and pricing
- **Billing & Invoicing**: Invoice generation, payment tracking, and financial reports
- **Messaging System**: Secure messaging between patients and staff
- **Audit Logging**: Track all critical actions in the system

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
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

The server will start on `http://localhost:399`

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dental_clinic?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=399
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (patients)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Update user status
- `PATCH /api/users/:id/role` - Assign role
- `POST /api/users/:id/reset-password` - Reset password
- `GET /api/users/staff/list` - Get staff members
- `GET /api/users/audit-logs` - Get audit logs

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient by ID
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/:id/appointments` - Get patient appointments
- `GET /api/patients/:id/treatments` - Get patient treatments
- `GET /api/patients/:id/invoices` - Get patient invoices
- `GET /api/patients/portal/me` - Get patient portal data
- `PUT /api/patients/portal/me` - Update patient profile

### Appointments
- `GET /api/appointments` - List all appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `POST /api/appointments/:id/cancel` - Cancel appointment
- `GET /api/appointments/availability/:doctorId` - Get doctor availability
- `GET /api/appointments/schedule/:doctorId` - Get doctor schedule
- `GET /api/appointments/calendar/data` - Get calendar data
- `POST /api/appointments/:id/treatments` - Add treatment to appointment
- `POST /api/appointments/:id/notes` - Add treatment note

### Treatments
- `GET /api/treatments` - List all treatments
- `POST /api/treatments` - Create treatment
- `GET /api/treatments/:id` - Get treatment by ID
- `PUT /api/treatments/:id` - Update treatment
- `DELETE /api/treatments/:id` - Delete treatment
- `GET /api/treatments/categories` - List all categories
- `POST /api/treatments/categories` - Create category
- `GET /api/treatments/plans` - List all treatment plans
- `POST /api/treatments/plans` - Create treatment plan
- `PATCH /api/treatments/plans/:id/approve` - Approve treatment plan

### Billing
- `GET /api/billing/invoices` - List all invoices
- `POST /api/billing/invoices` - Create invoice
- `GET /api/billing/invoices/:id` - Get invoice by ID
- `GET /api/billing/invoices/:id/download` - Download invoice
- `GET /api/billing/payments` - List all payments
- `POST /api/billing/payments` - Create payment
- `GET /api/billing/reports/revenue` - Get revenue report
- `GET /api/billing/reports/outstanding` - Get outstanding payments
- `GET /api/billing/stats` - Get financial stats

### Messages
- `GET /api/messages` - List messages
- `POST /api/messages` - Send message
- `GET /api/messages/:id` - Get message by ID
- `PATCH /api/messages/:id/read` - Mark message as read
- `GET /api/messages/unread/count` - Get unread count

### Dashboard
- `GET /api/dashboard` - Get dashboard stats
- `GET /api/dashboard/admin` - Get admin stats
- `GET /api/dashboard/doctor` - Get doctor stats
- `GET /api/dashboard/today` - Get today's schedule
- `GET /api/dashboard/upcoming` - Get upcoming appointments
- `GET /api/dashboard/notifications` - Get notifications

## Default Login Credentials

After seeding the database, you can use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dentalclinic.com | admin123 |
| Receptionist | reception@dentalclinic.com | reception123 |
| Dentist | dentist@dentalclinic.com | dentist123 |
| Specialist | specialist@dentalclinic.com | specialist123 |
| Nurse | nurse@dentalclinic.com | nurse123 |
| Assistant | assistant@dentalclinic.com | assistant123 |
| Patient | patient@example.com | patient123 |

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## License

MIT
