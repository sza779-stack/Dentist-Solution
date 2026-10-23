import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.getById(id!),
    enabled: !!id,
  });

  const staffForm = useForm<{
    avatarUrl?: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    biography?: string;
    yearsExperience?: string;
  }>({
    defaultValues: {
      avatarUrl: '',
      specialization: '',
      department: '',
      licenseNumber: '',
      biography: '',
      yearsExperience: '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (payload: any) => usersApi.update(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      toast.success('Staff profile updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update staff profile');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const user = data?.user;

  useEffect(() => {
    if (!user) return;
    const staff = user.staffProfile;
    const existingYears =
      typeof staff?.workingHours === 'object' &&
      staff?.workingHours &&
      'yearsExperience' in staff.workingHours
        ? String((staff.workingHours as any).yearsExperience || '')
        : '';

    staffForm.reset({
      avatarUrl: user.avatarUrl || staff?.avatarUrl || '',
      specialization: staff?.specialization || '',
      department: staff?.department || '',
      licenseNumber: staff?.licenseNumber || '',
      biography: staff?.biography || '',
      yearsExperience: existingYears,
    });
  }, [user, staffForm]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">User not found</p>
        <Button asChild className="mt-4">
          <Link to="/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>
    );
  }

  const onSaveStaffProfile = staffForm.handleSubmit((values) => {
    updateProfileMutation.mutate({
      avatarUrl: values.avatarUrl || undefined,
      staffProfile: {
        specialization: values.specialization || undefined,
        department: values.department || undefined,
        licenseNumber: values.licenseNumber || undefined,
        biography: values.biography || undefined,
        workingHours: {
          ...(user.staffProfile?.workingHours || {}),
          yearsExperience: values.yearsExperience ? Number(values.yearsExperience) : undefined,
        },
      },
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <Badge>{user.role}</Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={user.isActive ? 'default' : 'secondary'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium">
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {user.staffProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Staff Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Employee ID</p>
                <p className="font-medium">{user.staffProfile.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Hire Date</p>
                <p className="font-medium">
                  {new Date(user.staffProfile.hireDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium">
                  {user.staffProfile.department || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="font-medium">
                  {user.staffProfile.specialization || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">License Number</p>
                <p className="font-medium">
                  {user.staffProfile.licenseNumber || 'N/A'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="mt-6 rounded-xl border p-4">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Edit Doctor/Staff Public Profile</h3>
                <form onSubmit={onSaveStaffProfile} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Profile Image URL</Label>
                      <Input placeholder="https://..." {...staffForm.register('avatarUrl')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Specialization</Label>
                      <Input placeholder="Cardiologist" {...staffForm.register('specialization')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input placeholder="Cardiology Dept." {...staffForm.register('department')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Years Experience</Label>
                      <Input type="number" min="0" {...staffForm.register('yearsExperience')} />
                    </div>
                    <div className="space-y-2">
                      <Label>License Number</Label>
                      <Input {...staffForm.register('licenseNumber')} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Biography</Label>
                    <Input placeholder="Short profile description..." {...staffForm.register('biography')} />
                  </div>
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Staff Profile'}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {user.patientProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">
                  {user.patientProfile.dateOfBirth
                    ? new Date(user.patientProfile.dateOfBirth).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium">
                  {user.patientProfile.gender || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {user.patientProfile.address
                    ? `${user.patientProfile.address}, ${user.patientProfile.city}, ${user.patientProfile.state} ${user.patientProfile.zipCode}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Insurance</p>
                <p className="font-medium">
                  {user.patientProfile.insuranceProvider || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
