import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { NetworkVisualization } from '@/components/NetworkVisualization';
import { signIn } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenant: '',
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
      const credentials = {
        email: formData.email,
        password: formData.password,
        tenant: formData.tenant || undefined,
      };

      const response = await signIn({ ...credentials, role: 'manufacturer' });
      login(response.access_token, { userId: response.user.id, email: response.user.email, role: response.user.role });

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in',
      });

      const nextPath = (location.state as { from?: string } | null)?.from || '/dashboard';
      navigate(nextPath, { replace: true });

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Network Visualization */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="w-full max-w-lg">
            <NetworkVisualization />
          </div>
          <div className="mt-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
            <p className="text-lg opacity-90">
              Connect to your supply chain network and manage operations seamlessly.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Link to="/" className="flex items-center space-x-2 mb-8">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ChainLink Pro
              </span>
            </Link>
            <h2 className="text-3xl font-extrabold text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Or{' '}
              <Link
                to="/auth/select?mode=signup"
                className="font-medium text-blue-600 hover:underline"
              >
                start your free trial
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
              onSubmit={handleSubmit}
            >
              {/* Error display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email / Username *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email or username"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tenant">Company / Organization</Label>
                <Input
                  id="tenant"
                  name="tenant"
                  type="text"
                  value={formData.tenant}
                  onChange={(e) => handleInputChange('tenant', e.target.value)}
                  placeholder="Your company domain or identifier"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={formData.rememberMe}
                    onCheckedChange={(checked) => handleInputChange('rememberMe', checked === true)}
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-sm text-muted-foreground"
                  >
                    Remember me
                  </Label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity duration-300"
                  size="lg"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>

              <div className="text-center space-y-2">
                <div><Link to="/signin/supplier" className="text-sm text-purple-600 hover:underline">Supplier portal sign in</Link></div>
                <span className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    to="/auth/select?mode=signup"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Sign up
                  </Link>
                </span>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
}