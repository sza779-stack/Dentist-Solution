import { useDashboardStats } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  Calendar,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  TrendingDown,
  Clock,
  UserCheck,
  Stethoscope,
  Package,
  UserCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

function toNumber(value: unknown, fallback = 0) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function formatMoney(value: unknown) {
  return `$${toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Mock data for charts - in production, this would come from the API
const revenueData = [
  { name: 'Jan', revenue: 45000, appointments: 120 },
  { name: 'Feb', revenue: 52000, appointments: 135 },
  { name: 'Mar', revenue: 48000, appointments: 128 },
  { name: 'Apr', revenue: 61000, appointments: 155 },
  { name: 'May', revenue: 55000, appointments: 142 },
  { name: 'Jun', revenue: 67000, appointments: 168 },
];

const appointmentStatusData = [
  { name: 'Completed', value: 65, color: '#10b981' },
  { name: 'Scheduled', value: 25, color: '#3b82f6' },
  { name: 'Cancelled', value: 10, color: '#ef4444' },
];

const treatmentData = [
  { name: 'Cleaning', count: 45 },
  { name: 'Fillings', count: 32 },
  { name: 'Extractions', count: 18 },
  { name: 'Root Canal', count: 12 },
  { name: 'Crowns', count: 8 },
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("hover-lift card-shadow overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && trend !== 'neutral' && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                trend === 'up' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                trend === 'down' && "bg-red-500/10 text-red-600 dark:text-red-400"
              )}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {trendValue}
            </Badge>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { isAdmin, isDoctor, isStaff } = useAuth();
  const { mainStats, adminStats, doctorStats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview of your dental clinic operations and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
            <Clock className="h-3 w-3 mr-1" />
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </Badge>
        </div>
      </div>

      {/* Main Stats */}
      {mainStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Appointments"
            value={mainStats.stats.todayAppointments}
            icon={Calendar}
            description="Scheduled for today"
            trend="up"
            trendValue="12%"
          />
          <StatCard
            title="Total Patients"
            value={mainStats.stats.totalPatients.toLocaleString()}
            icon={Users}
            description="Registered patients"
            trend="up"
            trendValue="8%"
          />
          <StatCard
            title="Pending Payments"
            value={mainStats.stats.pendingPayments}
            icon={CreditCard}
            description="Invoices awaiting payment"
            trend="down"
            trendValue="5%"
          />
          <StatCard
            title="Today's Revenue"
            value={formatMoney(mainStats.stats.todayRevenue)}
            icon={DollarSign}
            description="Revenue collected today"
            trend="up"
            trendValue="23%"
            className="border-l-4 border-l-emerald-500"
          />
        </div>
      )}

      {/* Charts Section */}
      {isStaff && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2 card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Overview
              </CardTitle>
              <CardDescription>Monthly revenue and appointment trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Appointment Status */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Appointment Status
              </CardTitle>
              <CardDescription>Distribution by status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={appointmentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appointmentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {appointmentStatusData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Stats */}
      {isAdmin && adminStats && (
        <>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Admin Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Users"
              value={adminStats.users.active}
              icon={UserCheck}
              description="Currently active"
              trend="up"
              trendValue="3 new"
            />
            <StatCard
              title="Inactive Users"
              value={adminStats.users.inactive}
              icon={Users}
              description="Requires attention"
              className="border-l-4 border-l-amber-500"
            />
            <StatCard
              title="Monthly Revenue"
              value={formatMoney(adminStats.monthlyRevenue)}
              icon={DollarSign}
              description="This month's total"
              trend="up"
              trendValue="18%"
              className="border-l-4 border-l-emerald-500"
            />
            <StatCard
              title="Recent Activity"
              value={adminStats.recentActivity}
              icon={Activity}
              description="Actions in last 24h"
              trend="up"
              trendValue="High"
            />
          </div>

          {/* Additional Admin Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Popular Treatments
                </CardTitle>
                <CardDescription>Most requested procedures this month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={treatmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  System Health
                </CardTitle>
                <CardDescription>Platform performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Server Uptime</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">99.9%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[99.9%] bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Database Performance</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">98.5%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[98.5%] bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API Response Time</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">45ms</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[95%] bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage Usage</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">72%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[72%] bg-amber-500 rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Doctor Stats */}
      {isDoctor && doctorStats && (
        <>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            My Overview
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="My Patients"
              value={doctorStats.totalPatients}
              icon={Users}
              description="Total assigned patients"
            />
            <StatCard
              title="Completed This Month"
              value={doctorStats.completedThisMonth}
              icon={Calendar}
              description="Appointments completed"
              trend="up"
              trendValue="+5"
            />
            <StatCard
              title="Pending Plans"
              value={doctorStats.pendingTreatmentPlans}
              icon={Activity}
              description="Draft treatment plans"
              className="border-l-4 border-l-amber-500"
            />
            <StatCard
              title="Success Rate"
              value="94%"
              icon={TrendingUp}
              description="Patient satisfaction"
              trend="up"
              trendValue="2%"
              className="border-l-4 border-l-emerald-500"
            />
          </div>
        </>
      )}

      {/* Recent Appointments */}
      {mainStats?.recentAppointments && mainStats.recentAppointments.length > 0 && (
        <Card className="card-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Appointments
              </CardTitle>
              <CardDescription>Latest scheduled appointments</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/5">
              {mainStats.recentAppointments.length} Total
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mainStats.recentAppointments.map((appointment, index) => (
                <div
                  key={appointment.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg transition-colors",
                    "hover:bg-muted/50",
                    index !== mainStats.recentAppointments.length - 1 && "border-b border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {appointment.patient?.user?.firstName}{' '}
                        {appointment.patient?.user?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      variant="outline"
                      className={cn(
                        "capitalize",
                        appointment.status === 'COMPLETED' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        appointment.status === 'SCHEDULED' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                        appointment.status === 'CANCELLED' && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                        appointment.status === 'CONFIRMED' && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                      )}
                    >
                      {appointment.status.toLowerCase()}
                    </Badge>
                    <div className="text-right min-w-[100px]">
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">{appointment.startTime}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
