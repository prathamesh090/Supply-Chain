import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ProcurementModal from '@/components/ProcurementModal';
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
  trust_score?: number;
  trust_breakdown?: {
    reliability: number;
    quality: number;
    response_time: number;
    verification: number;
  };
};

export default function SupplierDiscovery() {
  const [items, setItems] = useState<SupplierRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [procurementModal, setProcurementModal] = useState<{ isOpen: boolean; id: number; name: string }>({ 
    isOpen: false, id: 0, name: '' 
  });

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
          <div className="grid md:grid-cols-2 gap-4 relative pb-20">
            {items.map((s) => (
              <Card key={s.supplier_id} className={`p-4 space-y-3 transition-all border-2 ${selectedIds.includes(s.supplier_id) ? 'border-primary bg-primary/5' : 'border-transparent'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedIds.includes(s.supplier_id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, s.supplier_id]);
                        else setSelectedIds(selectedIds.filter(id => id !== s.supplier_id));
                      }}
                    />
                    <Link className="font-semibold text-lg hover:underline" to={`/suppliers/${s.supplier_id}`}>{s.company_legal_name || `Supplier ${s.supplier_id}`}</Link>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{s.trust_score || 70}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Trust Score</div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">{s.company_overview || 'No description yet.'}</p>
                
                <div className="grid grid-cols-4 gap-1 pt-2">
                  {Object.entries(s.trust_breakdown || {}).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${val}%` }} />
                      </div>
                      <div className="text-[8px] text-muted-foreground uppercase truncate">{key.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground pt-2 font-medium">{[s.city, s.manufacturing_state, s.country].filter(Boolean).join(', ') || 'Location not set'}</p>
                
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant={s.connection_status === 'active' ? 'default' : 'outline'}>{s.connection_status === 'active' ? 'Connected' : 'Not Connected'}</Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="ml-auto"
                    onClick={() => setProcurementModal({ isOpen: true, id: s.supplier_id, name: s.company_legal_name })}
                  >
                    Request Quote
                  </Button>
                  <Button variant={s.connection_status === 'active' ? 'outline' : 'default'} size="sm" disabled={s.connection_status === 'active'} onClick={async () => { await connectSupplier(s.supplier_id); await load(); }}>
                    {s.connection_status === 'active' ? 'Connected' : 'Connect'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedIds.length >= 2 && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
            >
              <Card className="bg-primary text-primary-foreground px-6 py-4 flex items-center gap-6 shadow-2xl rounded-full border-none">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{selectedIds.length}</span>
                  <span className="text-sm opacity-80 font-medium">suppliers selected</span>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <Button 
                  className="bg-white text-primary hover:bg-white/90 rounded-full font-bold"
                  onClick={() => {
                    window.location.href = `/communication-hub`;
                  }}
                >
                  View Conversations
                </Button>
                <button onClick={() => setSelectedIds([])} className="hover:opacity-70 transition-opacity">
                  <Badge variant="secondary" className="bg-white/10 border-none">Clear</Badge>
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        <ProcurementModal 
          isOpen={procurementModal.isOpen} 
          onClose={() => setProcurementModal({ ...procurementModal, isOpen: false })}
          supplierId={procurementModal.id}
          supplierName={procurementModal.name}
        />
      </div>
    </AuthenticatedShell>
  );
}
