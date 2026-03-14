import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  AlertTriangle,
  BarChart3,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';

const sidebarItems = [
  { title: 'Dashboard Overview', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Demand Forecasting', url: '/demand-forecast', icon: TrendingUp },
  { title: 'Supplier Risk', url: '/supplier-risk', icon: AlertTriangle },
  { title: 'Inventory Management', url: '#', icon: Package, disabled: true },
  { title: 'Supply Chain', url: '#', icon: Truck, disabled: true },
  { title: 'Analytics', url: '#', icon: BarChart3, disabled: true },
  { title: 'Reports', url: '#', icon: FileText, disabled: true },
  { title: 'Customers', url: '#', icon: Users, disabled: true },
  { title: 'Settings', url: '#', icon: Settings, disabled: true },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={`${isCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 ease-in-out border-r border-border/40 bg-card`} collapsible="icon">
      <div className="p-3 border-b border-border/40 flex items-center justify-center">
        <SidebarTrigger className="h-10 w-10 transition-all duration-200 hover:scale-110 hover:bg-primary/10 rounded-lg" />
      </div>
      <SidebarContent className="pt-4 px-2">
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3 mb-3">Main Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {sidebarItems.map((item) => {
                const active = location.pathname === item.url;
                const baseClass = `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden ${isCollapsed ? 'justify-center px-2' : ''}`;
                const visualClass = item.disabled
                  ? 'text-muted-foreground/60 cursor-not-allowed bg-muted/30'
                  : active
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md';

                return (
                  <SidebarMenuItem key={item.title}>
                    {item.disabled ? (
                      <div className={`${baseClass} ${visualClass}`}>
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{item.title}</span>}
                      </div>
                    ) : (
                      <Link to={item.url} className="block">
                        <div className={`${baseClass} ${visualClass}`}>
                          {active && !isCollapsed && <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent animate-pulse opacity-50" />}
                          <item.icon className={`h-5 w-5 flex-shrink-0 relative z-10 transition-all duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
                          {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap relative z-10">{item.title}</span>}
                        </div>
                      </Link>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <div className="p-6 overflow-auto h-screen">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
