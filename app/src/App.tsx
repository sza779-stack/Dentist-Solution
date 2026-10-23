import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Layouts
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import LandingPage from '@/pages/public/LandingPage';
import AdminLandingPage from '@/pages/home/AdminLandingPage';
import PatientLandingPage from '@/pages/home/PatientLandingPage';

// User Management
import UsersList from '@/pages/users/UsersList';
import UserDetail from '@/pages/users/UserDetail';

// Patient Management
import PatientsList from '@/pages/patients/PatientsList';
import PatientDetail from '@/pages/patients/PatientDetail';

// Appointments
import AppointmentsList from '@/pages/appointments/AppointmentsList';
import AppointmentDetail from '@/pages/appointments/AppointmentDetail';
import CalendarView from '@/pages/appointments/CalendarView';

// Treatments
import TreatmentsList from '@/pages/treatments/TreatmentsList';
import TreatmentCategories from '@/pages/treatments/TreatmentCategories';

// Billing
import InvoicesList from '@/pages/billing/InvoicesList';
import PaymentsList from '@/pages/billing/PaymentsList';
import FinancialReports from '@/pages/billing/FinancialReports';

// Messages
import Messages from '@/pages/messages/Messages';

// Patient Portal
import MyAppointments from '@/pages/portal/MyAppointments';
import MyBilling from '@/pages/portal/MyBilling';
import Profile from '@/pages/portal/Profile';
import MyTreatments from '@/pages/portal/MyTreatments';
import MyMessages from '@/pages/portal/MyMessages';
import MyPrescriptions from '@/pages/portal/MyPrescriptions';
import ToothChart from '@/pages/teeth/ToothChart';

// Settings
import Settings from '@/pages/settings/Settings';
import { getDefaultRouteForRole } from '@/lib/home';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Role-based Dashboard Redirect
function DashboardRedirect() {
  const { user } = useAuth();

  return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLandingPage />
            </ProtectedRoute>
          }
        />
        {/* Patient Landing Page - Public access with internal auth handling */}
        <Route path="/patient" element={<PatientLandingPage />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Users - Admin Only */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserDetail />
            </ProtectedRoute>
          }
        />

        {/* Patients - Staff Only */}
        <Route
          path="/patients"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <PatientsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <PatientDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:patientId/teeth"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <ToothChart />
            </ProtectedRoute>
          }
        />

        {/* Appointments - Staff Only */}
        <Route
          path="/appointments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <AppointmentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <AppointmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments/:appointmentId/teeth"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <ToothChart />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <CalendarView />
            </ProtectedRoute>
          }
        />

        {/* Treatments */}
        <Route
          path="/treatments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST']}>
              <TreatmentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treatments/categories"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <TreatmentCategories />
            </ProtectedRoute>
          }
        />
        <Route path="/treatments/plans" element={<Navigate to="/treatments" replace />} />

        {/* Billing */}
        <Route
          path="/billing/invoices"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <InvoicesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/payments"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <PaymentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <FinancialReports />
            </ProtectedRoute>
          }
        />

        {/* Messages */}
        <Route path="/messages" element={<Messages />} />

        {/* Patient Portal */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <Navigate to="/patient" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/appointments"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/billing"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyBilling />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/profile"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/treatments"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyTreatments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/messages"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyMessages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <MyPrescriptions />
            </ProtectedRoute>
          }
        />

        {/* Settings - Admin Only */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Default Redirect */}
        <Route path="/app" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
