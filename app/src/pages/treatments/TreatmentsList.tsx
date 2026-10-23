import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { treatmentsApi } from '@/api/treatments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TreatmentsList() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | string>('ALL');

  const { data: treatmentsData } = useQuery({
    queryKey: ['treatments', search, categoryFilter],
    queryFn: () =>
      treatmentsApi.getAll({
        search: search || undefined,
        categoryId: categoryFilter === 'ALL' ? undefined : categoryFilter,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['treatmentCategories'],
    queryFn: () => treatmentsApi.getCategories(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatments</h1>
          <p className="text-gray-500">Manage treatment catalog and pricing</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search treatments..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categoriesData?.categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {treatmentsData?.treatments.map((treatment) => (
          <Card key={treatment.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{treatment.name}</CardTitle>
                <Badge
                  style={{
                    backgroundColor: treatment.category?.color || '#gray',
                  }}
                >
                  {treatment.category?.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">{treatment.description}</p>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{treatment.duration} min</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">
                    ${Number(treatment.price).toFixed(2)}
                  </p>
                </div>
              </div>
              {treatment.code && (
                <p className="text-xs text-gray-500">Code: {treatment.code}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
