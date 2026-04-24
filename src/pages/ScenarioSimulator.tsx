import React, { useState, useEffect, useCallback } from 'react';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Zap, AlertTriangle, Package, Truck,
  Play, RotateCcw, ChevronRight, Activity, Shield, DollarSign,
  Thermometer, Cloud, ArrowRight, CheckCircle2, XCircle, AlertCircle,
  GitBranch, Loader2, Info, BarChart3, Clock
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────
interface SimParams {
  surge_pct: number;
  failure_pct: number;
  supplier_name: string | null;
  price_change_pct: number;
  season: string | null;
  seasonal_multiplier: number;
  route_cost_increase_pct: number;
}

interface SimResult {
  scenario_type: string;
  parameters: SimParams;
  stages: {
    demand: {
      baseline_total: number; simulated_total: number; delta_pct: number;
      affected_products: number;
      breakdown: Array<{ product_id: string; plastic_type: string; baseline: number; simulated: number; delta_pct: number }>;
    };
    risk: {
      affected_suppliers: string[];
      risk_level_changes: Array<{ supplier: string; from: string; to: string }>;
      total_suppliers_monitored: number;
    };
    inventory: {
      total_items: number; stockout_count: number; healthy_count: number;
      reorder_count: number; newly_at_risk: number; safety_stock_increase_avg_pct: number;
      status_changes: Array<{ product_id: string; warehouse: string; from: string; to: string; current_stock: number; new_rop: number }>;
    };
    distribution: {
      unserviceable_routes: number; cost_increase_pct: number;
      affected_regions: string[]; est_cost_impact_inr: number;
    };
  };
  severity_score: number;
  summary: string;
  data_source: string;
}

interface SupplierOption { name: string; current_risk: string; }

// ── Scenario Definitions ──────────────────────────────────────────────
const SCENARIOS = [
  {
    id: 'demand_spike',
    label: 'Demand Surge',
    icon: TrendingUp,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
    desc: 'Sudden spike in customer demand',
    emoji: '🚀',
  },
  {
    id: 'supplier_failure',
    label: 'Supplier Failure',
    icon: AlertTriangle,
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-600',
    desc: 'Key supplier loses production capacity',
    emoji: '💥',
  },
  {
    id: 'price_shock',
    label: 'Price Shock',
    icon: DollarSign,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    desc: 'Raw material price increase or decrease',
    emoji: '💰',
  },
  {
    id: 'seasonal',
    label: 'Seasonal Shift',
    icon: Cloud,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    desc: 'Quarterly demand pattern override',
    emoji: '🌦️',
  },
  {
    id: 'logistics_disruption',
    label: 'Logistics Disruption',
    icon: Truck,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-700',
    desc: 'Route cost spike due to transport issues',
    emoji: '🚚',
  },
];

const SEASONS = ['Q1', 'Q2', 'Q3', 'Q4'];

const SEVERITY_LEVELS = [
  { max: 25, label: 'Minimal', color: '#10b981', bg: 'bg-emerald-500' },
  { max: 50, label: 'Moderate', color: '#f59e0b', bg: 'bg-amber-500' },
  { max: 75, label: 'Severe', color: '#f97316', bg: 'bg-orange-500' },
  { max: 100, label: 'Critical', color: '#ef4444', bg: 'bg-red-500' },
];

function getSeverityInfo(score: number) {
  return SEVERITY_LEVELS.find(l => score <= l.max) || SEVERITY_LEVELS[3];
}

