import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { getSupplierDetailById } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const colorMap: Record<string, string> = { in_stock: 'bg-green-100 text-green-700', low_stock: 'bg-yellow-100 text-yellow-700', out_of_stock: 'bg-red-100 text-red-700' };

export default function SupplierPortalDetail() {
  const { supplierId } = useParams();
  const [data, setData] = useState<any>(null);
  const [sortBy, setSortBy] = useState('material_name');

  useEffect(() => {
    if (supplierId) getSupplierDetailById(Number(supplierId)).then(setData);
  }, [supplierId]);

  const materials = useMemo(() => {
    const list = [...(data?.materials || [])];
    list.sort((a, b) => String(a[sortBy] || '').localeCompare(String(b[sortBy] || '')));
    return list;
  }, [data, sortBy]);

  if (!data) return <AuthenticatedShell><p>Loading...</p></AuthenticatedShell>;

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <Card className="p-5">
          <h1 className="text-2xl font-bold">{data.company_name}</h1>
          <p className="text-muted-foreground">{data.short_bio}</p>
          <p>{data.phone} · {data.support_email}</p>
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
