import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { getRouteDashboardSummary, getRouteHistory } from '@/lib/api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function RouteOptimizationDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    getRouteDashboardSummary().then(setSummary).catch(() => setSummary(null));
    getRouteHistory().then((d) => setHistory(d.orders ?? [])).catch(() => setHistory([]));
  }, []);

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Route Optimization</h2><Link to="/route-optimization/run"><Button>Generate Plan</Button></Link></div>
        <div className="grid md:grid-cols-5 gap-4">
          {[
            ['Total Orders', summary?.total_orders ?? 0],
            ['Fully Fulfilled', summary?.fully_fulfilled ?? 0],
            ['Partially Fulfilled', summary?.partially_fulfilled ?? 0],
            ['Infeasible', summary?.infeasible_orders ?? 0],
            ['Avg Fulfillment %', summary?.average_fulfillment_rate ?? 0],
          ].map(([k, v]) => <Card key={String(k)}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{k}</p><p className="text-2xl font-bold">{v}</p></CardContent></Card>)}
        </div>
        <Card><CardContent className="p-4 space-y-3">
          <p className="font-semibold">Recent Fulfillment History</p>
          {history.slice(0, 10).map((h) => <div key={h.order_id} className="flex justify-between text-sm border-b pb-2"><span>{h.order_id}</span><span>{h.fulfillment_status}</span><span>₹{Number(h.total_cost || 0).toFixed(2)}</span><Link to={`/route-optimization/plan/${h.order_id}`} className="text-primary">View</Link></div>)}
        </CardContent></Card>
      </div>
    </AuthenticatedShell>
  );
}
