import { Bell, User, LogOut, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '@/lib/home';

export function Header() {
  const { user, logout, isAdmin, isDoctor, isPatient } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const showPatientHero = isPatient && location.pathname.startsWith('/patient');

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleProfileClick = () => {
    if (isPatient) {
      navigate('/portal/profile');
    } else {
      // For staff/admin, navigate to their user detail page or show coming soon
      navigate(getDefaultRouteForRole(user?.role));
      toast.info('Profile page coming soon for staff users');
    }
  };

  const handleSettingsClick = () => {
    if (isAdmin) {
      navigate('/settings');
    } else {
      toast.info('Settings only available for Admin users');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'DOCTOR':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'RECEPTIONIST':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'PATIENT':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex items-center justify-between gap-4 border-b px-6',
        showPatientHero
          ? 'bg-slate-950 py-5'
          : 'h-16 bg-card/50 backdrop-blur-sm'
      )}
    >
      <div className={cn('flex min-w-0 items-center gap-4', showPatientHero && 'flex-1')}>
        <div className="hidden min-w-0 md:block">
            <h2 className={cn('truncate font-semibold', showPatientHero ? 'text-2xl text-white' : 'text-lg text-foreground')}>
              <span data-testid={showPatientHero ? 'patient-landing-title' : undefined}>
                Welcome back, {user?.firstName}
                {showPatientHero ? '!' : ''}
              </span>
            </h2>
            <div className="mt-0.5 flex items-center gap-2">
              {showPatientHero ? (
                <p className="truncate text-sm text-slate-300">
                  Here&apos;s what&apos;s happening with your dental care
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user?.role?.toLowerCase()}
                  </p>
                  {isAdmin && (
                    <Badge variant="outline" className={cn('text-xs', getRoleBadgeColor('ADMIN'))}>
                      <Shield className="mr-1 h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  {isDoctor && (
                    <Badge variant="outline" className={cn('text-xs', getRoleBadgeColor('DOCTOR'))}>
                      Doctor
                    </Badge>
                  )}
                </>
              )}
            </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0 text-xs animate-in zoom-in"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarImage src={user?.avatarUrl || ''} alt={`${user?.firstName} ${user?.lastName}`} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick} className="gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick} className="gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
