import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { getSupplierDetailById, updateSupplierRiskDetails } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

const colorMap: Record<string, string> = { in_stock: 'bg-green-100 text-green-700', low_stock: 'bg-yellow-100 text-yellow-700', out_of_stock: 'bg-red-100 text-red-700' };

export default function SupplierPortalDetail() {
  const { supplierId } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('material_name');
  const [riskForm, setRiskForm] = useState({ delivery_delay_days: 0, defect_rate_pct: 0, price_variance_pct: 0, trust_score: 50, compliance: 'No' });

  useEffect(() => {
    if (!supplierId) return;
    getSupplierDetailById(Number(supplierId)).then(setData).catch((e) => setError(e instanceof Error ? e.message : 'Failed to load supplier'));
  }, [supplierId]);

  const materials = useMemo(() => {
    const list = [...(data?.materials || [])];
    list.sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')));
    return list;
  }, [data, sortBy]);

  if (error) return <AuthenticatedShell><p className="text-red-600">{error}</p></AuthenticatedShell>;
  if (!data) return <AuthenticatedShell><p>Loading...</p></AuthenticatedShell>;

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <Card className="p-5">
          <h1 className="text-2xl font-bold">{data.company_name}</h1>
          <p className="text-muted-foreground">{data.short_bio || 'No company overview provided.'}</p>
          <p>{data.phone || 'Phone unavailable'} · {data.support_email || 'Email unavailable'}</p>
          <p className="text-sm text-muted-foreground">{[data.city, data.state, data.country].filter(Boolean).join(', ') || 'Location unavailable'}</p>
          <p className="text-sm">{data.categories || 'Categories not provided'}</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-semibold mb-3">Risk Input Details</h2>
          <p className="text-sm text-muted-foreground mb-3">Add connected supplier operating metrics to calculate a better risk score.</p>
          <div className="grid md:grid-cols-5 gap-3">
            <Input type="number" placeholder="Delay days" value={riskForm.delivery_delay_days} onChange={(e) => setRiskForm((p) => ({ ...p, delivery_delay_days: Number(e.target.value) || 0 }))} />
            <Input type="number" placeholder="Defect %" value={riskForm.defect_rate_pct} onChange={(e) => setRiskForm((p) => ({ ...p, defect_rate_pct: Number(e.target.value) || 0 }))} />
            <Input type="number" placeholder="Price variance %" value={riskForm.price_variance_pct} onChange={(e) => setRiskForm((p) => ({ ...p, price_variance_pct: Number(e.target.value) || 0 }))} />
            <Input type="number" placeholder="Trust score" value={riskForm.trust_score} onChange={(e) => setRiskForm((p) => ({ ...p, trust_score: Number(e.target.value) || 0 }))} />
            <Button onClick={async () => {
              try {
                await updateSupplierRiskDetails({ supplier_id: Number(supplierId), ...riskForm, plastic_type: data?.categories || 'Unknown' });
                toast({ title: 'Risk details saved' });
              } catch (e) {
                toast({ title: 'Save failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
              }
            }}>Save Risk Inputs</Button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex justify-between items-center mb-3"><h2 className="text-xl font-semibold">Raw Materials Catalog</h2>
            <select className="border rounded px-2 py-1" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="material_name">Material Name</option><option value="category">Category</option><option value="lead_time_days">Lead Time</option>
            </select>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b"><th>Material Name</th><th>Category</th><th>Technical Specifications</th><th>Lead Time</th><th>Live Stock Status</th></tr></thead>
              <tbody>{materials.map((m:any)=> <tr key={m.id} className="border-b"><td>{m.material_name}</td><td>{m.category}</td><td>{m.technical_specifications}</td><td>{m.lead_time_days} days</td><td><Badge className={colorMap[m.stock_status] || ''}>{m.stock_status}</Badge></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      </div>
    </AuthenticatedShell>
  );
}
