import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckIcon, DocumentArrowUpIcon, XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { verifyCompany, verifyForeignCompanyWithDocuments, validateFile, formatFileSize } from '@/lib/api';

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

export default function CompanyVerification() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    gstin: '',
    pan: '',
    registrationNumber: '',
    email: '',
  });
  
  // API integration states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [companyResult, setCompanyResult] = useState<any | null>(null);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);

  const isIndianCompany = selectedCountry === 'IN';

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors when user starts typing
    if (apiError) setApiError(null);
    // Clear company result when form changes
    if (companyResult) {
      setCompanyResult(null);
      setShowCompanyDetails(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Show validation errors
    if (errors.length > 0) {
      setApiError(`Some files were rejected:\n${errors.join('\n')}`);
    }

    // Add valid files
    if (validFiles.length > 0) {
      setUploadedFiles(prev => {
        const newFiles = [...prev, ...validFiles];
        return newFiles.slice(0, 10); // Limit to 10 files
      });
    }

    // Clear file input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): string | null => {
    if (isIndianCompany) {
      if (!formData.gstin.trim()) {
        return 'GSTIN is required for Indian companies';
      }
      if (formData.gstin.length !== 15) {
        return 'GSTIN must be exactly 15 characters';
      }
      if (!formData.pan.trim()) {
        return 'PAN is required for Indian companies';
      }
      if (formData.pan.length !== 10) {
        return 'PAN must be exactly 10 characters';
      }
    } else {
      if (!formData.registrationNumber.trim()) {
        return 'Company registration number is required';
      }
      if (!formData.email.trim()) {
        return 'Email address is required for verification updates';
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        return 'Please enter a valid email address';
      }
      if (uploadedFiles.length < 2) {
        return 'Please upload at least 2 supporting documents';
      }
      if (uploadedFiles.length > 10) {
        return 'Maximum 10 documents allowed';
      }
    }
    return null;
  };

  const handleProceedToSignUp = () => {
    if (companyResult) {
      setApiSuccess('Redirecting to sign-up...');
      setTimeout(() => {
        navigate('/signup/manufacturer', { 
          state: { 
            verifiedCompany: companyResult,
            country: selectedCountry 
          } 
        });
      }, 1000);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setApiError(null);
    setApiSuccess(null);
    setCompanyResult(null);
    setShowCompanyDetails(false);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setApiError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isIndianCompany) {
        // Indian company verification
        const verificationData = {
          country: selectedCountry,
          gstin: formData.gstin.toUpperCase(),
          pan: formData.pan.toUpperCase()
        };

        const result = await verifyCompany(verificationData);
        setCompanyResult(result);
        setShowCompanyDetails(true);
        
        // Handle Indian company status
        const companyStatus = result.status?.toLowerCase();
        if (companyStatus === 'active' || companyStatus === 'verified') {
          setApiSuccess('Company verified successfully! Please review the details below and proceed to sign-up.');
        } else if (companyStatus === 'inactive') {
          setApiError('Company verification successful but status is INACTIVE. Please contact support to activate your GSTIN before proceeding.');
        } else {
          setApiError('Company verification completed with unknown status. Please contact support.');
        }
      } else {
        // Foreign company verification with document upload
        const result = await verifyForeignCompanyWithDocuments(
          selectedCountry,
          formData.registrationNumber,
          formData.email,
          uploadedFiles
        );

        setCompanyResult(result);
        setShowCompanyDetails(true);

        if (result.company_exists) {
          setApiSuccess('Company registration verified! Your documents are under verification. We will inform you via email within 2-3 working days.');
        } else {
          setApiSuccess('Thank you for submitting your documents. Your company registration is under verification. We will inform you via email within 2-3 working days.');
        }
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      
      if (isIndianCompany) {
        // Indian company error handling
        if (err.message?.includes('not found') || err.message?.includes('404')) {
          setApiError('Company not found in our records. Please check your GSTIN/PAN or registration details.');
        } else if (err.message?.includes('PAN does not match')) {
          setApiError('PAN verification failed. Please check your PAN number.');
        } else {
          setApiError(err.message || 'An error occurred during verification. Please try again.');
        }
      } else {
        // Foreign company error handling
        setApiError(err.message || 'An error occurred during document upload. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToHome = () => {
    navigate('/');
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
                1
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Verification</span>
            </div>
            <div className="w-16 h-0.5 bg-border" />
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-border text-sm font-medium text-muted-foreground">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-muted-foreground">Sign-Up</span>
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
                Company Verification
              </h1>
              <p className="text-muted-foreground">
                We need to verify your company before creating your account
              </p>
            </div>

            {/* Error Message */}
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
              >
                <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    {apiError.includes('INACTIVE') ? 'Account Activation Required' : 'Verification Failed'}
                  </h3>
                  <p className="text-sm text-red-700 mt-1 whitespace-pre-line">{apiError}</p>
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {apiSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3"
              >
                <CheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Success!</h3>
                  <p className="text-sm text-green-700 mt-1">{apiSuccess}</p>
                </div>
              </motion.div>
            )}

            {/* Company Details Display - Show when we have results */}
            {showCompanyDetails && companyResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <h3 className="text-sm font-medium text-blue-800 mb-3">
                  {isIndianCompany ? 'Company Details Found' : 'Verification Status'}
                </h3>
                
                {isIndianCompany ? (
                  // Indian company details
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-blue-700">Company Name:</span>
                      <span className="ml-2 text-blue-900">{companyResult.company_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">GSTIN:</span>
                      <span className="ml-2 text-blue-900">{companyResult.gstin || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">PAN:</span>
                      <span className="ml-2 text-blue-900">{companyResult.pan || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Status:</span>
                      <span className={`ml-2 font-medium ${
                        companyResult.status?.toLowerCase() === 'active' 
                          ? 'text-green-600' 
                          : companyResult.status?.toLowerCase() === 'inactive'
                          ? 'text-orange-600'
                          : 'text-gray-600'
                      }`}>
                        {companyResult.status || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">State:</span>
                      <span className="ml-2 text-blue-900">{companyResult.state || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">City:</span>
                      <span className="ml-2 text-blue-900">{companyResult.city || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium text-blue-700">Country:</span>
                      <span className="ml-2 text-blue-900">{companyResult.country || 'N/A'}</span>
                    </div>
                  </div>
                ) : (
                  // Foreign company details
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium text-blue-700">Company Name:</span>
                        <span className="ml-2 text-blue-900">
                          {companyResult.company_name || 'Under Verification'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Registration No:</span>
                        <span className="ml-2 text-blue-900">
                          {companyResult.registration_number || formData.registrationNumber}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Country:</span>
                        <span className="ml-2 text-blue-900">
                          {companyResult.country || countries.find(c => c.code === selectedCountry)?.name || selectedCountry}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Contact Email:</span>
                        <span className="ml-2 text-blue-900">{companyResult.email || formData.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Business Type:</span>
                        <span className="ml-2 text-blue-900">{companyResult.business_type || 'Under Verification'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Status:</span>
                        <span className="ml-2 text-blue-900 font-medium">
                          {companyResult.status === 'active' ? 'Active' : 'Under Verification'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Documents Uploaded:</span>
                        <span className="ml-2 text-blue-900">{uploadedFiles.length} files</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-700">Verification ID:</span>
                        <span className="ml-2 text-blue-900 font-mono text-xs">
                          {companyResult.verification_id}
                        </span>
                      </div>
                    </div>

                    {/* Show additional company details if available */}
                    {companyResult.address && (
                      <div>
                        <span className="font-medium text-blue-700">Address:</span>
                        <span className="ml-2 text-blue-900">{companyResult.address}</span>
                      </div>
                    )}
                    
                    {companyResult.incorporation_date && (
                      <div>
                        <span className="font-medium text-blue-700">Incorporation Date:</span>
                        <span className="ml-2 text-blue-900">{companyResult.incorporation_date}</span>
                      </div>
                    )}

                    {/* Document verification status */}
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="flex items-center space-x-2">
                        <ExclamationCircleIcon className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Documents Under Verification</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        We are verifying your submitted documents. This process typically takes 2-3 working days.
                      </p>
                      <p className="text-sm text-yellow-700">
                        You will receive an email notification at <span className="font-medium">{companyResult.email || formData.email}</span> once the verification is complete.
                      </p>
                      {companyResult.company_exists && (
                        <p className="text-sm text-green-700 mt-1 font-medium">
                          ✓ Company registration details verified in our system
                        </p>
                      )}
                    </div>

                    {/* Uploaded files list */}
                    <div className="mt-3">
                      <span className="font-medium text-blue-700">Uploaded Documents:</span>
                      <div className="mt-2 space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center space-x-3">
                              <CheckIcon className="h-4 w-4 text-green-500" />
                              <div>
                                <span className="text-sm font-medium">{file.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-green-600 font-medium">Uploaded</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action based on status */}
                <div className="mt-4 pt-3 border-t border-blue-200">
                  {isIndianCompany ? (
                    // Indian company actions
                    companyResult.status?.toLowerCase() === 'active' ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-green-700">
                          <CheckIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">Company is active and eligible for registration</span>
                        </div>
                        <Button 
                          onClick={handleProceedToSignUp}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Proceed to Sign Up
                        </Button>
                      </div>
                    ) : companyResult.status?.toLowerCase() === 'inactive' ? (
                      <div className="flex items-center space-x-2 text-orange-700">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        <div>
                          <span className="text-sm font-medium">
                            Company verification successful but GSTIN status is INACTIVE.
                          </span>
                          <div className="mt-2">
                            <a 
                              href="https://services.gst.gov.in/services/searchtp" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline text-sm font-medium"
                            >
                              Check your GSTIN status on the official GST Portal
                            </a>
                          </div>
                          <p className="text-sm mt-1">
                            Please activate your GSTIN before proceeding with registration.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Unknown company status. Please contact support.</span>
                      </div>
                    )
                  ) : (
                    // Foreign company actions
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-blue-700">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        <div>
                          <span className="text-sm font-medium">Verification in Progress</span>
                          <p className="text-sm text-blue-600">
                            We will email you within 2-3 working days once verification is complete.
                          </p>
                        </div>
                      </div>
                      <Button 
                        onClick={handleReturnToHome}
                        variant="outline"
                      >
                        Return to Home
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Verification Form - Only show when no company details are displayed */}
            {!showCompanyDetails && (
              <form onSubmit={handleVerification} className="space-y-6">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center space-x-2">
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isIndianCompany ? (
                  <>
                    <div>
                      <Label htmlFor="gstin">GSTIN *</Label>
                      <Input
                        id="gstin"
                        value={formData.gstin}
                        onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                        placeholder="27AAPFU0939F1ZV"
                        maxLength={15}
                        className="mt-1 font-mono"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        15-digit Goods and Services Tax Identification Number
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="pan">PAN *</Label>
                      <Input
                        id="pan"
                        value={formData.pan}
                        onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                        placeholder="AAPFU0939F"
                        maxLength={10}
                        className="mt-1 font-mono"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        10-character Permanent Account Number
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="registrationNumber">Company Registration Number *</Label>
                      <Input
                        id="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                        placeholder="Enter your company registration number"
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Official registration number from your country's business registry
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="email">Contact Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter your email address for verification updates"
                        className="mt-1"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        We will send verification status updates to this email address
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="documents">
                        Supporting Documents ({uploadedFiles.length}/10) *
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          (Minimum 2, Maximum 10 files)
                        </span>
                      </Label>
                      <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center">
                        <input
                          id="documents"
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('documents')?.click()}
                          >
                            Choose Files
                          </Button>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Upload business license, tax documents, or other verification documents
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
                        </p>
                      </div>
                      
                      {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-foreground">
                            Selected Files ({uploadedFiles.length}):
                          </p>
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                              <div className="flex items-center space-x-3">
                                <CheckIcon className="h-4 w-4 text-green-500" />
                                <div>
                                  <span className="text-sm font-medium truncate max-w-xs">{file.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({formatFileSize(file.size)})
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                              >
                                <XMarkIcon className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-6">
                  <Link to="/sign-in">
                    <Button type="button" variant="ghost">
                      Already have an account?
                    </Button>
                  </Link>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition-opacity duration-300 text-white"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Verifying...</span>
                      </span>
                    ) : (
                      isIndianCompany ? 'Verify Company' : 'Upload Documents & Verify'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Back button when company details are shown */}
            {showCompanyDetails && (
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowCompanyDetails(false);
                    setCompanyResult(null);
                    setApiSuccess(null);
                    setApiError(null);
                    if (!isIndianCompany) {
                      setUploadedFiles([]);
                    }
                  }}
                >
                  {isIndianCompany ? 'Verify Another Company' : 'Start New Verification'}
                </Button>
                {companyResult?.status?.toLowerCase() !== 'active' && isIndianCompany && (
                  <Link to="/sign-in">
                    <Button type="button" variant="ghost">
                      Already have an account?
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
