import { useQuery } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const statusClasses: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-slate-100 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function MyPrescriptions() {
  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const prescriptions = data?.patient?.prescriptions || data?.prescriptions || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/patient">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Active and Past Prescriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <p className="text-sm text-gray-500">No prescriptions found.</p>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{prescription.medicationName}</p>
                        <Badge className={statusClasses[prescription.status] || 'bg-slate-100 text-slate-800'}>
                          {prescription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {prescription.dosage} • {prescription.frequency}
                        {prescription.duration ? ` • ${prescription.duration}` : ''}
                      </p>
                      {prescription.instructions && (
                        <p className="text-sm text-muted-foreground">{prescription.instructions}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground sm:text-right">
                      {prescription.startDate && (
                        <p>Start: {format(new Date(prescription.startDate), 'MMM d, yyyy')}</p>
                      )}
                      {prescription.endDate && (
                        <p>End: {format(new Date(prescription.endDate), 'MMM d, yyyy')}</p>
                      )}
                      <p>Refills: {prescription.refills}</p>
                      {prescription.prescribedBy?.user && (
                        <p>
                          Prescribed by {prescription.prescribedBy.user.firstName} {prescription.prescribedBy.user.lastName}
                        </p>
                      )}
                    </div>
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
