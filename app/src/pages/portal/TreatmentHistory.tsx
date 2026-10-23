import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const planStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function TreatmentHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment History</h1>
          <p className="text-gray-500">Your treatment plans and completed treatments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {treatmentPlans.length === 0 ? (
            <p className="text-sm text-gray-500">No treatment plans found.</p>
          ) : (
            <div className="space-y-4">
              {treatmentPlans.map((plan) => (
                <div key={plan.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      {plan.description && (
                        <p className="text-sm text-gray-500">{plan.description}</p>
                      )}
                    </div>
                    <Badge className={planStatusColors[plan.status] || 'bg-gray-100'}>
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Total: ${Number(plan.totalCost).toFixed(2)}
                  </div>
                  {plan.items && plan.items.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {plan.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium">{item.treatment?.name}</p>
                            {item.scheduledDate && (
                              <p className="text-xs text-gray-500">
                                Scheduled: {format(new Date(item.scheduledDate), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p>
                              ${Number(item.unitPrice).toFixed(2)} x {item.quantity}
                            </p>
                            <p className="text-xs text-gray-500">{item.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Treatments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentTreatments.length === 0 ? (
            <p className="text-sm text-gray-500">No treatments found.</p>
          ) : (
            <div className="space-y-3">
              {appointmentTreatments.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{item.treatment?.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.appointment?.appointmentDate
                        ? format(new Date(item.appointment.appointmentDate), 'MMM d, yyyy')
                        : '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      ${Number(item.unitPrice).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.appointment?.status || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tooth Treatments</CardTitle>
        </CardHeader>
        <CardContent>
          {toothTreatments.length === 0 ? (
            <p className="text-sm text-gray-500">No tooth treatments found.</p>
          ) : (
            <div className="space-y-3">
              {toothTreatments.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between border-b pb-3 last:border-0">
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
                    <p className="text-sm">${Number(t.cost || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{t.status}</p>
                    {t.appointment?.appointmentDate && (
                      <p className="text-xs text-gray-500">
                        {format(new Date(t.appointment.appointmentDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
