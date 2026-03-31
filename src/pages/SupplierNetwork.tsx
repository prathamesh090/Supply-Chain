import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNetworkSuppliers } from '@/lib/api';

type SupplierRow = {
  supplier_id: number;
  company_legal_name: string;
  company_overview?: string;
};

export default function SupplierNetwork() {
  const [items, setItems] = useState<SupplierRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNetworkSuppliers(search);
      setItems(data as SupplierRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load network suppliers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">My Network</h1>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Connected Suppliers</p><p className="text-2xl font-semibold">{items.length}</p></Card>
        <div className="flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search connected suppliers" /><Button onClick={load}>Search</Button></div>

        {loading && <p className="text-sm text-muted-foreground">Loading connected suppliers...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && items.length === 0 && <p className="text-sm text-muted-foreground">No connected suppliers yet.</p>}

        {!loading && !error && (
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((s) => (
              <Card key={s.supplier_id} className="p-4">
                <Link to={`/suppliers/${s.supplier_id}`} className="font-semibold hover:underline">{s.company_legal_name}</Link>
                <p className="text-sm text-muted-foreground line-clamp-2">{s.company_overview || 'No description yet.'}</p>
                <Badge className="mt-2">Active</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedShell>
  );
}
