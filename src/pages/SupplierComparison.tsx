import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { 
  ArrowLeft, Search, Filter, Download, Star, 
  Clock, DollarSign, ShieldCheck, ChevronRight,
  ExternalLink, MessageSquare, AlertCircle, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { getComparisonData } from '@/lib/api';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function SupplierComparison() {
  const [searchParams] = useSearchParams();
  const productName = searchParams.get('product') || '';
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (productName) {
      loadComparison();
    }
  }, [productName]);

  const loadComparison = async () => {
    try {
      const data = await getComparisonData(productName);
      setComparisonData(data);
    } catch (error) {
      console.error('Failed to load comparison data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = comparisonData.filter(d => 
    d.company_legal_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/communication-hub">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Supplier Comparison</h1>
              <p className="text-muted-foreground">Comparing quotes for: <span className="font-semibold text-foreground">{productName}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Export Report
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Filter suppliers..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Suppliers</p>
                  <p className="text-2xl font-bold">{comparisonData.length}</p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Best Price</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {comparisonData.length > 0 
                      ? `$${Math.min(...comparisonData.map(d => d.unit_price || Infinity))}` 
                      : 'N/A'}
                  </p>
                </div>
                <div className="h-10 w-px bg-border" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Avg. Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {comparisonData.length > 0 
                      ? Math.round(comparisonData.reduce((acc, d) => acc + (d.trust_score || 0), 0) / comparisonData.length) 
                      : 'N/A'}/100
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-64 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <Card className="border-none shadow-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[250px]">Supplier</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Lead Time</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Trust Breakdown</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((d, index) => (
                    <motion.tr 
                      key={d.rfq_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1">
                          <div className="font-bold text-base leading-none">{d.company_legal_name}</div>
                          <Badge variant="secondary" className="w-fit text-[10px] h-4 px-1.5 font-medium bg-slate-100 text-slate-600 border-none uppercase tracking-wider">
                            {d.rfq_product_name}
                          </Badge>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> Quote v{d.quote_version} • {d.quote_date ? format(new Date(d.quote_date), 'MMM d, yyyy') : 'No Quote'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {d.unit_price ? (
                          <div className="text-lg font-bold text-foreground">
                            ${d.unit_price}
                            <span className="text-xs text-muted-foreground font-normal ml-1">/ unit</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{d.lead_time_days || '--'} days</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 -rotate-90">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                className="text-muted/20"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="4"
                                strokeDasharray={126}
                                strokeDashoffset={126 - (126 * (d.trust_score || 0)) / 100}
                                className={d.trust_score > 80 ? 'text-emerald-500' : d.trust_score > 60 ? 'text-amber-500' : 'text-rose-500'}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                              {d.trust_score || 0}%
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold">
                            <span className="text-muted-foreground">Reliability</span>
                            <span>{d.trust_breakdown?.reliability}%</span>
                          </div>
                          <Progress value={d.trust_breakdown?.reliability} className="h-1 bg-muted" />
                          <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold">
                            <span className="text-muted-foreground">Quality</span>
                            <span>{d.trust_breakdown?.quality}%</span>
                          </div>
                          <Progress value={d.trust_breakdown?.quality} className="h-1 bg-muted" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="capitalize variant-outline bg-primary/5 text-primary border-primary/20">
                          {d.rfq_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/communication-hub?rfq=${d.rfq_id}`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              <MessageSquare className="w-4 h-4" /> Negotiate
                            </Button>
                          </Link>
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            Select
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No comparison data available for this product.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-none shadow-md overflow-hidden bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Best Price Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comparisonData.length > 0 ? (
                <div className="p-4 border border-emerald-200 bg-white rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-emerald-900">
                      {comparisonData.sort((a,b) => (a.unit_price || Infinity) - (b.unit_price || Infinity))[0].company_legal_name}
                    </p>
                    <p className="text-sm text-emerald-700">Offers the best unit price at ${comparisonData.sort((a,b) => (a.unit_price || Infinity) - (b.unit_price || Infinity))[0].unit_price}</p>
                  </div>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">View Quote</Button>
                </div>
              ) : <p className="text-sm text-muted-foreground">N/A</p>}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden bg-blue-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Highest Reliability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comparisonData.length > 0 ? (
                <div className="p-4 border border-blue-200 bg-white rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-blue-900">
                      {comparisonData.sort((a,b) => (b.trust_score || 0) - (a.trust_score || 0))[0].company_legal_name}
                    </p>
                    <p className="text-sm text-blue-700">Highest trust score: {comparisonData.sort((a,b) => (b.trust_score || 0) - (a.trust_score || 0))[0].trust_score}/100</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700">View Profile</Button>
                </div>
              ) : <p className="text-sm text-muted-foreground">N/A</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedShell>
  );
}
