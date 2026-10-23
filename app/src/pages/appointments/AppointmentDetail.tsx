import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments';
import { billingApi } from '@/api/billing';
import { treatmentsApi } from '@/api/treatments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Stethoscope, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { syncPatientData } from '@/lib/patient-sync';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
};

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: '',
    taxAmount: '',
    discountAmount: '',
    notes: '',
  });
  const [items, setItems] = useState<
    { description: string; quantity: number; unitPrice: number; treatmentId?: string }[]
  >([{ description: '', quantity: 1, unitPrice: 0 }]);

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => appointmentsApi.getById(id!),
    enabled: !!id,
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ['treatments', 'appointmentInvoice'],
    queryFn: () => treatmentsApi.getAll({ isActive: true }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      syncPatientData(queryClient, variables.patientId);
      setIsInvoiceOpen(false);
      setInvoiceForm({ dueDate: '', taxAmount: '', discountAmount: '', notes: '' });
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      toast.success('Invoice created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const submitInvoice = (appointmentId: string, patientId: string) => {
    if (!invoiceForm.dueDate) {
      toast.error('Due date is required');
      return;
    }
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one invoice item');
      return;
    }
    createInvoiceMutation.mutate({
      patientId,
      appointmentId,
      dueDate: invoiceForm.dueDate,
      items: validItems,
      taxAmount: invoiceForm.taxAmount ? Number(invoiceForm.taxAmount) : undefined,
      discountAmount: invoiceForm.discountAmount ? Number(invoiceForm.discountAmount) : undefined,
      notes: invoiceForm.notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const appointment = data?.appointment;

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Appointment not found</p>
        <Button asChild className="mt-4">
          <Link to="/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appointments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/appointments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button asChild>
          <Link to={`/appointments/${appointment.id}/teeth`}>Tooth Chart</Link>
        </Button>
        <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
          <DialogTrigger asChild>
            <Button
              disabled={!!appointment.invoice}
              title={appointment.invoice ? 'Invoice already exists' : 'Create invoice'}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceForm.taxAmount}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, taxAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Amount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={invoiceForm.discountAmount}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, discountAmount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <Label>Items</Label>
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, i) => (i === index ? { ...it, description: e.target.value } : it))
                      )
                    }
                  />
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, i) => (i === index ? { ...it, quantity: Number(e.target.value || 1) } : it))
                      )
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((it, i) => (i === index ? { ...it, unitPrice: Number(e.target.value || 0) } : it))
                      )
                    }
                  />
                  <Select
                    value={item.treatmentId || 'NONE'}
                    onValueChange={(value) =>
                      setItems((prev) =>
                        prev.map((it, i) =>
                          i === index ? { ...it, treatmentId: value === 'NONE' ? undefined : value } : it
                        )
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Treatment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No treatment</SelectItem>
                      {(treatmentsData?.treatments || []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    disabled={items.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setItems((prev) => [...prev, { description: '', quantity: 1, unitPrice: 0 }])}
              >
                Add Item
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => submitInvoice(appointment.id, appointment.patientId)}
                disabled={createInvoiceMutation.isPending}
              >
                {createInvoiceMutation.isPending ? 'Saving...' : 'Create Invoice'}
              </Button>
              <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
        <Badge className={statusColors[appointment.status]}>
          {appointment.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                {appointment.patient?.user?.firstName}{' '}
                {appointment.patient?.user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{appointment.patient?.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">
                {appointment.patient?.user?.phone || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Doctor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                Dr. {appointment.doctor?.user?.firstName}{' '}
                {appointment.doctor?.user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Specialization</p>
              <p className="font-medium">
                {appointment.doctor?.specialization || 'General Dentistry'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {format(new Date(appointment.appointmentDate), 'MMMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium">
                {appointment.startTime} - {appointment.endTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{appointment.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reason</p>
              <p className="font-medium">{appointment.reason || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{appointment.notes || 'No notes'}</p>
          </CardContent>
        </Card>
      </div>

      {appointment.treatments && appointment.treatments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Treatments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointment.treatments.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between border-b py-2"
                >
                  <div>
                    <p className="font-medium">{t.treatment?.name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {t.quantity} x ${t.unitPrice}
                    </p>
                  </div>
                  <p className="font-medium">
                    ${(t.quantity * t.unitPrice).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
