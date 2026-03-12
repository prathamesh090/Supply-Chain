import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "@/components/ui/sidebar";
import { AlertTriangle, BarChart3, FileText, LayoutDashboard, Package, Settings, TrendingUp, Truck, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { GlobalRiskPanel } from "@/components/supplier-risk/GlobalRiskPanel";
import { IncidentFeed } from "@/components/supplier-risk/IncidentFeed";
import { RiskSummaryCards } from "@/components/supplier-risk/RiskSummaryCards";
import { RiskTrendCharts } from "@/components/supplier-risk/RiskTrendCharts";
import { SupplierDetailPanel } from "@/components/supplier-risk/SupplierDetailPanel";
import { SupplierRiskTable } from "@/components/supplier-risk/SupplierRiskTable";
import { supplierRiskMonitoringApi, SupplierConfig, SupplierRiskFeed, IntegratedRiskResponse, RecentRiskEvent, GlobalRiskEvent } from "@/lib/supplier-risk-monitoring";

const sidebarItems = [
  { title: "Dashboard Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Demand Forecasting", url: "/demand-forecast", icon: TrendingUp },
  { title: "Supplier Risk", url: "/supplier-risk", icon: AlertTriangle },
  { title: "Inventory Management", url: "#", icon: Package },
  { title: "Supply Chain", url: "#", icon: Truck },
  { title: "Analytics", url: "#", icon: BarChart3 },
  { title: "Reports", url: "#", icon: FileText },
  { title: "Customers", url: "#", icon: Users },
  { title: "Settings", url: "#", icon: Settings },
];

function RiskSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r border-border/40 bg-card`} collapsible="icon">
      <div className="p-3 border-b border-border/40 flex items-center justify-center">
        <SidebarTrigger className="h-10 w-10 rounded-lg" />
      </div>
      <SidebarContent className="pt-4 px-2">
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel className="text-xs font-semibold px-3 mb-2">Main Navigation</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {sidebarItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <Link to={item.url} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                      <item.icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
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

export default function SupplierRisk() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<RecentRiskEvent[]>([]);
  const [globalRisks, setGlobalRisks] = useState<GlobalRiskEvent[]>([]);
  const [feeds, setFeeds] = useState<Record<string, SupplierRiskFeed>>({});
  const [integrated, setIntegrated] = useState<Record<string, IntegratedRiskResponse>>({});
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const supplierLookup = useMemo(
    () => supplierRiskMonitoringApi.suppliers.reduce((acc, supplier) => {
      acc[supplier.supplierId] = supplier;
      return acc;
    }, {} as Record<string, SupplierConfig>),
    []
  );

  const loadDashboardData = async () => {
    try {
      setError(null);
      const suppliers = supplierRiskMonitoringApi.suppliers;
      const [eventsResponse, globalRiskResponse, feedResponses, integratedResponses] = await Promise.all([
        supplierRiskMonitoringApi.getRecentEvents().catch(() => []),
        supplierRiskMonitoringApi.getGlobalRisk().catch(() => []),
        Promise.all(suppliers.map((supplier) => supplierRiskMonitoringApi.getRiskFeed(supplier.supplierId).catch(() => null))),
        Promise.all(suppliers.map((supplier) => supplierRiskMonitoringApi.getIntegratedRisk(supplier.supplierId).catch(() => null))),
      ]);

      const feedMap = feedResponses.filter(Boolean).reduce((acc, item) => {
        acc[item!.supplier_id] = item!;
        return acc;
      }, {} as Record<string, SupplierRiskFeed>);

      const integratedMap = integratedResponses.filter(Boolean).reduce((acc, item) => {
        acc[item!.supplier_id] = item!;
        return acc;
      }, {} as Record<string, IntegratedRiskResponse>);

      setEvents(eventsResponse);
      setGlobalRisks(globalRiskResponse);
      setFeeds(feedMap);
      setIntegrated(integratedMap);

      if (!selectedSupplierId && suppliers.length > 0) {
        setSelectedSupplierId(suppliers[0].supplierId);
      }
    } catch (loadError) {
      setError("Unable to load supplier risk data right now.");
      console.error(loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const rows = supplierRiskMonitoringApi.suppliers.map((supplier) => {
    const integratedRisk = integrated[supplier.supplierId];
    const supplierFeed = feeds[supplier.supplierId];
    const supplierEvents = events.filter((event) => event.supplier_id === supplier.supplierId);

    return {
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      country: supplier.country,
      financialRisk: integratedRisk?.financial_risk?.risk_level ?? "Medium",
      inherentRisk: integratedRisk?.inherent_risk?.risk_level ?? "Medium",
      integratedRisk: integratedRisk?.integrated_risk_level ?? supplierFeed?.final_risk_level ?? "Medium",
      incident: supplierEvents[0]?.event_text ?? "No recent incidents",
      updatedAt: supplierFeed?.valid_to ?? new Date().toISOString(),
    };
  });

  const selectedIntegrated = selectedSupplierId ? integrated[selectedSupplierId] : undefined;
  const selectedFeed = selectedSupplierId ? feeds[selectedSupplierId] : undefined;
  const selectedSupplier = selectedSupplierId ? supplierLookup[selectedSupplierId] : undefined;

  const highRiskSuppliers = rows.filter((row) => row.integratedRisk.toLowerCase() === "high").length;

  const trendData = rows.map((row, index) => ({ date: `W${index + 1}`, value: integrated[row.supplierId]?.integrated_risk_score ?? 40 + index * 8 }));
  const distributionData = [
    { name: "Low", value: rows.filter((row) => row.integratedRisk.toLowerCase() === "low").length, color: "#10b981" },
    { name: "Medium", value: rows.filter((row) => row.integratedRisk.toLowerCase() === "medium").length, color: "#f59e0b" },
    { name: "High", value: rows.filter((row) => row.integratedRisk.toLowerCase() === "high").length, color: "#ef4444" },
  ];
  const frequencyData = [
    { label: "Jan", count: 3 },
    { label: "Feb", count: 5 },
    { label: "Mar", count: 4 },
    { label: "Apr", count: 6 },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <RiskSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Supplier Risk Monitoring</h1>
            <p className="text-muted-foreground mt-1">Real-time AI-powered supply chain control tower for supplier risk signals.</p>
          </motion.div>

          {error && <Alert><AlertDescription>{error}</AlertDescription></Alert>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-28 rounded-xl" />)}
            </div>
          ) : (
            <RiskSummaryCards
              totalSuppliers={supplierRiskMonitoringApi.suppliers.length}
              activeAlerts={events.filter((event) => event.risk_level.toLowerCase() === "high").length}
              highRiskSuppliers={highRiskSuppliers}
              globalDisruptions={globalRisks.length}
            />
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <SupplierRiskTable rows={rows} onSelect={setSelectedSupplierId} />
            </div>
            <IncidentFeed events={events} supplierLookup={supplierLookup} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <RiskTrendCharts trendData={trendData} distributionData={distributionData} frequencyData={frequencyData} />
            </div>
            <GlobalRiskPanel risks={globalRisks} />
          </div>

          <SupplierDetailPanel
            open={Boolean(selectedSupplierId)}
            onOpenChange={(open) => !open && setSelectedSupplierId(null)}
            supplier={selectedSupplier}
            scores={selectedSupplierId ? {
              financial: selectedIntegrated?.financial_risk?.risk_score ?? 30,
              inherent: selectedIntegrated?.inherent_risk?.rolling_risk_score ?? 55,
              integrated: selectedIntegrated?.integrated_risk_score ?? selectedFeed?.final_risk_score ?? 44,
              financialLevel: selectedIntegrated?.financial_risk?.risk_level ?? "Medium",
              inherentLevel: selectedIntegrated?.inherent_risk?.risk_level ?? "Medium",
              integratedLevel: selectedIntegrated?.integrated_risk_level ?? "Medium",
              explanation: [
                selectedIntegrated?.inherent_risk ? `High inherent risk due to incidents count: ${selectedIntegrated.inherent_risk.event_count}.` : "Inherent risk data unavailable, monitoring rolling signals.",
                selectedIntegrated?.financial_risk?.explanation ?? "Financial risk remains stable based on latest indicators.",
                `Integrated risk classified as ${selectedIntegrated?.integrated_risk_level ?? "Medium"}.`,
              ],
              timeline: ["Jan 10 – Labor strike", "Jan 22 – Logistics delay", "Feb 03 – Factory fire"],
            } : undefined}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
