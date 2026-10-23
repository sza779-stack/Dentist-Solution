import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Calendar,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Pill,
  CreditCard,
  MessageSquare,
  Settings,
  FileText,
  DollarSign,
  FolderTree,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getDefaultRouteForRole } from '@/lib/home';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Users',
    path: '/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Patients',
    path: '/patients',
    icon: UserCircle,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST'],
  },
  {
    label: 'Appointments',
    path: '/appointments',
    icon: Calendar,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST'],
  },
  {
    label: 'Calendar',
    path: '/calendar',
    icon: CalendarDays,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST'],
  },
  {
    label: 'Treatments',
    path: '/treatments',
    icon: Stethoscope,
    roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'DENTIST', 'SPECIALIST'],
  },
  {
    label: 'Categories',
    path: '/treatments/categories',
    icon: FolderTree,
    roles: ['ADMIN'],
  },
  {
    label: 'Invoices',
    path: '/billing/invoices',
    icon: FileText,
    roles: ['ADMIN', 'RECEPTIONIST'],
  },
  {
    label: 'Payments',
    path: '/billing/payments',
    icon: DollarSign,
    roles: ['ADMIN', 'RECEPTIONIST'],
  },
  {
    label: 'Financial Reports',
    path: '/billing/reports',
    icon: CreditCard,
    roles: ['ADMIN'],
  },
  { label: 'Messages', path: '/messages', icon: MessageSquare },
  {
    label: 'Settings',
    path: '/settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
  // Patient portal links
  {
    label: 'My Appointments',
    path: '/portal/appointments',
    icon: Calendar,
    roles: ['PATIENT'],
  },
  {
    label: 'My Billing',
    path: '/portal/billing',
    icon: CreditCard,
    roles: ['PATIENT'],
  },
  {
    label: 'Treatment History',
    path: '/portal/treatments',
    icon: ClipboardList,
    roles: ['PATIENT'],
  },
  {
    label: 'Prescriptions',
    path: '/portal/prescriptions',
    icon: Pill,
    roles: ['PATIENT'],
  },
  {
    label: 'Profile',
    path: '/portal/profile',
    icon: UserCircle,
    roles: ['PATIENT'],
  },
];

export function Sidebar() {
  const { hasRole, user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const homePath = getDefaultRouteForRole(user?.role);
  const homeLabel = user?.role === 'PATIENT' ? 'Patient Home' : user?.role === 'ADMIN' ? 'Admin Home' : 'Dashboard';

  const homeNavItem: NavItem = {
    label: homeLabel,
    path: homePath,
    icon: LayoutDashboard,
  };

  const filteredNavItems = [homeNavItem, ...navItems].filter(
    (item) => !item.roles || hasRole(item.roles)
  );

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          collapsed && 'justify-center px-2'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out sticky top-0 h-screen',
          collapsed ? 'w-16' : 'w-64'
        )}
        data-testid="app-sidebar"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <NavLink to={homePath} className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-lg font-bold text-sidebar-foreground leading-tight">
                  Dental
                </span>
                <span className="text-xs text-sidebar-foreground/60 leading-tight">
                  Clinic Pro
                </span>
              </div>
            )}
          </NavLink>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              onClick={() => setCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-3 scrollbar-thin">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavItemComponent item={item} />
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse Button (when collapsed) */}
        {collapsed && (
          <div className="border-t border-sidebar-border p-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-9 text-sidebar-foreground/50 hover:text-sidebar-foreground"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-sidebar-border p-4">
            <div className="rounded-lg bg-sidebar-accent/50 p-3">
              <p className="text-xs text-sidebar-foreground/60">
                © 2024 Dental Clinic Pro
              </p>
              <p className="text-xs text-sidebar-foreground/40 mt-0.5">
                Version 2.0
              </p>
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}
