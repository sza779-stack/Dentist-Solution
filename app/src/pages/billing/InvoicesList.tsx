import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Download, CheckCircle, BadgePercent, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { billingApi } from '@/api/billing';
import { patientsApi } from '@/api/patients';
import { treatmentsApi } from '@/api/treatments';
import { PaymentStatus } from '@/types';
import type { PaymentStatusType } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { syncPatientData } from '@/lib/patient-sync';

const statusColors: Record<PaymentStatusType, string> = {
  [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
  [PaymentStatus.PARTIAL]: 'bg-blue-100 text-blue-800',
  [PaymentStatus.OVERDUE]: 'bg-red-100 text-red-800',
  [PaymentStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
  [PaymentStatus.REFUNDED]: 'bg-purple-100 text-purple-800',
};

export default function InvoicesList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatusType | 'ALL'>('ALL');
  const [discountInvoiceId, setDiscountInvoiceId] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    dueDate: '',
    taxAmount: '',
    discountAmount: '',
    notes: '',
  });
  const [items, setItems] = useState<
    { description: string; quantity: number; unitPrice: number; treatmentId?: string }[]
  >([{ description: '', quantity: 1, unitPrice: 0 }]);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', search, statusFilter],
    queryFn: () =>
      billingApi.getAllInvoices({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 50,
      }),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'invoiceForm'],
    queryFn: () => patientsApi.getAll({ limit: 100 }),
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ['treatments', 'invoiceForm'],
    queryFn: () => treatmentsApi.getAll({ isActive: true }),
  });

  const markPaidMutation = useMutation({
    mutationFn: async (invoice: any) => {
      const balance = Number(invoice.balanceDue);
      if (balance <= 0) {
        throw new Error('Invoice is already paid');
      }
      return billingApi.createPayment({
        invoiceId: invoice.id,
        patientId: invoice.patientId,
        amount: balance,
        method: 'CASH',
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      syncPatientData(queryClient, variables.patientId);
      toast.success('Invoice marked as paid');
    },
    onError: (error: any) => {
      toast.error(error.message || error.response?.data?.message || 'Failed to mark as paid');
    },
  });

  const discountMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      billingApi.applyInvoiceDiscount(id, amount),
    onSuccess: ({ invoice }) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      syncPatientData(queryClient, invoice.patientId);
      toast.success('Discount applied');
      setDiscountInvoiceId(null);
      setDiscountValue('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to apply discount');
    },
  });

  const handlePrint = async (invoiceId: string) => {
    try {
      const { invoice } = await billingApi.getInvoiceById(invoiceId);
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) return;
      win.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; }
              h1 { margin-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .totals { margin-top: 16px; text-align: right; }
            </style>
          </head>
          <body>
            <h1>Invoice #${invoice.invoiceNumber}</h1>
            <p>Patient: ${invoice.patient?.user?.firstName || ''} ${invoice.patient?.user?.lastName || ''}</p>
            <p>Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${(invoice.items || [])
                  .map(
                    (item) => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>$${Number(item.unitPrice).toFixed(2)}</td>
                    <td>$${Number(item.totalPrice).toFixed(2)}</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
            <div class="totals">
              <p>Subtotal: $${Number(invoice.subtotal).toFixed(2)}</p>
              <p>Tax: $${Number(invoice.taxAmount).toFixed(2)}</p>
              <p>Discount: $${Number(invoice.discountAmount).toFixed(2)}</p>
              <h3>Total: $${Number(invoice.totalAmount).toFixed(2)}</h3>
              <p>Paid: $${Number(invoice.paidAmount).toFixed(2)}</p>
              <p>Balance Due: $${Number(invoice.balanceDue).toFixed(2)}</p>
            </div>
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      win.print();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to print invoice');
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      await billingApi.downloadInvoice(invoiceId);
      toast.success('Invoice download ready');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download invoice');
    }
  };

  const createInvoiceMutation = useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      syncPatientData(queryClient, variables.patientId);
      setIsCreateOpen(false);
      setInvoiceForm({
        patientId: '',
        dueDate: '',
        taxAmount: '',
        discountAmount: '',
        notes: '',
      });
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      toast.success('Invoice created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const submitInvoice = () => {
    if (!invoiceForm.patientId || !invoiceForm.dueDate) {
      toast.error('Please select patient and due date');
      return;
    }
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0 && i.unitPrice >= 0);
    if (validItems.length === 0) {
      toast.error('Add at least one invoice item');
      return;
    }
    createInvoiceMutation.mutate({
      patientId: invoiceForm.patientId,
      dueDate: invoiceForm.dueDate,
      items: validItems,
      taxAmount: invoiceForm.taxAmount ? Number(invoiceForm.taxAmount) : undefined,
      discountAmount: invoiceForm.discountAmount ? Number(invoiceForm.discountAmount) : undefined,
      notes: invoiceForm.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500">Manage patient invoices</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Invoice</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select
                  value={invoiceForm.patientId}
                  onValueChange={(value) => setInvoiceForm((prev) => ({ ...prev, patientId: value }))}
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
              <Button onClick={submitInvoice} disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending ? 'Saving...' : 'Create Invoice'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search invoices..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as PaymentStatusType | 'ALL')
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(PaymentStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              data?.invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    {invoice.patient?.user?.firstName}{' '}
                    {invoice.patient?.user?.lastName}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>${Number(invoice.totalAmount).toFixed(2)}</TableCell>
                  <TableCell>${Number(invoice.balanceDue).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status]}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markPaidMutation.mutate(invoice)}
                        title="Mark as paid"
                        disabled={invoice.status === PaymentStatus.PAID}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Dialog
                        open={discountInvoiceId === invoice.id}
                        onOpenChange={(open) =>
                          setDiscountInvoiceId(open ? invoice.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Apply discount">
                            <BadgePercent className="h-4 w-4 text-blue-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Apply Discount</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3">
                            <Label>Discount Amount</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                            />
                            <Button
                              onClick={() =>
                                discountMutation.mutate({
                                  id: invoice.id,
                                  amount: Number(discountValue || 0),
                                })
                              }
                              disabled={discountMutation.isPending}
                            >
                              {discountMutation.isPending ? 'Applying...' : 'Apply'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePrint(invoice.id)}
                        title="Print invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(invoice.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
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
