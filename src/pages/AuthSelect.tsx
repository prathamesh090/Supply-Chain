import { Factory, Building2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthSelect() {
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'signup' ? 'signup' : 'signin';
  const title = mode === 'signin' ? 'Choose your portal' : 'Choose your onboarding path';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-slate-600 mt-3">ChainLink Pro has dedicated experiences for manufacturers and suppliers.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-7 border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Factory className="text-blue-700" /></div>
              <div>
                <h2 className="text-xl font-semibold">Manufacturer Portal</h2>
                <p className="text-sm text-slate-500">Source and manage your supplier network</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">Use supplier discovery, network management, and risk intelligence for your production chain.</p>
            <div className="flex gap-3">
              <Link className="flex-1" to="/signin/manufacturer"><Button className="w-full">Sign In</Button></Link>
              <Link className="flex-1" to="/signup/manufacturer"><Button variant="outline" className="w-full">Get Started</Button></Link>
            </div>
          </Card>

          <Card className="p-7 border-slate-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><Building2 className="text-purple-700" /></div>
              <div>
                <h2 className="text-xl font-semibold">Supplier Portal</h2>
                <p className="text-sm text-slate-500">Manage profile and material catalog</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">Sign in as a supplier to update capabilities, stock status, and become discoverable to manufacturers.</p>
            <div className="flex gap-3">
              <Link className="flex-1" to="/signin/supplier"><Button className="w-full bg-purple-600 hover:bg-purple-700">Sign In</Button></Link>
              <Link className="flex-1" to="/signup/supplier"><Button variant="outline" className="w-full">Get Started</Button></Link>
            </div>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700">Back to website <ArrowRight className="w-4 h-4 ml-1" /></Link>
        </div>
      </div>
    </div>
  );
}
