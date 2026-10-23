import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

export default function MainLayout() {
  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-background antialiased",
      "selection:bg-primary/20 selection:text-primary"
    )} data-testid="main-layout">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto scrollbar-thin" data-testid="app-main">
          <div className="container mx-auto p-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
