import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { riskLevelStyles } from "@/lib/supplier-risk-monitoring";

export interface SupplierRow {
  supplierId: string;
  supplierName: string;
  country: string;
  financialRisk: string;
  inherentRisk: string;
  integratedRisk: string;
  incident: string;
  updatedAt: string;
}

interface Props {
  rows: SupplierRow[];
  onSelect: (supplierId: string) => void;
}

export function SupplierRiskTable({ rows, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<"supplierName" | "country" | "updatedAt">("supplierName");

  const filteredRows = useMemo(() => {
    const normalized = query.toLowerCase();
    return rows
      .filter((row) => {
        const matchesQuery =
          row.supplierName.toLowerCase().includes(normalized) || row.country.toLowerCase().includes(normalized);
        const matchesFilter = filter === "all" || row.integratedRisk.toLowerCase() === filter;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => a[sort].localeCompare(b[sort]));
  }, [rows, query, filter, sort]);

  return (
    <Card className="shadow-sm border-border/60">
      <CardHeader className="space-y-4">
        <CardTitle className="text-lg">Supplier Risk Table</CardTitle>
        <div className="flex flex-col md:flex-row gap-3">
          <Input placeholder="Search supplier or country..." value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Risk filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSort((prev) => prev === "supplierName" ? "updatedAt" : prev === "updatedAt" ? "country" : "supplierName")}>
            <ArrowUpDown className="h-4 w-4 mr-2" /> Sort
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Financial Risk</TableHead>
                <TableHead>Inherent Risk</TableHead>
                <TableHead>Integrated Risk</TableHead>
                <TableHead>Recent Incident</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No suppliers found.</TableCell></TableRow>
              ) : (
                filteredRows.map((row) => (
                  <motion.tr key={row.supplierId} whileHover={{ backgroundColor: "hsl(var(--muted))" }} className="cursor-pointer border-b" onClick={() => onSelect(row.supplierId)}>
                    <TableCell className="font-medium">{row.supplierName}</TableCell>
                    <TableCell>{row.country}</TableCell>
                    <TableCell><Badge variant="outline" className={riskLevelStyles[row.financialRisk] ?? ""}>{row.financialRisk}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={riskLevelStyles[row.inherentRisk] ?? ""}>{row.inherentRisk}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className={riskLevelStyles[row.integratedRisk] ?? ""}>{row.integratedRisk}</Badge></TableCell>
                    <TableCell className="max-w-60 truncate">{row.incident}</TableCell>
                    <TableCell>{new Date(row.updatedAt).toLocaleString()}</TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
