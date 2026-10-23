import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { appointmentsApi } from '@/api/appointments';
import { toothTreatmentsApi } from '@/api/toothTreatments';
import { treatmentsApi } from '@/api/treatments';
import {
  ToothNotation,
  ToothTreatmentStatus,
  type ToothNotationType,
  type ToothTreatmentStatusType,
  type ToothTreatment,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Paperclip, Info, X, ZoomIn, Download, ChevronLeft, ChevronRight, ImageIcon, FileText, CheckCircle2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { syncPatientData } from '@/lib/patient-sync';

// Dental tooth definitions
interface ToothDef {
  universal: string;
  fdi: string;
  name: string;
  type: 'incisor' | 'canine' | 'premolar' | 'molar';
  width: number;
  height: number;
}

// Upper teeth with realistic proportions
const upperTeeth: ToothDef[] = [
  { universal: '1', fdi: '18', name: 'Upper Right 3rd Molar', type: 'molar', width: 28, height: 26 },
  { universal: '2', fdi: '17', name: 'Upper Right 2nd Molar', type: 'molar', width: 28, height: 26 },
  { universal: '3', fdi: '16', name: 'Upper Right 1st Molar', type: 'molar', width: 28, height: 26 },
  { universal: '4', fdi: '15', name: 'Upper Right 2nd Premolar', type: 'premolar', width: 22, height: 24 },
  { universal: '5', fdi: '14', name: 'Upper Right 1st Premolar', type: 'premolar', width: 22, height: 24 },
  { universal: '6', fdi: '13', name: 'Upper Right Canine', type: 'canine', width: 18, height: 28 },
  { universal: '7', fdi: '12', name: 'Upper Right Lateral Incisor', type: 'incisor', width: 16, height: 24 },
  { universal: '8', fdi: '11', name: 'Upper Right Central Incisor', type: 'incisor', width: 18, height: 26 },
  { universal: '9', fdi: '21', name: 'Upper Left Central Incisor', type: 'incisor', width: 18, height: 26 },
  { universal: '10', fdi: '22', name: 'Upper Left Lateral Incisor', type: 'incisor', width: 16, height: 24 },
  { universal: '11', fdi: '23', name: 'Upper Left Canine', type: 'canine', width: 18, height: 28 },
  { universal: '12', fdi: '24', name: 'Upper Left 1st Premolar', type: 'premolar', width: 22, height: 24 },
  { universal: '13', fdi: '25', name: 'Upper Left 2nd Premolar', type: 'premolar', width: 22, height: 24 },
  { universal: '14', fdi: '26', name: 'Upper Left 1st Molar', type: 'molar', width: 28, height: 26 },
  { universal: '15', fdi: '27', name: 'Upper Left 2nd Molar', type: 'molar', width: 28, height: 26 },
  { universal: '16', fdi: '28', name: 'Upper Left 3rd Molar', type: 'molar', width: 28, height: 26 },
];

// Lower teeth with realistic proportions
const lowerTeeth: ToothDef[] = [
  { universal: '17', fdi: '48', name: 'Lower Right 3rd Molar', type: 'molar', width: 26, height: 24 },
  { universal: '18', fdi: '47', name: 'Lower Right 2nd Molar', type: 'molar', width: 26, height: 24 },
  { universal: '19', fdi: '46', name: 'Lower Right 1st Molar', type: 'molar', width: 26, height: 24 },
  { universal: '20', fdi: '45', name: 'Lower Right 2nd Premolar', type: 'premolar', width: 20, height: 22 },
  { universal: '21', fdi: '44', name: 'Lower Right 1st Premolar', type: 'premolar', width: 20, height: 22 },
  { universal: '22', fdi: '43', name: 'Lower Right Canine', type: 'canine', width: 16, height: 24 },
  { universal: '23', fdi: '42', name: 'Lower Right Lateral Incisor', type: 'incisor', width: 14, height: 20 },
  { universal: '24', fdi: '41', name: 'Lower Right Central Incisor', type: 'incisor', width: 16, height: 22 },
  { universal: '25', fdi: '31', name: 'Lower Left Central Incisor', type: 'incisor', width: 16, height: 22 },
  { universal: '26', fdi: '32', name: 'Lower Left Lateral Incisor', type: 'incisor', width: 14, height: 20 },
  { universal: '27', fdi: '33', name: 'Lower Left Canine', type: 'canine', width: 16, height: 24 },
  { universal: '28', fdi: '34', name: 'Lower Left 1st Premolar', type: 'premolar', width: 20, height: 22 },
  { universal: '29', fdi: '35', name: 'Lower Left 2nd Premolar', type: 'premolar', width: 20, height: 22 },
  { universal: '30', fdi: '36', name: 'Lower Left 1st Molar', type: 'molar', width: 26, height: 24 },
  { universal: '31', fdi: '37', name: 'Lower Left 2nd Molar', type: 'molar', width: 26, height: 24 },
  { universal: '32', fdi: '38', name: 'Lower Left 3rd Molar', type: 'molar', width: 26, height: 24 },
];

const surfaceOptions = ['M', 'D', 'O', 'B', 'L'];
type DiagnosisCatalogItem = { code: string; description: string };

// Get status color
const getStatusColor = (status: ToothTreatmentStatusType): string => {
  switch (status) {
    case 'COMPLETED': return '#10B981';
    case 'IN_PROGRESS': return '#3B82F6';
    case 'PLANNED': return '#F59E0B';
    case 'CANCELLED': return '#EF4444';
    default: return '#94A3B8';
  }
};

export default function ToothChart() {
  const { patientId, appointmentId } = useParams<{ patientId?: string; appointmentId?: string }>();
  const queryClient = useQueryClient();
  const [selectedTooth, setSelectedTooth] = useState<ToothDef | null>(null);
  const [hoveredTooth, setHoveredTooth] = useState<ToothDef | null>(null);
  const [notation, setNotation] = useState<ToothNotationType>(ToothNotation.UNIVERSAL);
  const [surfaces, setSurfaces] = useState<string[]>([]);
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<ToothTreatmentStatusType>(ToothTreatmentStatus.PLANNED);
  const [cost, setCost] = useState('');
  const [editing, setEditing] = useState<ToothTreatment | null>(null);
  const [newTreatmentFiles, setNewTreatmentFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);

  const [treatmentDetailOpen, setTreatmentDetailOpen] = useState(false);
  const [selectedTreatmentDetail, setSelectedTreatmentDetail] = useState<ToothTreatment | null>(null);
  const [selectedXrayId, setSelectedXrayId] = useState<string | null>(null);
  
  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) => toothTreatmentsApi.deleteAttachment(attachmentId),
    onSuccess: () => {
      toast.success('Attachment deleted');
      // Refresh treatments to get updated attachments
      queryClient.invalidateQueries({ queryKey: ['toothTreatments', resolvedPatientId, appointmentId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete attachment');
    },
  });
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<Array<{url: string; name: string}>>([]);

  const { data: appointmentData } = useQuery({
    queryKey: ['appointment', appointmentId],
    queryFn: () => appointmentsApi.getById(appointmentId!),
    enabled: !!appointmentId,
  });

  const resolvedPatientId = patientId || appointmentData?.appointment?.patientId;

  const { data: patientData } = useQuery({
    queryKey: ['patient', resolvedPatientId],
    queryFn: () => patientsApi.getById(resolvedPatientId!),
    enabled: !!resolvedPatientId,
  });

  const { data: treatmentsData } = useQuery({
    queryKey: ['toothTreatments', resolvedPatientId, appointmentId],
    queryFn: () =>
      toothTreatmentsApi.getAll({
        patientId: resolvedPatientId,
        appointmentId: appointmentId || undefined,
      }),
    enabled: !!resolvedPatientId,
  });

  const treatments = treatmentsData?.treatments || [];

  const { data: diagnosisCatalogData } = useQuery({
    queryKey: ['diagnosisCatalog'],
    queryFn: () => treatmentsApi.getDiagnosisCatalog(),
  });

  const diagnosisCatalog: DiagnosisCatalogItem[] = useMemo(() => {
    return diagnosisCatalogData?.diagnoses || [];
  }, [diagnosisCatalogData]);

  const treatmentsByTooth = useMemo(() => {
    const map: Record<string, ToothTreatment[]> = {};
    treatments.forEach((t) => {
      const key = t.toothNumber;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [treatments]);

  const createMutation = useMutation({
    mutationFn: async ({
      payload,
      files,
    }: {
      payload: Parameters<typeof toothTreatmentsApi.create>[0];
      files: File[];
    }) => {
      const { treatment } = await toothTreatmentsApi.create(payload);
      if (files.length > 0) {
        for (const file of files) {
          await toothTreatmentsApi.uploadAttachment(treatment.id, file);
        }
      }
      return treatment;
    },
    onSuccess: () => {
      // Invalidate tooth treatments
      queryClient.invalidateQueries({ queryKey: ['toothTreatments', resolvedPatientId, appointmentId] });
      syncPatientData(queryClient, resolvedPatientId);
      toast.success('Treatment added');
      setNewTreatmentFiles([]);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add treatment');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, files }: { id: string; data: any; files: File[] }) => {
      const { treatment } = await toothTreatmentsApi.update(id, data);
      // Upload new files if any
      if (files.length > 0) {
        for (const file of files) {
          await toothTreatmentsApi.uploadAttachment(treatment.id, file);
        }
      }
      return treatment;
    },
    onSuccess: () => {
      // Invalidate tooth treatments
      queryClient.invalidateQueries({ queryKey: ['toothTreatments', resolvedPatientId, appointmentId] });
      syncPatientData(queryClient, resolvedPatientId);
      toast.success('Treatment updated');
      setNewTreatmentFiles([]);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update treatment');
    },
  });



  const resetForm = () => {
    setSelectedTooth(null);
    setNotation(ToothNotation.UNIVERSAL);
    setSurfaces([]);
    setDiagnosisCode('');
    setDiagnosis('');
    setTreatmentType('');
    setNotes('');
    setStatus(ToothTreatmentStatus.PLANNED);
    setCost('');
    // Clean up object URLs
    filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    setNewTreatmentFiles([]);
    setFilePreviewUrls([]);
    setEditing(null);
  };

  const submit = () => {
    if (!resolvedPatientId) {
      toast.error('Patient not found');
      return;
    }
    if (!selectedTooth) {
      toast.error('Select a tooth');
      return;
    }
    if (!treatmentType.trim()) {
      toast.error('Treatment type is required');
      return;
    }
    const toothNumber = notation === ToothNotation.UNIVERSAL ? selectedTooth.universal : selectedTooth.fdi;

    const payload = {
      patientId: resolvedPatientId,
      appointmentId: appointmentId || undefined,
      toothNumber,
      notation,
      surfaces,
      diagnosis: diagnosisCode ? `${diagnosisCode} - ${diagnosis}` : diagnosis || undefined,
      treatmentType,
      notes: notes || undefined,
      status,
      cost: cost ? Number(cost) : undefined,
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload, files: newTreatmentFiles });
    } else {
      createMutation.mutate({ payload, files: newTreatmentFiles });
    }
  };

  const openEdit = (t: ToothTreatment) => {
    setEditing(t);
    setNotation(t.notation);
    const tooth = [...upperTeeth, ...lowerTeeth].find((x) =>
      t.notation === ToothNotation.UNIVERSAL ? x.universal === t.toothNumber : x.fdi === t.toothNumber
    );
    setSelectedTooth(tooth || null);
    setSurfaces(t.surfaces || []);
    const diagnosisValue = t.diagnosis || '';
    const matched = diagnosisCatalog.find((item) =>
      diagnosisValue.startsWith(`${item.code} - `)
    );
    if (matched) {
      setDiagnosisCode(matched.code);
      setDiagnosis(diagnosisValue.replace(`${matched.code} - `, '').trim());
    } else {
      setDiagnosisCode('');
      setDiagnosis(diagnosisValue);
    }
    setTreatmentType(t.treatmentType || '');
    setNotes(t.notes || '');
    setStatus(t.status);
    setCost(t.cost ? String(t.cost) : '');
  };

  const patientName = useMemo(() => {
    const p = patientData?.patient;
    return p ? `${p.user?.firstName || ''} ${p.user?.lastName || ''}`.trim() : '';
  }, [patientData]);

  // Calculate tooth position on dental arch - roof of mouth view
  const getToothPosition = (arch: 'upper' | 'lower', index: number, _tooth: ToothDef) => {
    const centerX = 400;
    // Move upper and lower sets further apart by another 10% (total ~20%)
    const centerY = arch === 'upper' ? 105 : 295;
    
    // Position from center: -7.5 to +7.5 (16 teeth total)
    const posFromCenter = index - 7.5;
    const normalizedPos = posFromCenter / 7.5; // -1 to 1
    
    // Distance from center (absolute value 0 to 1)
    const distFromCenter = Math.abs(normalizedPos);
    
    // EXPANDED arch: molars spread outward more
    const spreadFactor = Math.sin(distFromCenter * Math.PI * 0.5);
    
    // Base width at center (incisors) - INCREASED spacing
    // Wider range: teeth 6-11 (indices 5-10) get extra spacing
    const isFrontTooth = index >= 5 && index <= 10;
    // EXTRA spacing for very center teeth 8,9 and 24,25 (indices 7,8)
    const isVeryCenterTooth = index === 7 || index === 8;
    const extraCenterSpacing = isVeryCenterTooth ? 65 : (isFrontTooth ? 35 : 0); // 65px for center (was 60), 35px for front
    const centerWidth = 50 + extraCenterSpacing;
    
    // Maximum spread at edges (molars)
    const edgeSpread = 200;
    
    // X position: expand outward significantly at edges
    const x = centerX + normalizedPos * (centerWidth + edgeSpread * spreadFactor);
    
    // Y position: catenary curve with ~20% more separation
    const archDepth = arch === 'upper' ? 73 : -73; // ~20% more than 60
    const y = centerY + (distFromCenter * distFromCenter) * archDepth;
    
    // Rotation: teeth rotation
    const rotation = normalizedPos * 15 * (arch === 'upper' ? -1 : 1);
    
    return { x, y, rotation };
  };

  // Render a single tooth SVG
  const renderTooth = (tooth: ToothDef, arch: 'upper' | 'lower', index: number) => {
    const pos = getToothPosition(arch, index, tooth);
    const isSelected = selectedTooth?.universal === tooth.universal;
    const isHovered = hoveredTooth?.universal === tooth.universal;
    
    const toothNumber = notation === ToothNotation.UNIVERSAL ? tooth.universal : tooth.fdi;
    const toothTreatments = treatmentsByTooth[toothNumber] || [];
    const hasTreatments = toothTreatments.length > 0;
    const latestTreatment = toothTreatments[toothTreatments.length - 1];
    
    const strokeColor = isSelected ? '#3B82F6' : hasTreatments ? getStatusColor(latestTreatment.status) : '#94A3B8';
    const strokeWidth = isSelected ? 2.5 : hasTreatments ? 2 : 1;

    return (
      <g
        key={`${arch}-${tooth.universal}`}
        onMouseEnter={() => setHoveredTooth(tooth)}
        onMouseLeave={() => setHoveredTooth(null)}
        style={{ cursor: 'pointer' }}
      >
        {/* Soft shadow */}
        <ellipse
          cx={pos.x + 1}
          cy={pos.y + tooth.height/2 + 3}
          rx={tooth.width/2 - 2}
          ry={4}
          fill="rgba(0,0,0,0.08)"
        />
        
        {/* Tooth group with rotation - flip lower teeth upside down */}
        <g transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.rotation}) scale(1, ${arch === 'lower' ? -1 : 1})`}>
          {/* Main tooth body */}
          <rect
            x={-tooth.width/2}
            y={-tooth.height/2}
            width={tooth.width}
            height={tooth.height}
            rx={tooth.width/4}
            ry={tooth.width/4}
            fill={isSelected ? '#EFF6FF' : isHovered ? '#F8FAFC' : '#FFFFFF'}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            style={{ transition: 'all 0.15s ease' }}
          />
          
          {/* Shine highlight */}
          <ellipse
            cx={-tooth.width/6}
            cy={-tooth.height/4}
            rx={tooth.width/6}
            ry={tooth.height/8}
            fill="white"
            opacity={0.7}
          />
          
          {/* Root line */}
          <line 
            x1={0} 
            y1={tooth.height/2 - 3} 
            x2={0} 
            y2={tooth.height/2 + 3} 
            stroke={strokeColor} 
            strokeWidth={1} 
            opacity={0.4}
          />
        </g>

        {/* Treatment indicator dot */}
        {hasTreatments && (
          <circle
            cx={pos.x + tooth.width/3}
            cy={pos.y - tooth.height/3}
            r={4}
            fill={getStatusColor(latestTreatment.status)}
            stroke="white"
            strokeWidth={1.5}
          />
        )}

        {/* Tooth number label */}
        <text
          x={pos.x}
          y={pos.y + (arch === 'upper' ? -tooth.height/2 - 8 : tooth.height/2 + 16)}
          textAnchor="middle"
          fontSize="10"
          fontWeight={isSelected ? "600" : "400"}
          fill={isSelected ? "#3B82F6" : "#64748B"}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {toothNumber}
        </text>

        {/* Hit area */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={Math.max(tooth.width, tooth.height)/2 + 4}
          fill="transparent"
          onClick={() => setSelectedTooth(tooth)}
          style={{ cursor: 'pointer' }}
        />

        {/* Hover tooltip */}
        {isHovered && (
          <g>
            <rect
              x={Math.min(Math.max(pos.x - 70, 10), 660)}
              y={arch === 'upper' ? pos.y - 55 : pos.y + 35}
              width="140"
              height="42"
              rx="6"
              fill="rgba(15, 23, 42, 0.95)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            <text
              x={Math.min(Math.max(pos.x, 80), 730)}
              y={arch === 'upper' ? pos.y - 42 : pos.y + 48}
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="white"
            >
              {tooth.name}
            </text>
            <text
              x={Math.min(Math.max(pos.x, 80), 730)}
              y={arch === 'upper' ? pos.y - 31 : pos.y + 59}
              textAnchor="middle"
              fontSize="9"
              fill="#94A3B8"
            >
              U:{tooth.universal} | FDI:{tooth.fdi}
            </text>
            <text
              x={Math.min(Math.max(pos.x, 80), 730)}
              y={arch === 'upper' ? pos.y - 20 : pos.y + 70}
              textAnchor="middle"
              fontSize="8"
              fill={hasTreatments ? getStatusColor(latestTreatment.status) : '#64748B'}
            >
              {hasTreatments ? `Status: ${latestTreatment.status}` : 'No treatments'}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to={appointmentId ? `/appointments/${appointmentId}` : `/patients/${resolvedPatientId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dental Chart</h1>
          <p className="text-muted-foreground">
            {patientName ? `Patient: ${patientName}` : 'Select a patient'}
          </p>
        </div>
      </div>

      {/* Dental Chart */}
      <Card className="overflow-hidden border-2 shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Odontogram</CardTitle>
              <CardDescription>Select a tooth to view or add treatments</CardDescription>
            </div>
            <Tabs value={notation} onValueChange={(v) => setNotation(v as ToothNotationType)}>
              <TabsList className="bg-background">
                <TabsTrigger value={ToothNotation.UNIVERSAL}>Universal</TabsTrigger>
                <TabsTrigger value={ToothNotation.FDI}>FDI</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-muted/50 rounded-lg p-3">
            <span className="text-muted-foreground font-medium">Status:</span>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Planned</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Cancelled</span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden">
            <svg
              viewBox="0 0 800 400"
              className="w-full h-auto"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Dental chart"
            >
              <defs>
                <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FAFAFA" />
                  <stop offset="100%" stopColor="#F1F5F9" />
                </radialGradient>
                <linearGradient id="gumLine" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FDA4AF" />
                  <stop offset="50%" stopColor="#FB7185" />
                  <stop offset="100%" stopColor="#F43F5E" />
                </linearGradient>
              </defs>

              {/* Background */}
              <rect x="0" y="0" width="800" height="400" fill="url(#bgGradient)" />

              {/* Subtle arch guides */}
              <path
                d="M 180,90 Q 400,10 620,90"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="8,4"
              />
              <path
                d="M 180,310 Q 400,390 620,310"
                fill="none"
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="8,4"
              />

              {/* Gum area highlights */}
              <ellipse cx="400" cy="85" rx="220" ry="15" fill="#FCE7F3" opacity="0.5" />
              <ellipse cx="400" cy="315" rx="220" ry="15" fill="#FCE7F3" opacity="0.5" />

              {/* Quadrant dividers */}
              <line x1="400" y1="60" x2="400" y2="340" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
              <line x1="160" y1="200" x2="640" y2="200" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />

              {/* Quadrant labels */}
              <text x="280" y="95" fontSize="10" fill="#94A3B8" fontWeight="500" textAnchor="middle">Upper Right (1)</text>
              <text x="520" y="95" fontSize="10" fill="#94A3B8" fontWeight="500" textAnchor="middle">Upper Left (2)</text>
              <text x="280" y="315" fontSize="10" fill="#94A3B8" fontWeight="500" textAnchor="middle">Lower Right (4)</text>
              <text x="520" y="315" fontSize="10" fill="#94A3B8" fontWeight="500" textAnchor="middle">Lower Left (3)</text>

              {/* Upper teeth */}
              {upperTeeth.map((tooth, index) => renderTooth(tooth, 'upper', index))}

              {/* Lower teeth */}
              {lowerTeeth.map((tooth, index) => renderTooth(tooth, 'lower', index))}
            </svg>

            {/* Selected tooth panel */}
            {selectedTooth && (
              <div className="absolute bottom-3 left-3 right-3 md:left-auto md:right-3 md:w-64 bg-white/95 backdrop-blur rounded-lg border shadow-lg p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{selectedTooth.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      U:{selectedTooth.universal} | FDI:{selectedTooth.fdi}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 -mt-1 -mr-1"
                    onClick={() => setSelectedTooth(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {(treatmentsByTooth[notation === ToothNotation.UNIVERSAL ? selectedTooth.universal : selectedTooth.fdi] || []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {treatmentsByTooth[notation === ToothNotation.UNIVERSAL ? selectedTooth.universal : selectedTooth.fdi]?.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs">
                        <span className="truncate">{t.treatmentType}</span>
                        <Badge variant="outline" className="text-[10px] ml-1 px-1">
                          {t.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  className="w-full mt-2 h-8 text-xs"
                  onClick={() => {
                    document.getElementById('treatment-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Add Treatment
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            <Info className="inline h-3 w-3 mr-1" />
            Hover over teeth to see details. Click to select for treatment.
          </p>
        </CardContent>
      </Card>

      {/* Treatment Form */}
      <Card id="treatment-form">
        <CardHeader>
          <CardTitle>{editing ? 'Edit Treatment' : 'Add Treatment'}</CardTitle>
          <CardDescription>
            {selectedTooth ? `${selectedTooth.name} (U:${selectedTooth.universal} / FDI:${selectedTooth.fdi})` : 'Select a tooth first'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Tooth Number</Label>
              <Input
                value={selectedTooth ? (notation === ToothNotation.UNIVERSAL ? selectedTooth.universal : selectedTooth.fdi) : '-'}
                readOnly
                className={cn(!selectedTooth && "text-muted-foreground")}
              />
            </div>
            <div className="space-y-2">
              <Label>Tooth Name</Label>
              <Input value={selectedTooth?.name || '-'} readOnly className="text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input 
                value={selectedTooth?.type ? selectedTooth.type.charAt(0).toUpperCase() + selectedTooth.type.slice(1) : '-'} 
                readOnly 
                className="text-muted-foreground capitalize" 
              />
            </div>
            <div className="space-y-2">
              <Label>Notation</Label>
              <Select value={notation} onValueChange={(v) => setNotation(v as ToothNotationType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ToothNotation.UNIVERSAL}>Universal</SelectItem>
                  <SelectItem value={ToothNotation.FDI}>FDI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Diagnosis Code</Label>
              <Select value={diagnosisCode || 'NONE'} onValueChange={(value) => {
                if (value === 'NONE') {
                  setDiagnosisCode('');
                  return;
                }
                setDiagnosisCode(value);
                const selected = diagnosisCatalog.find((item) => item.code === value);
                if (selected) setDiagnosis(selected.description);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No code</SelectItem>
                  {diagnosisCatalog.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Description" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Treatment Type</Label>
              <Input value={treatmentType} onChange={(e) => setTreatmentType(e.target.value)} placeholder="e.g., Filling" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ToothTreatmentStatusType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ToothTreatmentStatus).map((s) => (
                    <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cost ($)</Label>
              <Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Surfaces</Label>
            <div className="flex flex-wrap gap-2">
              {surfaceOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSurfaces((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={cn(
                    "h-10 w-10 rounded-lg border-2 font-semibold text-sm transition-all",
                    surfaces.includes(s) 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {s}
                </button>
              ))}
              <span className="text-xs text-muted-foreground ml-2 self-center">
                M=Mesial, D=Distal, O=Occlusal, B=Buccal, L=Lingual
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            
            {/* Drag & Drop Upload Zone */}
            <div 
              className={cn(
                "relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer",
                "hover:border-primary hover:bg-primary/5",
                "flex flex-col items-center justify-center gap-3",
                newTreatmentFiles.length > 0 ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              )}
              onClick={() => document.getElementById('treatment-file-input')?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  // Clean up old URLs
                  filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
                  // Create new URLs
                  const newUrls = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
                  setNewTreatmentFiles(files);
                  setFilePreviewUrls(newUrls);
                }
              }}
            >
              <input
                id="treatment-file-input"
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  // Clean up old URLs
                  filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
                  // Create new URLs for images
                  const newUrls = files.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : '');
                  setNewTreatmentFiles(files);
                  setFilePreviewUrls(newUrls);
                }}
              />
              
              {newTreatmentFiles.length === 0 ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images or PDFs (max 10MB each)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {newTreatmentFiles.length} file{newTreatmentFiles.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to change files
                    </p>
                  </div>
                  
                  {/* Preview thumbnails */}
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {newTreatmentFiles.slice(0, 4).map((file, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted">
                        {file.type.startsWith('image/') && filePreviewUrls[idx] ? (
                          <img 
                            src={filePreviewUrls[idx]} 
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {idx === 3 && newTreatmentFiles.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">+{newTreatmentFiles.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      filePreviewUrls.forEach(url => url && URL.revokeObjectURL(url));
                      setNewTreatmentFiles([]);
                      setFilePreviewUrls([]);
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                </>
              )}
            </div>
            
            {/* Selected Files Gallery Preview */}
            {newTreatmentFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  New files to upload ({newTreatmentFiles.length}) - Click image to preview:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {newTreatmentFiles.map((file, idx) => (
                    <div 
                      key={idx} 
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer group hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => {
                        // Build lightbox images from stored URLs
                        const images = newTreatmentFiles
                          .filter((f, i) => f.type.startsWith('image/') && filePreviewUrls[i])
                          .map((f, i) => ({ url: filePreviewUrls[i], name: f.name }));
                        if (file.type.startsWith('image/') && filePreviewUrls[idx]) {
                          const imageIndex = images.findIndex((img) => img.name === file.name);
                          setLightboxImages(images);
                          setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
                          setLightboxOpen(true);
                        }
                      }}
                    >
                      {file.type.startsWith('image/') && filePreviewUrls[idx] ? (
                        <img 
                          src={filePreviewUrls[idx]} 
                          alt={file.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-center text-muted-foreground truncate w-full">
                            {file.name}
                          </span>
                        </div>
                      )}
                      
                      {/* Hover overlay for images */}
                      {file.type.startsWith('image/') && filePreviewUrls[idx] && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      
                      {/* Remove button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clean up URL being removed
                          if (filePreviewUrls[idx]) URL.revokeObjectURL(filePreviewUrls[idx]);
                          setNewTreatmentFiles((prev) => prev.filter((_, i) => i !== idx));
                          setFilePreviewUrls((prev) => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Existing Attachments (Edit Mode Only) */}
            {editing && editing.attachments && editing.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Saved X-Rays ({editing.attachments.length}) - Click to preview, × to delete:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {editing.attachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer group hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => {
                        if (attachment.mimeType?.startsWith('image/')) {
                          const images = editing.attachments
                            ?.filter((att) => att.mimeType?.startsWith('image/'))
                            .map((att) => ({ url: att.fileUrl, name: att.fileName })) || [];
                          const imageIndex = images.findIndex((img) => img.url === attachment.fileUrl);
                          setLightboxImages(images);
                          setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
                          setLightboxOpen(true);
                        }
                      }}
                    >
                      {attachment.mimeType?.startsWith('image/') ? (
                        <img 
                          src={attachment.fileUrl} 
                          alt={attachment.fileName}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-center text-muted-foreground truncate w-full">
                            {attachment.fileName}
                          </span>
                        </div>
                      )}
                      
                      {/* Hover overlay for images */}
                      {attachment.mimeType?.startsWith('image/') && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      
                      {/* Delete button */}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        disabled={deleteAttachmentMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this attachment?')) {
                            deleteAttachmentMutation.mutate(attachment.id);
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending || !selectedTooth}>
              {editing ? 'Update' : 'Add Treatment'}
            </Button>
            {editing && (
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Treatment History */}
      <Card>
        <CardHeader>
          <CardTitle>Treatment History</CardTitle>
          <CardDescription>{treatments.length} treatment(s) recorded</CardDescription>
        </CardHeader>
        <CardContent>
          {treatments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No treatments recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {treatments.map((t) => (
                <div key={t.id} className="rounded-lg border bg-card overflow-hidden">
                  {/* Header - Always visible */}
                  <div className="p-3 flex items-center justify-between">
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">Tooth {t.toothNumber}</span>
                        <Badge variant="outline" className="text-[10px]" style={{ borderColor: getStatusColor(t.status), color: getStatusColor(t.status) }}>
                          {t.status.replace('_', ' ')}
                        </Badge>
                        {t.attachments && t.attachments.length > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {t.attachments.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{t.treatmentType}{t.diagnosis && ` • ${t.diagnosis}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.createdAt && new Date(t.createdAt).toLocaleDateString()} 
                        {t.doctor?.user && ` • Dr. ${t.doctor.user.lastName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-right mr-2 hidden sm:block">
                        <div className="font-semibold text-sm">${Number(t.cost || 0).toFixed(2)}</div>
                      </div>
                      
                      {/* View Details Button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedTreatmentDetail(t);
                          setSelectedXrayId(null); // Reset to first image
                          setTreatmentDetailOpen(true);
                        }}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {/* Edit Button */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => openEdit(t)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treatment Detail Dialog - View Only History */}
      <Dialog open={treatmentDetailOpen} onOpenChange={setTreatmentDetailOpen}>
        <DialogContent className="max-w-[888px] max-h-[90vh] overflow-y-auto">
          <DialogTitle className="flex items-center gap-2">
            <span>Treatment Details</span>
            {selectedTreatmentDetail && (
              <Badge 
                variant="outline" 
                style={{ borderColor: getStatusColor(selectedTreatmentDetail.status), color: getStatusColor(selectedTreatmentDetail.status) }}
              >
                {selectedTreatmentDetail.status.replace('_', ' ')}
              </Badge>
            )}
          </DialogTitle>
          
          {selectedTreatmentDetail && (
            <div className="space-y-6">
              {/* Patient Name */}
              <div className="p-3 bg-primary/5 rounded-lg">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Patient</p>
                <p className="text-lg font-semibold">
                  {patientData?.patient?.user?.firstName} {patientData?.patient?.user?.lastName}
                </p>
              </div>

              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Tooth {selectedTreatmentDetail.toothNumber} - {selectedTreatmentDetail.treatmentType}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTreatmentDetail.createdAt && new Date(selectedTreatmentDetail.createdAt).toLocaleDateString()}
                    {selectedTreatmentDetail.doctor?.user && ` • Dr. ${selectedTreatmentDetail.doctor.user.firstName} ${selectedTreatmentDetail.doctor.user.lastName}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${Number(selectedTreatmentDetail.cost || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Notation</p>
                  <p className="text-sm font-medium">{selectedTreatmentDetail.notation || 'Universal'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Surfaces</p>
                  <p className="text-sm font-medium">{selectedTreatmentDetail.surfaces?.join(', ') || 'None'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">{selectedTreatmentDetail.status}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Files</p>
                  <p className="text-sm font-medium">{selectedTreatmentDetail.attachments?.length || 0} attachment{selectedTreatmentDetail.attachments?.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Diagnosis */}
              {selectedTreatmentDetail.diagnosis && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Diagnosis</h4>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedTreatmentDetail.diagnosis}</p>
                </div>
              )}

              {/* Dr. Notes */}
              {selectedTreatmentDetail.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Dr. Notes</h4>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedTreatmentDetail.notes}</p>
                </div>
              )}

              {/* X-Rays Gallery - Thumbnails with Large Selected View */}
              {selectedTreatmentDetail.attachments && selectedTreatmentDetail.attachments.filter(a => a.mimeType?.startsWith('image/')).length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    X-Rays
                    <span className="text-muted-foreground">({selectedTreatmentDetail.attachments.filter(a => a.mimeType?.startsWith('image/')).length})</span>
                  </h4>
                  
                  {/* Large Selected Image View */}
                  <div className="relative rounded-xl overflow-hidden border bg-black/5 aspect-video max-h-[300px]">
                    {(selectedTreatmentDetail.attachments.find(a => a.id === selectedXrayId) || selectedTreatmentDetail.attachments.filter(a => a.mimeType?.startsWith('image/'))[0]) ? (
                      <>
                        <img 
                          src={(selectedTreatmentDetail.attachments.find(a => a.id === selectedXrayId) || selectedTreatmentDetail.attachments.filter(a => a.mimeType?.startsWith('image/'))[0]).fileUrl}
                          alt={(selectedTreatmentDetail.attachments.find(a => a.id === selectedXrayId) || selectedTreatmentDetail.attachments.filter(a => a.mimeType?.startsWith('image/'))[0]).fileName}
                          className="w-full h-full object-contain"
                          onClick={() => {
                            const images = selectedTreatmentDetail.attachments
                              ?.filter((att) => att.mimeType?.startsWith('image/'))
                              .map((att) => ({ url: att.fileUrl, name: att.fileName })) || [];
                            const currentIdx = images.findIndex(img => img.url === (selectedTreatmentDetail.attachments?.find(a => a.id === selectedXrayId) || selectedTreatmentDetail.attachments?.filter(a => a.mimeType?.startsWith('image/'))[0])?.fileUrl);
                            setLightboxImages(images);
                            setCurrentImageIndex(currentIdx >= 0 ? currentIdx : 0);
                            setLightboxOpen(true);
                          }}
                        />
                        {/* Zoom hint */}
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 hover:opacity-100 transition-opacity">
                          Click to zoom
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 opacity-30" />
                      </div>
                    )}
                  </div>
                  
                  {/* Thumbnail Strip */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedTreatmentDetail.attachments
                      .filter((a) => a.mimeType?.startsWith('image/'))
                      .map((a) => {
                        const isSelected = selectedXrayId === a.id || (!selectedXrayId && selectedTreatmentDetail.attachments?.filter(att => att.mimeType?.startsWith('image/'))[0]?.id === a.id);
                        return (
                          <button
                            key={a.id}
                            onClick={() => setSelectedXrayId(a.id)}
                            className={cn(
                              "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                              isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                            )}
                          >
                            <img 
                              src={a.fileUrl} 
                              alt={a.fileName}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                  </div>
                  
                  {/* Other Files - View Only */}
                  {selectedTreatmentDetail.attachments.filter((a) => !a.mimeType?.startsWith('image/')).length > 0 && (
                    <div className="grid gap-2 pt-2">
                      <p className="text-xs text-muted-foreground">Other Files</p>
                      {selectedTreatmentDetail.attachments
                        .filter((a) => !a.mimeType?.startsWith('image/'))
                        .map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted hover:bg-muted/80 transition-colors"
                          >
                            <a
                              href={a.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-3 flex-1"
                            >
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <span className="text-sm">{a.fileName}</span>
                            </a>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <a href={a.fileUrl} target="_blank" rel="noreferrer" download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 text-center">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No X-rays attached</p>
                </div>
              )}

              {/* Single Close Button */}
              <div className="pt-4 border-t">
                <Button 
                  className="w-full"
                  onClick={() => setTreatmentDetailOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 border-none">
          <DialogTitle className="sr-only">Image Viewer</DialogTitle>
          {lightboxImages.length > 0 && (
            <div className="relative w-full h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/50">
                <div className="text-white text-sm">
                  <span className="font-medium">{currentImageIndex + 1}</span>
                  <span className="text-white/60"> / {lightboxImages.length}</span>
                  <span className="ml-3 text-white/80 truncate max-w-[300px] inline-block align-bottom">
                    {lightboxImages[currentImageIndex]?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" asChild>
                    <a href={lightboxImages[currentImageIndex]?.url} target="_blank" rel="noreferrer" download>
                      <Download className="h-5 w-5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setLightboxOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Image Container */}
              <div className="flex-1 relative flex items-center justify-center p-4">
                {/* Previous Button */}
                {lightboxImages.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 h-10 w-10 text-white hover:bg-white/20 rounded-full"
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1))}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                )}

                {/* Image */}
                <img
                  src={lightboxImages[currentImageIndex]?.url}
                  alt={lightboxImages[currentImageIndex]?.name}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Next Button */}
                {lightboxImages.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 h-10 w-10 text-white hover:bg-white/20 rounded-full"
                    onClick={() => setCurrentImageIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1))}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>

              {/* Thumbnails */}
              {lightboxImages.length > 1 && (
                <div className="px-4 py-3 bg-black/50">
                  <div className="flex gap-2 justify-center overflow-x-auto pb-1">
                    {lightboxImages.map((img, idx) => (
                      <button
                        key={idx}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                          idx === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-white/50'
                        }`}
                        onClick={() => setCurrentImageIndex(idx)}
                      >
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
