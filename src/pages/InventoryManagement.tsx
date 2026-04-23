import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Warehouse,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Search,
  RefreshCw,
  Plus,
  ArrowLeft,
  Brain,
  ChevronDown,
  ChevronUp,
  Cpu,
  Shield,
  BarChart3,
  GitBranch,
} from 'lucide-react';
import { MiniScenarioSimulator, SimResult } from '@/components/scenario/MiniScenarioSimulator';
import { SimulationImpactCard } from '@/components/scenario/SimulationImpactCard';
import {
  getWarehouses,
  getInventoryDashboard,
  addInventoryItem,
  checkAvailability,
  type Warehouse as WarehouseType,
  type InventoryDashboard,
  type InventoryProduct,
} from '@/lib/api';

// ── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'Healthy') {
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
        <CheckCircle className="w-3 h-3" />
        Healthy
      </Badge>
    );
  }
  if (status === 'Reorder Soon') {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 gap-1">
        <AlertTriangle className="w-3 h-3" />
        Reorder Soon
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1">
      <XCircle className="w-3 h-3" />
      Stockout Risk
    </Badge>
  );
}

// ── Risk Badge ────────────────────────────────────────────────────────
function RiskBadge({ risk }: { risk: string }) {
  if (risk === 'Low') {
    return (
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
        Low
      </Badge>
    );
  }
  if (risk === 'Medium') {
    return (
      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
        Medium
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
      High
    </Badge>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function InventoryManagement() {
  const navigate = useNavigate();

  // ── State ───────────────────────────────────────────────────────────
  const [warehouses, setWarehouses]           = useState<WarehouseType[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(1);
  const [dashboard, setDashboard]             = useState<InventoryDashboard | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [error, setError]                     = useState('');
  const [searchTerm, setSearchTerm]           = useState('');
  const [statusFilter, setStatusFilter]       = useState('All');
  const [expandedRow, setExpandedRow]         = useState<string | null>(null);
  const [integratedSimResult, setIntegratedSimResult] = useState<SimResult | null>(null);

  // ── Add Inventory Form State ────────────────────────────────────────
  const [formData, setFormData] = useState({
    product_id:        '',
    warehouse_id:      1,
    current_stock:     '',
    lead_time:         '',
    supplier_name:     '',
    supplier_location: 'Mumbai, Maharashtra',  // Default to major hub
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError]     = useState('');

  // ── Check Stock State ───────────────────────────────────────────────
  const [checkData, setCheckData] = useState({
    product_id:   '',
    warehouse_id: 1,
    qty:          '',
  });
  const [checkResult, setCheckResult] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);

  // ── Fetch Warehouses on Mount ───────────────────────────────────────
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await getWarehouses();
        setWarehouses(data);
      } catch (err) {
        setError('Failed to load warehouses');
      } finally {
        setWarehouseLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  // ── Fetch Dashboard When Warehouse Changes ──────────────────────────
  useEffect(() => {
    fetchDashboard();
  }, [selectedWarehouse]);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getInventoryDashboard(selectedWarehouse);
      setDashboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ── Filter Products ─────────────────────────────────────────────────
  const filteredProducts = dashboard?.products.filter((p) => {
    const matchSearch =
      p.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      statusFilter === 'All' || p.status === statusFilter;
    return matchSearch && matchStatus;
  }) || [];

  // ── Handle Add Inventory ────────────────────────────────────────────
  const handleAddInventory = async () => {
    if (!formData.product_id || !formData.current_stock || !formData.lead_time) {
      setFormError('Please fill Product ID, Current Stock and Lead Time');
      return;
    }
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      await addInventoryItem({
        product_id:        formData.product_id,
        warehouse_id:      formData.warehouse_id,
        current_stock:     parseInt(formData.current_stock),
        lead_time:         parseInt(formData.lead_time),
        supplier_name:     formData.supplier_name,
        supplier_location: formData.supplier_location,
      });
      setFormSuccess(`✅ ${formData.product_id} added successfully!`);
      setFormData({
        product_id: '', warehouse_id: 1,
        current_stock: '', lead_time: '', supplier_name: '',
        supplier_location: 'Mumbai, Maharashtra'
      });
      fetchDashboard();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add inventory');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Handle Check Availability ───────────────────────────────────────
  const handleCheckAvailability = async () => {
    if (!checkData.product_id || !checkData.qty) {
      return;
    }
    setCheckLoading(true);
    setCheckResult(null);
    try {
      const result = await checkAvailability(
        checkData.product_id,
        checkData.warehouse_id,
        parseInt(checkData.qty)
      );
      setCheckResult(result);
    } catch (err: any) {
      setCheckResult({ error: err.message });
    } finally {
      setCheckLoading(false);
    }
  };

  // ── Utilization color ───────────────────────────────────────────────
  const getUtilizationColor = (pct: string) => {
    const num = parseFloat(pct);
    if (num < 50) return 'bg-green-500';
    if (num < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ── Loading State ───────────────────────────────────────────────────
  if (warehouseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading Inventory System...</p>
        </div>
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Package className="w-8 h-8 text-primary" />
                Inventory Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manufacturing Unit: <strong>Mumbai, Maharashtra</strong> | Warehouses: Mumbai & Bhopal | Suppliers across India
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* ── Warehouse Selector ── */}
        <div className="flex gap-3 flex-wrap">
          {warehouses.map((w) => (
            <button
              key={w.warehouse_id}
              onClick={() => setSelectedWarehouse(w.warehouse_id)}
              className={`
                flex items-center gap-2 px-5 py-3 rounded-xl border-2
                font-medium transition-all duration-200
                ${selectedWarehouse === w.warehouse_id
                  ? 'border-primary bg-primary text-primary-foreground shadow-lg'
                  : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                }
              `}
            >
              <Warehouse className="w-4 h-4" />
              {w.name}
              <Badge
                variant="secondary"
                className="ml-1 text-xs"
              >
                {Math.round(w.demand_weight * 100)}%
              </Badge>
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        )}

        {/* ── Dashboard Content ── */}
        {!loading && dashboard && (
          <>
            {/* ── Warehouse Info + Capacity Bar ── */}
            <Card className="border-2 border-primary/10 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-primary" />
                    {dashboard.city} Warehouse Status
                  </CardTitle>
                  <Badge 
                    className={{
                      '0': 'bg-blue-100 text-blue-800',
                      '40': 'bg-green-100 text-green-800',
                      '70': 'bg-yellow-100 text-yellow-800',
                      '85': 'bg-orange-100 text-orange-800',
                      '95': 'bg-red-100 text-red-800',
                    }[
                      parseFloat(dashboard.utilization_pct) < 40 ? '0' :
                      parseFloat(dashboard.utilization_pct) < 70 ? '40' :
                      parseFloat(dashboard.utilization_pct) < 85 ? '70' :
                      parseFloat(dashboard.utilization_pct) < 95 ? '85' : '95'
                    ] || 'bg-gray-100 text-gray-800'}
                  >
                    {parseFloat(dashboard.utilization_pct) < 40 ? '✅ Optimal' :
                     parseFloat(dashboard.utilization_pct) < 70 ? '✅ Healthy' :
                     parseFloat(dashboard.utilization_pct) < 85 ? '⚠️ Good' :
                     parseFloat(dashboard.utilization_pct) < 95 ? '⚠️ Warning' : '🔴 Critical'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">📍 City</span>
                    <p className="font-bold text-lg mt-1">{dashboard.city}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">📊 Demand Share</span>
                    <p className="font-bold text-lg mt-1">{dashboard.demand_weight}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">📦 Capacity</span>
                    <p className="font-bold text-lg mt-1">{(dashboard.total_capacity / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">{dashboard.total_capacity.toLocaleString()} units</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">📥 Used</span>
                    <p className="font-bold text-lg mt-1">{(dashboard.current_utilization / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">{dashboard.current_utilization.toLocaleString()} units</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/20 dark:to-cyan-900/20 rounded-lg p-4 border border-cyan-200 dark:border-cyan-800">
                    <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">🆓 Available</span>
                    <p className="font-bold text-lg mt-1">{((dashboard.total_capacity - dashboard.current_utilization) / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">{(dashboard.total_capacity - dashboard.current_utilization).toLocaleString()} units</p>
                  </div>
                </div>

                {/* Enhanced Utilization Bar */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Warehouse Utilization</span>
                      <span className="text-2xl font-bold text-primary">{dashboard.utilization_pct}</span>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{dashboard.current_utilization.toLocaleString()} / {dashboard.total_capacity.toLocaleString()} units</p>
                    </div>
                  </div>
                  
                  {/* Main Progress Bar with Enhanced Styling */}
                  <div className="relative w-full h-8 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-inner">
                    {/* Background guideline markers */}
                    <div className="absolute top-0 left-1/4 w-px h-full bg-gray-300/30 dark:bg-gray-700/30" title="50% threshold"></div>
                    <div className="absolute top-0 left-1/2 w-px h-full bg-gray-300/50 dark:bg-gray-700/50" title="50% threshold"></div>
                    <div className="absolute top-0 left-3/4 w-px h-px h-full bg-gray-300/30 dark:bg-gray-700/30" title="75% threshold"></div>
                    
                    {/* Actual Utilization Bar */}
                    <div
                      className={`h-full transition-all duration-700 ease-out rounded-xl flex items-center justify-end pr-3 font-bold text-white text-sm shadow-lg ${
                        parseFloat(dashboard.utilization_pct) < 40
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                          : parseFloat(dashboard.utilization_pct) < 70
                          ? 'bg-gradient-to-r from-blue-400 to-cyan-500'
                          : parseFloat(dashboard.utilization_pct) < 85
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                          : parseFloat(dashboard.utilization_pct) < 95
                          ? 'bg-gradient-to-r from-orange-400 to-red-500'
                          : 'bg-gradient-to-r from-red-500 to-red-700'
                      }`}
                      style={{ width: dashboard.utilization_pct }}
                    >
                      {parseFloat(dashboard.utilization_pct) > 15 && (
                        <span className="drop-shadow-md">{dashboard.utilization_pct}</span>
                      )}
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-muted-foreground">0-40%: Optimal</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-muted-foreground">40-70%: Healthy</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-muted-foreground">70-85%: Good</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-muted-foreground">85-95%: Warning</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-muted-foreground">95%+: Critical</span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`p-3 rounded-lg border-l-4 ${
                    parseFloat(dashboard.utilization_pct) < 70 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-500 text-green-800 dark:text-green-200'
                      : parseFloat(dashboard.utilization_pct) < 85
                      ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-500 text-yellow-800 dark:text-yellow-200'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-500 text-red-800 dark:text-red-200'
                  }`}>
                    <p className="text-xs font-semibold">
                      {parseFloat(dashboard.utilization_pct) < 40 
                        ? '✅ Excellent capacity. Consider stocking more high-demand products.'
                        : parseFloat(dashboard.utilization_pct) < 70
                        ? '✅ Good utilization. Monitor demand trends.'
                        : parseFloat(dashboard.utilization_pct) < 85
                        ? '⚠️ High utilization. Consider restocking or expanding capacity.'
                        : '🔴 Critical utilization! Immediate restocking required.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Healthy</p>
                    <p className="text-4xl font-bold text-green-600">
                      {dashboard.summary.Healthy}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Products in good stock
                    </p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-500 opacity-80" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Reorder Soon</p>
                    <p className="text-4xl font-bold text-yellow-600">
                      {dashboard.summary['Reorder Soon']}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Products need restocking
                    </p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-yellow-500 opacity-80" />
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stockout Risk</p>
                    <p className="text-4xl font-bold text-red-600">
                      {dashboard.summary['Stockout Risk']}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Urgent replenishment needed
                    </p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-500 opacity-80" />
                </CardContent>
              </Card>
            </div>

            {/* ── Tabs ── */}
            <Tabs defaultValue="dashboard" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">
                  📦 Inventory Dashboard
                </TabsTrigger>
                <TabsTrigger value="add">
                  ➕ Add Inventory
                </TabsTrigger>
                <TabsTrigger value="check">
                  🔍 Check Stock
                </TabsTrigger>
                <TabsTrigger value="stress" className="gap-2">
                  🚀 Stress Test
                </TabsTrigger>
              </TabsList>

              {/* ── Tab 1: Dashboard ── */}
              <TabsContent value="dashboard" className="space-y-4 mt-4">

                {/* Search + Filter */}
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search product or supplier..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Status</SelectItem>
                      <SelectItem value="Healthy">✅ Healthy</SelectItem>
                      <SelectItem value="Reorder Soon">⚠️ Reorder Soon</SelectItem>
                      <SelectItem value="Stockout Risk">🚨 Stockout Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Products Table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Products — {dashboard.warehouse_name}
                      <Badge variant="secondary" className="ml-auto">
                        {filteredProducts.length} products
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">W. Demand</TableHead>
                            <TableHead className="text-right">Safety Stock</TableHead>
                            <TableHead className="text-right">ROP</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Risk</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="text-center py-8 text-muted-foreground"
                              >
                                No products found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredProducts.map((product) => (
                              <>
                                <TableRow
                                  key={product.product_id}
                                  className="hover:bg-muted/30 cursor-pointer"
                                  onClick={() => setExpandedRow(expandedRow === product.product_id ? null : product.product_id)}
                                >
                                  <TableCell>
                                    {expandedRow === product.product_id
                                      ? <ChevronUp className="w-4 h-4 text-primary" />
                                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {product.product_id}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {product.current_stock.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    <span className="flex items-center justify-end gap-1">
                                      <Cpu className="w-3 h-3 text-purple-500" />
                                      {product.global_forecasted_demand}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {product.safety_stock}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-primary">
                                    {product.ROP}
                                  </TableCell>
                                  <TableCell className="text-sm max-w-[180px] truncate" title={product.supplier_name}>
                                    {product.supplier_name || '—'}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {product.supplier_location || '—'}
                                  </TableCell>
                                  <TableCell>
                                    <RiskBadge risk={product.supplier_risk} />
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge status={product.status} />
                                  </TableCell>
                                  <TableCell className="text-xs font-medium">
                                    {product.suggested_action}
                                  </TableCell>
                                </TableRow>
                                {expandedRow === product.product_id && (
                                  <TableRow key={`${product.product_id}-detail`} className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                                    <TableCell colSpan={10} className="py-4 px-6">
                                      <div className="flex items-start gap-2 mb-3">
                                        <Brain className="w-4 h-4 text-purple-600 mt-0.5" />
                                        <span className="text-sm font-semibold text-purple-700">AI-Derived Restocking Calculation</span>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div className="bg-white dark:bg-card rounded-lg p-3 border border-purple-100 shadow-sm">
                                          <div className="flex items-center gap-1 text-purple-600 mb-1">
                                            <Cpu className="w-3 h-3" />
                                            <span className="font-semibold">ML Global Forecast</span>
                                          </div>
                                          <p className="text-base font-bold">{product.global_forecasted_demand} units</p>
                                          <p className="text-muted-foreground mt-0.5">From Demand Forecasting AI</p>
                                        </div>
                                        <div className="bg-white dark:bg-card rounded-lg p-3 border border-blue-100 shadow-sm">
                                          <div className="flex items-center gap-1 text-blue-600 mb-1">
                                            <BarChart3 className="w-3 h-3" />
                                            <span className="font-semibold">Warehouse Allocation</span>
                                          </div>
                                          <p className="text-base font-bold">{product.warehouse_demand} units</p>
                                          <p className="text-muted-foreground mt-0.5">Forecast × {dashboard?.demand_weight} demand share</p>
                                        </div>
                                        <div className="bg-white dark:bg-card rounded-lg p-3 border border-orange-100 shadow-sm">
                                          <div className="flex items-center gap-1 text-orange-600 mb-1">
                                            <Shield className="w-3 h-3" />
                                            <span className="font-semibold">Supplier Risk Multiplier</span>
                                          </div>
                                          <p className="text-base font-bold">{product.risk_multiplier}×</p>
                                          <p className="text-muted-foreground mt-0.5">{product.supplier_risk} risk → {product.risk_multiplier === 1 ? 'No buffer added' : product.risk_multiplier === 1.3 ? '+30% safety buffer' : '+60% safety buffer'}</p>
                                        </div>
                                        <div className="bg-white dark:bg-card rounded-lg p-3 border border-green-100 shadow-sm">
                                          <div className="flex items-center gap-1 text-green-600 mb-1">
                                            <TrendingUp className="w-3 h-3" />
                                            <span className="font-semibold">Reorder Point (ROP)</span>
                                          </div>
                                          <p className="text-base font-bold">{product.ROP} units</p>
                                          <p className="text-muted-foreground mt-0.5">Safety: {product.safety_stock} + lead: {product.daily_demand} × lead time</p>
                                        </div>
                                      </div>
                                      <div className="mt-3 p-2 rounded bg-white/70 dark:bg-card/50 border text-xs text-muted-foreground">
                                        <span className="font-semibold">Decision Logic: </span>
                                        Current stock <strong>{product.current_stock}</strong> {product.current_stock > product.ROP ? '>' : product.current_stock > product.safety_stock ? '≤' : '≤'} ROP <strong>{product.ROP}</strong> → <span className={product.status === 'Healthy' ? 'text-green-600 font-bold' : product.status === 'Reorder Soon' ? 'text-yellow-600 font-bold' : 'text-red-600 font-bold'}>{product.suggested_action}</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Tab 2: Add Inventory ── */}
              <TabsContent value="add" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add / Update Inventory
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Add a new product or update existing stock in a warehouse
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-lg">

                    <div className="space-y-2">
                      <Label>Product ID</Label>
                      <Input
                        placeholder="e.g. PROD001"
                        value={formData.product_id}
                        onChange={(e) =>
                          setFormData({ ...formData, product_id: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Warehouse</Label>
                      <Select
                        value={String(formData.warehouse_id)}
                        onValueChange={(v) =>
                          setFormData({ ...formData, warehouse_id: parseInt(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem
                              key={w.warehouse_id}
                              value={String(w.warehouse_id)}
                            >
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Current Stock (units)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={formData.current_stock}
                          onChange={(e) =>
                            setFormData({ ...formData, current_stock: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Lead Time (days)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 7"
                          value={formData.lead_time}
                          onChange={(e) =>
                            setFormData({ ...formData, lead_time: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Supplier Name</Label>
                      <Input
                        placeholder="e.g. Delta_Logistics"
                        value={formData.supplier_name}
                        onChange={(e) =>
                          setFormData({ ...formData, supplier_name: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Must match supplier name in SRA module
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Supplier Location</Label>
                      <Select
                        value={formData.supplier_location}
                        onValueChange={(v) =>
                          setFormData({ ...formData, supplier_location: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mumbai, Maharashtra">🏭 Mumbai, Maharashtra (Hub)</SelectItem>
                          <SelectItem value="Pune, Maharashtra">🏭 Pune, Maharashtra</SelectItem>
                          <SelectItem value="Nagpur, Maharashtra">🏭 Nagpur, Maharashtra</SelectItem>
                          <SelectItem value="Bhopal, Madhya Pradesh">🏭 Bhopal, Madhya Pradesh (Hub)</SelectItem>
                          <SelectItem value="Indore, Madhya Pradesh">🏭 Indore, Madhya Pradesh</SelectItem>
                          <SelectItem value="Ahmedabad, Gujarat">🏭 Ahmedabad, Gujarat</SelectItem>
                          <SelectItem value="Surat, Gujarat">🏭 Surat, Gujarat</SelectItem>
                          <SelectItem value="Vadodara, Gujarat">🏭 Vadodara, Gujarat</SelectItem>
                          <SelectItem value="Bangalore, Karnataka">🏭 Bangalore, Karnataka</SelectItem>
                          <SelectItem value="Hyderabad, Telangana">🏭 Hyderabad, Telangana</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select supplier's location - impacts lead time and risk
                      </p>
                    </div>

                    {formError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {formError}
                      </div>
                    )}

                    {formSuccess && (
                      <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                        {formSuccess}
                      </div>
                    )}

                    <Button
                      onClick={handleAddInventory}
                      disabled={formLoading}
                      className="w-full"
                    >
                      {formLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {formLoading ? 'Adding...' : 'Add Inventory'}
                    </Button>

                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Tab 3: Check Stock ── */}
              <TabsContent value="check" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      Check Stock Availability
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Check if enough stock exists for a specific quantity
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 max-w-lg">

                    <div className="space-y-2">
                      <Label>Product ID</Label>
                      <Input
                        placeholder="e.g. PROD001"
                        value={checkData.product_id}
                        onChange={(e) =>
                          setCheckData({ ...checkData, product_id: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Warehouse</Label>
                      <Select
                        value={String(checkData.warehouse_id)}
                        onValueChange={(v) =>
                          setCheckData({ ...checkData, warehouse_id: parseInt(v) })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem
                              key={w.warehouse_id}
                              value={String(w.warehouse_id)}
                            >
                              {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity Required</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 50"
                        value={checkData.qty}
                        onChange={(e) =>
                          setCheckData({ ...checkData, qty: e.target.value })
                        }
                      />
                    </div>

                    <Button
                      onClick={handleCheckAvailability}
                      disabled={checkLoading}
                      className="w-full"
                    >
                      {checkLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      {checkLoading ? 'Checking...' : 'Check Availability'}
                    </Button>

                    {/* Result */}
                    {checkResult && !checkResult.error && (
                      <div className={`
                        p-4 rounded-xl border-2 mt-2
                        ${checkResult.available
                          ? 'bg-green-50 border-green-300'
                          : 'bg-red-50 border-red-300'
                        }
                      `}>
                        <div className="flex items-center gap-2 mb-3">
                          {checkResult.available ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <XCircle className="w-6 h-6 text-red-600" />
                          )}
                          <span className={`font-bold text-lg ${
                            checkResult.available ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {checkResult.available ? 'Stock Available' : 'Insufficient Stock'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <p className="text-muted-foreground text-xs">Product</p>
                            <p className="font-bold">{checkResult.product_id}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <p className="text-muted-foreground text-xs">Current Stock</p>
                            <p className="font-bold">{checkResult.current_stock}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                            <p className="text-muted-foreground text-xs">Requested</p>
                            <p className="font-bold">{checkResult.requested_qty}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {checkResult?.error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {checkResult.error}
                      </div>
                    )}

                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="stress" className="mt-4">
                <Card className="border-2 border-primary/10 shadow-lg">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-2">
                       <GitBranch className="w-5 h-5 text-primary" />
                       Stress Simulation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="bg-muted/30 p-6 rounded-2xl border-2 border-dashed border-muted flex flex-col gap-6">
                              <div className="space-y-2">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                  <Cpu className="w-5 h-5 text-primary" />
                                  Simulation Parameters
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  Adjust parameters to see how disruptions cascade through your inventory pipeline.
                                </p>
                              </div>
                              <MiniScenarioSimulator feature="inventory" onResult={setIntegratedSimResult} />
                           </div>
                        </div>

                        <div className="space-y-6">
                           {integratedSimResult ? (
                              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
                                 <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                      <Brain className="w-16 h-16" />
                                    </div>
                                    <h4 className="text-sm font-black text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
                                       <Brain className="w-4 h-4" />
                                       AI Impact Summary
                                    </h4>
                                    <p className="text-base text-foreground font-medium leading-relaxed relative z-10">
                                       "{integratedSimResult.summary}"
                                    </p>
                                 </div>

                                 <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Detailed Metrics</h4>
                                    <SimulationImpactCard stage="inventory" data={integratedSimResult.stages.inventory} severity={integratedSimResult.severity_score} />
                                 </div>

                                 {integratedSimResult.stages.inventory.safety_stock_increase_avg_pct > 0 && (
                                    <div className="p-5 rounded-2xl bg-orange-50 border border-orange-100 flex items-start gap-4 shadow-sm">
                                       <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
                                          <TrendingUp className="w-6 h-6" />
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-orange-800">Capacity Alert</p>
                                          <p className="text-sm text-orange-700/80 leading-relaxed mt-1">
                                             This scenario would require increasing your safety stock buffer by <span className="font-bold text-orange-800">{integratedSimResult.stages.inventory.safety_stock_increase_avg_pct}%</span> to maintain current service levels.
                                          </p>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-3xl border-muted bg-muted/5 group">
                                 <div className="p-4 rounded-full bg-muted/20 mb-4 group-hover:scale-110 transition-transform duration-500">
                                    <GitBranch className="w-12 h-12 text-muted-foreground opacity-40" />
                                 </div>
                                 <p className="font-bold text-muted-foreground text-lg">Predictive Playground</p>
                                 <p className="text-sm text-muted-foreground/60 max-w-[280px] mt-2">
                                    Configure a scenario on the left to visualize supply chain pressure points.
                                 </p>
                              </div>
                           )}
                        </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}