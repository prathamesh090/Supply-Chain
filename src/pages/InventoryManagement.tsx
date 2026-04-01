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
} from 'lucide-react';
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

  // ── Add Inventory Form State ────────────────────────────────────────
  const [formData, setFormData] = useState({
    product_id:    '',
    warehouse_id:  1,
    current_stock: '',
    lead_time:     '',
    supplier_name: '',
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
        product_id:    formData.product_id,
        warehouse_id:  formData.warehouse_id,
        current_stock: parseInt(formData.current_stock),
        lead_time:     parseInt(formData.lead_time),
        supplier_name: formData.supplier_name,
      });
      setFormSuccess(`✅ ${formData.product_id} added successfully!`);
      setFormData({
        product_id: '', warehouse_id: 1,
        current_stock: '', lead_time: '', supplier_name: ''
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
                AI-powered inventory tracking across warehouses
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
            <Card>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">City</span>
                      <p className="font-semibold text-base">{dashboard.city}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Demand Share</span>
                      <p className="font-semibold text-base">{dashboard.demand_weight}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Capacity</span>
                      <p className="font-semibold text-base">
                        {dashboard.total_capacity.toLocaleString()} units
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Stock</span>
                      <p className="font-semibold text-base">
                        {dashboard.current_utilization.toLocaleString()} units
                      </p>
                    </div>
                  </div>
                  <div className="w-full md:w-64">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Utilization</span>
                      <span className="font-semibold">{dashboard.utilization_pct}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${getUtilizationColor(dashboard.utilization_pct)}`}
                        style={{ width: dashboard.utilization_pct }}
                      />
                    </div>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dashboard">
                  📦 Inventory Dashboard
                </TabsTrigger>
                <TabsTrigger value="add">
                  ➕ Add Inventory
                </TabsTrigger>
                <TabsTrigger value="check">
                  🔍 Check Stock
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
                              <TableRow
                                key={product.product_id}
                                className="hover:bg-muted/30"
                              >
                                <TableCell className="font-semibold">
                                  {product.product_id}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {product.current_stock}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {product.warehouse_demand}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {product.safety_stock}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {product.ROP}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {product.supplier_name || '—'}
                                </TableCell>
                                <TableCell>
                                  <RiskBadge risk={product.supplier_risk} />
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={product.status} />
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {product.suggested_action}
                                </TableCell>
                              </TableRow>
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
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}