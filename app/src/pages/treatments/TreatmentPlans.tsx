import { useQuery } from '@tanstack/react-query';
import { treatmentsApi } from '@/api/treatments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function TreatmentPlans() {
  const { data } = useQuery({
    queryKey: ['treatmentPlans'],
    queryFn: () => treatmentsApi.getAllPlans(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Treatment Plans</h1>
        <p className="text-gray-500">Manage patient treatment plans</p>
      </div>

      <div className="space-y-4">
        {data?.treatmentPlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <p className="text-sm text-gray-500">
                    Patient: {plan.patient?.user?.firstName}{' '}
                    {plan.patient?.user?.lastName}
                  </p>
                </div>
                <Badge className={statusColors[plan.status] || 'bg-gray-100'}>
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Items:</p>
                {plan.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm border-b py-1"
                  >
                    <span>{item.treatment?.name}</span>
                    <span>
                      {item.quantity} x ${item.unitPrice}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Total:{' '}
                  <span className="font-bold">
                    ${plan.totalCost.toFixed(2)}
                  </span>
                </p>
                {plan.approvedAt && (
                  <p className="text-xs text-gray-500">
                    Approved: {format(new Date(plan.approvedAt), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
