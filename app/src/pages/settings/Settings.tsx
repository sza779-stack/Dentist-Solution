import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { settingsApi } from '@/api/settings';
import { cn } from '@/lib/utils';

type DiagnosisCatalogItem = {
  code: string;
  description: string;
};

type ClinicHourRow = {
  day: string;
  isClosed: boolean;
  open: string;
  close: string;
};

const defaultClinicHours: ClinicHourRow[] = [
  { day: 'Monday', isClosed: false, open: '09:00', close: '18:00' },
  { day: 'Tuesday', isClosed: false, open: '09:00', close: '18:00' },
  { day: 'Wednesday', isClosed: false, open: '09:00', close: '18:00' },
  { day: 'Thursday', isClosed: false, open: '09:00', close: '18:00' },
  { day: 'Friday', isClosed: false, open: '09:00', close: '18:00' },
  { day: 'Saturday', isClosed: false, open: '09:00', close: '14:00' },
  { day: 'Sunday', isClosed: true, open: '09:00', close: '14:00' },
];

export default function Settings() {
  const queryClient = useQueryClient();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [newDiagnosisCode, setNewDiagnosisCode] = useState('');
  const [newDiagnosisDescription, setNewDiagnosisDescription] = useState('');
  const [clinicHours, setClinicHours] = useState<ClinicHourRow[]>(defaultClinicHours);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('store_closed');
  const [targetRole, setTargetRole] = useState('ALL');
  const [landingMainImage, setLandingMainImage] = useState('');
  const [landingMainImageFile, setLandingMainImageFile] = useState<File | null>(null);
  const [landingWelcomeText, setLandingWelcomeText] = useState('');
  const [landingTitle, setLandingTitle] = useState('');
  const [landingSubtitle, setLandingSubtitle] = useState('');
  const [landingPrimaryButton, setLandingPrimaryButton] = useState('');
  const [landingSecondaryButton, setLandingSecondaryButton] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      key,
      value,
      category,
      description,
    }: {
      key: string;
      value: string;
      category?: string;
      description?: string;
    }) => settingsApi.upsert(key, { value, category, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings saved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save setting');
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: settingsApi.createBroadcastNotification,
    onSuccess: (res) => {
      toast.success(`Notification sent to ${res.recipients} users`);
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationType('store_closed');
      setTargetRole('ALL');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    },
  });

  const saveLandingMutation = useMutation({
    mutationFn: settingsApi.bulkUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicLanding'] });
      toast.success('Landing page content saved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save landing content');
    },
  });

  const uploadLandingImageMutation = useMutation({
    mutationFn: settingsApi.uploadLandingImage,
    onSuccess: (res) => {
      setLandingMainImage(res.imageUrl);
      setLandingMainImageFile(null);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['publicLanding'] });
      toast.success('Main image uploaded');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload main image');
    },
  });

  const handleSave = (key: string) => {
    if (editedSettings[key] !== undefined) {
      updateMutation.mutate({ key, value: editedSettings[key] });
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const settings = data?.settings || [];
  const clinicHoursSetting = settings.find((s) => s.key === 'clinic_hours');
  const parsedClinicHours = useMemo(() => {
    if (!clinicHoursSetting?.value) return defaultClinicHours;
    try {
      const parsed = JSON.parse(clinicHoursSetting.value);
      if (!Array.isArray(parsed)) return defaultClinicHours;
      return parsed.map((row) => ({
        day: String(row.day),
        isClosed: Boolean(row.isClosed),
        open: String(row.open || '09:00'),
        close: String(row.close || '18:00'),
      })) as ClinicHourRow[];
    } catch {
      return defaultClinicHours;
    }
  }, [clinicHoursSetting?.value]);

  useEffect(() => {
    setClinicHours(parsedClinicHours);
  }, [parsedClinicHours]);

  useEffect(() => {
    const getValue = (key: string, fallback: string) =>
      settings.find((s) => s.key === key)?.value || fallback;

    setLandingMainImage(getValue('landing_main_image', 'https://images.unsplash.com/photo-1588776814546-ec7e3f2391af?auto=format&fit=crop&w=1600&q=80'));
    setLandingWelcomeText(getValue('landing_welcome_text', 'WELCOME TO OUR CLINIC'));
    setLandingTitle(getValue('landing_title', 'Best Healthcare Solution In Your City'));
    setLandingSubtitle(getValue('landing_subtitle', 'Comprehensive dental care for you and your family with experienced professionals.'));
    setLandingPrimaryButton(getValue('landing_primary_button', 'Find Doctor'));
    setLandingSecondaryButton(getValue('landing_secondary_button', 'Appointment'));
  }, [settings]);
  const diagnosisCatalogSetting = settings.find((s) => s.key === 'diagnosis_catalog');
  let diagnosisCatalog: DiagnosisCatalogItem[] = [];
  try {
    diagnosisCatalog = diagnosisCatalogSetting?.value
      ? JSON.parse(diagnosisCatalogSetting.value)
      : [];
  } catch {
    diagnosisCatalog = [];
  }

  const saveDiagnosisCatalog = (nextCatalog: DiagnosisCatalogItem[]) => {
    updateMutation.mutate({
      key: 'diagnosis_catalog',
      value: JSON.stringify(nextCatalog),
      category: 'clinical',
      description: 'Diagnosis code catalog used in tooth chart',
    });
  };

  const addDiagnosisCatalogItem = () => {
    const code = newDiagnosisCode.trim().toUpperCase();
    const description = newDiagnosisDescription.trim();
    if (!code || !description) {
      toast.error('Diagnosis code and description are required');
      return;
    }
    if (diagnosisCatalog.some((d) => d.code === code)) {
      toast.error('Diagnosis code already exists');
      return;
    }
    saveDiagnosisCatalog([...diagnosisCatalog, { code, description }]);
    setNewDiagnosisCode('');
    setNewDiagnosisDescription('');
  };

  const removeDiagnosisCatalogItem = (code: string) => {
    saveDiagnosisCatalog(diagnosisCatalog.filter((d) => d.code !== code));
  };

  const saveClinicHours = () => {
    updateMutation.mutate({
      key: 'clinic_hours',
      value: JSON.stringify(clinicHours),
      category: 'operations',
      description: 'Clinic working hours by day',
    });
  };

  const sendBroadcastNotification = () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Title and message are required');
      return;
    }
    broadcastMutation.mutate({
      title: notificationTitle.trim(),
      message: notificationMessage.trim(),
      type: notificationType,
      targetRole: targetRole === 'ALL' ? undefined : (targetRole as any),
    });
  };

  const saveLandingSettings = () => {
    saveLandingMutation.mutate([
      {
        key: 'landing_main_image',
        value: landingMainImage.trim(),
        category: 'website',
        description: 'Landing page main hero image URL',
      },
      {
        key: 'landing_welcome_text',
        value: landingWelcomeText.trim(),
        category: 'website',
        description: 'Landing page welcome text',
      },
      {
        key: 'landing_title',
        value: landingTitle.trim(),
        category: 'website',
        description: 'Landing page hero title',
      },
      {
        key: 'landing_subtitle',
        value: landingSubtitle.trim(),
        category: 'website',
        description: 'Landing page hero subtitle',
      },
      {
        key: 'landing_primary_button',
        value: landingPrimaryButton.trim(),
        category: 'website',
        description: 'Landing page primary button label',
      },
      {
        key: 'landing_secondary_button',
        value: landingSecondaryButton.trim(),
        category: 'website',
        description: 'Landing page secondary button label',
      },
    ]);
  };

  const grouped = settings.reduce((acc: any, setting: any) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/60 p-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Configure clinic operations, alerts, billing and clinical defaults from one place.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 md:grid-cols-7">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
        </TabsList>

        {Object.entries(grouped)
          .filter(([category]) => !['clinical', 'operations', 'website'].includes(category))
          .map(([category, categorySettings]: [string, any]) => (
          <TabsContent key={category} value={category}>
            <Card className="rounded-2xl border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="capitalize text-slate-900">{category} Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categorySettings.map((setting: any) => (
                  <div key={setting.key} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold capitalize text-slate-800">
                        {setting.key.replace(/_/g, ' ')}
                        </Label>
                        <Input
                          className="h-10 border-slate-300 focus-visible:ring-emerald-500"
                          value={
                            editedSettings[setting.key] !== undefined
                              ? editedSettings[setting.key]
                              : setting.value
                          }
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={() => handleSave(setting.key)}
                        disabled={updateMutation.isPending}
                        className="h-10 md:min-w-24"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="website">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900">Landing Page</CardTitle>
              <p className="text-sm text-slate-600">
                Configure the public home page main image and hero content.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Main Image Upload</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="h-10 border-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:text-emerald-700 hover:file:bg-emerald-100"
                  onChange={(e) => setLandingMainImageFile(e.target.files?.[0] || null)}
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!landingMainImageFile || uploadLandingImageMutation.isPending}
                    onClick={() => {
                      if (landingMainImageFile) uploadLandingImageMutation.mutate(landingMainImageFile);
                    }}
                  >
                    {uploadLandingImageMutation.isPending ? 'Uploading...' : 'Upload Main Image'}
                  </Button>
                  {landingMainImage && (
                    <a
                      href={landingMainImage}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-emerald-700 underline underline-offset-4"
                    >
                      Preview current image
                    </a>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Main Image URL (auto-managed)</Label>
                <Input
                  className="h-10 border-slate-300 focus-visible:ring-emerald-500"
                  placeholder="Uploaded image URL"
                  value={landingMainImage}
                  readOnly
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Welcome Text</Label>
                  <Input value={landingWelcomeText} onChange={(e) => setLandingWelcomeText(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Hero Title</Label>
                  <Input value={landingTitle} onChange={(e) => setLandingTitle(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800">Subtitle</Label>
                <Textarea value={landingSubtitle} onChange={(e) => setLandingSubtitle(e.target.value)} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Primary Button</Label>
                  <Input value={landingPrimaryButton} onChange={(e) => setLandingPrimaryButton(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Secondary Button</Label>
                  <Input value={landingSecondaryButton} onChange={(e) => setLandingSecondaryButton(e.target.value)} />
                </div>
              </div>
              <Button
                onClick={saveLandingSettings}
                disabled={saveLandingMutation.isPending}
                className="h-10 min-w-44 bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveLandingMutation.isPending ? 'Saving...' : 'Save Landing Content'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations">
          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900">Clinic Hours</CardTitle>
                <p className="text-sm text-slate-600">
                  Define weekly opening schedule used by staff and front desk.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {clinicHours.map((row, index) => (
                  <div
                    key={row.day}
                    className={cn(
                      'grid gap-3 rounded-xl border p-4 md:grid-cols-[180px_130px_1fr_1fr] md:items-center',
                      row.isClosed ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-white'
                    )}
                  >
                    <div className="font-medium text-slate-800">{row.day}</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={row.isClosed}
                        onCheckedChange={(checked) =>
                          setClinicHours((prev) =>
                            prev.map((x, i) => (i === index ? { ...x, isClosed: checked } : x))
                          )
                        }
                      />
                      <span className={cn('text-sm', row.isClosed ? 'text-rose-700' : 'text-slate-600')}>
                        Closed
                      </span>
                    </div>
                    <Input
                      type="time"
                      value={row.open}
                      disabled={row.isClosed}
                      className="h-10 border-slate-300 disabled:opacity-60"
                      onChange={(e) =>
                        setClinicHours((prev) =>
                          prev.map((x, i) => (i === index ? { ...x, open: e.target.value } : x))
                        )
                      }
                    />
                    <Input
                      type="time"
                      value={row.close}
                      disabled={row.isClosed}
                      className="h-10 border-slate-300 disabled:opacity-60"
                      onChange={(e) =>
                        setClinicHours((prev) =>
                          prev.map((x, i) => (i === index ? { ...x, close: e.target.value } : x))
                        )
                      }
                    />
                  </div>
                ))}
                <Button
                  onClick={saveClinicHours}
                  disabled={updateMutation.isPending}
                  className="h-10 min-w-44 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Clinic Hours
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-900">Create Broadcast Notification</CardTitle>
                <p className="text-sm text-slate-600">
                  Use for closure alerts, emergencies, and operational announcements.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Title</Label>
                  <Input
                    className="h-10 border-slate-300 focus-visible:ring-emerald-500"
                    placeholder="Clinic closed notice"
                    value={notificationTitle}
                    onChange={(e) => setNotificationTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Message</Label>
                  <Textarea
                    className="min-h-24 border-slate-300 focus-visible:ring-emerald-500"
                    placeholder="Clinic will be closed today due to..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">Type</Label>
                    <Select value={notificationType} onValueChange={setNotificationType}>
                      <SelectTrigger className="h-10 border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="store_closed">Store Closed</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-800">Audience</Label>
                    <Select value={targetRole} onValueChange={setTargetRole}>
                      <SelectTrigger className="h-10 border-slate-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Users</SelectItem>
                        <SelectItem value="PATIENT">Patients</SelectItem>
                        <SelectItem value="DOCTOR">Doctors</SelectItem>
                        <SelectItem value="DENTIST">Dentists</SelectItem>
                        <SelectItem value="SPECIALIST">Specialists</SelectItem>
                        <SelectItem value="RECEPTIONIST">Receptionists</SelectItem>
                        <SelectItem value="NURSE">Nurses</SelectItem>
                        <SelectItem value="DENTIST_ASSISTANT">Assistants</SelectItem>
                        <SelectItem value="ADMIN">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={sendBroadcastNotification}
                  disabled={broadcastMutation.isPending}
                  className="h-10 min-w-44 bg-slate-900 hover:bg-slate-800"
                >
                  {broadcastMutation.isPending ? 'Sending...' : 'Send Notification'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clinical">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-900">Diagnosis Catalog (Codes + Description)</CardTitle>
              <p className="text-sm text-slate-600">
                This catalog powers the diagnosis dropdown and auto-description in Tooth Chart.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Diagnosis Code</Label>
                  <Input
                    className="h-10 border-slate-300 focus-visible:ring-emerald-500"
                    placeholder="e.g. K02.9"
                    value={newDiagnosisCode}
                    onChange={(e) => setNewDiagnosisCode(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-800">Description</Label>
                  <Input
                    className="h-10 border-slate-300 focus-visible:ring-emerald-500"
                    placeholder="e.g. Dental caries, unspecified"
                    value={newDiagnosisDescription}
                    onChange={(e) => setNewDiagnosisDescription(e.target.value)}
                  />
                </div>
              </div>
              <Button
                onClick={addDiagnosisCatalogItem}
                disabled={updateMutation.isPending}
                className="h-10 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Diagnosis
              </Button>

              <div className="space-y-2">
                {diagnosisCatalog.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No diagnosis codes configured.
                  </div>
                )}
                {diagnosisCatalog.map((item) => (
                  <div key={item.code} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                    <div className="space-y-1">
                      <p className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {item.code}
                      </p>
                      <p className="text-sm text-slate-700">{item.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDiagnosisCatalogItem(item.code)}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
