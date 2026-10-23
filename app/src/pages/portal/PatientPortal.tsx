import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BriefcaseMedical, 
  Calendar, 
  CreditCard, 
  FileText, 
  Phone,
  TrendingUp,
  Clock,
  DollarSign,
  AlertCircle,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isAfter } from 'date-fns';

export default function PatientPortal() {
  const { data, isLoading } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });
  const { data: doctorsData, isLoading: isDoctorsLoading } = useQuery({
    queryKey: ['portalDoctors'],
    queryFn: () => patientsApi.getPortalDoctors(),
  });

  if (isLoading || isDoctorsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const patient = data?.patient;
  const careTeam = doctorsData?.staff || [];

  // Analytics calculations
  const now = new Date();
  
  // Total visits (completed appointments)
  const totalVisits = patient?.appointments?.filter(
    (a) => a.status === 'COMPLETED'
  ).length || 0;

  // Next upcoming appointment
  const upcomingAppointments = patient?.appointments
    ?.filter((a) => {
      const aptDate = new Date(a.appointmentDate);
      return isAfter(aptDate, now) && (a.status === 'SCHEDULED' || a.status === 'CONFIRMED');
    })
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  
  const nextVisit = upcomingAppointments?.[0];

  // Total paid (all payments)
  const totalPaid = patient?.invoices?.reduce(
    (sum, inv) => sum + Number(inv.paidAmount || 0), 
    0
  ) || 0;

  // Pending bills (outstanding balance)
  const pendingBills = patient?.invoices
    ?.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((sum, i) => sum + Number(i.balanceDue), 0) || 0;

  // Total invoices count
  const totalInvoices = patient?.invoices?.length || 0;

  // Treatment count
  const completedTreatments = patient?.treatmentPlans?.filter(
    (t) => t.status === 'COMPLETED'
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {patient?.user?.firstName}!
          </h1>
          <p className="text-gray-500">Here's your dental care overview</p>
        </div>
        <Button asChild>
          <Link to="/portal/appointments">Book Appointment</Link>
        </Button>
      </div>

      {/* Analytics Cards Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Visits
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisits}</div>
            <p className="text-xs text-gray-500 mt-1">Completed appointments</p>
            <Button variant="link" className="p-0 h-auto text-xs" asChild>
              <Link to="/portal/appointments">View history</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Next Visit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Next Visit
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {nextVisit ? (
              <>
                <div className="text-lg font-bold">
                  {format(new Date(nextVisit.appointmentDate), 'MMM d, yyyy')}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {nextVisit.startTime} • Dr. {nextVisit.doctor?.user?.lastName}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  {nextVisit.type}
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-bold text-gray-400">No upcoming</div>
                <p className="text-xs text-gray-500 mt-1">Book your next visit</p>
                <Button variant="link" className="p-0 h-auto text-xs" asChild>
                  <Link to="/portal/appointments">Schedule now</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Paid */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Paid
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${totalPaid.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedTreatments} treatments completed
            </p>
            <Button variant="link" className="p-0 h-auto text-xs" asChild>
              <Link to="/portal/billing">View payments</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Bills
            </CardTitle>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              pendingBills > 0 ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <AlertCircle className={`h-4 w-4 ${
                pendingBills > 0 ? 'text-red-600' : 'text-gray-500'
              }`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              pendingBills > 0 ? 'text-red-600' : 'text-gray-900'
            }`}>
              ${pendingBills.toFixed(2)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pendingBills > 0 ? 'Outstanding balance' : 'All bills paid'}
            </p>
            {pendingBills > 0 && (
              <Button variant="link" className="p-0 h-auto text-xs text-red-600" asChild>
                <Link to="/portal/billing">Pay now</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Upcoming Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patient?.appointments?.filter(
                (a) => new Date(a.appointmentDate) >= now
              ).length || 0}
            </div>
            <Button variant="link" className="p-0" asChild>
              <Link to="/portal/appointments">View all</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Treatment Plans
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patient?.treatmentPlans?.length || 0}
            </div>
            <Button variant="link" className="p-0" asChild>
              <Link to="/portal/treatments">View history</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Invoices
            </CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <Button variant="link" className="p-0" asChild>
              <Link to="/portal/billing">View bills</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient?.appointments?.slice(0, 5).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">{apt.type}</p>
                  <p className="text-sm text-gray-500">
                    Dr. {apt.doctor?.user?.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {format(new Date(apt.appointmentDate), 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-gray-500">{apt.startTime}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                    apt.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
            {(!patient?.appointments || patient.appointments.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No appointments yet. Book your first visit!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-500" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient?.invoices?.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <div>
                  <p className="font-medium">#{invoice.invoiceNumber}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    invoice.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    ${Number(invoice.totalAmount).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Balance: ${Number(invoice.balanceDue).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
            {(!patient?.invoices || patient.invoices.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No invoices yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Doctors & Staff Section */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Doctors & Staff</CardTitle>
          <p className="text-sm text-gray-500">
            Your care team profiles configured by clinic admin.
          </p>
        </CardHeader>
        <CardContent>
          {careTeam.length === 0 ? (
            <p className="text-sm text-gray-500">No care team assigned yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {careTeam.map((doctor) => {
                const yearsExperience =
                  typeof doctor.workingHours === 'object' &&
                  doctor.workingHours &&
                  'yearsExperience' in doctor.workingHours
                    ? Number(doctor.workingHours.yearsExperience)
                    : null;
                return (
                  <div
                    key={doctor.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-slate-100">
                      {doctor.user?.avatarUrl ? (
                        <img
                          src={doctor.user.avatarUrl}
                          alt={`${doctor.user?.firstName || ''} ${doctor.user?.lastName || ''}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-600">
                          <BriefcaseMedical className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <h3 className="text-2xl font-semibold text-slate-900">
                        Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                      </h3>
                      <p className="mt-1 text-sm font-medium text-blue-600">
                        {doctor.specialization || doctor.user?.role || 'Healthcare Professional'}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {doctor.biography || 'Experienced clinical professional providing quality dental care.'}
                      </p>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-center gap-2">
                        <BriefcaseMedical className="h-4 w-4 text-blue-600" />
                        <span>{yearsExperience ? `${yearsExperience}+ Years Experience` : 'Experience not set'}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>{doctor.department || 'General Department'}</span>
                      </div>
                      {doctor.user?.phone && (
                        <div className="flex items-center justify-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span>{doctor.user.phone}</span>
                        </div>
                      )}
                    </div>
                    <Button asChild className="mt-5 w-full rounded-full bg-blue-600 hover:bg-blue-700">
                      <Link to={`/portal/appointments?doctorId=${doctor.id}`}>Book Appointment</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
