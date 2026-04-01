import { useState } from 'react';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { runRouteOptimization } from '@/lib/api';
import { WarehouseAllocationTable } from '@/components/route-optimization/WarehouseAllocationTable';
import { DecisionSummaryPanel } from '@/components/route-optimization/DecisionSummaryPanel';

export default function RouteOptimizationRunPage() {
  const [orderId, setOrderId] = useState('');
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!orderId.trim()) return;
    const data = await runRouteOptimization(orderId.trim());
    setResult(data);
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-5">
        <h2 className="text-2xl font-bold">Generate Fulfillment Plan</h2>
        <Card><CardContent className="p-4 flex gap-2">
          <Input placeholder="Enter order id" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          <Button onClick={run}>Run Optimization</Button>
        </CardContent></Card>

        {result && (
          <div className="space-y-4">
            <Card><CardContent className="p-4 text-sm">Status: <span className="font-semibold">{result.status}</span> • Shortage: {result.shortage ?? 0}</CardContent></Card>
            <WarehouseAllocationTable allocations={result.allocations ?? []} />
            <DecisionSummaryPanel decisionSummary={result.decision_summary ?? []} />
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}
