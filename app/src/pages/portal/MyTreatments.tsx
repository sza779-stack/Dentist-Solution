import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
};

export default function MyTreatments() {
  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const treatmentPlans = data?.patient?.treatmentPlans || [];
  const appointmentTreatments = data?.appointmentTreatments || [];
  const toothTreatments = data?.toothTreatments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/portal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">My Treatments</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {treatmentPlans.length === 0 && (
              <p className="text-sm text-gray-500">No treatment plans found.</p>
            )}
            {treatmentPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <Badge className={statusColors[plan.status] || 'bg-gray-100'}>
                    {plan.status}
                  </Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(plan.items || []).map((item) => (
                    <div key={item.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{item.treatment?.name}</p>
                        <Badge className={statusColors[item.status] || 'bg-gray-100'}>
                          {item.status}
                        </Badge>
                      </div>
                      {item.scheduledDate && (
                        <p className="text-sm text-gray-500">
                          Scheduled: {format(new Date(item.scheduledDate), 'MMM d, yyyy')}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} • Unit: ${Number(item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treatment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {appointmentTreatments.length === 0 && toothTreatments.length === 0 && (
              <p className="text-sm text-gray-500">No treatment history found.</p>
            )}
            {appointmentTreatments.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{record.treatment?.name}</p>
                  <p className="text-sm text-gray-500">
                    {record.treatment?.code ? `Code: ${record.treatment?.code}` : ''}
                  </p>
                  {record.notes && (
                    <p className="text-sm text-gray-500">{record.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  {record.appointment?.appointmentDate && (
                    <p className="text-sm">
                      {format(new Date(record.appointment.appointmentDate), 'MMM d, yyyy')}
                    </p>
                  )}
                  {record.appointment?.status && (
                    <Badge className={statusColors[record.appointment.status] || 'bg-gray-100'}>
                      {record.appointment.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {toothTreatments.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">
                    Tooth {t.toothNumber} ({t.notation})
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.treatmentType}
                    {t.diagnosis ? ` • ${t.diagnosis}` : ''}
                  </p>
                  {t.doctor?.user && (
                    <p className="text-xs text-gray-500">
                      Doctor: {t.doctor.user.firstName} {t.doctor.user.lastName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge className={statusColors[t.status] || 'bg-gray-100'}>
                    {t.status}
                  </Badge>
                  {t.appointment?.appointmentDate && (
                    <p className="text-xs text-gray-500">
                      {format(new Date(t.appointment.appointmentDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
