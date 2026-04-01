import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { signUp, createCompany } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';

const businessTypes = [
  'Manufacturing',
  'Trading',
  'Service Provider',
  'Retail',
  'Wholesale',
  'Import/Export',
  'Technology',
  'Consulting',
  'Other'
];

const industries = [
  'Automotive',
  'Electronics',
  'Textiles & Apparel',
  'Pharmaceuticals',
  'Food & Beverage',
  'Chemical',
  'Machinery',
  'Construction',
  'Energy',
  'Healthcare',
  'Aerospace',
  'Agriculture',
  'Plastic',
  'Paper & Packaging',
  'Other'
];

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    // Company fields
    companyName: '',
    businessType: '',
    industry: '',
    companyLocation: '',
    
    // Admin fields
    fullName: '',
    workEmail: '',
    password: '',
    confirmPassword: '',
  });

  // Get verified company data from navigation state
  const verifiedCompany = location.state?.verifiedCompany;
  const country = location.state?.country;

  useEffect(() => {
    if (!verifiedCompany) {
      navigate('/verify-company', { replace: true });
      return;
    }

    setFormData((prev) => ({
      ...prev,
      companyName: verifiedCompany.company_name || prev.companyName,
      companyLocation: [verifiedCompany.city, verifiedCompany.state, verifiedCompany.country]
        .filter(Boolean)
        .join(', ') || prev.companyLocation,
    }));
  }, [verifiedCompany, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleNext = () => {
    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 1) {
      navigate('/auth/select?mode=signup');
    } else {
      setCurrentStep(1);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async () => {
  if (!agreeToTerms) {
    setError('Please agree to the Terms of Service and Privacy Policy');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (passwordStrength < 3) {
    setError('Password is too weak. Please use a stronger password.');
    return;
  }

  setIsSubmitting(true);
  setError(null);

  try {
    // Step 1: Create user account
    const signUpData = {
      email: formData.workEmail,
      password: formData.password,
      full_name: formData.fullName,
      role: 'manufacturer'
    };

    const authResponse = await signUp(signUpData);
    login(authResponse.access_token, { userId: authResponse.user.id, email: authResponse.user.email, role: authResponse.user.role });

    // Step 2: Create company profile (only if we have company data)
    if (formData.companyName) {
      const companyData = {
        company_name: formData.companyName,
        business_type: formData.businessType,
        industry: formData.industry,
        company_location: formData.companyLocation,
        country_code: country,
        ...(verifiedCompany?.gstin && { gstin: verifiedCompany.gstin }),
        ...(verifiedCompany?.pan && { pan: verifiedCompany.pan }),
        ...(verifiedCompany?.registration_number && { 
          registration_number: verifiedCompany.registration_number 
        }),
      };

      await createCompany(companyData, authResponse.access_token);
    }

    // Success - redirect to dashboard
    toast({
      title: 'Account created successfully!',
      description: 'Welcome to ChainLink Pro',
    });
    
    navigate('/dashboard', { replace: true });

  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : 'An error occurred during sign up');
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ChainLink Pro
            </span>
          </Link>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-accent/50 border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Verification</span>
            </div>
            <div className="w-16 h-0.5 bg-blue-600" />
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Sign-Up</span>
            </div>
            <div className="w-16 h-0.5 bg-border" />
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-border text-sm font-medium text-muted-foreground">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-muted-foreground">Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-lg border border-border p-8 shadow-sm"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Complete Your Setup
              </h1>
              <p className="text-muted-foreground">
                Step {currentStep} of 2: {currentStep === 1 ? 'Company Information' : 'Admin Account'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            <div className="mb-6">
              <div className="flex space-x-2">
                <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-blue-600' : 'bg-border'}`} />
                <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-border'}`} />
              </div>
            </div>

            {currentStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="companyName">Company / Organization Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Your Company Ltd."
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="companyLocation">Company Location *</Label>
                  <Input
                    id="companyLocation"
                    value={formData.companyLocation}
                    onChange={(e) => handleInputChange('companyLocation', e.target.value)}
                    placeholder="City, State/Province, Country"
                    className="mt-1"
                    required
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="John Doe"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="workEmail">Work Email *</Label>
                  <Input
                    id="workEmail"
                    type="email"
                    value={formData.workEmail}
                    onChange={(e) => handleInputChange('workEmail', e.target.value)}
                    placeholder="john@company.com"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    className="mt-1"
                    required
                  />
                  <div className="mt-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full ${
                            passwordStrength >= level
                              ? passwordStrength <= 2
                                ? 'bg-red-500'
                                : passwordStrength <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 8 characters with uppercase, lowercase, number and special character
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className="mt-1"
                    required
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm leading-relaxed"
                  >
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                  </Label>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between pt-8">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Back</span>
              </Button>
              
              {currentStep === 1 ? (
                <Button 
                  onClick={handleNext}
                  disabled={!formData.companyName || !formData.companyLocation}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity duration-300"
                  size="lg"
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit}
                  disabled={!agreeToTerms || isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity duration-300"
                  size="lg"
                >
                  {isSubmitting ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Creating Account...</span>
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
