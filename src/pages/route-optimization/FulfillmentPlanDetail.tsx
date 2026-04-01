import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { getRouteChartData, getRouteExplain, getRouteKpis, getRoutePlan } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { WarehouseAllocationTable } from '@/components/route-optimization/WarehouseAllocationTable';
import { ExplainabilityPanel } from '@/components/route-optimization/ExplainabilityPanel';
import { RouteOptimizationCharts } from '@/components/route-optimization/RouteOptimizationCharts';

export default function FulfillmentPlanDetail() {
  const { orderId = '' } = useParams();
  const [plan, setPlan] = useState<any>(null);
  const [kpis, setKpis] = useState<any>(null);
  const [explain, setExplain] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;
    getRoutePlan(orderId).then(setPlan);
    getRouteKpis(orderId).then(setKpis);
    getRouteExplain(orderId).then(setExplain);
    getRouteChartData(orderId).then(setCharts);
  }, [orderId]);

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Fulfillment Plan Detail • {orderId}</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {kpis && [
            ['Requested', kpis.requested_quantity],
            ['Allocated', kpis.allocated_quantity],
            ['Shortage', kpis.shortage],
            ['Status', kpis.status],
          ].map(([k,v])=> <Card key={String(k)}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{k}</p><p className="font-bold">{v}</p></CardContent></Card>)}
        </div>
        {plan && <WarehouseAllocationTable allocations={plan.allocations ?? []} />}
        {charts && <Card><CardContent className="p-4"><RouteOptimizationCharts {...charts} /></CardContent></Card>}
        {explain && <ExplainabilityPanel explanation={explain.explanation ?? []} />}
      </div>
    </AuthenticatedShell>
  );
}
