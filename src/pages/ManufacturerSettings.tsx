import { FormEvent, useEffect, useState } from 'react';
import { AuthenticatedShell } from '@/components/AuthenticatedShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getManufacturerProfile, saveManufacturerProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function ManufacturerSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getManufacturerProfile();
        setForm(data || {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveManufacturerProfile(form);
      toast({ title: 'Profile saved', description: 'Manufacturer settings updated.' });
    } catch (error) {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Unable to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Manufacturer Settings</h1>
        <Card className="p-6">
          {loading ? <p>Loading profile...</p> : (
            <form className="grid md:grid-cols-2 gap-4" onSubmit={onSubmit}>
              {[
                ['company_name', 'Company Name'],
                ['contact_person', 'Contact Person'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['address', 'Address'],
                ['city', 'City'],
                ['state', 'State'],
                ['country', 'Country'],
                ['website', 'Website'],
                ['business_description', 'Business Description'],
              ].map(([key, label]) => (
                <div key={key} className={key === 'business_description' || key === 'address' ? 'md:col-span-2' : ''}>
                  <Label>{label}</Label>
                  <Input value={form[key] || ''} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="md:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button></div>
            </form>
          )}
        </Card>
      </div>
    </AuthenticatedShell>
  );
}
