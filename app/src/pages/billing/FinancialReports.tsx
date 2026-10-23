import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { billingApi } from '@/api/billing';
import { patientsApi } from '@/api/patients';
import { treatmentsApi } from '@/api/treatments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function FinancialReports() {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [patientId, setPatientId] = useState<string>('ALL');
  const [treatmentId, setTreatmentId] = useState<string>('ALL');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [rangePreset, setRangePreset] = useState<'7' | '30' | '90' | 'month' | 'year'>('30');

  const effectivePatientId = patientId === 'ALL' ? undefined : patientId;
  const effectiveTreatmentId = treatmentId === 'ALL' ? undefined : treatmentId;

  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'reportFilters'],
    queryFn: () => patientsApi.getAll({ limit: 100 }),
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ['treatments', 'reportFilters'],
    queryFn: () => treatmentsApi.getAll({ isActive: true }),
  });

  const patientOptions = patientsData?.patients || [];
  const treatmentOptions = treatmentsData?.treatments || [];

  const { data: stats } = useQuery({
    queryKey: ['financialStats', effectivePatientId, effectiveTreatmentId],
    queryFn: () =>
      billingApi.getFinancialStats({
        patientId: effectivePatientId,
        treatmentId: effectiveTreatmentId,
      }),
  });

  const { data: revenueReport } = useQuery({
    queryKey: ['revenueReport', dateRange, groupBy, effectivePatientId, effectiveTreatmentId],
    queryFn: () =>
      billingApi.getRevenueReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy,
        patientId: effectivePatientId,
        treatmentId: effectiveTreatmentId,
      }),
  });

  const chartData = revenueReport?.revenueByDate
    ? Object.entries(revenueReport.revenueByDate).map(([date, amount]) => ({
        date:
          groupBy === 'month'
            ? format(new Date(date), 'MMM yyyy')
            : groupBy === 'year'
            ? format(new Date(date), 'yyyy')
            : format(new Date(date), 'MMM d'),
        amount: Number(amount),
      }))
    : [];

  const applyPreset = (preset: '7' | '30' | '90' | 'month' | 'year') => {
    const today = new Date();
    if (preset === 'month') {
      setDateRange({
        startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
      });
      return;
    }
    if (preset === 'year') {
      setDateRange({
        startDate: format(startOfYear(today), 'yyyy-MM-dd'),
        endDate: format(endOfYear(today), 'yyyy-MM-dd'),
      });
      return;
    }
    const days = Number(preset);
    setDateRange({
      startDate: format(subDays(today, days), 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-500">View financial performance and reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Patient</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="All patients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All patients</SelectItem>
                {patientOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.user?.firstName} {p.user?.lastName} ({p.user?.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Treatment Type</Label>
            <Select value={treatmentId} onValueChange={setTreatmentId}>
              <SelectTrigger>
                <SelectValue placeholder="All treatments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All treatments</SelectItem>
                {treatmentOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Revenue Trend Grouping</Label>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={rangePreset}
              onValueChange={(v) => {
                const preset = v as any;
                setRangePreset(preset);
                applyPreset(preset);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(stats.today.revenue).toFixed(2)}
              </div>
              <p className="text-xs text-gray-500">
                {stats.today.paymentsCount} payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(stats.thisMonth.revenue).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Number(stats.last30Days.revenue).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${Number(stats.outstanding.balance).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No revenue data for the selected filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `$${value.toFixed(2)}`}
                  />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
