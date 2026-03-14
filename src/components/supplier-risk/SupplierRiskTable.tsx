import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupplierRiskRow } from './types';

interface Props {
  suppliers: SupplierRiskRow[];
  onRowClick: (supplier: SupplierRiskRow) => void;
}

type SortKey = 'supplierName' | 'country' | 'financialRiskScore' | 'inherentRiskScore' | 'integratedRiskScore' | 'lastUpdated';

const riskBadgeClass = (level: string) => {
  const normalized = level.toLowerCase();
  if (normalized === 'low') return 'bg-green-100 text-green-800 border-green-200';
  if (normalized === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (normalized === 'high') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

export function SupplierRiskTable({ suppliers, onRowClick }: Props) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('integratedRiskScore');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [descending, setDescending] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return suppliers
      .filter((row) => (
        !q ||
        row.supplierName.toLowerCase().includes(q) ||
        row.country.toLowerCase().includes(q) ||
        row.recentIncident.toLowerCase().includes(q)
      ))
      .filter((row) => riskFilter === 'all' || row.integratedRiskLevel.toLowerCase() === riskFilter)
      .sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const dir = descending ? -1 : 1;
        if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
        return String(aVal).localeCompare(String(bVal)) * dir;
      });
  }, [suppliers, query, riskFilter, sortKey, descending]);

  return (
    <Card>
      <CardHeader className="gap-4">
        <CardTitle>Supplier Risk Table</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search supplier, country, incident" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="border rounded-md px-3" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as 'all' | 'low' | 'medium' | 'high')}>
            <option value="all">All risk levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select className="border rounded-md px-3" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="integratedRiskScore">Integrated Risk</option>
            <option value="inherentRiskScore">Inherent Risk</option>
            <option value="financialRiskScore">Financial Risk</option>
            <option value="supplierName">Supplier Name</option>
            <option value="country">Country</option>
            <option value="lastUpdated">Last Updated</option>
          </select>
          <Button variant="outline" onClick={() => setDescending((v) => !v)}>
            Sort: {descending ? 'Desc' : 'Asc'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Supplier Name</th>
              <th className="py-2 pr-4">Country</th>
              <th className="py-2 pr-4">Financial Risk</th>
              <th className="py-2 pr-4">Inherent Risk</th>
              <th className="py-2 pr-4">Integrated Risk</th>
              <th className="py-2 pr-4">Recent Incident</th>
              <th className="py-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((supplier) => (
              <tr
                key={supplier.supplierId}
                onClick={() => onRowClick(supplier)}
                className="border-b cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <td className="py-3 pr-4 font-medium">{supplier.supplierName}</td>
                <td className="py-3 pr-4">{supplier.country}</td>
                <td className="py-3 pr-4">
                  <Badge className={riskBadgeClass(supplier.financialRiskLevel)}>{supplier.financialRiskLevel} ({supplier.financialRiskScore})</Badge>
                </td>
                <td className="py-3 pr-4">
                  <Badge className={riskBadgeClass(supplier.inherentRiskLevel)}>{supplier.inherentRiskLevel} ({supplier.inherentRiskScore})</Badge>
                </td>
                <td className="py-3 pr-4">
                  <Badge className={riskBadgeClass(supplier.integratedRiskLevel)}>{supplier.integratedRiskLevel} ({supplier.integratedRiskScore})</Badge>
                </td>
                <td className="py-3 pr-4 max-w-64 truncate">{supplier.recentIncident}</td>
                <td className="py-3">{new Date(supplier.lastUpdated).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="text-muted-foreground py-6">No suppliers match your current filters.</p>}
      </CardContent>
    </Card>
  );
}
