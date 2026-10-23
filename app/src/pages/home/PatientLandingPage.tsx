import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CreditCard,
  FileText,
  Pill,
  UserRound,
  Clock,
  ChevronRight,
  Stethoscope,
  DollarSign,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { format, isAfter } from 'date-fns';

const quickActions = [
  {
    title: 'My Appointments',
    description: 'View and manage your appointments',
    href: '/portal/appointments',
    icon: Calendar,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    title: 'My Billing',
    description: 'View invoices and payments',
    href: '/portal/billing',
    icon: CreditCard,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    title: 'Treatment History',
    description: 'View your treatments and plans',
    href: '/portal/treatments',
    icon: FileText,
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    title: 'Prescriptions',
    description: 'Review current and past medications',
    href: '/portal/prescriptions',
    icon: Pill,
    color: 'bg-rose-500/10 text-rose-600',
  },
  {
    title: 'My Profile',
    description: 'Update your information',
    href: '/portal/profile',
    icon: UserRound,
    color: 'bg-amber-500/10 text-amber-600',
  },
];

function StatsCards() {
  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const patient = data?.patient;
  const now = new Date();

  const totalVisits = patient?.appointments?.filter(
    (a) => a.status === 'COMPLETED'
  ).length || 0;

  const upcomingAppointments = patient?.appointments?.filter(
    (a) => isAfter(new Date(a.appointmentDate), now) &&
      (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
  ) || [];

  const nextVisit = upcomingAppointments[0];

  const pendingBills = patient?.invoices?.filter(
    (i) => i.status === 'PENDING' || i.status === 'OVERDUE'
  ).reduce((sum, i) => sum + Number(i.balanceDue), 0) || 0;

  const completedTreatments = patient?.treatmentPlans?.filter(
    (t) => t.status === 'COMPLETED'
  ).length || 0;

  const stats = [
    {
      title: 'Total Visits',
      value: totalVisits.toString(),
      subtitle: 'Completed appointments',
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Next Visit',
      value: nextVisit ? format(new Date(nextVisit.appointmentDate), 'MMM d') : 'None',
      subtitle: nextVisit ? `${nextVisit.startTime} • Dr. ${nextVisit.doctor?.user?.lastName}` : 'Book an appointment',
      icon: Clock,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Pending Bills',
      value: `$${pendingBills.toFixed(0)}`,
      subtitle: pendingBills > 0 ? 'Outstanding balance' : 'All paid',
      icon: pendingBills > 0 ? AlertCircle : DollarSign,
      color: pendingBills > 0 ? 'text-red-600' : 'text-emerald-600',
      bgColor: pendingBills > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-emerald-100 dark:bg-emerald-900/20',
    },
    {
      title: 'Treatments',
      value: completedTreatments.toString(),
      subtitle: 'Completed treatments',
      icon: Stethoscope,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {quickActions.map((action) => (
        <Link key={action.href} to={action.href}>
          <Card className="h-full cursor-pointer border shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">{action.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function UpcomingAppointments() {
  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });
  const navigate = useNavigate();

  const now = new Date();
  const appointments = data?.patient?.appointments
    ?.filter((a) => isAfter(new Date(a.appointmentDate), now) &&
      (a.status === 'SCHEDULED' || a.status === 'CONFIRMED'))
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
    .slice(0, 3) || [];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Appointments
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portal/appointments">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No upcoming appointments</p>
            <Button
              className="mt-4"
              onClick={() => navigate('/portal/appointments?tab=book')}
            >
              Book Now
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {format(new Date(apt.appointmentDate), 'd')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{apt.type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={apt.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                    {apt.status}
                  </Badge>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {apt.startTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentBilling() {
  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const invoices = data?.patient?.invoices?.slice(0, 3) || [];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Recent Billing
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portal/billing">View all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="py-8 text-center">
            <CreditCard className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div>
                  <p className="font-medium">Invoice #{invoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${Number(invoice.totalAmount).toFixed(2)}</p>
                  <Badge
                    variant={invoice.status === 'PAID' ? 'default' : invoice.status === 'OVERDUE' ? 'destructive' : 'secondary'}
                    className="mt-1"
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PatientLandingPage() {
  return (
    <div className="space-y-6" data-testid="patient-landing-page">
      <StatsCards />
      <QuickActions />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingAppointments />
        <RecentBilling />
      </div>
    </div>
  );
}
