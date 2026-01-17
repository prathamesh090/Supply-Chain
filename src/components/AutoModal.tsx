import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { XMarkIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'signin' | 'signup' | 'verification' | 'companySetup';

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
  'Other'
];

const countries = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
];

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    // Login fields
    email: '',
    password: '',
    tenant: '',
    
    // Company verification fields
    gstin: '',
    pan: '',
    registrationNumber: '',
    
    // Company setup fields
    companyName: '',
    businessType: '',
    industry: '',
    companyLocation: '',
    
    // Admin fields
    fullName: '',
    workEmail: '',
    confirmPassword: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files].slice(0, 4)); // Max 4 files
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const isIndianCompany = selectedCountry === 'IN';

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const formVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <DialogHeader className="relative">
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
              {mode === 'signin' 
                ? 'Welcome Back' 
                : mode === 'signup' 
                ? 'Company Verification' 
                : mode === 'companySetup'
                ? 'Complete Your Setup'
                : 'Join ChainLink Pro'}
            </DialogTitle>
            <button
              onClick={onClose}
              className="absolute right-0 top-0 p-2 hover:bg-accent rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {mode === 'signin' && (
              <motion.div
                key="signin"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4 py-4"
              >
                <div>
                  <Label htmlFor="signin-email">Email / Username</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email or username"
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <div>
                  <Label htmlFor="tenant">Company / Organization</Label>
                  <Input
                    id="tenant"
                    value={formData.tenant}
                    onChange={(e) => handleInputChange('tenant', e.target.value)}
                    placeholder="Your company domain or identifier"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </Label>
                </div>
                <Button variant="hero" className="w-full" size="lg">
                  Sign In
                </Button>
                <div className="text-center space-y-2">
                  <button className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </button>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Don't have an account?{' '}
                      <button
                        onClick={() => setMode('signup')}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign up
                      </button>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {mode === 'signup' && (
              <motion.div
                key="signup"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4 py-4"
              >
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Step 1: Company Verification</p>
                </div>
                
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isIndianCompany ? (
                  <>
                    <div>
                      <Label htmlFor="gstin">GSTIN</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) => handleInputChange('gstin', e.target.value)}
                        placeholder="27AAPFU0939F1ZV"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        15-digit Goods and Services Tax Identification Number
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="pan">PAN</Label>
                      <Input
                        id="pan"
                        value={formData.pan}
                        onChange={(e) => handleInputChange('pan', e.target.value)}
                        placeholder="AAPFU0939F"
                        maxLength={10}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        10-character Permanent Account Number
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="registrationNumber">Company Registration Number</Label>
                      <Input
                        id="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                        placeholder="Enter your company registration number"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Official registration number from your country's business registry
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="documents">Supporting Documents (2-4 files required)</Label>
                      <div className="mt-2">
                        <input
                          id="documents"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('documents')?.click()}
                          className="w-full"
                        >
                          <DocumentArrowUpIcon className="w-4 h-4 mr-2" />
                          Upload Documents ({uploadedFiles.length}/4)
                        </Button>
                      </div>
                      {uploadedFiles.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-accent p-2 rounded">
                              <span className="truncate">{file.name}</span>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-destructive hover:underline ml-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload business license, tax documents, or other verification documents
                      </p>
                    </div>
                  </>
                )}

                <Button 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  onClick={() => setMode('companySetup')}
                >
                  Continue to Setup
                </Button>
                
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      onClick={() => setMode('signin')}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </span>
                </div>
              </motion.div>
            )}

            {mode === 'companySetup' && (
              <motion.div
                key="companySetup"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4 py-4"
              >
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">Step 2: Company & Admin Setup</p>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h4 className="font-medium text-sm">Company Information</h4>
                  
                  <div>
                    <Label htmlFor="companyName">Company / Organization Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Your Company Ltd."
                    />
                  </div>

                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                    <Label htmlFor="companyLocation">Company Location</Label>
                    <Input
                      id="companyLocation"
                      value={formData.companyLocation}
                      onChange={(e) => handleInputChange('companyLocation', e.target.value)}
                      placeholder="City, State/Province, Country"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Admin Account</h4>
                  
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="workEmail">Work Email</Label>
                    <Input
                      id="workEmail"
                      type="email"
                      value={formData.workEmail}
                      onChange={(e) => handleInputChange('workEmail', e.target.value)}
                      placeholder="john@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Create a strong password"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 8 characters with uppercase, lowercase, number and special character
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm font-medium leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{' '}
                    <button className="text-primary hover:underline">Terms of Service</button>
                    {' '}and{' '}
                    <button className="text-primary hover:underline">Privacy Policy</button>
                  </Label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => setMode('signup')}
                  >
                    Back
                  </Button>
                  <Button 
                    variant="hero" 
                    className="flex-1" 
                    size="lg"
                    disabled={!agreeToTerms}
                  >
                    Create Account
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
