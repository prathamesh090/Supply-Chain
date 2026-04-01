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
} from '@/components/ui/sidebar';
import { AlertTriangle, LayoutDashboard, TrendingUp, Factory, Network, Settings } from 'lucide-react';
import { getAuthSession } from '@/lib/api';

function AppSidebar() {
  const location = useLocation();
  const role = getAuthSession()?.role;

  const manufacturerItems = [
    { title: 'Dashboard Overview', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Demand Forecasting', url: '/demand-forecast', icon: TrendingUp },
    { title: 'Supplier Risk', url: '/supplier-risk', icon: AlertTriangle },
    { title: 'Settings', url: '/manufacturer/settings', icon: Settings },
  ];

  const supplierItems = [
    { title: 'Supplier Portal', url: '/supplier-dashboard', icon: Factory },
    { title: 'Settings', url: '/supplier/settings', icon: Settings },
  ];
  const items = role === 'supplier' ? supplierItems : manufacturerItems;

  return (
    <Sidebar className="w-64 border-r bg-card" collapsible="none">
      <div className="h-16 px-4 border-b flex items-center">
        <span className="font-semibold text-sm text-muted-foreground">Navigation</span>
      </div>
      <SidebarContent className="pt-4 px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {items.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link to={item.url} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role !== 'supplier' && (
          <SidebarGroup>
            <SidebarGroupLabel>Suppliers</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                <SidebarMenuItem>
                  <Link to="/suppliers/discovery" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${location.pathname.includes('/suppliers/discovery') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                    <Factory className="h-5 w-5" />
                    <span className="text-sm">Find New Suppliers</span>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link to="/suppliers/network" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${location.pathname.includes('/suppliers/network') ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                    <Network className="h-5 w-5" />
                    <span className="text-sm">My Network</span>
                  </Link>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden"><div className="p-6 overflow-auto h-screen">{children}</div></main>
      </div>
    </SidebarProvider>
  );
}
