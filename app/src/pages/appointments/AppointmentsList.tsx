import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Calendar, Eye, CheckCircle, XCircle, Stethoscope, Plus } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { appointmentsApi } from '@/api/appointments';
import { patientsApi } from '@/api/patients';
import { usersApi } from '@/api/users';
import type { AppointmentStatusType, AppointmentTypeType } from '@/types';
import { AppointmentStatus, AppointmentType } from '@/types';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const statusColors: Record<AppointmentStatusType, string> = {
  [AppointmentStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
  [AppointmentStatus.CONFIRMED]: 'bg-green-100 text-green-800',
  [AppointmentStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
  [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [AppointmentStatus.NO_SHOW]: 'bg-yellow-100 text-yellow-800',
  [AppointmentStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
};

export default function AppointmentsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusType | 'ALL'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    type: AppointmentType.CHECKUP as AppointmentTypeType,
    reason: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  // Handle query params for opening create dialog from calendar
  useEffect(() => {
    const shouldCreate = searchParams.get('create') === 'true';
    const dateParam = searchParams.get('date');
    
    if (shouldCreate) {
      setIsCreateOpen(true);
      if (dateParam) {
        setFormData(prev => ({ ...prev, appointmentDate: dateParam }));
      }
      // Clean up URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', search, statusFilter],
    queryFn: () =>
      appointmentsApi.getAll({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 50,
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatusType }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment status updated');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment cancelled');
    },
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', 'appointmentsForm'],
    queryFn: () => patientsApi.getAll({ limit: 100 }),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff', 'appointmentsForm'],
    queryFn: () => usersApi.getStaffMembers(),
  });

  const doctorOptions = (staffData?.staff || []).filter((staff) =>
    ['DOCTOR', 'DENTIST', 'SPECIALIST'].includes(staff.user?.role)
  );

  const createMutation = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setIsCreateOpen(false);
      setFormData({
        patientId: '',
        doctorId: '',
        appointmentDate: '',
        startTime: '',
        endTime: '',
        type: AppointmentType.CHECKUP as AppointmentTypeType,
        reason: '',
        notes: '',
      });
      toast.success('Appointment created');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create appointment');
    },
  });

  const submitNewAppointment = () => {
    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || !formData.startTime || !formData.endTime) {
      toast.error('Please fill required fields');
      return;
    }
    createMutation.mutate({
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      appointmentDate: formData.appointmentDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      type: formData.type,
      reason: formData.reason || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500">Manage patient appointments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Appointment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select
                    value={formData.patientId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, patientId: value }))}
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
                  <Label>Doctor</Label>
                  <Select
                    value={formData.doctorId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, doctorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorOptions.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.user?.firstName} {doc.user?.lastName} ({doc.user?.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as AppointmentTypeType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AppointmentType).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={submitNewAppointment} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Create Appointment'}
                </Button>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline">
            <Link to="/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar View
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search appointments..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as AppointmentStatusType | 'ALL')
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(AppointmentStatus).map((status) => (
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
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
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
            ) : data?.appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No appointments found
                </TableCell>
              </TableRow>
            ) : (
              data?.appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                  </TableCell>
                  <TableCell>
                    Dr. {apt.doctor?.user?.lastName}
                  </TableCell>
                  <TableCell>{apt.type}</TableCell>
                  <TableCell>
                    {format(new Date(apt.appointmentDate), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {apt.startTime} - {apt.endTime}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[apt.status]}>
                      {apt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {apt.status === AppointmentStatus.SCHEDULED && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: apt.id,
                              status: AppointmentStatus.CONFIRMED,
                            })
                          }
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      {(apt.status === AppointmentStatus.SCHEDULED ||
                        apt.status === AppointmentStatus.CONFIRMED) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => cancelMutation.mutate(apt.id)}
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/appointments/${apt.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/appointments/${apt.id}/teeth`}>
                          <Stethoscope className="h-4 w-4" />
                        </Link>
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
