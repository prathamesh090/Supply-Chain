import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarProvider,
  useSidebar,
} from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { getCurrentUser, getRiskDistribution, getSupplierRankings, getToken } from '@/lib/api';
import { fetchGlobalRiskEvents, fetchRecentRiskEvents } from '@/components/supplier-risk/api';
import { mlApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authWarning, setAuthWarning] = useState<string | null>(null);

  const [totalSuppliers, setTotalSuppliers] = useState(0);
  const [highRiskSuppliers, setHighRiskSuppliers] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [globalDisruptions, setGlobalDisruptions] = useState(0);
  const [recentSessionsCount, setRecentSessionsCount] = useState(0);
  const [forecastDemandAvg, setForecastDemandAvg] = useState<number | null>(null);

  const loadDashboardData = async () => {
    const [rankings, distribution, incidents, globalRisk, sessions] = await Promise.all([
      getSupplierRankings().catch(() => ({ rankings: [] })),
      getRiskDistribution().catch(() => ({ distribution: { total_suppliers: 0 } })),
      fetchRecentRiskEvents().catch(() => []),
      fetchGlobalRiskEvents().catch(() => []),
      mlApi.getRecentSessions(20).catch(() => ({ sessions: [] })),
    ]);

    const ranked = rankings.rankings ?? [];
    const total = distribution?.distribution?.total_suppliers ?? ranked.length;

    setTotalSuppliers(total);
    setHighRiskSuppliers(ranked.filter((supplier) => supplier.predicted_risk?.toLowerCase?.() === 'high').length);
    setActiveAlerts((incidents ?? []).filter((event) => event?.risk_level?.toLowerCase?.() !== 'low').length);
    setGlobalDisruptions((globalRisk ?? []).length);

    const sessionsList = sessions?.sessions ?? [];
    setRecentSessionsCount(sessionsList.length);

    const avgDemandCandidates = sessionsList
      .map((session: { avg_demand?: number }) => session.avg_demand)
      .filter((value: number | undefined): value is number => typeof value === 'number' && Number.isFinite(value));

    setForecastDemandAvg(avgDemandCandidates.length
      ? Number((avgDemandCandidates.reduce((acc, curr) => acc + curr, 0) / avgDemandCandidates.length).toFixed(1))
      : null);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/sign-in');
      return;
    }

    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
      } catch (err) {
        setUser({
          id: 0,
          email: 'local@chainlink.pro',
          full_name: 'Local User',
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
        });
        setAuthWarning('Unable to validate user profile from backend. Showing dashboard in local fallback mode.');
      } finally {
        await loadDashboardData();
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const statsData = useMemo(() => [
    { title: 'Suppliers Connected', value: String(totalSuppliers), icon: Users, helper: 'Live supplier registry + rankings' },
    { title: 'Active Risk Alerts', value: String(activeAlerts), icon: AlertTriangle, helper: 'Recent non-low incidents' },
    { title: 'High Risk Suppliers', value: String(highRiskSuppliers), icon: Activity, helper: 'Integrated high-risk suppliers' },
    { title: 'Global Disruptions', value: String(globalDisruptions), icon: Truck, helper: 'Current global risk events' },
    { title: 'Forecast Sessions', value: String(recentSessionsCount), icon: Clock, helper: 'Recent saved forecast runs' },
    { title: 'Avg Forecast Demand', value: forecastDemandAvg !== null ? `${forecastDemandAvg}` : 'N/A', icon: TrendingUp, helper: 'From recent ML sessions' },
  ], [totalSuppliers, activeAlerts, highRiskSuppliers, globalDisruptions, recentSessionsCount, forecastDemandAvg]);

  const handleSignOut = () => {
    logout();
    navigate('/sign-in');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <main className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6 overflow-auto h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">Welcome, {user?.full_name || 'User'}</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified Account
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={async () => await loadDashboardData()}>Refresh</Button>
                <Button onClick={handleSignOut} variant="outline" size="sm">Sign Out</Button>
              </div>
            </div>

            {authWarning && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 text-sm text-yellow-800">{authWarning}</CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {statsData.map((stat) => (
                <Card key={stat.title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.helper}</p>
                      </div>
                      <stat.icon className="h-8 w-8 text-secondary shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Demand Forecasting</h4>
                    <p className="text-gray-600 text-sm mb-4">AI-powered predictions for manufacturing demand</p>
                    <Button onClick={() => navigate('/demand-forecast')}>Start Forecasting</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Supplier Risk Monitoring</h4>
                    <p className="text-gray-600 text-sm mb-4">Track incidents, disruptions, and integrated supplier risk</p>
                    <Button variant="outline" onClick={() => navigate('/supplier-risk')}>Open Supplier Risk</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow opacity-90">
                  <CardHeader><CardTitle className="text-base">Inventory Management</CardTitle></CardHeader>
                  <CardContent className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">Inventory and supply-chain modules are coming soon in this environment.</p>
                    <Button variant="secondary" disabled>Coming Soon</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
