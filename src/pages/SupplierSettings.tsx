import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupplierProfile, saveSupplierProfile, type SupplierProfilePayload } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function SupplierSettings({ forceComplete = false }: { forceComplete?: boolean }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [form, setForm] = useState<SupplierProfilePayload>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getSupplierProfile();
        setForm(data);
        setProfileCompleted(Boolean(data?.profile_completed));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await saveSupplierProfile(form);
      setProfileCompleted(Boolean(result?.profile_completed));
      toast({ title: 'Profile saved', description: 'Supplier profile updated successfully.' });
      if (forceComplete) navigate('/supplier-dashboard', { replace: true });
    } catch (error) {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Unable to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Supplier Profile Settings</h1>
        <p className="text-sm text-muted-foreground">Complete and maintain the profile data manufacturers see.</p>
        <p className="text-sm mt-1">Status: <span className={profileCompleted ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>{profileCompleted ? 'Complete' : 'Incomplete'}</span></p>
      </div>
      <Card className="p-6">
        <form className="grid md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          {[
            ['company_legal_name', 'Company Name'],
            ['contact_person', 'Contact Person'],
            ['support_email', 'Contact Email'],
            ['phone', 'Phone'],
            ['factory_address', 'Address'],
            ['city', 'City'],
            ['manufacturing_state', 'State'],
            ['country', 'Country'],
            ['website', 'Website'],
            ['categories', 'Categories / Materials'],
            ['technical_capabilities', 'Technical Capabilities'],
            ['lead_time_defaults', 'Lead Time Defaults'],
            ['stock_service_notes', 'Stock / Service Notes'],
            ['company_overview', 'Business Description'],
          ].map(([key, label]) => (
            <div key={key} className={key === 'company_overview' || key === 'technical_capabilities' || key === 'stock_service_notes' ? 'md:col-span-2' : ''}>
              <Label>{label}</Label>
              <Input value={(form as any)[key] || ''} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} />
            </div>
          ))}
          <div className="md:col-span-2 flex gap-2 justify-end">
            {forceComplete && <Button type="button" variant="outline" onClick={() => navigate('/supplier-dashboard')}>Skip for now</Button>}
            <Button type="submit" disabled={saving || loading}>{saving ? 'Saving...' : 'Save Profile'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );

  if (loading) return <AuthenticatedShell><p>Loading profile...</p></AuthenticatedShell>;
  return <AuthenticatedShell>{content}</AuthenticatedShell>;
}
