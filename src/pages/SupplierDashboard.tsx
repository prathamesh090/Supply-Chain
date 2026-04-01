import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getSupplierProducts, getSupplierProfile } from '@/lib/api';

type Material = {
  id: number;
  material_name: string;
  category?: string;
  technical_specifications?: string;
  lead_time_days?: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
};

const statusLabel: Record<string, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
};

export default function SupplierDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [profileRes, materialRes] = await Promise.all([
          getSupplierProfile().catch(() => null),
          getSupplierProducts().catch(() => []),
        ]);
        setProfile(profileRes);
        setMaterials(Array.isArray(materialRes) ? materialRes : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const lowStockCount = useMemo(() => materials.filter((m) => m.stock_status !== 'in_stock').length, [materials]);

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Supplier Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome {profile?.contact_person || profile?.company_legal_name || 'Supplier'}.</p>
          </div>
          <Link to="/supplier/settings"><Button variant="outline">Edit Profile</Button></Link>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading dashboard...</p>}

        {!loading && (
          <>
            <div className="grid md:grid-cols-3 gap-3">
              <Card className="p-4"><p className="text-xs text-muted-foreground">Company</p><p className="text-lg font-semibold">{profile?.company_legal_name || 'Not set'}</p></Card>
              <Card className="p-4"><p className="text-xs text-muted-foreground">Profile Status</p><p className="text-lg font-semibold">{profile?.profile_completed ? 'Complete' : 'Incomplete'}</p></Card>
              <Card className="p-4"><p className="text-xs text-muted-foreground">Materials Listed</p><p className="text-lg font-semibold">{materials.length} ({lowStockCount} alerts)</p></Card>
            </div>

            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-3">Material Catalog</h2>
              {materials.length === 0 ? (
                <p className="text-sm text-muted-foreground">No materials yet. Add materials from your supplier portal flow.</p>
              ) : (
                <div className="space-y-2">
                  {materials.map((m) => (
                    <div key={m.id} className="border rounded p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{m.material_name}</p>
                        <p className="text-xs text-muted-foreground">{m.category || 'Uncategorized'} • {m.technical_specifications || 'No specs provided'}</p>
                      </div>
                      <Badge variant={m.stock_status === 'in_stock' ? 'default' : 'outline'}>{statusLabel[m.stock_status]}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AuthenticatedShell>
  );
}