// ── Helper Components ─────────────────────────────────────────────────
const DeltaBadge = ({ pct }: { pct: number }) => {
  if (Math.abs(pct) < 0.1) return <span className="text-gray-400 text-xs font-medium">No change</span>;
  const positive = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${positive ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
};

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    'Healthy': 'bg-emerald-100 text-emerald-700',
    'Reorder Soon': 'bg-amber-100 text-amber-700',
    'Stockout Risk': 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const PipelineStage = ({ label, icon: Icon, active, done, color }: {
  label: string; icon: React.ElementType; active: boolean; done: boolean; color: string;
}) => (
  <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${active ? 'scale-110' : done ? 'opacity-100' : 'opacity-40'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
      ${done ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : active ? `shadow-lg` : 'bg-gray-200 dark:bg-gray-700'}`}
      style={active ? { backgroundColor: color, boxShadow: `0 0 20px ${color}55` } : {}}>
      {done ? <CheckCircle2 className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5 text-white" />}
    </div>
    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────
export default function ScenarioSimulator() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [params, setParams] = useState<SimParams>({
    surge_pct: 30, failure_pct: 70, supplier_name: null,
    price_change_pct: 25, season: 'Q3', seasonal_multiplier: 1.0,
    route_cost_increase_pct: 40,
  });
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [running, setRunning] = useState(false);
  const [activeStage, setActiveStage] = useState(-1);
  const [result, setResult] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/scenario/suppliers`)
      .then(r => r.json())
      .then(data => {
        setSuppliers(Array.isArray(data) ? data : []);
        if (data.length > 0) setParams(p => ({ ...p, supplier_name: data[0].name }));
      })
      .catch(() => {
        const fallback = ['Alpha_Polymers', 'Delta_Logistics', 'Sigma_Plastics', 'BrightChem', 'IndoPlast'];
        setSuppliers(fallback.map(n => ({ name: n, current_risk: 'Low' })));
        setParams(p => ({ ...p, supplier_name: fallback[0] }));
      });
  }, []);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    setResult(null);
    setError(null);
    setActiveStage(0);

    // Animate pipeline stages
    const stageDelay = 700;
    setTimeout(() => setActiveStage(1), stageDelay);
    setTimeout(() => setActiveStage(2), stageDelay * 2);
    setTimeout(() => setActiveStage(3), stageDelay * 3);

    try {
      const res = await fetch(`${API_BASE}/scenario/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_type: selectedScenario.id, parameters: params }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail?.detail || `HTTP ${res.status}`);
      }
      const data: SimResult = await res.json();
      setTimeout(() => {
        setActiveStage(4);
        setResult(data);
        setRunning(false);
      }, stageDelay * 3.5);
    } catch (e: any) {
      setTimeout(() => {
        setError(e.message || 'Simulation failed');
        setRunning(false);
        setActiveStage(-1);
      }, stageDelay * 2);
    }
  }, [selectedScenario, params]);

  const resetSim = () => {
    setResult(null); setError(null); setActiveStage(-1);
  };

  const pipelineStages = [
    { label: 'Demand', icon: TrendingUp, color: '#6366f1' },
    { label: 'Risk', icon: Shield, color: '#ef4444' },
    { label: 'Inventory', icon: Package, color: '#f59e0b' },
    { label: 'Distribution', icon: Truck, color: '#10b981' },
  ];

  const scenarioInfo = SCENARIOS.find(s => s.id === selectedScenario.id)!;

  // Build demand chart data
  const demandChartData = result
    ? result.stages.demand.breakdown.map(b => ({
        name: b.product_id.replace(/-\d+$/, '').substring(0, 8),
        Baseline: Math.round(b.baseline),
        Simulated: Math.round(b.simulated),
      }))
    : [];

  const severityInfo = result ? getSeverityInfo(result.severity_score) : null;

  return (
    <AuthenticatedShell>
      <div className="space-y-6 pb-16">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-6 h-6 text-violet-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-700 bg-clip-text text-transparent">
                Scenario Simulator
              </h1>
              <Badge variant="secondary" className="bg-violet-100 text-violet-700 text-xs">NEW</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Run What-If scenarios across your entire supply chain pipeline — Demand → Risk → Inventory → Distribution
            </p>
          </div>
          {result && (
            <Button variant="outline" size="sm" onClick={resetSim} className="gap-2">
              <RotateCcw className="w-4 h-4" /> New Simulation
            </Button>
          )}
        </div>

        {/* ── Pipeline Animation ── */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-xl">
          <CardContent className="py-5 px-6">
            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
              {pipelineStages.map((stage, i) => (
                <React.Fragment key={stage.label}>
                  <PipelineStage
                    label={stage.label}
                    icon={stage.icon}
                    color={stage.color}
                    active={activeStage === i}
                    done={activeStage > i || activeStage === 4}
                  />
                  {i < pipelineStages.length - 1 && (
                    <div className={`transition-all duration-700 ${activeStage > i || activeStage === 4 ? 'opacity-100' : 'opacity-20'}`}>
                      <ArrowRight className="w-5 h-5 text-violet-400" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            {running && (
              <div className="text-center mt-4">
                <div className="flex items-center justify-center gap-2 text-violet-300 text-sm animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cascading scenario through {pipelineStages[Math.min(activeStage, 3)]?.label || 'pipeline'}…
                </div>
              </div>
            )}
            {result && (
              <div className="text-center mt-3 text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Simulation complete — results below
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: Scenario Selector + Parameters ── */}
          <div className="xl:col-span-1 space-y-4">

            {/* Scenario Cards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Choose Scenario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {SCENARIOS.map(s => {
                  const Icon = s.icon;
                  const active = selectedScenario.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedScenario(s); resetSim(); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all duration-200 group
                        ${active
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40'
                          : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${s.gradient}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold ${active ? 'text-violet-700 dark:text-violet-300' : ''}`}>{s.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                      </div>
                      {active && <ChevronRight className="w-4 h-4 text-violet-500 ml-auto flex-shrink-0" />}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Parameters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="text-xl">{scenarioInfo.emoji}</span> Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">

                {selectedScenario.id === 'demand_spike' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Demand Surge</span>
                      <span className="font-bold text-indigo-600">+{params.surge_pct}%</span>
                    </div>
                    <Slider min={5} max={150} step={5} value={[params.surge_pct]}
                      onValueChange={([v]) => { setParams(p => ({ ...p, surge_pct: v })); resetSim(); }}
                      className="[&>span:first-child]:bg-indigo-500" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>+5%</span><span>+150%</span></div>
                  </div>
                )}

                {selectedScenario.id === 'supplier_failure' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Failing Supplier</label>
                      <select
                        className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-violet-500"
                        value={params.supplier_name || ''}
                        onChange={e => { setParams(p => ({ ...p, supplier_name: e.target.value })); resetSim(); }}
                      >
                        {suppliers.map(s => (
                          <option key={s.name} value={s.name}>{s.name} ({s.current_risk} risk)</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Capacity Loss</span>
                        <span className="font-bold text-red-600">{params.failure_pct}%</span>
                      </div>
                      <Slider min={10} max={100} step={10} value={[params.failure_pct]}
                        onValueChange={([v]) => { setParams(p => ({ ...p, failure_pct: v })); resetSim(); }}
                        className="[&>span:first-child]:bg-red-500" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10% (Minor)</span><span>100% (Total)</span>
                      </div>
                    </div>
                  </>
                )}

                {selectedScenario.id === 'price_shock' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Price Change</span>
                      <span className={`font-bold ${params.price_change_pct >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {params.price_change_pct >= 0 ? '+' : ''}{params.price_change_pct}%
                      </span>
                    </div>
                    <Slider min={-50} max={100} step={5} value={[params.price_change_pct]}
                      onValueChange={([v]) => { setParams(p => ({ ...p, price_change_pct: v })); resetSim(); }}
                      className="[&>span:first-child]:bg-amber-500" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>-50%</span><span>+100%</span></div>
                    <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                      Price elasticity of demand: <strong>-0.35</strong> (1% price rise → 0.35% demand fall)
                    </p>
                  </div>
                )}

                {selectedScenario.id === 'seasonal' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quarter</label>
                      <div className="grid grid-cols-4 gap-1">
                        {SEASONS.map(q => (
                          <button key={q}
                            onClick={() => { setParams(p => ({ ...p, season: q })); resetSim(); }}
                            className={`py-1.5 text-sm font-medium rounded-lg border transition-all
                              ${params.season === q
                                ? 'bg-emerald-500 text-white border-emerald-500'
                                : 'border-gray-200 dark:border-gray-700 hover:border-emerald-300'
                              }`}
                          >{q}</button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <p className="font-medium text-emerald-700 dark:text-emerald-300">Seasonal multipliers:</p>
                      {[['Q1','×0.85 (Low)'],['Q2','×1.10 (Rising)'],['Q3','×1.25 (Peak)'],['Q4','×0.95 (Cooling)']].map(([q,m]) => (
                        <div key={q} className={`flex justify-between ${params.season === q ? 'font-bold' : ''}`}>
                          <span>{q}</span><span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {selectedScenario.id === 'logistics_disruption' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Route Cost Increase</span>
                      <span className="font-bold text-violet-600">+{params.route_cost_increase_pct}%</span>
                    </div>
                    <Slider min={5} max={100} step={5} value={[params.route_cost_increase_pct]}
                      onValueChange={([v]) => { setParams(p => ({ ...p, route_cost_increase_pct: v })); resetSim(); }}
                      className="[&>span:first-child]:bg-violet-500" />
                    <div className="flex justify-between text-xs text-muted-foreground"><span>Minor (+5%)</span><span>Severe (+100%)</span></div>
                  </div>
                )}

                <Button
                  onClick={runSimulation}
                  disabled={running}
                  className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
                >
                  {running
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Simulating…</>
                    : <><Play className="w-4 h-4" /> Run Simulation</>
                  }
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── Right: Results ── */}
          <div className="xl:col-span-2 space-y-4">

            {/* Idle / Error state */}
            {!result && !running && !error && (
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <div className="text-6xl mb-4">{scenarioInfo.emoji}</div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Simulate</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Configure your <strong>{scenarioInfo.label}</strong> scenario using the controls on the left,
                    then click <em>Run Simulation</em> to see cascading impact across your pipeline.
                  </p>
                </CardContent>
              </Card>
            )}

            {running && !result && (
              <Card>
                <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-violet-200 animate-spin border-t-violet-600" />
                    <Zap className="w-6 h-6 text-violet-600 absolute inset-0 m-auto" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">Running cascade simulation…</p>
                    <p className="text-sm text-muted-foreground">Propagating through demand → risk → inventory → distribution</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
                <CardContent className="py-8 flex flex-col items-center gap-3">
                  <XCircle className="w-10 h-10 text-red-500" />
                  <div className="text-center">
                    <p className="font-semibold text-red-700 dark:text-red-300">Simulation Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ensure the backend is running at {API_BASE}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetSim}>Try Again</Button>
                </CardContent>
              </Card>
            )}

            {result && (
              <>
                {/* Summary + Severity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="md:col-span-2" style={{ borderColor: severityInfo!.color + '44' }}>
                    <CardContent className="pt-4 pb-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <AlertCircle className="w-5 h-5" style={{ color: severityInfo!.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1">Simulation Summary</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                          {result.data_source === 'mock' && (
                            <Badge variant="outline" className="mt-2 text-xs gap-1">
                              <Info className="w-3 h-3" /> Using mock data — connect backend DB for live results
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Severity Gauge */}
                  <Card className="flex flex-col items-center justify-center py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Severity Score</p>
                    <div className="relative w-28 h-28">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                        <circle
                          cx="50" cy="50" r="40" fill="none"
                          stroke={severityInfo!.color} strokeWidth="10"
                          strokeDasharray={`${(result.severity_score / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-black">{result.severity_score}</span>
                        <span className="text-xs font-medium" style={{ color: severityInfo!.color }}>
                          {severityInfo!.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {SEVERITY_LEVELS.map(l => (
                        <div key={l.label} className={`h-1.5 w-6 rounded-full ${l.bg} ${result.severity_score <= l.max ? 'opacity-100' : 'opacity-30'}`} />
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Stage Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Demand */}
                  <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">DEMAND</span>
                      </div>
                      <p className="text-lg font-black text-indigo-800 dark:text-indigo-200">
                        {result.stages.demand.simulated_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">vs {result.stages.demand.baseline_total.toLocaleString('en-IN', { maximumFractionDigits: 0 })} baseline</p>
                      <DeltaBadge pct={result.stages.demand.delta_pct} />
                    </CardContent>
                  </Card>

                  {/* Risk */}
                  <Card className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-100 dark:border-red-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-700 dark:text-red-300">RISK</span>
                      </div>
                      <p className="text-lg font-black text-red-800 dark:text-red-200">
                        {result.stages.risk.risk_level_changes.length}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">risk escalation(s)</p>
                      {result.stages.risk.risk_level_changes.length > 0
                        ? <Badge variant="destructive" className="text-xs">⚠ Suppliers Impacted</Badge>
                        : <Badge variant="secondary" className="text-xs text-emerald-700 bg-emerald-100">✓ No change</Badge>
                      }
                    </CardContent>
                  </Card>

                  {/* Inventory */}
                  <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-100 dark:border-amber-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">INVENTORY</span>
                      </div>
                      <p className="text-lg font-black text-amber-800 dark:text-amber-200">
                        {result.stages.inventory.stockout_count}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">stockout items</p>
                      <DeltaBadge pct={result.stages.inventory.newly_at_risk * 10} />
                    </CardContent>
                  </Card>

                  {/* Distribution */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Truck className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">DISTRIBUTION</span>
                      </div>
                      <p className="text-lg font-black text-emerald-800 dark:text-emerald-200">
                        {result.stages.distribution.unserviceable_routes}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">affected routes</p>
                      {result.stages.distribution.est_cost_impact_inr > 0 && (
                        <p className="text-xs font-medium text-red-600">
                          ₹{(result.stages.distribution.est_cost_impact_inr / 100000).toFixed(1)}L impact
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Demand Chart */}
                {demandChartData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-500" />
                        Demand: Baseline vs Simulated
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={demandChartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <RechartTooltip
                            contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                            formatter={(v: number) => [v.toLocaleString('en-IN'), '']}
                          />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="Baseline" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Simulated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Bottom detail panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inventory status changes */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-500" />
                        Inventory Status Changes
                        {result.stages.inventory.status_changes.length > 0 && (
                          <Badge variant="destructive" className="text-xs ml-auto">
                            {result.stages.inventory.status_changes.length} affected
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {result.stages.inventory.status_changes.length === 0 ? (
                        <div className="flex items-center gap-2 py-4 justify-center text-emerald-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm">No status changes — inventory stable</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {result.stages.inventory.status_changes.map((sc, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-gray-50 dark:bg-white/5">
                              <span className="font-mono font-semibold truncate max-w-[80px]" title={sc.product_id}>{sc.product_id}</span>
                              <span className="text-gray-400 text-xs">{sc.warehouse}</span>
                              <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                                <StatusPill status={sc.from} />
                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                <StatusPill status={sc.to} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Summary counts */}
                      <div className="flex gap-2 mt-3 pt-3 border-t">
                        {[
                          { label: 'Healthy', count: result.stages.inventory.healthy_count, cls: 'bg-emerald-100 text-emerald-700' },
                          { label: 'Reorder', count: result.stages.inventory.reorder_count, cls: 'bg-amber-100 text-amber-700' },
                          { label: 'Stockout', count: result.stages.inventory.stockout_count, cls: 'bg-red-100 text-red-700' },
                        ].map(s => (
                          <div key={s.label} className={`flex-1 text-center rounded-lg py-1 ${s.cls}`}>
                            <p className="text-base font-black">{s.count}</p>
                            <p className="text-xs">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk + Distribution detail */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-500" />
                        Risk & Distribution Detail
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {/* Risk escalations */}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Risk Escalations</p>
                        {result.stages.risk.risk_level_changes.length === 0 ? (
                          <div className="flex items-center gap-2 text-emerald-600 text-sm">
                            <CheckCircle2 className="w-4 h-4" /> No supplier risk escalations
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {result.stages.risk.risk_level_changes.map((r, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                                <span className="font-semibold truncate max-w-[100px]">{r.supplier}</span>
                                <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                                  <StatusPill status={r.from} />
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <StatusPill status={r.to} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Distribution */}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Distribution Impact</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Unserviceable Routes</span>
                            <span className={`font-bold ${result.stages.distribution.unserviceable_routes > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {result.stages.distribution.unserviceable_routes}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Cost Increase</span>
                            <span className={`font-bold ${result.stages.distribution.cost_increase_pct > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                              +{result.stages.distribution.cost_increase_pct}%
                            </span>
                          </div>
                          {result.stages.distribution.est_cost_impact_inr > 0 && (
                            <div className="flex justify-between">
                              <span>Est. Cost Impact</span>
                              <span className="font-bold text-red-700">
                                ₹{(result.stages.distribution.est_cost_impact_inr / 100000).toFixed(2)}L
                              </span>
                            </div>
                          )}
                          {result.stages.distribution.affected_regions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.stages.distribution.affected_regions.map(r => (
                                <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
                              ))}
                            </div>
                          )}
                          {result.stages.distribution.unserviceable_routes === 0 && result.stages.distribution.cost_increase_pct === 0 && (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" /> All routes serviceable
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
