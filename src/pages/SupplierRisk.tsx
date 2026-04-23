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
import { MiniScenarioSimulator, SimResult } from '@/components/scenario/MiniScenarioSimulator';
import { SimulationImpactCard } from '@/components/scenario/SimulationImpactCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { GitBranch, Brain, Info } from 'lucide-react';
import type { GlobalRiskEventItem, RiskEventItem, SupplierRiskRow } from '@/components/supplier-risk/types';

export default function SupplierRisk() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<SupplierRiskRow[]>([]);
  const [events, setEvents] = useState<RiskEventItem[]>([]);
  const [globalEvents, setGlobalEvents] = useState<GlobalRiskEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [integratedSimResult, setIntegratedSimResult] = useState<SimResult | null>(null);

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
            <TabsTrigger value="simulation">Disruption Simulation</TabsTrigger>
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

          <TabsContent value="simulation">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <MiniScenarioSimulator 
                  feature="risk" 
                  onResult={(res) => setIntegratedSimResult(res)} 
                />
              </div>
              <div className="lg:col-span-2 space-y-6">
                {integratedSimResult ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                    <Card className="border-primary/10 shadow-md">
                      <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-primary">
                          <Brain className="w-5 h-5" />
                          Risk Disruption Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm italic">
                          "{integratedSimResult.summary}"
                        </div>
                        <SimulationImpactCard 
                          stage="risk" 
                          data={integratedSimResult.stages.risk} 
                          severity={integratedSimResult.severity_score}
                        />
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-2xl border-muted opacity-50">
                    <GitBranch className="w-12 h-12 mb-4 text-muted-foreground" />
                    <p className="font-semibold text-muted-foreground">Select a scenario to start disruption analysis</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Model how global events impact your integrated risk scores and supplier reliability in real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </AuthenticatedShell>
  );
}
