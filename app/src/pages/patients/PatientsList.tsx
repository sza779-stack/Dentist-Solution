import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Edit, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { patientsApi } from '@/api/patients';
import { usersApi } from '@/api/users';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Gender, type GenderType, type Patient } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const patientSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  assignedDoctorId: z.preprocess(
    (val) => (val === '' || val === 'UNASSIGNED' ? undefined : val),
    z.string().uuid().optional()
  ),
});

type PatientForm = z.infer<typeof patientSchema>;

export default function PatientsList() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () =>
      patientsApi.getAll({
        search: search || undefined,
        limit: 50,
      }),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'doctors'],
    queryFn: () => usersApi.getStaffMembers(),
    enabled: isAdmin,
  });

  const doctorOptions = (staffData?.staff || []).filter((staff) =>
    ['DOCTOR', 'DENTIST', 'SPECIALIST'].includes(staff.user?.role)
  );

  const createMutation = useMutation({
    mutationFn: patientsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setIsCreateOpen(false);
      toast.success('Patient created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create patient');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientForm }) =>
      patientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setEditingPatient(null);
      toast.success('Patient updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update patient');
    },
  });

  const createForm = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      gender: Gender.PREFER_NOT_TO_SAY,
      assignedDoctorId: 'UNASSIGNED' as any,
    },
  });

  const editForm = useForm<PatientForm>({
    resolver: zodResolver(patientSchema.partial({ email: true })),
  });

  const openEdit = (patient: Patient) => {
    setEditingPatient(patient);
    editForm.reset({
      email: patient.user?.email || '',
      firstName: patient.user?.firstName || '',
      lastName: patient.user?.lastName || '',
      phone: patient.user?.phone || '',
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
      gender: (patient.gender as GenderType) || Gender.PREFER_NOT_TO_SAY,
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zipCode: patient.zipCode || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      assignedDoctorId: patient.assignedDoctorId || 'UNASSIGNED',
    });
  };

  const onCreateSubmit = (formData: PatientForm) => {
    const payload = {
      ...formData,
      assignedDoctorId: formData.assignedDoctorId || undefined,
    };
    createMutation.mutate(payload);
  };

  const onEditSubmit = (formData: PatientForm) => {
    if (!editingPatient) return;
    updateMutation.mutate({
      id: editingPatient.id,
      data: {
        ...formData,
        assignedDoctorId: formData.assignedDoctorId || undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500">Manage patient records and information</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input {...createForm.register('firstName')} />
                  {createForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input {...createForm.register('lastName')} />
                  {createForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...createForm.register('email')} />
                  {createForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {createForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...createForm.register('phone')} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...createForm.register('dateOfBirth')} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={createForm.watch('gender')}
                    onValueChange={(value) =>
                      createForm.setValue('gender', value as GenderType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(Gender).map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Assigned Doctor</Label>
                  <Select
                    value={createForm.watch('assignedDoctorId') || 'UNASSIGNED'}
                    onValueChange={(value) =>
                      createForm.setValue('assignedDoctorId', value as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                      {doctorOptions.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.user?.firstName} {doc.user?.lastName} ({doc.user?.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input {...createForm.register('address')} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...createForm.register('city')} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input {...createForm.register('state')} />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input {...createForm.register('zipCode')} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input {...createForm.register('emergencyContact')} />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input {...createForm.register('emergencyPhone')} />
                </div>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Create Patient'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search patients..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Appointments</TableHead>
              <TableHead>Invoices</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No patients found
                </TableCell>
              </TableRow>
            ) : (
              data?.patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    {patient.user?.firstName} {patient.user?.lastName}
                  </TableCell>
                  <TableCell>{patient.user?.email}</TableCell>
                  <TableCell>{patient.user?.phone || 'N/A'}</TableCell>
                  <TableCell>{patient._count?.appointments || 0}</TableCell>
                  <TableCell>{patient._count?.invoices || 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/patients/${patient.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/patients/${patient.id}/teeth`}>
                          <Stethoscope className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(patient)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingPatient} onOpenChange={(open) => !open && setEditingPatient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input {...editForm.register('firstName')} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input {...editForm.register('lastName')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editForm.watch('email') || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...editForm.register('phone')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" {...editForm.register('dateOfBirth')} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={editForm.watch('gender')}
                  onValueChange={(value) =>
                    editForm.setValue('gender', value as GenderType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Gender).map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isAdmin && (
              <div className="space-y-2">
                <Label>Assigned Doctor</Label>
                <Select
                  value={editForm.watch('assignedDoctorId') || 'UNASSIGNED'}
                  onValueChange={(value) =>
                    editForm.setValue('assignedDoctorId', value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
                    {doctorOptions.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.user?.firstName} {doc.user?.lastName} ({doc.user?.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input {...editForm.register('address')} />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input {...editForm.register('city')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>State</Label>
                <Input {...editForm.register('state')} />
              </div>
              <div className="space-y-2">
                <Label>ZIP Code</Label>
                <Input {...editForm.register('zipCode')} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Emergency Contact</Label>
                <Input {...editForm.register('emergencyContact')} />
              </div>
              <div className="space-y-2">
                <Label>Emergency Phone</Label>
                <Input {...editForm.register('emergencyPhone')} />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
