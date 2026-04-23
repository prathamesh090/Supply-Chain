import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { getSupplierDetailById, updateSupplierRiskDetails } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { 
  ShieldCheck, Clock, Award, MessageSquare, 
  ChevronRight, TrendingUp, AlertTriangle, FileText
} from 'lucide-react';
import ProcurementModal from '@/components/ProcurementModal';
import { Separator } from '@/components/ui/separator';

const colorMap: Record<string, string> = { in_stock: 'bg-green-100 text-green-700', low_stock: 'bg-yellow-100 text-yellow-700', out_of_stock: 'bg-red-100 text-red-700' };

export default function SupplierPortalDetail() {
  const { supplierId } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('material_name');
  const [procurementModal, setProcurementModal] = useState(false);
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
        <Card className="p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16" />
          <div className="flex flex-col md:flex-row justify-between gap-6 relative">
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{data.company_name}</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl">{data.company_overview || data.short_bio || 'No company overview provided.'}</p>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Established 2014</div>
                <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> V4.2 Certified</div>
                <div className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-blue-500" /> High Reliability</div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button size="lg" className="px-8 bg-gradient-to-r from-primary to-indigo-600 font-bold" onClick={() => setProcurementModal(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Request Quote
                </Button>
                <Button variant="outline" size="lg">Send Message</Button>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-4">
              <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overall Trust Score</span>
                  <span className="text-3xl font-black text-primary">{data.trust_score || 85}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: `${data.trust_score || 85}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.trust_breakdown || {}).map(([key, val]: [string, any]) => (
                  <div key={key} className="p-2 rounded-lg border bg-card/50">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold truncate mb-1">{key.replace('_', ' ')}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold">{val}%</div>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6 bg-muted/30 border-dashed">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Simulate Performance Scenarios</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Expert Mode: Adjust parameters below to see how this supplier's risk score would react to various performance shifts.</p>
          <div className="grid md:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Delay Days</label>
              <Input type="number" placeholder="Delay days" value={riskForm.delivery_delay_days} onChange={(e) => setRiskForm((p) => ({ ...p, delivery_delay_days: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Defect %</label>
              <Input type="number" placeholder="Defect %" value={riskForm.defect_rate_pct} onChange={(e) => setRiskForm((p) => ({ ...p, defect_rate_pct: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Price Var %</label>
              <Input type="number" placeholder="Price variance %" value={riskForm.price_variance_pct} onChange={(e) => setRiskForm((p) => ({ ...p, price_variance_pct: Number(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Seed Score</label>
              <Input type="number" placeholder="Trust score" value={riskForm.trust_score} onChange={(e) => setRiskForm((p) => ({ ...p, trust_score: Number(e.target.value) || 0 }))} />
            </div>
            <Button className="mt-auto" onClick={async () => {
              try {
                await updateSupplierRiskDetails({ supplier_id: Number(supplierId), ...riskForm, plastic_type: data?.categories || 'Unknown' });
                toast({ title: 'Performance data updated' });
              } catch (e) {
                toast({ title: 'Update failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
              }
            }}>Run Scenarios</Button>
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
        <ProcurementModal 
          isOpen={procurementModal}
          onClose={() => setProcurementModal(false)}
          supplierId={Number(supplierId)}
          supplierName={data.company_name}
        />
      </div>
    </AuthenticatedShell>
  );
}
