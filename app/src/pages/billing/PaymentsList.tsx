import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Printer, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { billingApi } from '@/api/billing';
import { patientsApi } from '@/api/patients';
import { PaymentMethod } from '@/types';
import type { PaymentMethodType } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { syncPatientData } from '@/lib/patient-sync';

const methodLabels: Record<PaymentMethodType, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CREDIT_CARD]: 'Credit Card',
  [PaymentMethod.DEBIT_CARD]: 'Debit Card',
  [PaymentMethod.CHECK]: 'Check',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.INSURANCE]: 'Insurance',
  [PaymentMethod.ONLINE]: 'Online',
};

export default function PaymentsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [patientId, setPatientId] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    patientId: '',
    invoiceId: '',
    amount: '',
    method: 'CASH' as PaymentMethodType,
    reference: '',
    notes: '',
    paymentDate: '',
  });

  const effectivePatientId = patientId === 'ALL' ? undefined : patientId;

  const { data, isLoading } = useQuery({
    queryKey: ['payments', effectivePatientId],
    queryFn: () =>
      billingApi.getAllPayments({
        limit: 50,
        patientId: effectivePatientId,
      }),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'paymentsFilter'],
    queryFn: () => patientsApi.getAll({ limit: 100 }),
  });

  const payments = data?.payments || [];
  const filteredPayments = payments.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const name = `${p.patient?.user?.firstName || ''} ${p.patient?.user?.lastName || ''}`.toLowerCase();
    const invoice = (p.invoice?.invoiceNumber || '').toLowerCase();
    return name.includes(term) || invoice.includes(term) || (p.reference || '').toLowerCase().includes(term);
  });

  const handlePrintReceipt = async (paymentId: string) => {
    try {
      const { payment } = await billingApi.getPaymentById(paymentId);
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) return;
      win.document.write(`
        <html>
          <head>
            <title>Receipt ${payment.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; }
              h1 { margin-bottom: 8px; }
              .row { margin: 6px 0; }
              .label { color: #555; }
              .amount { font-size: 20px; font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            </style>
          </head>
          <body>
            <h1>Payment Receipt</h1>
            <div class="row"><span class="label">Receipt ID:</span> ${payment.id}</div>
            <div class="row"><span class="label">Patient:</span> ${payment.patient?.user?.firstName || ''} ${payment.patient?.user?.lastName || ''}</div>
            <div class="row"><span class="label">Method:</span> ${methodLabels[payment.method as PaymentMethodType]}</div>
            <div class="row"><span class="label">Reference:</span> ${payment.reference || 'N/A'}</div>
            <div class="row"><span class="label">Date:</span> ${new Date(payment.paymentDate).toLocaleDateString()}</div>
            <div class="row amount">Amount: $${Number(payment.amount).toFixed(2)}</div>
            ${payment.invoice ? `<div class="row"><span class="label">Invoice:</span> ${payment.invoice.invoiceNumber}</div>` : ''}
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to print receipt');
    }
  };

  const createPaymentMutation = useMutation({
    mutationFn: billingApi.createPayment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      syncPatientData(queryClient, variables.patientId);
      setIsCreateOpen(false);
      setPaymentForm({
        patientId: '',
        invoiceId: '',
        amount: '',
        method: 'CASH' as PaymentMethodType,
        reference: '',
        notes: '',
        paymentDate: '',
      });
      toast.success('Payment created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create payment');
    },
  });

  const submitPayment = () => {
    if (!paymentForm.patientId || !paymentForm.amount) {
      toast.error('Patient and amount are required');
      return;
    }
    createPaymentMutation.mutate({
      patientId: paymentForm.patientId,
      invoiceId: paymentForm.invoiceId || undefined,
      amount: Number(paymentForm.amount),
      method: paymentForm.method,
      reference: paymentForm.reference || undefined,
      notes: paymentForm.notes || undefined,
      paymentDate: paymentForm.paymentDate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">View and manage payments</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select
                  value={paymentForm.patientId}
                  onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, patientId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {(patientsData?.patients || []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.user?.firstName} {p.user?.lastName} ({p.user?.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice (optional)</Label>
                <Input
                  placeholder="Invoice ID"
                  value={paymentForm.invoiceId}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, invoiceId: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={paymentForm.method}
                    onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, method: value as PaymentMethodType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(PaymentMethod).map((m) => (
                        <SelectItem key={m} value={m}>
                          {methodLabels[m as PaymentMethodType]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={submitPayment} disabled={createPaymentMutation.isPending}>
                  {createPaymentMutation.isPending ? 'Saving...' : 'Create Payment'}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search payments..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Patient</Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="All patients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All patients</SelectItem>
              {(patientsData?.patients || []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.user?.firstName} {p.user?.lastName} ({p.user?.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No payments found
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {payment.patient?.user?.firstName}{' '}
                    {payment.patient?.user?.lastName}
                  </TableCell>
                  <TableCell className="font-medium text-green-600">
                    ${Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {methodLabels[payment.method]}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.reference || 'N/A'}</TableCell>
                  <TableCell>
                    {format(new Date(payment.paymentDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {payment.invoice?.invoiceNumber || 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePrintReceipt(payment.id)}
                      title="Print receipt"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
