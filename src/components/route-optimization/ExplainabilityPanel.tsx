export function ExplainabilityPanel({ explanation }: { explanation: Array<{step?:number; warehouse_id:string; product_id?:string; reason:string; allocated_quantity:number}> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {explanation.map((e, idx) => (
        <div key={idx} className="rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground">Why this warehouse?</p>
          <p className="font-semibold">W{e.warehouse_id} • {e.product_id}</p>
          <p className="text-sm mt-1">{e.reason}</p>
          <p className="text-sm mt-2">Allocated: <span className="font-medium">{e.allocated_quantity}</span></p>
        </div>
      ))}
    </div>
  );
}
