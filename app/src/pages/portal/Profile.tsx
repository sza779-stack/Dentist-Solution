import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { authApi } from '@/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInYears, format } from 'date-fns';
import { Gender } from '@/types';
import { toast } from 'sonner';

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContact: string;
  emergencyPhone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceGroupNumber: string;
  allergies: string;
  medications: string;
};

const emptyProfile: ProfileForm = {
  firstName: '',
  lastName: '',
  phone: '',
  avatarUrl: '',
  dateOfBirth: '',
  gender: 'UNSPECIFIED',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  emergencyContact: '',
  emergencyPhone: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceGroupNumber: '',
  allergies: '',
  medications: '',
};

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const patient = data?.patient;

  useEffect(() => {
    if (!patient) return;
    setProfile({
      firstName: patient.user?.firstName || '',
      lastName: patient.user?.lastName || '',
      phone: patient.user?.phone || '',
      avatarUrl: patient.user?.avatarUrl || '',
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
      gender: patient.gender || 'UNSPECIFIED',
      address: patient.address || '',
      city: patient.city || '',
      state: patient.state || '',
      zipCode: patient.zipCode || '',
      emergencyContact: patient.emergencyContact || '',
      emergencyPhone: patient.emergencyPhone || '',
      insuranceProvider: patient.insuranceProvider || '',
      insurancePolicyNumber: patient.insurancePolicyNumber || '',
      insuranceGroupNumber: patient.insuranceGroupNumber || '',
      allergies: patient.allergies || '',
      medications: patient.medications || '',
    });
  }, [patient]);

  const age = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    return differenceInYears(new Date(), new Date(patient.dateOfBirth));
  }, [patient?.dateOfBirth]);

  const updateProfileMutation = useMutation({
    mutationFn: patientsApi.updatePortalProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientPortal'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: patientsApi.uploadAvatar,
    onSuccess: (data) => {
      setProfile((prev) => ({ ...prev, avatarUrl: data.avatarUrl || prev.avatarUrl }));
      queryClient.invalidateQueries({ queryKey: ['patientPortal'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Avatar uploaded');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update password');
    },
  });

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      avatarUrl: profile.avatarUrl || undefined,
      dateOfBirth: profile.dateOfBirth || undefined,
      gender: profile.gender === 'UNSPECIFIED' ? undefined : (profile.gender as any),
      address: profile.address || undefined,
      city: profile.city || undefined,
      state: profile.state || undefined,
      zipCode: profile.zipCode || undefined,
      emergencyContact: profile.emergencyContact || undefined,
      emergencyPhone: profile.emergencyPhone || undefined,
      insuranceProvider: profile.insuranceProvider || undefined,
      insurancePolicyNumber: profile.insurancePolicyNumber || undefined,
      insuranceGroupNumber: profile.insuranceGroupNumber || undefined,
      allergies: profile.allergies || undefined,
      medications: profile.medications || undefined,
    });
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleAvatarUpload = () => {
    if (!avatarFile) {
      toast.error('Please select an image');
      return;
    }
    uploadAvatarMutation.mutate(avatarFile);
  };

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
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-600">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <Badge className="mt-2">{user?.role}</Badge>
              </div>
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <p>Member since: {user?.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}</p>
              <p>Age: {age ?? '-'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={profile.gender}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNSPECIFIED">Prefer not to say</SelectItem>
                      {Object.values(Gender).map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profile Picture URL</Label>
                <Input
                  value={profile.avatarUrl}
                  onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>Upload New Picture</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  />
                  <Button type="button" onClick={handleAvatarUpload} disabled={uploadAvatarMutation.isPending}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadAvatarMutation.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={profile.city}
                    onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={profile.state}
                    onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zip Code</Label>
                  <Input
                    value={profile.zipCode}
                    onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Emergency Contact</Label>
                  <Input
                    value={profile.emergencyContact}
                    onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input
                    value={profile.emergencyPhone}
                    onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Insurance Provider</Label>
                  <Input
                    value={profile.insuranceProvider}
                    onChange={(e) => setProfile({ ...profile, insuranceProvider: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={profile.insurancePolicyNumber}
                    onChange={(e) =>
                      setProfile({ ...profile, insurancePolicyNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Group Number</Label>
                  <Input
                    value={profile.insuranceGroupNumber}
                    onChange={(e) =>
                      setProfile({ ...profile, insuranceGroupNumber: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Allergies</Label>
                  <Input
                    value={profile.allergies}
                    onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medications</Label>
                <Input
                  value={profile.medications}
                  onChange={(e) => setProfile({ ...profile, medications: e.target.value })}
                />
              </div>

              <Button type="submit" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
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
          <form onSubmit={handlePasswordSubmit} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-sm text-gray-500">
            Forgot your password?{' '}
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              Reset it here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
