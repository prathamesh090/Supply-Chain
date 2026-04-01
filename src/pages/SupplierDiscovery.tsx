import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { connectSupplier, getDiscoverySuppliers } from '@/lib/api';

type SupplierRow = {
  supplier_id: number;
  company_legal_name: string;
  company_overview?: string;
  city?: string;
  manufacturing_state?: string;
  country?: string;
  categories?: string;
  connection_status: 'active' | 'pending' | 'none';
};

export default function SupplierDiscovery() {
  const [items, setItems] = useState<SupplierRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDiscoverySuppliers(search);
      setItems(data as SupplierRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const connectedCount = useMemo(() => items.filter((s) => s.connection_status === 'active').length, [items]);

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Find New Suppliers</h1>

        <div className="grid md:grid-cols-3 gap-3">
          <Card className="p-4"><p className="text-xs text-muted-foreground">Total Suppliers</p><p className="text-2xl font-semibold">{items.length}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Connected Suppliers</p><p className="text-2xl font-semibold">{connectedCount}</p></Card>
          <Card className="p-4"><p className="text-xs text-muted-foreground">Available to Connect</p><p className="text-2xl font-semibold">{items.length - connectedCount}</p></Card>
        </div>

        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search suppliers by company or overview" />
          <Button onClick={load}>Search</Button>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading supplier directory...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="text-sm text-muted-foreground">No suppliers found.</p>}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((s) => (
              <Card key={s.supplier_id} className="p-4 space-y-3">
                <Link className="font-semibold text-lg hover:underline" to={`/suppliers/${s.supplier_id}`}>{s.company_legal_name || `Supplier ${s.supplier_id}`}</Link>
                <p className="text-sm text-muted-foreground line-clamp-2">{s.company_overview || 'No description yet.'}</p>
                <p className="text-xs text-muted-foreground">{[s.city, s.manufacturing_state, s.country].filter(Boolean).join(', ') || 'Location not set'}</p>
                <p className="text-xs">{s.categories || 'Categories not set'}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={s.connection_status === 'active' ? 'default' : 'outline'}>{s.connection_status === 'active' ? 'Connected' : 'Not Connected'}</Badge>
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
