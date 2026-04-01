import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NetworkVisualization } from '@/components/NetworkVisualization';
import { getSupplierProfile, supplierSignIn } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { Building2, Mail, Lock, ArrowLeft } from 'lucide-react';

export default function SupplierSignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await supplierSignIn({
        email: formData.email,
        password: formData.password
      });
      
      login(response.access_token, { userId: response.user_id, email: response.email, role: 'supplier', full_name: response.full_name || response.supplier_name || response.email });

      toast({
        title: 'Welcome back!',
        description: 'Supplier portal access granted.',
      });

      let nextRoute = '/supplier-dashboard';
      try {
        const profile = await getSupplierProfile();
        if (!profile?.profile_completed) nextRoute = '/supplier/profile-setup';
      } catch {
        nextRoute = '/supplier/profile-setup';
      }
      navigate(nextRoute, { replace: true });

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Authentication failed';
      setError(errorMessage);
      toast({
        title: 'Sign In Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Network Visualization (Matching SignIn UI) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="w-full max-w-lg">
            <NetworkVisualization />
          </div>
          <div className="mt-8 text-center">
            <Building2 className="w-16 h-16 text-white/80 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Supplier Portal</h2>
            <p className="text-lg opacity-90 max-w-md mx-auto">
              Manage your product catalog, update pricing, and connect with plastic manufacturers globally.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-6 lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
            
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ChainLink Pro
              </span>
            </div>
            
            <h2 className="text-3xl font-extrabold text-foreground">
              Supplier Sign In
            </h2>
            <p className="mt-2 text-sm text-muted-foreground font-medium">
              Access your supplier dashboard and manage inquiries
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="email">Business Email *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="name@company.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">Password *</Label>
                <Link to="/forgot-password" title="password reset" className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => handleInputChange('rememberMe', checked === true)}
              />
              <Label
                htmlFor="remember-me"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Remember me for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity duration-300 h-11"
              size="lg"
            >
              {isSubmitting ? 'Signing in...' : 'Access Dashboard'}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase bg-white px-2 text-muted-foreground font-bold tracking-widest">
                New Supplier?
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/signup/supplier')}
              className="w-full border-2 hover:bg-blue-50 text-foreground font-bold h-11 transition-all"
            >
              Start Registration
            </Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
