import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { billingApi } from '@/api/billing';
import { treatmentsApi } from '@/api/treatments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pill, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { syncPatientData } from '@/lib/patient-sync';
import type { Prescription, PrescriptionStatusType } from '@/types';

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: '',
    taxAmount: '',
    discountAmount: '',
    notes: '',
  });
  const [items, setItems] = useState<
    { description: string; quantity: number; unitPrice: number; treatmentId?: string }[]
  >([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: '',
    refills: '0',
    instructions: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE' as PrescriptionStatusType,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.getById(id!),
    enabled: !!id,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['patientAppointments', id],
    queryFn: () => patientsApi.getAppointments(id!, { limit: 5 }),
    enabled: !!id,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['patientInvoices', id],
    queryFn: () => patientsApi.getInvoices(id!, { limit: 5 }),
    enabled: !!id,
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ['treatments', 'patientInvoice'],
    queryFn: () => treatmentsApi.getAll({ isActive: true }),
  });

  const { data: prescriptionsData } = useQuery({
    queryKey: ['patientPrescriptions', id],
    queryFn: () => patientsApi.getPrescriptions(id!),
    enabled: !!id,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: billingApi.createInvoice,
    onSuccess: () => {
      syncPatientData(queryClient, id);
      setIsInvoiceOpen(false);
      setInvoiceForm({ dueDate: '', taxAmount: '', discountAmount: '', notes: '' });
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      toast.success('Invoice created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const resetPrescriptionForm = () => {
    setEditingPrescription(null);
    setPrescriptionForm({
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      refills: '0',
      instructions: '',
      startDate: '',
      endDate: '',
      status: 'ACTIVE',
    });
  };

  const syncPrescriptionQueries = () => {
    syncPatientData(queryClient, id);
  };

  const createPrescriptionMutation = useMutation({
    mutationFn: (data: Parameters<typeof patientsApi.createPrescription>[1]) =>
      patientsApi.createPrescription(id!, data),
    onSuccess: () => {
      syncPrescriptionQueries();
      setIsPrescriptionOpen(false);
      resetPrescriptionForm();
      toast.success('Prescription created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create prescription');
    },
  });

  const updatePrescriptionMutation = useMutation({
    mutationFn: ({ prescriptionId, data }: { prescriptionId: string; data: Parameters<typeof patientsApi.updatePrescription>[2] }) =>
      patientsApi.updatePrescription(id!, prescriptionId, data),
    onSuccess: () => {
      syncPrescriptionQueries();
      setIsPrescriptionOpen(false);
      resetPrescriptionForm();
      toast.success('Prescription updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update prescription');
    },
  });

  const deletePrescriptionMutation = useMutation({
    mutationFn: (prescriptionId: string) => patientsApi.deletePrescription(id!, prescriptionId),
    onSuccess: () => {
      syncPrescriptionQueries();
      toast.success('Prescription deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete prescription');
    },
  });

  const submitInvoice = () => {
    if (!id || !invoiceForm.dueDate) {
      toast.error('Due date is required');
      return;
    }
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one invoice item');
      return;
    }
    createInvoiceMutation.mutate({
      patientId: id,
      dueDate: invoiceForm.dueDate,
      items: validItems,
      taxAmount: invoiceForm.taxAmount ? Number(invoiceForm.taxAmount) : undefined,
      discountAmount: invoiceForm.discountAmount ? Number(invoiceForm.discountAmount) : undefined,
      notes: invoiceForm.notes || undefined,
    });
  };

  const openPrescriptionEditor = (prescription?: Prescription) => {
    if (prescription) {
      setEditingPrescription(prescription);
      setPrescriptionForm({
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        frequency: prescription.frequency,
        duration: prescription.duration || '',
        quantity: prescription.quantity ? String(prescription.quantity) : '',
        refills: String(prescription.refills ?? 0),
        instructions: prescription.instructions || '',
        startDate: prescription.startDate ? prescription.startDate.slice(0, 10) : '',
        endDate: prescription.endDate ? prescription.endDate.slice(0, 10) : '',
        status: prescription.status,
      });
    } else {
      resetPrescriptionForm();
    }
    setIsPrescriptionOpen(true);
  };

  const submitPrescription = () => {
    if (!id || !prescriptionForm.medicationName || !prescriptionForm.dosage || !prescriptionForm.frequency) {
      toast.error('Medication name, dosage, and frequency are required');
      return;
    }

    const payload = {
      medicationName: prescriptionForm.medicationName,
      dosage: prescriptionForm.dosage,
      frequency: prescriptionForm.frequency,
      duration: prescriptionForm.duration || undefined,
      quantity: prescriptionForm.quantity ? Number(prescriptionForm.quantity) : undefined,
      refills: prescriptionForm.refills ? Number(prescriptionForm.refills) : 0,
      instructions: prescriptionForm.instructions || undefined,
      startDate: prescriptionForm.startDate || undefined,
      endDate: prescriptionForm.endDate || undefined,
      status: prescriptionForm.status,
    };

    if (editingPrescription) {
      updatePrescriptionMutation.mutate({ prescriptionId: editingPrescription.id, data: payload });
      return;
    }

    createPrescriptionMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const patient = data?.patient;

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found</p>
        <Button asChild className="mt-4">
          <Link to="/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button asChild>
          <Link to={`/patients/${patient.id}/teeth`}>Tooth Chart</Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {patient.user?.firstName} {patient.user?.lastName}
        </h1>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{patient.user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{patient.user?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {patient.dateOfBirth
                    ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">{patient.gender || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">
                {patient.address
                  ? `${patient.address}, ${patient.city}, ${patient.state} ${patient.zipCode}`
                  : 'No address on file'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{patient.emergencyContact || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{patient.emergencyPhone || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Insurance</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="font-medium">{patient.insuranceProvider || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Policy Number</p>
                <p className="font-medium">
                  {patient.insurancePolicyNumber || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {appointmentsData?.appointments.length === 0 ? (
                <p className="text-gray-500">No appointments found</p>
              ) : (
                <div className="space-y-4">
                  {appointmentsData?.appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">{apt.type}</p>
                        <p className="text-sm text-gray-500">{apt.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {format(new Date(apt.appointmentDate), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">{apt.startTime}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-primary" />
                  Prescriptions
                </CardTitle>
                <Dialog
                  open={isPrescriptionOpen}
                  onOpenChange={(open) => {
                    setIsPrescriptionOpen(open);
                    if (!open) resetPrescriptionForm();
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => openPrescriptionEditor()}>
                      <Plus className="mr-2 h-4 w-4" />
                      New Prescription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingPrescription ? 'Edit Prescription' : 'Create Prescription'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Medication Name</Label>
                        <Input value={prescriptionForm.medicationName} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, medicationName: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Dosage</Label>
                        <Input value={prescriptionForm.dosage} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, dosage: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Input value={prescriptionForm.frequency} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, frequency: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Input value={prescriptionForm.duration} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, duration: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input type="number" min="1" value={prescriptionForm.quantity} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, quantity: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Refills</Label>
                        <Input type="number" min="0" value={prescriptionForm.refills} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, refills: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={prescriptionForm.startDate} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, startDate: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={prescriptionForm.endDate} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, endDate: e.target.value }))} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Status</Label>
                        <Select value={prescriptionForm.status} onValueChange={(value) => setPrescriptionForm((prev) => ({ ...prev, status: value as PrescriptionStatusType }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Instructions</Label>
                        <Textarea value={prescriptionForm.instructions} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, instructions: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={submitPrescription} disabled={createPrescriptionMutation.isPending || updatePrescriptionMutation.isPending}>
                        {editingPrescription ? 'Save Prescription' : 'Create Prescription'}
                      </Button>
                      <Button variant="outline" onClick={() => setIsPrescriptionOpen(false)}>Cancel</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {(prescriptionsData?.prescriptions || []).length === 0 ? (
                <p className="text-gray-500">No prescriptions found</p>
              ) : (
                <div className="space-y-4">
                  {prescriptionsData?.prescriptions.map((prescription) => (
                    <div key={prescription.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-medium">{prescription.medicationName}</p>
                          <p className="text-sm text-gray-500">
                            {prescription.dosage} • {prescription.frequency}
                            {prescription.duration ? ` • ${prescription.duration}` : ''}
                          </p>
                          {prescription.instructions && (
                            <p className="mt-1 text-sm text-gray-500">{prescription.instructions}</p>
                          )}
                          {prescription.prescribedBy?.user && (
                            <p className="mt-1 text-xs text-gray-500">
                              Prescribed by {prescription.prescribedBy.user.firstName} {prescription.prescribedBy.user.lastName}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {prescription.status}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => openPrescriptionEditor(prescription)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePrescriptionMutation.mutate(prescription.id)}
                            disabled={deletePrescriptionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Invoices</CardTitle>
                <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
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
                      <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesData?.invoices.length === 0 ? (
                <p className="text-gray-500">No invoices found</p>
              ) : (
                <div className="space-y-4">
                  {invoicesData?.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <div>
                        <p className="font-medium">#{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-500">{invoice.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${Number(invoice.totalAmount).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
