import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskSummaryCards } from '@/components/supplier-risk/RiskSummaryCards';
import { SupplierRiskTable } from '@/components/supplier-risk/SupplierRiskTable';
import { IncidentFeed } from '@/components/supplier-risk/IncidentFeed';
import { GlobalRiskPanel } from '@/components/supplier-risk/GlobalRiskPanel';
import { RiskTrendCharts } from '@/components/supplier-risk/RiskTrendCharts';
import { fetchGlobalRiskEvents, fetchRecentRiskEvents, fetchSupplierMonitoringData } from '@/components/supplier-risk/api';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import type { GlobalRiskEventItem, RiskEventItem, SupplierRiskRow } from '@/components/supplier-risk/types';

export default function SupplierRisk() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierRiskRow[]>([]);
  const [events, setEvents] = useState<RiskEventItem[]>([]);
  const [globalEvents, setGlobalEvents] = useState<GlobalRiskEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonitoringData = async () => {
    try {
      setError(null);
      const [supplierResult, incidentResult, disruptionResult] = await Promise.allSettled([
        fetchSupplierMonitoringData(),
        fetchRecentRiskEvents(),
        fetchGlobalRiskEvents(),
      ]);
      const supplierRows = supplierResult.status === 'fulfilled' ? supplierResult.value : [];
      const incidentRows = incidentResult.status === 'fulfilled' ? incidentResult.value : [];
      const disruptionRows = disruptionResult.status === 'fulfilled' ? disruptionResult.value : [];

      setSuppliers(supplierRows);
      setEvents(incidentRows);
      setGlobalEvents(disruptionRows);

      const failedCalls = [supplierResult, incidentResult, disruptionResult].filter((r) => r.status === 'rejected').length;
      if (failedCalls > 0) {
        setError(`Some risk data sources are temporarily unavailable (${failedCalls}/3). Showing partial data.`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load supplier monitoring data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const [incidentResult, disruptionResult] = await Promise.allSettled([fetchRecentRiskEvents(), fetchGlobalRiskEvents()]);
      if (incidentResult.status === 'fulfilled') setEvents(incidentResult.value);
      if (disruptionResult.status === 'fulfilled') setGlobalEvents(disruptionResult.value);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const summary = useMemo(() => {
    const highRiskSuppliers = suppliers.filter((s) => s.integratedRiskLevel.toLowerCase() === 'high').length;
    const activeRiskAlerts = events.filter((e) => e.risk_level.toLowerCase() !== 'low').length;
    return {
      totalSuppliers: suppliers.length,
      activeRiskAlerts,
      highRiskSuppliers,
      globalDisruptions: globalEvents.length,
    };
  }, [suppliers, events, globalEvents]);

  const trendSeed = Array.from({ length: 6 }).map((_, i) => ({
    date: `W${i + 1}`,
    financial: 40 + i * 4,
    inherent: 35 + i * 3,
    integrated: 38 + i * 4,
    incidents: Math.max(0, 7 - i),
  }));

  const handleSelectSupplier = async (supplier: SupplierRiskRow) => {
    navigate(`/supplier/${encodeURIComponent(supplier.supplierName)}`);
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Supplier Risk Monitoring</h1>
            <p className="text-muted-foreground">Monitor financial, inherent, and integrated risk across your supplier network.</p>
          </div>
          <Button variant="outline" onClick={loadMonitoringData}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </motion.div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <RiskSummaryCards {...summary} />

        <Tabs defaultValue="monitoring" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="analytics">Risk Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring" className="space-y-4">
            {loading ? <p className="text-muted-foreground">Loading supplier monitoring data...</p> : (
              <SupplierRiskTable suppliers={suppliers} onRowClick={handleSelectSupplier} />
            )}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <IncidentFeed events={events} />
              <GlobalRiskPanel events={globalEvents} />
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <RiskTrendCharts trendSeries={trendSeed} suppliers={suppliers} />
          </TabsContent>
        </Tabs>
      </div>

    </AuthenticatedShell>
  );
}
