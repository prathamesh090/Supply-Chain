import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  TrendingUp, AlertTriangle, Package, Truck,
  Play, RotateCcw, ChevronRight, Loader2, DollarSign, Cloud, Zap
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export interface SimParams {
  surge_pct: number;
  failure_pct: number;
  supplier_name: string | null;
  price_change_pct: number;
  season: string | null;
  seasonal_multiplier: number;
  route_cost_increase_pct: number;
}

export interface SimResult {
  scenario_type: string;
  parameters: SimParams;
  stages: {
    demand: any;
    risk: any;
    inventory: any;
    distribution: any;
  };
  severity_score: number;
  summary: string;
  data_source: string;
}

const ALL_SCENARIOS = [
  {
    id: 'demand_spike',
    label: 'Demand Surge',
    icon: TrendingUp,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-purple-600',
    desc: 'Sudden spike in customer demand',
    emoji: '🚀',
    features: ['demand', 'inventory']
  },
  {
    id: 'supplier_failure',
    label: 'Supplier Failure',
    icon: AlertTriangle,
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-600',
    desc: 'Key supplier loses production capacity',
    emoji: '💥',
    features: ['risk', 'inventory']
  },
  {
    id: 'price_shock',
    label: 'Price Shock',
    icon: DollarSign,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    desc: 'Raw material price shift',
    emoji: '💰',
    features: ['demand']
  },
  {
    id: 'seasonal',
    label: 'Seasonal Shift',
    icon: Cloud,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    desc: 'Quarterly pattern override',
    emoji: '🌦️',
    features: ['demand']
  },
  {
    id: 'logistics_disruption',
    label: 'Logistics Disruption',
    icon: Truck,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-700',
    desc: 'Route cost spike',
    emoji: '🚚',
    features: ['route', 'inventory']
  },
];

interface MiniScenarioSimulatorProps {
  feature: 'demand' | 'inventory' | 'risk' | 'route';
  onResult: (result: SimResult | null) => void;
  onSimulationStart?: () => void;
}

export function MiniScenarioSimulator({ feature, onResult, onSimulationStart }: MiniScenarioSimulatorProps) {
  const filteredScenarios = ALL_SCENARIOS.filter(s => s.features.includes(feature));
  const [selectedScenario, setSelectedScenario] = useState(filteredScenarios[0]);
  const [params, setParams] = useState<SimParams>({
    surge_pct: 30, failure_pct: 70, supplier_name: null,
    price_change_pct: 25, season: 'Q3', seasonal_multiplier: 1.0,
    route_cost_increase_pct: 40,
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/scenario/suppliers`)
      .then(r => r.json())
      .then(data => {
        setSuppliers(Array.isArray(data) ? data : []);
        if (data.length > 0) setParams(p => ({ ...p, supplier_name: data[0].name }));
      })
      .catch(() => {
        const fallback = ['Alpha_Polymers', 'Delta_Logistics', 'Sigma_Plastics'];
        setSuppliers(fallback.map(n => ({ name: n, current_risk: 'Low' })));
        setParams(p => ({ ...p, supplier_name: fallback[0] }));
      });
  }, []);

  const runSimulation = useCallback(async () => {
    setRunning(true);
    onResult(null);
    if (onSimulationStart) onSimulationStart();

    try {
      const res = await fetch(`${API_BASE}/scenario/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_type: selectedScenario.id, parameters: params }),
      });
      if (!res.ok) throw new Error('Simulation failed');
      const data: SimResult = await res.json();
      onResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  }, [selectedScenario, params, onResult, onSimulationStart]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Select Scenario</label>
          <div className="grid grid-cols-1 gap-2">
            {filteredScenarios.map(s => {
              const Icon = s.icon;
              const active = selectedScenario.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelectedScenario(s); onResult(null); }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all
                    ${active ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-accent'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${s.gradient}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{s.desc}</p>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 text-primary ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-4 bg-muted/30 p-4 rounded-xl border border-dashed">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{selectedScenario.emoji}</span>
            <span className="text-sm font-bold uppercase tracking-wider">Parameters</span>
          </div>

          {selectedScenario.id === 'demand_spike' && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span>Surge Intensity</span>
                <span className="text-primary">+{params.surge_pct}%</span>
              </div>
              <Slider min={5} max={100} step={5} value={[params.surge_pct]} 
                onValueChange={([v]) => { setParams(p => ({ ...p, surge_pct: v })); onResult(null); }} />
            </div>
          )}

          {selectedScenario.id === 'supplier_failure' && (
            <div className="space-y-3">
              <select 
                className="w-full text-xs p-2 rounded-md border bg-background"
                value={params.supplier_name || ''}
                onChange={e => { setParams(p => ({ ...p, supplier_name: e.target.value })); onResult(null); }}
              >
                {suppliers.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <div className="flex justify-between text-xs font-medium">
                <span>Loss Impact</span>
                <span className="text-destructive">{params.failure_pct}%</span>
              </div>
              <Slider min={10} max={100} step={10} value={[params.failure_pct]} 
                onValueChange={([v]) => { setParams(p => ({ ...p, failure_pct: v })); onResult(null); }} />
            </div>
          )}

          {selectedScenario.id === 'price_shock' && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span>Price Delta</span>
                <span className={params.price_change_pct > 0 ? "text-destructive" : "text-emerald-600"}>
                  {params.price_change_pct}%
                </span>
              </div>
              <Slider min={-30} max={50} step={5} value={[params.price_change_pct]} 
                onValueChange={([v]) => { setParams(p => ({ ...p, price_change_pct: v })); onResult(null); }} />
            </div>
          )}

          {selectedScenario.id === 'logistics_disruption' && (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium">
                <span>Cost Escalation</span>
                <span className="text-violet-600">+{params.route_cost_increase_pct}%</span>
              </div>
              <Slider min={5} max={100} step={5} value={[params.route_cost_increase_pct]} 
                onValueChange={([v]) => { setParams(p => ({ ...p, route_cost_increase_pct: v })); onResult(null); }} />
            </div>
          )}

          <Button 
            className="w-full h-9 gap-2 shadow-md" 
            onClick={runSimulation}
            disabled={running}
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Calculating...' : 'Run Simulation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
