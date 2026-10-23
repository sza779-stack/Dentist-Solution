import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, CalendarPlus, Calendar, List, Grid3X3 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppointmentType, type AppointmentTypeType } from '@/types';
import { addMinutes, parseISO } from 'date-fns';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CONFIRMED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  NO_SHOW: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function MyAppointments() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctorId') || '');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentTypeType>(AppointmentType.CHECKUP);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'book' ? 'book' : 'list');

  const { data } = useQuery({
    queryKey: ['patientPortal'],
    queryFn: () => patientsApi.getPortalData(),
  });

  const appointments = data?.patient?.appointments || [];
  const { data: doctorsData } = useQuery({
    queryKey: ['portalDoctors'],
    queryFn: () => patientsApi.getPortalDoctors(),
  });

  const { data: availabilityData, isLoading: availabilityLoading } = useQuery({
    queryKey: ['portalDoctorAvailability', selectedDoctorId, selectedDate],
    queryFn: () => patientsApi.getPortalDoctorAvailability(selectedDoctorId, selectedDate),
    enabled: !!selectedDoctorId && !!selectedDate,
  });

  const doctors = doctorsData?.staff || [];
  const availableSlots = availabilityData?.availableSlots || [];

  const createAppointmentMutation = useMutation({
    mutationFn: () => {
      const endTime = format(addMinutes(parseISO(`${selectedDate}T${selectedSlot}:00`), 30), 'HH:mm');
      return patientsApi.createPortalAppointment({
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        startTime: selectedSlot,
        endTime,
        type: appointmentType,
        reason: reason || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      setSelectedSlot('');
      setReason('');
      setNotes('');
      setActiveTab('list');
      queryClient.invalidateQueries({ queryKey: ['patientPortal'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to book appointment');
    },
  });

  const canSubmit = useMemo(
    () => !!selectedDoctorId && !!selectedDate && !!selectedSlot && !!appointmentType && !createAppointmentMutation.isPending,
    [selectedDoctorId, selectedDate, selectedSlot, appointmentType, createAppointmentMutation.isPending]
  );

  const startDate = startOfWeek(startOfMonth(currentDate));
  const endDate = endOfWeek(endOfMonth(currentDate));

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getEventsForDay = (date: Date) => {
    return appointments.filter((apt) =>
      isSameDay(new Date(apt.appointmentDate), date)
    );
  };

  const handleBookClick = () => {
    setActiveTab('book');
    setSearchParams({ tab: 'book' });
  };

  return (
    <div className="space-y-6">
      {/* Header with Big Book Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link to="/patient">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">My Appointments</h1>
        </div>
        <Button 
          size="lg" 
          className="gap-2 w-full sm:w-auto"
          onClick={handleBookClick}
        >
          <CalendarPlus className="h-5 w-5" />
          Book New Appointment
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="book" className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Book</span>
          </TabsTrigger>
        </TabsList>

        {/* Book Tab */}
        <TabsContent value="book" className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="border-b bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Book New Appointment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Schedule your visit with our dental team
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Step 1: Select Service & Doctor */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  1. Select Service & Doctor
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Appointment Type</Label>
                    <Select value={appointmentType} onValueChange={(value) => setAppointmentType(value as AppointmentTypeType)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AppointmentType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replaceAll('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor / Specialist</Label>
                    <Select
                      value={selectedDoctorId}
                      onValueChange={(value) => {
                        setSelectedDoctorId(value);
                        setSelectedSlot('');
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id}>
                            Dr. {doctor.user?.firstName} {doctor.user?.lastName} 
                            {doctor.specialization ? ` - ${doctor.specialization}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Step 2: Select Date & Time */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  2. Select Date & Time
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot('');
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Available Time Slots</Label>
                    {!selectedDoctorId ? (
                      <div className="h-11 flex items-center px-3 text-sm text-muted-foreground border rounded-md bg-muted/50">
                        Select a doctor first
                      </div>
                    ) : availabilityLoading ? (
                      <div className="h-11 flex items-center px-3 text-sm text-muted-foreground border rounded-md bg-muted/50">
                        Loading availability...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="h-11 flex items-center px-3 text-sm text-muted-foreground border rounded-md bg-muted/50">
                        No slots available for this date
                      </div>
                    ) : (
                      <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Additional Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  3. Additional Details
                </h3>
                <div className="space-y-2">
                  <Label>Reason for Visit</Label>
                  <Input 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Briefly describe your reason for visit"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Any additional information you'd like to share..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => createAppointmentMutation.mutate()} 
                  disabled={!canSubmit}
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {createAppointmentMutation.isPending ? (
                    <>Booking...</>
                  ) : (
                    <>
                      <CalendarPlus className="h-5 w-5 mr-2" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List Tab */}
        <TabsContent value="list">
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                All Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No appointments yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven&apos;t booked any appointments yet.
                  </p>
                  <Button onClick={handleBookClick}>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Book Your First Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                          <span className="text-xs text-muted-foreground uppercase">
                            {format(new Date(apt.appointmentDate), 'MMM')}
                          </span>
                          <span className="text-xl font-bold text-primary">
                            {format(new Date(apt.appointmentDate), 'd')}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{apt.type.replace(/_/g, ' ')}</p>
                            <Badge className={statusColors[apt.status] || ''}>
                              {apt.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                          </p>
                          {apt.notes && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{apt.startTime}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.appointmentDate), 'EEEE')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card className="border shadow-sm">
            <CardHeader className="border-b flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5 text-primary" />
                Calendar View
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-28 text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-7 gap-px bg-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                  <div
                    key={dayName}
                    className="bg-muted p-3 text-center text-sm font-medium"
                  >
                    {dayName}
                  </div>
                ))}
                {days.map((date, index) => {
                  const dayEvents = getEventsForDay(date);
                  const isCurrentMonth = isSameMonth(date, currentDate);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <div
                      key={index}
                      className={`min-h-24 bg-background p-2 transition-colors hover:bg-muted/50 ${
                        !isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''
                      } ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {format(date, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => {
                              setSelectedAppointment(event);
                              setIsDialogOpen(true);
                            }}
                            className={`text-xs text-white px-2 py-1 rounded block w-full text-left truncate ${
                              statusColors[event.status]?.split(' ')[0].replace('bg-', 'bg-') || 'bg-gray-400'
                            }`}
                          >
                            {event.startTime} {event.type}
                          </button>
                        ))}
                        {dayEvents.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setActiveTab('list')}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            +{dayEvents.length - 2} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(new Date(selectedAppointment.appointmentDate), 'MMM')}
                  </span>
                  <span className="text-xl font-bold text-primary">
                    {format(new Date(selectedAppointment.appointmentDate), 'd')}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{selectedAppointment.type.replace(/_/g, ' ')}</p>
                  <Badge className={statusColors[selectedAppointment.status] || ''}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {format(new Date(selectedAppointment.appointmentDate), 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time</span>
                  <span className="font-medium">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doctor</span>
                  <span className="font-medium">
                    Dr. {selectedAppointment.doctor?.user?.firstName} {selectedAppointment.doctor?.user?.lastName}
                  </span>
                </div>
                {selectedAppointment.notes && (
                  <div className="pt-3 border-t">
                    <span className="text-muted-foreground block mb-1">Notes</span>
                    <p className="text-sm">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
