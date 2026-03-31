import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { connectSupplier, getDiscoverySuppliers } from '@/lib/api';

export default function SupplierDiscovery() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getDiscoverySuppliers(search);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Find New Suppliers</h1>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers" />
          <Button onClick={load}>Search</Button>
        </div>
        {loading ? <p>Loading...</p> : (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((s) => (
              <Card key={s.supplier_id} className="p-4 space-y-3">
                <Link className="font-semibold text-lg hover:underline" to={`/suppliers/${s.supplier_id}`}>{s.company_legal_name || `Supplier ${s.supplier_id}`}</Link>
                <p className="text-sm text-muted-foreground">{s.company_overview || 'No description yet.'}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{s.connection_status}</Badge>
                  <Button disabled={s.connection_status === 'active'} onClick={async () => { await connectSupplier(s.supplier_id); await load(); }}>
                    {s.connection_status === 'active' ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}
