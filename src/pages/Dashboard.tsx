import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Truck,
  Users,
  Package,
  Sparkles,
  MessageCircle,
  GitBranch,
} from 'lucide-react';
import { getCurrentUser, getRiskDistribution, getSupplierRankings, getToken } from '@/lib/api';
import { fetchGlobalRiskEvents, fetchRecentRiskEvents } from '@/components/supplier-risk/api';
import { mlApi } from '@/lib/api';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { useAuth } from '@/hooks/use-auth';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          email: session?.email || 'local@chainlink.pro',
          full_name: session?.full_name || 'User',
          role: session?.role || 'user',
          is_active: true,
          created_at: new Date().toISOString(),
        });
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
    <AuthenticatedShell>
      <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold">Signed in as {user?.full_name || 'User'}</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified Account
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={async () => await loadDashboardData()}>Refresh</Button>
              </div>
            </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Inventory Management</h4>
                    <p className="text-gray-600 text-sm mb-4">Warehouse stock health, ROP, safety stock, and availability checks.</p>
                    <Button variant="secondary" onClick={() => navigate('/inventory-management')}>Open Inventory</Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Ad Generator</h4>
                    <p className="text-gray-600 text-sm mb-4">AI-powered advertisements with Groq &amp; Gemini</p>
                    <Button variant="secondary" onClick={() => navigate('/ad-generator')}>
                      Open Generator
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow border-indigo-100 bg-indigo-50/20">
                  <CardContent className="p-6 text-center">
                    <MessageCircle className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Smart Procurement Hub</h4>
                    <p className="text-gray-600 text-sm mb-4">Manage RFQs, negotiate quotes, and compare suppliers</p>
                    <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/communication-hub')}>
                      Open Comm Hub
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-shadow border-violet-100 dark:border-violet-900">
                  <CardContent className="p-6 text-center">
                    <GitBranch className="h-12 w-12 text-violet-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Scenario Simulator</h4>
                    <p className="text-gray-600 text-sm mb-4">What-if simulations across your entire supply chain pipeline</p>
                    <Button variant="secondary" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => navigate('/scenario-simulator')}>
                      Open Simulator
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

      </div>
    </AuthenticatedShell>
  );
}
