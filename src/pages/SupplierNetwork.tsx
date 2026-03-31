import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNetworkSuppliers } from '@/lib/api';

export default function SupplierNetwork() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    const data = await getNetworkSuppliers(search);
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">My Network</h1>
        <div className="flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} /><Button onClick={load}>Search</Button></div>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((s) => (
            <Card key={s.supplier_id} className="p-4">
              <Link to={`/suppliers/${s.supplier_id}`} className="font-semibold hover:underline">{s.company_legal_name}</Link>
              <p className="text-sm text-muted-foreground">{s.company_overview}</p>
              <Badge className="mt-2">Active</Badge>
            </Card>
          ))}
        </div>
      </div>
    </AuthenticatedShell>
  );
}
