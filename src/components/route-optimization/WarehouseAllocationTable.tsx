import { Badge } from '@/components/ui/badge';
import type { RoAllocation } from '@/lib/api';

export function WarehouseAllocationTable({ allocations }: { allocations: RoAllocation[] }) {
  return (
    <div className="rounded-xl border overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3">Product</th>
            <th className="text-left p-3">Warehouse</th>
            <th className="text-left p-3">Allocated</th>
            <th className="text-left p-3">Distance</th>
            <th className="text-left p-3">Cost</th>
            <th className="text-left p-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {allocations.map((a, i) => (
            <tr key={`${a.product_id}-${a.warehouse_id}-${i}`} className="border-t">
              <td className="p-3"><Badge variant="outline">{a.product_id}</Badge></td>
              <td className="p-3">{a.warehouse_id}</td>
              <td className="p-3">{a.allocated_quantity}</td>
              <td className="p-3">{a.distance_km} km</td>
              <td className="p-3">₹{a.transport_cost}</td>
              <td className="p-3 text-muted-foreground">{a.decision_reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
