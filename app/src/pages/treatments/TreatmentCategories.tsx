import { useQuery } from '@tanstack/react-query';
import { treatmentsApi } from '@/api/treatments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TreatmentCategories() {
  const { data } = useQuery({
    queryKey: ['treatmentCategories'],
    queryFn: () => treatmentsApi.getCategories(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Treatment Categories</h1>
        <p className="text-gray-500">Manage treatment categories</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color || '#gray' }}
                />
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">{category.description}</p>
              <Badge variant="secondary">
                {category._count?.treatments || 0} treatments
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
