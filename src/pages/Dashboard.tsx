import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Truck,
  BarChart3,
  FileText,
  Users,
  Settings,
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity
} from 'lucide-react';
import { getCurrentUser, getToken, removeToken } from '@/lib/api';
import { motion } from 'framer-motion';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

// Sidebar items
const sidebarItems = [
  { title: "Dashboard Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Demand Forecasting", url: "/demand-forecast", icon: TrendingUp },
  { title: "Supplier Risk", url: "/supplier-risk", icon: AlertTriangle }, // Changed from Risk Assessment
  { title: "Inventory Management", url: "#", icon: Package },
  { title: "Supply Chain", url: "#", icon: Truck },
  { title: "Analytics", url: "#", icon: BarChart3 },
  { title: "Reports", url: "#", icon: FileText },
  { title: "Customers", url: "#", icon: Users },
  { title: "Settings", url: "#", icon: Settings },
];

const statsData = [
  { title: "Suppliers Connected", value: "24", icon: Users, change: "+2 this week" },
  { title: "Raw Materials Tracked", value: "156", icon: Package, change: "+12 this month" },
  { title: "Forecast Accuracy", value: "94.2%", icon: TrendingUp, change: "+1.2% improvement" },
  { title: "Active Risk Alerts", value: "3", icon: AlertTriangle, change: "2 resolved today" },
  { title: "Avg Supplier Response", value: "2.3h", icon: Clock, change: "-15min improvement" },
  { title: "Orders Last Month", value: "89", icon: Activity, change: "+15% vs last month" },
];

function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      className={`${isCollapsed ? "w-16" : "w-64"} transition-all duration-300 ease-in-out border-r border-border/40 bg-card`}
      collapsible="icon"
    >
      <div className="p-3 border-b border-border/40 flex items-center justify-center">
        <SidebarTrigger className="h-10 w-10 transition-all duration-200 hover:scale-110 hover:bg-primary/10 rounded-lg" />
      </div>
      <SidebarContent className="pt-4 px-2">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground px-3 mb-3">
              Main Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {sidebarItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link to={item.url} className="block">
                      <div
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200 group relative overflow-hidden
                          ${active
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-md'
                          }
                          ${isCollapsed ? 'justify-center px-2' : ''}
                        `}
                      >
                        {active && !isCollapsed && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent animate-pulse opacity-50" />
                        )}
                        <item.icon
                          className={`
                            h-5 w-5 flex-shrink-0 relative z-10 transition-all duration-200
                            ${active ? 'scale-110' : 'group-hover:scale-105'}
                          `}
                        />
                        {!isCollapsed && (
                          <span className="font-medium text-sm whitespace-nowrap relative z-10 transition-opacity duration-200">
                            {item.title}
                          </span>
                        )}
                      </div>
                    </Link>
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        removeToken();
        navigate('/sign-in');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleSignOut = () => {
    removeToken();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">
                  Welcome, {user?.full_name || 'User'}
                </h2>
                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Account
                </Badge>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {statsData.map((stat, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-primary">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                      </div>
                      <stat.icon className="h-8 w-8 text-secondary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Demand Forecasting</h4>
                    <p className="text-gray-600 text-sm mb-4">AI-powered predictions for manufacturing demand</p>
                    <Button onClick={() => navigate('/demand-forecast')}>
                      Start Forecasting
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Inventory Management</h4>
                    <p className="text-gray-600 text-sm mb-4">Track and manage your raw materials inventory</p>
                    <Button variant="outline">
                      Manage Inventory
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <Truck className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-lg mb-2">Supply Chain</h4>
                    <p className="text-gray-600 text-sm mb-4">Monitor your supply chain partners and logistics</p>
                    <Button variant="outline">
                      View Supply Chain
                    </Button>
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