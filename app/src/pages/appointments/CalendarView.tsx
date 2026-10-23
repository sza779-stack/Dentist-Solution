import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Plus,
  Video,
  MapPin,
  Stethoscope,
  Sparkles,
  Activity,
  Scissors,
  AlertCircle
} from 'lucide-react';
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
  isToday,
} from 'date-fns';
import { AppointmentStatus } from '@/types';
import type { AppointmentStatusType } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const statusConfig: Record<AppointmentStatusType, { color: string; bg: string; border: string; label: string }> = {
  [AppointmentStatus.SCHEDULED]: { 
    color: 'text-blue-700', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200',
    label: 'Scheduled'
  },
  [AppointmentStatus.CONFIRMED]: { 
    color: 'text-emerald-700', 
    bg: 'bg-emerald-50', 
    border: 'border-emerald-200',
    label: 'Confirmed'
  },
  [AppointmentStatus.COMPLETED]: { 
    color: 'text-slate-700', 
    bg: 'bg-slate-100', 
    border: 'border-slate-200',
    label: 'Completed'
  },
  [AppointmentStatus.CANCELLED]: { 
    color: 'text-red-700', 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    label: 'Cancelled'
  },
  [AppointmentStatus.NO_SHOW]: { 
    color: 'text-amber-700', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200',
    label: 'No Show'
  },
  [AppointmentStatus.IN_PROGRESS]: { 
    color: 'text-purple-700', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200',
    label: 'In Progress'
  },
};

const typeIcons: Record<string, React.ReactNode> = {
  CONSULTATION: <User className="h-3 w-3" />,
  TREATMENT: <Clock className="h-3 w-3" />,
  FOLLOW_UP: <CalendarIcon className="h-3 w-3" />,
  EMERGENCY: <AlertCircle className="h-3 w-3" />,
  CLEANING: <Sparkles className="h-3 w-3" />,
  CHECKUP: <Stethoscope className="h-3 w-3" />,
  ROOT_CANAL: <Activity className="h-3 w-3" />,
  FILLING: <MapPin className="h-3 w-3" />,
  CROWN: <Video className="h-3 w-3" />,
  BRIDGE: <Activity className="h-3 w-3" />,
  IMPLANT: <Activity className="h-3 w-3" />,
  EXTRACTION: <Scissors className="h-3 w-3" />,
  SURGERY: <Activity className="h-3 w-3" />,
  ORTHODONTICS: <Activity className="h-3 w-3" />,
  WHITENING: <Sparkles className="h-3 w-3" />,
};

export default function CalendarView() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const startDate = useMemo(() => {
    if (view === 'month') {
      return startOfWeek(startOfMonth(currentDate));
    }
    return startOfWeek(currentDate);
  }, [currentDate, view]);

  const endDate = useMemo(() => {
    if (view === 'month') {
      return endOfWeek(endOfMonth(currentDate));
    }
    return endOfWeek(currentDate);
  }, [currentDate, view]);

  const { data } = useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () =>
      appointmentsApi.getCalendarData({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
  });

  const events = data?.events || [];

  const days: Date[] = useMemo(() => {
    const daysList: Date[] = [];
    let day = startDate;
    while (day <= endDate) {
      daysList.push(day);
      day = addDays(day, 1);
    }
    return daysList;
  }, [startDate, endDate]);

  const getEventsForDay = (date: Date) => {
    return events.filter((event) =>
      isSameDay(new Date(event.start), date)
    );
  };

  const goToToday = () => setCurrentDate(new Date());

  const shortWeekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1">Manage appointments and schedules</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                view === 'month' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                view === 'week' ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Week
            </button>
          </div>

          <div className="h-6 w-px bg-border" />

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              onClick={goToToday}
              className="h-9 px-4 font-medium"
            >
              Today
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <Button 
            onClick={() => navigate('/appointments?create=true')}
            className="h-9 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Appointment</span>
          </Button>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {events.filter(e => e.status === AppointmentStatus.SCHEDULED).length} Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {events.filter(e => e.status === AppointmentStatus.CONFIRMED).length} Confirmed
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 bg-muted/50 border-b">
            {shortWeekDays.map((dayName) => (
              <div
                key={dayName}
                className="py-3 text-center text-sm font-semibold text-muted-foreground"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((date, index) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const today = isToday(date);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <div
                  key={index}
                  onClick={() => navigate(`/appointments?create=true&date=${format(date, 'yyyy-MM-dd')}`)}
                  className={cn(
                    "min-h-[120px] p-2 border-b border-r transition-colors relative group cursor-pointer",
                    !isCurrentMonth && "bg-muted/30",
                    isWeekend && isCurrentMonth && "bg-muted/10",
                    "hover:bg-accent/50"
                  )}
                >
                  {/* Date Number */}
                  <div className="flex items-center justify-between mb-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appointments?create=true&date=${format(date, 'yyyy-MM-dd')}`);
                      }}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center text-sm font-medium rounded-full transition-all",
                        today 
                          ? "bg-primary text-primary-foreground" 
                          : "text-foreground hover:bg-muted",
                        !isCurrentMonth && "text-muted-foreground"
                      )}
                    >
                      {format(date, 'd')}
                    </button>
                    
                    {/* Add button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/appointments?create=true&date=${format(date, 'yyyy-MM-dd')}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary hover:text-primary-foreground rounded-full bg-muted z-10"
                      title="Add appointment"
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 4).map((event) => {
                      const config = statusConfig[event.status];
                      return (
                        <Link
                          key={event.id}
                          to={`/appointments/${event.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all hover:shadow-sm border",
                            config.bg,
                            config.color,
                            config.border
                          )}
                          title={`${event.title} - ${format(new Date(event.start), 'h:mm a')}`}
                        >
                          <span className="opacity-70 shrink-0">
                            {typeIcons[event.type] || <Clock className="h-3 w-3" />}
                          </span>
                          <span className="truncate">
                            {format(new Date(event.start), 'h:mm a')}
                          </span>
                          <span className="truncate flex-1">
                            {event.title}
                          </span>
                        </Link>
                      );
                    })}
                    
                    {dayEvents.length > 4 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/appointments?date=${format(date, 'yyyy-MM-dd')}`);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 w-full text-left transition-colors"
                      >
                        +{dayEvents.length - 4} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            {Object.entries(statusConfig).map(([status, config]) => (
              <div key={status} className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", config.bg.replace('bg-', 'bg-').replace('50', '500'))} />
                <span className="text-sm text-muted-foreground">{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
