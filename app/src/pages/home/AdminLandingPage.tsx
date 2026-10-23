import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, CreditCard, Settings, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/pages/Dashboard';

const adminActions = [
  {
    title: 'Team Access',
    description: 'Manage staff permissions, patient access, and activation status.',
    href: '/users',
    icon: Users,
  },
  {
    title: 'Appointments',
    description: 'Review the schedule, fill open slots, and unblock bottlenecks.',
    href: '/appointments',
    icon: Calendar,
  },
  {
    title: 'Billing',
    description: 'Track outstanding invoices and review clinic revenue.',
    href: '/billing/reports',
    icon: CreditCard,
  },
  {
    title: 'Clinic Settings',
    description: 'Update global settings, messaging, and operational defaults.',
    href: '/settings',
    icon: Settings,
  },
];

export default function AdminLandingPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8" data-testid="admin-landing-page">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.35),_transparent_55%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge className="w-fit border-white/15 bg-white/10 text-white hover:bg-white/10">
              <Shield className="mr-1 h-3.5 w-3.5" />
              Admin Home
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="admin-landing-title">
                Run the clinic from one control surface
              </h1>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">
                {user?.firstName}, use this page as your operational start point for staffing,
                appointments, finance, and system configuration.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/users">Manage Staff</Link>
            </Button>
            <Button asChild size="lg" className="bg-blue-500 text-white hover:bg-blue-400">
              <Link to="/settings">
                Open Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminActions.map((action) => (
          <Card key={action.href} className="border-slate-200/80 shadow-sm transition-transform hover:-translate-y-0.5">
            <CardHeader className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="mt-1">{action.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to={action.href}>
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Dashboard />
    </div>
  );
}
