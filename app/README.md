# Dental Clinic Management System - Frontend

A modern React frontend for the Dental Clinic Management System built with Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Role-Based Access**: Different views for admin, staff, doctors, and patients
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: React Query for efficient data fetching
- **Type-Safe**: Full TypeScript support

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query
- **Routing**: React Router
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dental-clinic-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Environment Variables

```env
VITE_API_URL=http://localhost:399/api
```

## Project Structure

```
src/
├── api/           # API client and endpoints
├── components/    # React components
│   ├── layout/    # Layout components (Sidebar, Header)
│   └── ui/        # shadcn/ui components
├── contexts/      # React contexts (Auth)
├── hooks/         # Custom React hooks
├── pages/         # Page components
│   ├── auth/      # Login, Register
│   ├── users/     # User management
│   ├── patients/  # Patient management
│   ├── appointments/
│   ├── treatments/
│   ├── billing/
│   ├── messages/
│   ├── portal/    # Patient portal
│   └── settings/
├── types/         # TypeScript types
└── utils/         # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features by Role

### Admin
- Full system access
- User management
- Financial reports
- System settings
- Audit logs

### Receptionist
- Appointment scheduling
- Patient registration
- Invoice management
- Payment processing

### Doctor/Dentist/Specialist
- View assigned patients
- Manage appointments
- Add treatment notes
- Create treatment plans
- View patient history

### Patient
- View profile
- Book appointments
- View appointment history
- View treatment history
- View and pay bills
- Secure messaging

## License

MIT
