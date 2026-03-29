import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  getSupplierProducts, 
  getSupplierProfile, 
  saveSupplierProfile, 
  saveSupplierPricing, 
  logout 
} from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'products'>('dashboard');
  const [supplierInfo, setSupplierInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>({
    // Company Overview
    companyOverview: '',
    yearsInBusiness: '',
    companySize: 'Small (1-50)',
    annualTurnover: '< 1 Cr',
    websiteUrl: '',
    linkedinUrl: '',

    // Manufacturing Details
    factoryArea: '',
    numberOfMachines: '',
    keyEquipment: '',
    additionalCertifications: [] as string[],

    // Operational Details
    paymentTerms: '100% COD',
    shippingOptions: [] as string[],
    qualityGuarantee: '',
    returnPolicy: '',

    // Contact Details
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    officeAddress: '',
    officePhone: '',
    supportEmail: '',

    // Differentiation
    whyChooseUs: '',
    keyStrengths: [] as string[],
    videoLink: '',
  });

  const supplierId = parseInt(localStorage.getItem('supplierId') || '1');

  useEffect(() => {
    fetchSupplierInfo();
  }, [supplierId]);

  const fetchSupplierInfo = async () => {
    try {
      setLoading(true);
      const data = await getSupplierProducts(supplierId);
      setSupplierInfo(data);
      
      // Load profile data from database
      try {
        const profile = await getSupplierProfile(supplierId);
        if (profile) {
          setProfileData({
            companyOverview: profile.company_overview || '',
            yearsInBusiness: profile.years_in_business || '',
            companySize: profile.company_size || 'Small (1-50)',
            annualTurnover: profile.annual_turnover || '< 1 Cr',
            websiteUrl: profile.website_url || '',
            linkedinUrl: profile.linkedin_url || '',
            factoryArea: profile.factory_area || '',
            numberOfMachines: profile.number_of_machines || '',
            keyEquipment: profile.key_equipment || '',
            additionalCertifications: profile.additional_certifications || [],
            paymentTerms: profile.payment_terms || '100% COD',
            shippingOptions: profile.shipping_options || [],
            qualityGuarantee: profile.quality_guarantee || '',
            returnPolicy: profile.return_policy || '',
            primaryContactName: profile.primary_contact_name || '',
            primaryContactPhone: profile.primary_contact_phone || '',
            primaryContactEmail: profile.primary_contact_email || '',
            officeAddress: profile.office_address || '',
            officePhone: profile.office_phone || '',
            supportEmail: profile.support_email || '',
            why_choose_us: profile.why_choose_us || '',
            keyStrengths: profile.key_strengths || [],
            videoLink: profile.video_link || '',
          });
        }
      } catch (e) {
        console.log("No profile record found in DB yet");
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load supplier info',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('supplierId');
    navigate('/');
  };

  const handleProfileChange = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (arrayField: string, value: string) => {
    setProfileData(prev => {
      const current = prev[arrayField] || [];
      const updated = current.includes(value)
        ? current.filter((item: string) => item !== value)
        : [...current, value];
      return { ...prev, [arrayField]: updated };
    });
  };

  const calculateProfileCompletion = () => {
    const requiredFields = [
      'companyOverview',
      'yearsInBusiness',
      'companySize',
      'annualTurnover',
      'factoryArea',
      'numberOfMachines',
      'keyEquipment',
      'paymentTerms',
      'shippingOptions',
      'qualityGuarantee',
      'returnPolicy',
      'primaryContactName',
      'primaryContactPhone',
      'primaryContactEmail',
      'officeAddress'
    ];

    const filledFields = requiredFields.filter(field => {
      const value = profileData[field];
      if (Array.isArray(value)) return value.length > 0;
      return value && value.toString().trim() !== '';
    });

    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const getProfileRating = (completion: number) => {
    if (completion < 10) return { level: 'Minimal', stars: 1, color: 'text-red-500' };
    if (completion < 40) return { level: 'Basic', stars: 2, color: 'text-orange-500' };
    if (completion < 70) return { level: 'Good', stars: 3, color: 'text-yellow-500' };
    return { level: 'Excellent', stars: 5, color: 'text-green-500' };
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      await saveSupplierProfile({
        supplier_id: supplierId,
        company_overview: profileData.companyOverview,
        years_in_business: parseInt(profileData.yearsInBusiness) || 0,
        company_size: profileData.companySize,
        annual_turnover: profileData.annualTurnover,
        website_url: profileData.websiteUrl,
        linkedin_url: profileData.linkedinUrl,
        factory_area: profileData.factoryArea,
        number_of_machines: parseInt(profileData.numberOfMachines) || 0,
        key_equipment: profileData.keyEquipment,
        additional_certifications: profileData.additionalCertifications,
        payment_terms: profileData.paymentTerms,
        shipping_options: profileData.shippingOptions,
        quality_guarantee: profileData.qualityGuarantee,
        return_policy: profileData.returnPolicy,
        primary_contact_name: profileData.primaryContactName,
        primary_contact_phone: profileData.primaryContactPhone,
        primary_contact_email: profileData.primaryContactEmail,
        office_address: profileData.officeAddress,
        office_phone: profileData.officePhone,
        support_email: profileData.supportEmail,
        why_choose_us: profileData.whyChooseUs,
        key_strengths: profileData.keyStrengths,
        video_link: profileData.videoLink
      });
      
      toast({
        title: 'Profile Saved',
        description: 'Your supplier profile has been updated successfully in the database!',
      });
      
      fetchSupplierInfo(); // Refresh to update dashboard completion
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile to database',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const [newProduct, setNewProduct] = useState({
    product_name: '',
    plastic_type: 'LDPE',
    grade: '',
    application: '',
    category: '',
    price_per_unit: '',
    bulk_discount_percent: '0',
  });

  const handleAddProduct = async () => {
    if (!newProduct.product_name || !newProduct.price_per_unit || !newProduct.grade) {
      toast({
        title: 'Missing Fields',
        description: 'Product name, grade, and price are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      await saveSupplierPricing({
        supplier_id: supplierId,
        product_name: newProduct.product_name,
        plastic_type: newProduct.plastic_type,
        grade: newProduct.grade,
        application: newProduct.application,
        category: newProduct.category,
        price_per_unit: parseFloat(newProduct.price_per_unit),
        bulk_discount_percent: parseFloat(newProduct.bulk_discount_percent) || 0,
      });
      
      toast({
        title: 'Product Added',
        description: 'New product has been added to your database catalog!',
      });
      
      setNewProduct({
        product_name: '',
        plastic_type: 'LDPE',
        grade: '',
        application: '',
        category: '',
        price_per_unit: '',
        bulk_discount_percent: '0',
      });
      
      fetchSupplierInfo();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product to database',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const profileCompletion = calculateProfileCompletion();
  const { level, stars, color } = getProfileRating(profileCompletion);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <p className="text-lg">Loading supplier information...</p>
      </div>
    );
  }

  if (!supplierInfo) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800">Failed to load supplier information. Please try again.</p>
          <Button onClick={fetchSupplierInfo} className="mt-4">Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Supplier Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'dashboard'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Complete Your Profile
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Your Products
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">{supplierInfo.supplier_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-lg">{supplierInfo.country}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Plastic Types</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {supplierInfo.plastic_types.map((type: string) => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Products</p>
                <p className="font-semibold text-lg text-blue-600">{supplierInfo.product_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cost Range</p>
                <p className="font-semibold">₹{supplierInfo.cost_range.min} - ₹{supplierInfo.cost_range.max}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Your Products ({supplierInfo.product_count})</h3>
            {supplierInfo.products.length === 0 ? (
              <p className="text-gray-600">No products found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supplierInfo.products.map((product: any) => (
                  <div key={product.product_id} className="border rounded p-4 hover:shadow-lg transition">
                    <h4 className="font-bold mb-2">{product.product_name}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Type: <span className="font-semibold">{product.plastic_type}</span></p>
                      <p>Grade: <span className="font-semibold">{product.grade}</span></p>
                      <p>App: <span className="font-semibold">{product.application}</span></p>
                      <p>Category: <span className="font-semibold">{product.category}</span></p>
                    </div>
                    <p className="font-semibold text-blue-600 mt-3">₹{product.unit_cost}/unit</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-4xl">
          {/* Profile Completion Card */}
          <Card className="p-6 mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold mb-2">Profile Completion</h3>
                <p className="text-gray-600">Complete your profile to attract more buyers and improve visibility</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{profileCompletion}%</div>
                <div className={`text-lg font-semibold ${color}`}>
                  {'⭐'.repeat(stars)} {level}
                </div>
              </div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </Card>

          {/* Section 1: Company Overview */}
          <Card className="p-6 mb-6">
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">1</span>
              Company Overview
            </h4>
            <div className="space-y-4">
              <div>
                <Label>Company Overview *</Label>
                <textarea
                  value={profileData.companyOverview}
                  onChange={(e) => handleProfileChange('companyOverview', e.target.value)}
                  placeholder="Describe your company, what you do, your mission..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">{profileData.companyOverview.length}/500 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Years in Business *</Label>
                  <Input
                    type="number"
                    value={profileData.yearsInBusiness}
                    onChange={(e) => handleProfileChange('yearsInBusiness', e.target.value)}
                    placeholder="15"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Company Size *</Label>
                  <select
                    value={profileData.companySize}
                    onChange={(e) => handleProfileChange('companySize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  >
                    <option>Small (1-50)</option>
                    <option>Medium (51-500)</option>
                    <option>Large (500+)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Annual Turnover *</Label>
                  <select
                    value={profileData.annualTurnover}
                    onChange={(e) => handleProfileChange('annualTurnover', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  >
                    <option>&lt; 1 Cr</option>
                    <option>1-5 Cr</option>
                    <option>5-10 Cr</option>
                    <option>10+ Cr</option>
                  </select>
                </div>
                <div>
                  <Label>Website (Optional)</Label>
                  <Input
                    type="url"
                    value={profileData.websiteUrl}
                    onChange={(e) => handleProfileChange('websiteUrl', e.target.value)}
                    placeholder="www.yourcompany.com"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>LinkedIn URL (Optional)</Label>
                <Input
                  type="url"
                  value={profileData.linkedinUrl}
                  onChange={(e) => handleProfileChange('linkedinUrl', e.target.value)}
                  placeholder="linkedin.com/company/yourcompany"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Section 2: Manufacturing Details */}
          <Card className="p-6 mb-6">
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">2</span>
              Manufacturing Details
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Factory Area *</Label>
                  <Input
                    value={profileData.factoryArea}
                    onChange={(e) => handleProfileChange('factoryArea', e.target.value)}
                    placeholder="5000 sq.ft"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Number of Machines *</Label>
                  <Input
                    type="number"
                    value={profileData.numberOfMachines}
                    onChange={(e) => handleProfileChange('numberOfMachines', e.target.value)}
                    placeholder="10"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Key Equipment (comma separated) *</Label>
                <textarea
                  value={profileData.keyEquipment}
                  onChange={(e) => handleProfileChange('keyEquipment', e.target.value)}
                  placeholder="Injection Molding, Extrusion, Film Blowing, Testing Lab"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Additional Certifications (besides ISO, BIS, EPR, Pollution Board)</Label>
                <div className="mt-2 space-y-2">
                  {['IATF 16949', 'Food Safety', 'ISO 14001', 'SA 8000', 'Other'].map(cert => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={cert}
                        checked={profileData.additionalCertifications.includes(cert)}
                        onCheckedChange={() => handleCheckboxChange('additionalCertifications', cert)}
                      />
                      <label htmlFor={cert} className="text-sm cursor-pointer">{cert}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Section 3: Operational Details */}
          <Card className="p-6 mb-6">
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">3</span>
              Operational Details
            </h4>
            <div className="space-y-4">
              <div>
                <Label>Payment Terms *</Label>
                <select
                  value={profileData.paymentTerms}
                  onChange={(e) => handleProfileChange('paymentTerms', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                >
                  <option>100% COD</option>
                  <option>50% Advance + 50% COD</option>
                  <option>30 days from invoice</option>
                  <option>Custom terms (mention in notes)</option>
                </select>
              </div>
              <div>
                <Label>Shipping Options *</Label>
                <div className="mt-2 space-y-2">
                  {['FOB', 'CIF', 'Local Delivery', 'Export Ready'].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={profileData.shippingOptions.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('shippingOptions', option)}
                      />
                      <label htmlFor={option} className="text-sm cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Quality Guarantee *</Label>
                <textarea
                  value={profileData.qualityGuarantee}
                  onChange={(e) => handleProfileChange('qualityGuarantee', e.target.value)}
                  placeholder="100% inspection before dispatch, defect-free guarantee, 30 days warranty..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Return & Warranty Policy *</Label>
                <textarea
                  value={profileData.returnPolicy}
                  onChange={(e) => handleProfileChange('returnPolicy', e.target.value)}
                  placeholder="Accept returns within 7 days of delivery for quality issues, defective material replaced free..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Section 4: Contact Information */}
          <Card className="p-6 mb-6">
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">4</span>
              Contact Information
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Primary Contact Name *</Label>
                  <Input
                    value={profileData.primaryContactName}
                    onChange={(e) => handleProfileChange('primaryContactName', e.target.value)}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Title (Sales Manager, etc.)</Label>
                  <Input placeholder="Sales Manager" className="mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Phone *</Label>
                  <Input
                    type="tel"
                    value={profileData.primaryContactPhone}
                    onChange={(e) => handleProfileChange('primaryContactPhone', e.target.value)}
                    placeholder="+91-9999999999"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Contact Email *</Label>
                  <Input
                    type="email"
                    value={profileData.primaryContactEmail}
                    onChange={(e) => handleProfileChange('primaryContactEmail', e.target.value)}
                    placeholder="contact@company.com"
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>Office Address *</Label>
                <textarea
                  value={profileData.officeAddress}
                  onChange={(e) => handleProfileChange('officeAddress', e.target.value)}
                  placeholder="201, Industrial Park, Sector 5, Mumbai, Maharashtra 400092"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Office Phone</Label>
                  <Input
                    type="tel"
                    value={profileData.officePhone}
                    onChange={(e) => handleProfileChange('officePhone', e.target.value)}
                    placeholder="+91-2299999999"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Support Email</Label>
                  <Input
                    type="email"
                    value={profileData.supportEmail}
                    onChange={(e) => handleProfileChange('supportEmail', e.target.value)}
                    placeholder="support@company.com"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Section 5: Differentiation */}
          <Card className="p-6 mb-6">
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">5</span>
              Differentiation (Stand Out!)
            </h4>
            <div className="space-y-4">
              <div>
                <Label>Why Choose Us?</Label>
                <textarea
                  value={profileData.whyChooseUs}
                  onChange={(e) => handleProfileChange('whyChooseUs', e.target.value)}
                  placeholder="15+ years of experience, ISO certified quality, competitive pricing, fast delivery, dedicated account manager..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                  rows={3}
                />
              </div>
              <div>
                <Label>Key Strengths</Label>
                <div className="mt-2 space-y-2">
                  {[
                    'Competitive Pricing',
                    'Fast Delivery',
                    'Quality Certified',
                    'Customization Support',
                    'Export Ready',
                    'Innovation/R&D',
                    'Sustainability Focus',
                    'In-house Testing'
                  ].map(strength => (
                    <div key={strength} className="flex items-center space-x-2">
                      <Checkbox
                        id={strength}
                        checked={profileData.keyStrengths.includes(strength)}
                        onCheckedChange={() => handleCheckboxChange('keyStrengths', strength)}
                      />
                      <label htmlFor={strength} className="text-sm cursor-pointer">{strength}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Factory Tour / Introduction Video Link</Label>
                <Input
                  type="url"
                  value={profileData.videoLink}
                  onChange={(e) => handleProfileChange('videoLink', e.target.value)}
                  placeholder="https://youtu.be/your-video"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button onClick={saveProfile} className="flex-1 bg-green-600 hover:bg-green-700">
              ✓ Save Profile
            </Button>
            <Button variant="outline" onClick={() => setActiveTab('dashboard')} className="flex-1">
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          {/* Add Product Form */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">+</span>
              Add New Product
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={newProduct.product_name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, product_name: e.target.value }))}
                  placeholder="e.g. Recycled LDPE Pellets Grade A"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Plastic Type *</Label>
                <select
                  value={newProduct.plastic_type}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, plastic_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                >
                  {['LDPE', 'HDPE', 'PP', 'PET', 'PVC', 'PS', 'ABS', 'NYLON'].map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Grade *</Label>
                <Input
                  value={newProduct.grade}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, grade: e.target.value }))}
                  placeholder="e.g. Blow Grade, Film Grade"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Application</Label>
                <Input
                  value={newProduct.application}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, application: e.target.value }))}
                  placeholder="e.g. Packaging, Industrial Parts"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={newProduct.category}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g. Post-Consumer, Virgin Equivalent"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Price per Unit (₹) *</Label>
                <Input
                  type="number"
                  value={newProduct.price_per_unit}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price_per_unit: e.target.value }))}
                  placeholder="95.50"
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={handleAddProduct} className="w-full bg-blue-600 hover:bg-blue-700">
              Add to Catalog
            </Button>
          </Card>

          {/* Product List */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Your Products ({supplierInfo.product_count})</h3>
            {supplierInfo.products.length === 0 ? (
              <p className="text-gray-600">No products found in your catalog. Add one above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {supplierInfo.products.map((product: any) => (
                  <div key={product.product_id} className="border rounded p-4 hover:shadow-lg transition bg-white">
                    <h4 className="font-bold mb-2 text-lg text-gray-800">{product.product_name}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="flex justify-between">
                        <span>Type:</span>
                        <Badge variant="outline" className="font-semibold">{product.plastic_type}</Badge>
                      </p>
                      <p className="flex justify-between">
                        <span>Grade:</span>
                        <span className="font-semibold">{product.grade}</span>
                      </p>
                      {product.application && (
                        <p className="flex justify-between">
                          <span>App:</span>
                          <span className="font-semibold">{product.application}</span>
                        </p>
                      )}
                      {product.category && (
                        <p className="flex justify-between">
                          <span>Category:</span>
                          <span className="font-semibold">{product.category}</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <span className="text-sm text-gray-500">Unit Price</span>
                      <span className="font-bold text-xl text-blue-600">₹{product.unit_cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
