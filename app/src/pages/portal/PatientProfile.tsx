import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { differenceInYears } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { authApi } from '@/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { GenderType } from '@/types';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),
  insuranceGroupNumber: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  notes: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function PatientProfile() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const patient = data?.patient;
  const user = patient?.user;

  const [photoUrl, setPhotoUrl] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!patient || !user) return;
    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.slice(0, 10) : '',
      gender: patient.gender as GenderType | undefined,
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zipCode: patient.zipCode || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      insuranceProvider: patient.insuranceProvider || '',
      insurancePolicyNumber: patient.insurancePolicyNumber || '',
      insuranceGroupNumber: patient.insuranceGroupNumber || '',
      medicalHistory: patient.medicalHistory || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
      notes: patient.notes || '',
    });

    const storedPhoto = localStorage.getItem(`patient_avatar_${user.id}`);
    if (storedPhoto) {
      setPhotoUrl(storedPhoto);
    }
  }, [patient, user, reset]);

  const age = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(patient.dateOfBirth));
  }, [patient?.dateOfBirth]);

  const genderValue = watch('gender');

  const initials = useMemo(() => {
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  }, [user?.firstName, user?.lastName]);

  const onSubmit = async (form: ProfileForm) => {
    try {
      await patientsApi.updatePortalProfile(form);
      if (user?.id) {
        localStorage.setItem(`patient_avatar_${user.id}`, photoUrl || '');
      }
      await queryClient.invalidateQueries({ queryKey: ['patientPortal'] });
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get('currentPassword') || '');
    const newPassword = String(form.get('newPassword') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');

    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Password updated');
      e.currentTarget.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to="/portal">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500">Manage your personal information</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <p className="font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                {age !== null && (
                  <p className="text-sm text-gray-500">Age: {age}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Profile photo URL</Label>
              <Input
                placeholder="https://..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Optional. Stored locally in your browser.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register('phone')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register('dateOfBirth')} />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={genderValue}
                    onValueChange={(value) => setValue('gender', value as GenderType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                      <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input {...register('address')} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input {...register('city')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input {...register('state')} />
                </div>
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input {...register('zipCode')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input {...register('emergencyContact')} />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input {...register('emergencyPhone')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Insurance Provider</Label>
                  <Input {...register('insuranceProvider')} />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input {...register('insurancePolicyNumber')} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Group Number</Label>
                  <Input {...register('insuranceGroupNumber')} />
                </div>
                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <Input {...register('allergies')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medications</Label>
                <Input {...register('medications')} />
              </div>

              <div className="space-y-2">
                <Label>Medical History</Label>
                <Textarea rows={3} {...register('medicalHistory')} />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea rows={3} {...register('notes')} />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" name="currentPassword" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" name="newPassword" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" name="confirmPassword" />
            </div>
            <div className="md:col-span-3 flex items-center justify-between">
              <Button type="submit">Update Password</Button>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
