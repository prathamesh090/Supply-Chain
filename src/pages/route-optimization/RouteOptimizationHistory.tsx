import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Card, CardContent } from '@/components/ui/card';
import { getRouteHistory } from '@/lib/api';

export default function RouteOptimizationHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { getRouteHistory().then((d) => setOrders(d.orders ?? [])); }, []);

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Route Optimization History</h2>
        <Card><CardContent className="p-4 space-y-2">
          {orders.map((o) => (
            <div key={o.order_id} className="grid grid-cols-5 text-sm border-b pb-2">
              <span>{o.order_id}</span>
              <span>{o.fulfillment_status}</span>
              <span>{o.total_allocated}</span>
              <span>₹{Number(o.total_cost || 0).toFixed(2)}</span>
              <Link className="text-primary" to={`/route-optimization/plan/${o.order_id}`}>Open</Link>
            </div>
          ))}
        </CardContent></Card>
      </div>
    </AuthenticatedShell>
  );
}
