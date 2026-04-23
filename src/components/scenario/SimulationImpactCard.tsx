import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Package, 
  Truck, ArrowRight, Shield, AlertCircle
} from 'lucide-react';

interface Props {
  stage: 'demand' | 'inventory' | 'risk' | 'distribution';
  data: any;
  severity: number;
}

const DeltaBadge = ({ pct }: { pct: number }) => {
  if (Math.abs(pct) < 0.1) return <span className="text-muted-foreground text-xs font-medium">No change</span>;
  const positive = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{pct.toFixed(1)}%
    </span>
  );
};

export function SimulationImpactCard({ stage, data, severity }: Props) {
  if (!data) return null;

  const renderContent = () => {
    switch (stage) {
      case 'demand':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-black">{data.simulated_total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Projected Units</p>
              </div>
              <DeltaBadge pct={data.delta_pct} />
            </div>
            <div className="space-y-2 pt-2 border-t text-sm">
              <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Top Affected Products</p>
              {data.breakdown?.slice(0, 3).map((b: any) => (
                <div key={b.product_id} className="flex justify-between items-center">
                  <span className="truncate max-w-[120px] font-mono">{b.product_id}</span>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground line-through decoration-muted-foreground/30">{Math.round(b.baseline)}</span>
                    <span className="font-bold">{Math.round(b.simulated)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                 <p className="text-2xl font-black text-red-700">{data.stockout_count}</p>
                 <p className="text-[10px] font-bold text-red-600 uppercase">Stockout Risks</p>
               </div>
               <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                 <p className="text-2xl font-black text-amber-700">{data.reorder_count}</p>
                 <p className="text-[10px] font-bold text-amber-600 uppercase">Reorders Needed</p>
               </div>
             </div>
             <div className="space-y-2 pt-2 border-t text-sm">
               {data.status_changes?.slice(0, 2).map((sc: any, i: number) => (
                 <div key={i} className="flex items-center gap-2 bg-muted/30 p-2 rounded text-[11px]">
                   <span className="font-bold">{sc.product_id}</span>
                   <span className="text-muted-foreground ml-auto">{sc.from}</span>
                   <ArrowRight className="w-3 h-3" />
                   <span className="text-destructive font-bold">{sc.to}</span>
                 </div>
               ))}
             </div>
          </div>
        );
      case 'risk':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-black text-red-700">{data.risk_level_changes?.length || 0}</p>
                <p className="text-xs font-bold text-red-600 uppercase">Risk Escalations</p>
              </div>
            </div>
            <div className="space-y-2">
              {data.risk_level_changes?.map((r: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-xs p-2 bg-muted/30 rounded border">
                  <span className="font-bold">{r.supplier}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">{r.from}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-destructive font-bold">{r.to}</span>
                  </div>
                </div>
              ))}
              {(!data.risk_level_changes || data.risk_level_changes.length === 0) && (
                <div className="text-center py-4 text-emerald-600 text-sm font-medium">
                  No direct risk escalations detected
                </div>
              )}
            </div>
          </div>
        );
      case 'distribution':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-black text-violet-600">₹{(data.est_cost_impact_inr / 100000).toFixed(1)}L</p>
                <p className="text-sm text-muted-foreground">Estimated Cost Impact</p>
              </div>
              <Badge variant="outline" className="text-violet-600 border-violet-200">+{data.cost_increase_pct}% Cost</Badge>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Unserviceable Routes</span>
                <span className="font-bold text-destructive">{data.unserviceable_routes}</span>
              </div>
              {data.affected_regions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.affected_regions.map((r: string) => (
                    <span key={r} className="text-[10px] px-1.5 py-0.5 bg-background border rounded text-muted-foreground">{r}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getHeaderInfo = () => {
    switch (stage) {
      case 'demand': return { title: 'Demand Impact', icon: TrendingUp, color: 'text-indigo-500' };
      case 'inventory': return { title: 'Inventory Health', icon: Package, color: 'text-amber-500' };
      case 'risk': return { title: 'Network Risk', icon: Shield, color: 'text-red-500' };
      case 'distribution': return { title: 'Logistics Impact', icon: Truck, color: 'text-violet-500' };
    }
  };

  const info = getHeaderInfo();

  return (
    <Card className={`border shadow-lg ${severity > 70 ? 'ring-2 ring-destructive/20 border-destructive/30' : 'border-primary/10'}`}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <info.icon className={`w-4 h-4 ${info.color}`} />
          {info.title}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <AlertCircle className={`w-3.5 h-3.5 ${severity > 50 ? 'text-orange-500' : 'text-emerald-500'}`} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Impact Score: {severity}</span>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
