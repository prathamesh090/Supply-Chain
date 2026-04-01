import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { verifySupplierDocuments, getSupplierProducts, getSupplierProfile, saveSupplierPricing } from '@/lib/api';
import { AlertTriangle, CheckCircle2, Factory, FileCheck2, Package, Plus, ShieldCheck } from 'lucide-react';
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
  file_name: string;
  reason: string;
  verified: boolean;
  expiry_date?: string | null;
  template_match?: boolean;
  document_type_valid?: boolean;
};

const profileFields = [
  'company_legal_name',
  'contact_person',
  'support_email',
  'phone',
  'factory_address',
  'city',
  'manufacturing_state',
  'country',
  'company_overview',
];

export default function SupplierDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [docType, setDocType] = useState('ISO 9001');
  const [files, setFiles] = useState<File[]>([]);
  const [newMaterial, setNewMaterial] = useState({ material_name: '', category: '', technical_specifications: '', lead_time_days: 7, stock_status: 'in_stock' });

  const loadData = async () => {
    const [profileRes, materialRes] = await Promise.all([getSupplierProfile().catch(() => null), getSupplierProducts().catch(() => [])]);
    setProfile(profileRes);
    setMaterials(Array.isArray(materialRes) ? materialRes : []);
  };

  useEffect(() => {
    (async () => {
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completionPercent = useMemo(() => {
    const completed = profileFields.filter((field) => String(profile?.[field] || '').trim()).length;
    return Math.round((completed / profileFields.length) * 100);
  }, [profile]);

  const lowStockCount = useMemo(() => materials.filter((m) => m.stock_status !== 'in_stock').length, [materials]);

  const onSaveMaterial = async () => {
    if (!newMaterial.material_name.trim()) {
      toast({ title: 'Material name required', variant: 'destructive' });
      return;
    }
    setSavingProduct(true);
    try {
      await saveSupplierPricing(newMaterial);
      toast({ title: 'Material saved', description: 'Catalog has been updated.' });
      setNewMaterial({ material_name: '', category: '', technical_specifications: '', lead_time_days: 7, stock_status: 'in_stock' });
      await loadData();
    } catch (error) {
      toast({ title: 'Failed to save material', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSavingProduct(false);
    }
  };

  const onVerifyDocs = async () => {
    if (files.length === 0) {
      toast({ title: 'Upload at least one certificate', variant: 'destructive' });
      return;
    }
    try {
      const result = await verifySupplierDocuments(docType, files);
      setVerificationResults(result.results || []);
      toast({ title: 'Verification complete', description: 'Certificate checks ran successfully.' });
    } catch (error) {
      toast({ title: 'Verification failed', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-blue-100">ChainLink Pro • Supplier Portal</p>
              <h1 className="text-3xl font-bold mt-1">Welcome, {profile?.contact_person || profile?.company_legal_name || 'Supplier'}</h1>
              <p className="text-sm text-blue-100 mt-2">Manage profile completion, material catalog, and certificate verification from one control tower.</p>
            </div>
            <Link to="/supplier/settings"><Button variant="secondary">Open Full Profile Settings</Button></Link>
          </div>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading dashboard...</p> : (
          <>
            <div className="grid md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><div className="flex items-center justify-between"><Factory className="h-5 w-5 text-blue-600" /><span className="text-2xl font-bold">{materials.length}</span></div><p className="text-xs text-muted-foreground mt-2">Products Listed</p></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center justify-between"><AlertTriangle className="h-5 w-5 text-amber-600" /><span className="text-2xl font-bold">{lowStockCount}</span></div><p className="text-xs text-muted-foreground mt-2">Stock Alerts</p></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center justify-between"><ShieldCheck className="h-5 w-5 text-green-600" /><span className="text-2xl font-bold">{verificationResults.filter(v => v.verified).length}</span></div><p className="text-xs text-muted-foreground mt-2">Verified Certificates</p></CardContent></Card>
              <Card><CardContent className="p-4"><div className="flex items-center justify-between"><FileCheck2 className="h-5 w-5 text-purple-600" /><span className="text-2xl font-bold">{completionPercent}%</span></div><p className="text-xs text-muted-foreground mt-2">Profile Completion</p></CardContent></Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid md:w-[480px] grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Completion</CardTitle>
                    <CardDescription>Progress based on core profile fields used in manufacturer discovery.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={completionPercent} />
                    <p className="text-sm text-muted-foreground">{completionPercent}% complete. Fill missing fields in Settings for better supplier ranking.</p>
                    <div className="flex flex-wrap gap-2">
                      {profileFields.map((field) => (
                        <Badge key={field} variant={String(profile?.[field] || '').trim() ? 'default' : 'outline'}>{field.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Material Catalog</CardTitle>
                    <CardDescription>Add or update product lines and lead times.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-5 gap-3">
                      <Input placeholder="Material name" value={newMaterial.material_name} onChange={(e) => setNewMaterial((prev) => ({ ...prev, material_name: e.target.value }))} />
                      <Input placeholder="Category" value={newMaterial.category} onChange={(e) => setNewMaterial((prev) => ({ ...prev, category: e.target.value }))} />
                      <Input placeholder="Specifications" value={newMaterial.technical_specifications} onChange={(e) => setNewMaterial((prev) => ({ ...prev, technical_specifications: e.target.value }))} />
                      <Input type="number" placeholder="Lead time days" value={newMaterial.lead_time_days} onChange={(e) => setNewMaterial((prev) => ({ ...prev, lead_time_days: Number(e.target.value) || 0 }))} />
                      <Button onClick={onSaveMaterial} disabled={savingProduct}><Plus className="h-4 w-4 mr-1" />{savingProduct ? 'Saving...' : 'Add'}</Button>
                    </div>
                    <div className="space-y-2">
                      {materials.map((m) => (
                        <div key={m.id} className="rounded-xl border p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{m.material_name}</p>
                            <p className="text-xs text-muted-foreground">{m.category || 'Uncategorized'} • {m.technical_specifications || 'No specs'}</p>
                          </div>
                          <Badge variant={m.stock_status === 'in_stock' ? 'default' : 'outline'}>{m.stock_status.replace('_', ' ')}</Badge>
                        </div>
                      ))}
                      {materials.length === 0 && <p className="text-sm text-muted-foreground">No materials listed yet.</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="verification">
                <Card>
                  <CardHeader>
                    <CardTitle>Certificate Verification</CardTitle>
                    <CardDescription>Checks expiry date, file format, and template/pattern consistency. Company-name matching is intentionally skipped.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-3">
                      <Input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="Document type" />
                      <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                      <Button onClick={onVerifyDocs}>Verify Certificates</Button>
                    </div>
                    <div className="space-y-2">
                      {verificationResults.map((result) => (
                        <div key={result.file_name} className="rounded-xl border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{result.file_name}</p>
                            <Badge variant={result.verified ? 'default' : 'outline'}>{result.verified ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}{result.verified ? 'Verified' : 'Needs Review'}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{result.reason}</p>
                          {result.expiry_date && <p className="text-xs mt-1">Expiry date: {result.expiry_date}</p>}
                        </div>
                      ))}
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
