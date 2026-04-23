import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  verifySupplierDocuments, getSupplierProducts, getSupplierProfile,
  saveSupplierPricing, getSupplierVerifications, getSupplierConnections,
  respondToConnection, getSupplierInquiries, getRFQs, submitRFQQuote
} from '@/lib/api';
import {
  AlertTriangle, CheckCircle2, Factory, FileCheck2, ShieldCheck, Plus,
  TrendingUp, Users, Package, Star, ClipboardList, Clock, Award, ArrowUpRight,
  FileText, MessageSquare
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type Material = {
  id: number;
  material_name: string;
  category?: string;
  technical_specifications?: string;
  lead_time_days?: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
};

type VerificationResult = {
  id?: number;
  file_name: string;
  reason: string;
  verified: boolean;
  doc_type?: string;
  expiry_date?: string | null;
  template_match?: boolean;
  document_type_valid?: boolean;
};

const profileFields = [
  'company_legal_name', 'contact_person', 'support_email',
  'phone', 'factory_address', 'city', 'manufacturing_state', 'country', 'company_overview',
];

const DOC_LABELS: Record<string, string> = {
  'ISO 9001': '🏆 ISO 9001',
  'BIS': '🇮🇳 BIS',
  'EPR': '♻️ EPR',
  'Pollution Board': '🌿 Pollution Board',
};

export default function SupplierDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'overview';
  // Backward compatibility for 'inquiries' -> 'procurement'
  const currentTab = rawTab === 'inquiries' ? 'procurement' : rawTab;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [docType, setDocType] = useState('ISO 9001');
  const [files, setFiles] = useState<File[]>([]);
  const [newMaterial, setNewMaterial] = useState({
    material_name: '', category: '', technical_specifications: '', lead_time_days: 7, stock_status: 'in_stock'
  });
  const [connections, setConnections] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const [profileRes, materialRes, verificationRes, connectionsRes, inquiriesRes, rfqsRes] = await Promise.all([
        getSupplierProfile().catch(() => null),
        getSupplierProducts().catch(() => []),
        getSupplierVerifications().catch(() => []),
        getSupplierConnections().catch(() => []),
        getSupplierInquiries().catch(() => []),
        getRFQs().catch(() => []),
      ]);
      setProfile(profileRes);
      setMaterials(Array.isArray(materialRes) ? materialRes : []);
      setVerificationResults(Array.isArray(verificationRes) ? verificationRes : []);
      setConnections(connectionsRes);
      setInquiries(inquiriesRes);
      setRfqs(rfqsRes);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    }
  };

  useEffect(() => {
    (async () => {
      try { await loadData(); } finally { setLoading(false); }
    })();
  }, []);

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const completionPercent = useMemo(() => {
    const completed = profileFields.filter((f) => String(profile?.[f] || '').trim()).length;
    return Math.round((completed / profileFields.length) * 100);
  }, [profile]);

  const lowStockCount = useMemo(() => materials.filter((m) => m.stock_status !== 'in_stock').length, [materials]);
  const verifiedCount = useMemo(() => verificationResults.filter((v) => v.verified).length, [verificationResults]);

  // Trust score: weighted formula (SCM proxy)
  const trustScore = useMemo(() => {
    const certWeight = Math.min(verifiedCount * 20, 40);   // max 40 pts from certs
    const profileWeight = Math.round(completionPercent * 0.4); // max 40 pts from profile
    const catalogWeight = Math.min(materials.length * 5, 20); // max 20 pts from catalog
    return certWeight + profileWeight + catalogWeight;
  }, [verifiedCount, completionPercent, materials.length]);

  // Verified doc types (unique)
  const verifiedDocTypes = useMemo(
    () => [...new Set(verificationResults.filter((v) => v.verified).map((v) => v.doc_type || 'Document'))],
    [verificationResults]
  );

  // ── Actions ───────────────────────────────────────────────────────────────
  const onSaveMaterial = async () => {
    if (!newMaterial.material_name.trim()) {
      toast({ title: 'Material name required', variant: 'destructive' });
      return;
    }
    setSavingProduct(true);
    try {
      await saveSupplierPricing(newMaterial as any);
      toast({ title: 'Material saved', description: 'Catalog has been updated.' });
      setNewMaterial({ material_name: '', category: '', technical_specifications: '', lead_time_days: 7, stock_status: 'in_stock' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to save material', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleConnectionAction = async (id: number, action: 'active' | 'rejected') => {
    try {
      setActionLoading(id);
      await respondToConnection(id, action);
      toast({ title: 'Success', description: `Connection ${action === 'active' ? 'approved' : 'rejected'}.` });
      await loadData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const onVerifyDocs = async () => {
    if (files.length === 0) {
      toast({ title: 'Upload at least one certificate', variant: 'destructive' });
      return;
    }
    try {
      const result = await verifySupplierDocuments(docType, files);
      const newResults = result.results || [];
      // Merge with existing so counter persists
      setVerificationResults((prev) => [...prev, ...newResults]);
      toast({ title: 'Verification complete', description: 'Certificate checks ran successfully.' });
      // Reload to get server-saved results
      await loadData();
    } catch (error) {
      toast({ title: 'Verification failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        {/* Hero Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-blue-100">ChainLink Pro • Supplier Portal</p>
              <h1 className="text-3xl font-bold mt-1">
                Welcome, {profile?.contact_person || profile?.company_legal_name || 'Supplier'}
              </h1>
              <p className="text-sm text-blue-100 mt-2">
                Your supply chain command centre — manage products, certificates, and manufacturer connections.
              </p>
            </div>
            <Link to="/supplier/settings"><Button variant="secondary">Open Full Profile Settings</Button></Link>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading dashboard…</p>
        ) : (
          <>
            {/* ── KPI Strip ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Factory className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold">{materials.length}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Products Listed</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="text-2xl font-bold">{lowStockCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Stock Alerts</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold">{verifiedCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Verified Certificates</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{trustScore}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Trust Score / 100</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Trust Score Banner (if low) ── */}
            {trustScore < 60 && (
              <Card className="border-amber-300 bg-amber-50">
                <CardContent className="p-4 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800">Boost your Trust Score</p>
                    <ul className="text-sm text-amber-700 list-disc list-inside mt-1 space-y-1">
                      {verifiedCount < 2 && <li>Upload more certificates (ISO, BIS, EPR, Pollution Board)</li>}
                      {completionPercent < 80 && <li>Complete your profile ({completionPercent}% done)</li>}
                      {materials.length < 2 && <li>Add more products to your catalog</li>}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Main Tabs ── */}
            <Tabs 
              value={currentTab} 
              onValueChange={(v) => setSearchParams({ tab: v })} 
              className="space-y-4"
            >
              <TabsList className="grid md:w-[840px] grid-cols-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="partners">
                  Partners {connections.filter(c => c.status === 'pending').length > 0 && 
                  <Badge className="ml-2 bg-red-500 h-4 px-1 min-w-[16px]">{connections.filter(c => c.status === 'pending').length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="procurement">
                  Procurement {rfqs.filter(r => r.status === 'sent').length > 0 && 
                  <Badge className="ml-2 bg-blue-500 h-4 px-1 min-w-[16px]">{rfqs.filter(r => r.status === 'sent').length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
              </TabsList>

              {/* ── Overview ── */}
              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Profile Completion */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><FileCheck2 className="h-4 w-4" /> Profile Completion</CardTitle>
                      <CardDescription>Fill all fields to improve manufacturer discovery ranking.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Progress value={completionPercent} />
                      <p className="text-sm text-muted-foreground">{completionPercent}% complete</p>
                      <div className="flex flex-wrap gap-2">
                        {profileFields.map((field) => (
                          <Badge key={field} variant={String(profile?.[field] || '').trim() ? 'default' : 'outline'}>
                            {field.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Verified Badges */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4 text-green-600" /> Compliance Badges</CardTitle>
                      <CardDescription>Certificates you have verified. Manufacturers see these.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {verifiedDocTypes.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No verified certificates yet. Go to the Verification tab to upload.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {verifiedDocTypes.map((dt) => (
                            <Badge key={dt} className="bg-green-100 text-green-800 border-green-300">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> {DOC_LABELS[dt] || dt}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* SCM Performance Hints */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl border p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{materials.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Products in Catalog</p>
                      </div>
                      <div className="rounded-xl border p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">Verified Docs</p>
                      </div>
                      <div className="rounded-xl border p-3 text-center">
                        <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">Low / Out of Stock</p>
                      </div>
                      <div className="rounded-xl border p-3 text-center">
                        <p className="text-2xl font-bold text-purple-600">{completionPercent}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Profile Filled</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── Products ── */}
              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Material Catalog</CardTitle>
                    <CardDescription>Add or update product lines, stock status, and lead times.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-5 gap-3">
                      <Input placeholder="Material name" value={newMaterial.material_name}
                        onChange={(e) => setNewMaterial((p) => ({ ...p, material_name: e.target.value }))} />
                      <Input placeholder="Category" value={newMaterial.category}
                        onChange={(e) => setNewMaterial((p) => ({ ...p, category: e.target.value }))} />
                      <Input placeholder="Specifications" value={newMaterial.technical_specifications}
                        onChange={(e) => setNewMaterial((p) => ({ ...p, technical_specifications: e.target.value }))} />
                      <Input type="number" placeholder="Lead time (days)" value={newMaterial.lead_time_days}
                        onChange={(e) => setNewMaterial((p) => ({ ...p, lead_time_days: Number(e.target.value) || 0 }))} />
                      <Button onClick={onSaveMaterial} disabled={savingProduct}>
                        <Plus className="h-4 w-4 mr-1" />{savingProduct ? 'Saving…' : 'Add'}
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {materials.map((m) => (
                        <div key={m.id} className="rounded-xl border p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.material_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.category || 'Uncategorized'} • {m.technical_specifications || 'No specs'} • Lead time: {m.lead_time_days || '—'} days
                            </p>
                          </div>
                          <Badge variant={m.stock_status === 'in_stock' ? 'default' : 'outline'}>
                            {m.stock_status.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                      {materials.length === 0 && <p className="text-sm text-muted-foreground">No materials listed yet.</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Verification ── */}
              <TabsContent value="verification">
                <Card>
                  <CardHeader>
                    <CardTitle>Certificate Verification</CardTitle>
                    <CardDescription>
                      Upload compliance certificates. Our AI checks expiry, format, and template consistency.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-3">
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                      >
                        {['ISO 9001', 'BIS', 'EPR', 'Pollution Board'].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                      <Button onClick={onVerifyDocs}>Verify Certificates</Button>
                    </div>

                    {/* Historical verified results from DB */}
                    {verificationResults.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-semibold">All Verification History</h4>
                        {verificationResults.map((result, i) => (
                          <div key={result.id || i} className="rounded-xl border p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{result.file_name}</p>
                                {result.doc_type && <p className="text-xs text-muted-foreground">{result.doc_type}</p>}
                              </div>
                              <Badge variant={result.verified ? 'default' : 'outline'}>
                                {result.verified ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                                {result.verified ? 'Verified' : 'Needs Review'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{result.reason}</p>
                            {result.expiry_date && <p className="text-xs mt-1">Expiry: {result.expiry_date}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {verificationResults.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">No certificates verified yet. Upload above to get started.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Partners ── */}
              <TabsContent value="partners" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Manufacturer Network</CardTitle>
                    <CardDescription>Approve or manage connections with manufacturers.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {connections.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No manufacturers have connected with you yet.</p>
                      ) : (
                        connections.map((c) => (
                          <div key={c.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-lg">{c.company_name}</span>
                                <Badge variant={c.status === 'active' ? 'default' : c.status === 'pending' ? 'secondary' : 'outline'}>
                                  {c.status.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{c.contact_person} • {c.email}</p>
                              <p className="text-xs text-muted-foreground">{c.city}, {c.country}</p>
                            </div>
                            {c.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoading === c.id}
                                  onClick={() => handleConnectionAction(c.id, 'rejected')}
                                >
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  disabled={actionLoading === c.id}
                                  onClick={() => handleConnectionAction(c.id, 'active')}
                                >
                                  Approve
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


              {/* ── Procurement ── */}
              <TabsContent value="procurement" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Active RFQs & Quotes</CardTitle>
                        <CardDescription>Structured negotiations with manufacturers.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.location.href='/communication-hub'}>Open Comm Hub</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rfqs.length === 0 ? (
                        <div className="text-center py-10">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="text-sm text-muted-foreground">No active procurement requests yet.</p>
                        </div>
                      ) : (
                        rfqs.map((rfq) => (
                          <Card key={rfq.id} className="overflow-hidden">
                            <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="font-bold">{rfq.product_name}</h3>
                                  <p className="text-sm text-muted-foreground">{rfq.company_name} • {rfq.quantity} units</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right hidden md:block mr-2">
                                  <p className="text-xs text-muted-foreground">Status</p>
                                  <Badge className="capitalize">{rfq.status}</Badge>
                                </div>
                                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition-opacity" onClick={() => window.location.href=`/communication-hub?rfq=${rfq.id}`}>
                                  <MessageSquare className="w-4 h-4" /> Message & Quote
                                </Button>
                              </div>
                            </div>
                            {rfq.status === 'sent' && (
                              <div className="bg-blue-50 px-4 py-2 border-t border-blue-100 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                                <span className="text-xs text-blue-700 font-medium">New request! Open to view details and submit a quote.</span>
                              </div>
                            )}

                
                {/* Legacy Inquiries as fallback */}
                {inquiries.length > 0 && (
                  <Card className="opacity-70">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm">Historical Messages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 px-4 pb-4">
                      {inquiries.map(i => (
                        <div key={i.id} className="text-xs border-b pb-2">
                          <span className="font-bold">{i.manufacturer_name}:</span> {i.message}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Scorecard ── */}
              <TabsContent value="scorecard">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Supplier Scorecard</CardTitle>
                    <CardDescription>
                      How manufacturers evaluate you. Improve each metric to rank higher in discovery.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Profile score */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Profile Completeness</span>
                        <span>{completionPercent}%</span>
                      </div>
                      <Progress value={completionPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Fill all 9 core fields for maximum visibility.</p>
                    </div>

                    {/* Compliance score */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Compliance (Certifications)</span>
                        <span>{verifiedCount}/4 verified</span>
                      </div>
                      <Progress value={(verifiedCount / 4) * 100} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">ISO 9001, BIS, EPR, Pollution Board — aim for all 4.</p>
                    </div>

                    {/* Catalog depth */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Catalog Depth</span>
                        <span>{materials.length} SKU{materials.length !== 1 ? 's' : ''}</span>
                      </div>
                      <Progress value={Math.min(materials.length * 20, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Add at least 5 products to reach full score.</p>
                    </div>

                    {/* Stock health */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Stock Health</span>
                        <span>{materials.length - lowStockCount}/{materials.length} in stock</span>
                      </div>
                      <Progress
                        value={materials.length > 0 ? ((materials.length - lowStockCount) / materials.length) * 100 : 0}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Keep all products in-stock to avoid manufacturer churn.</p>
                    </div>

                    {/* Overall Trust Score */}
                    <div className="rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border p-4 mt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg">Overall Trust Score</p>
                          <p className="text-sm text-muted-foreground">Composite SCM reliability index</p>
                        </div>

                        <div className="text-4xl font-black text-blue-700">{trustScore}<span className="text-lg font-normal text-muted-foreground">/100</span></div>
                      </div>
                      <Progress value={trustScore} className="h-3 mt-3" />
                      <p className="text-xs mt-2 text-muted-foreground">
                        {trustScore >= 80 ? '🌟 Excellent — you appear at the top of manufacturer searches.' :
                         trustScore >= 60 ? '✅ Good — a few improvements will make you a top supplier.' :
                         '⚠️ Needs work — complete profile, upload certs, and add more products.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AuthenticatedShell>
  );
}
