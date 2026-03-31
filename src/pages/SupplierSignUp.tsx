import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supplierSignUp } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function SupplierSignUp() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    company_legal_name: '',
    phone: '',
    manufacturing_state: '',
    factory_address: ''
  });

  // Step 2: Products
  const [products, setProducts] = useState<any[]>([]);
  const [newProduct, setNewProduct] = useState({
    plastic_type: '',
    grade: '',
    price_per_unit: '',
    bulk_discount_percent: 0
  });

  // Step 3: Documents
  const [documents, setDocuments] = useState<any[]>([]);

  // Step 4: Profile
  const [profile, setProfile] = useState({
    company_overview: '',
    years_in_business: '',
    company_size: '',
    annual_turnover: '',
    primary_contact_name: '',
    primary_contact_phone: '',
    primary_contact_email: '',
    office_address: '',
    office_phone: '',
    support_email: '',
    website_url: '',
    linkedin_url: '',
    why_choose_us: ''
  });

  const [errors, setErrors] = useState<any>({});

  // ==================== STEP 1: BASIC INFO ====================

  const validateStep1 = () => {
    const newErrors: any = {};
    
    if (!basicInfo.email) newErrors.email = 'Email required';
    else if (!basicInfo.email.includes('@')) newErrors.email = 'Invalid email';
    
    if (!basicInfo.password) newErrors.password = 'Password required';
    else if (basicInfo.password.length < 8) newErrors.password = 'Min 8 characters';
    else if (basicInfo.password !== basicInfo.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!basicInfo.company_legal_name) newErrors.company_legal_name = 'Required';
    if (!basicInfo.phone) newErrors.phone = 'Required';
    if (!basicInfo.manufacturing_state) newErrors.manufacturing_state = 'Required';
    if (!basicInfo.factory_address) newErrors.factory_address = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Next = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  // ==================== STEP 2: PRODUCTS ====================

  const plasticTypes = ['PET', 'HDPE', 'LDPE', 'LLDPE', 'PP', 'PVC'];
  const grades = [
    'Bottle Grade', 'Food Grade', 'Film Grade', 'Pharma Grade',
    'Blow Molding', 'Injection Grade', 'Pipe Grade', 'Fiber Grade',
    'Random Copolymer', 'Medical Grade', 'Flexible Grade', 'Rigid Grade'
  ];

  const validateProduct = () => {
    const newErrors: any = {};
    
    if (!newProduct.plastic_type) newErrors.plastic_type = 'Required';
    if (!newProduct.grade) newErrors.grade = 'Required';
    if (!newProduct.price_per_unit) newErrors.price_per_unit = 'Required';
    else if (parseFloat(newProduct.price_per_unit) <= 0) newErrors.price_per_unit = 'Must be > 0';
    
    if (products.some(p => 
      p.plastic_type === newProduct.plastic_type && 
      p.grade === newProduct.grade
    )) {
      newErrors.duplicate = 'This type & grade already added';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddProduct = () => {
    if (validateProduct()) {
      setProducts([...products, { id: Date.now(), ...newProduct }]);
      setNewProduct({
        plastic_type: '',
        grade: '',
        price_per_unit: '',
        bulk_discount_percent: 0
      });
      setErrors({});
    }
  };

  const handleDeleteProduct = (id: any) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleStep2Next = () => {
    if (products.length === 0) {
      setErrors({ products: 'Add at least 1 product' });
      return;
    }
    setCurrentStep(3);
  };

  // ==================== STEP 3: DOCUMENTS ====================

  const docTypes = [
    { value: 'ISO 9001', label: 'ISO 9001 (Quality Management)' },
    { value: 'BIS', label: 'BIS Certificate' },
    { value: 'EPR', label: 'EPR Certification' },
    { value: 'Pollution Board', label: 'Pollution Board Consent' }
  ];

  const [uploadForm, setUploadForm] = useState<any>({
    docType: '',
    file: null,
    description: ''
  });

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const newErrors: any = {};
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        newErrors.file = 'Only PDF, JPG, PNG allowed';
      }
      
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        newErrors.file = 'Max 5 MB';
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setUploadForm({...uploadForm, file: null});
      } else {
        setErrors({});
        setUploadForm({...uploadForm, file});
      }
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleUploadDocument = async () => {
    if (!uploadForm.docType || !uploadForm.file) {
      setErrors({ upload: 'Select document type and file' });
      return;
    }
    
    setUploadingDoc(true);
    setErrors({});
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('doc_type', uploadForm.docType);
      
      const response = await fetch('http://localhost:8000/api/supplier-portal/documents/verify', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (result.verified) {
        setDocuments([...documents, {
          id: Date.now(),
          docType: uploadForm.docType,
          fileName: uploadForm.file.name,
          description: uploadForm.description,
          uploadedAt: new Date().toLocaleString()
        }]);
        setUploadForm({ docType: '', file: null, description: '' });
        toast({ title: 'Verified ✅', description: 'Groq AI confirmed document authenticity.' });
      } else {
        setErrors({ upload: `AI Verification Failed: ${result.reason}` });
      }
    } catch (err: any) {
      setErrors({ upload: 'AI Verification Server Error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleStep3Next = () => {
    const requiredTypes = ['ISO 9001', 'BIS', 'EPR', 'Pollution Board'];
    const uploadedTypes = documents.map(d => d.docType);
    const missing = requiredTypes.filter(t => !uploadedTypes.includes(t));
    
    if (missing.length > 0) {
      setErrors({ documents: `Missing required verified documents: ${missing.join(', ')}` });
      return;
    }
    setCurrentStep(4);
  };

  // ==================== STEP 4: PROFILE ====================

  const companySizes = ['Startup', 'Small', 'Medium', 'Large', 'Enterprise'];

  const handleStep4Next = () => {
    setCurrentStep(5);
  };

  // ==================== STEP 5: REVIEW & SUBMIT ====================

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const data = await supplierSignUp({
        email: basicInfo.email,
        password: basicInfo.password,
        full_name: basicInfo.full_name,
        company_legal_name: basicInfo.company_legal_name,
        phone: basicInfo.phone,
        manufacturing_state: basicInfo.manufacturing_state,
        factory_address: basicInfo.factory_address,
        company_overview: profile.company_overview
      });
      
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('auth_session', JSON.stringify({ token: data.access_token, userId: data.user_id, email: data.email, role: 'supplier' }));
        navigate('/supplier-dashboard');
      } else {
        setMessage('Signup failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Authentication failed';
      setMessage('Error: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8 mt-16">
          <h1 className="text-3xl font-bold mb-4">Supplier Registration</h1>
          <div className="flex justify-between mb-4">
            {[1, 2, 3, 4, 5].map(step => (
              <div
                key={step}
                className={`flex-1 h-2 mx-1 rounded ${
                  step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-gray-600">
            Step {currentStep} of 5: {
              currentStep === 1 ? 'Basic Information' :
              currentStep === 2 ? 'Products & Pricing' :
              currentStep === 3 ? 'Documents Upload' :
              currentStep === 4 ? 'Complete Profile' :
              'Review & Submit'
            }
          </p>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {message}
          </div>
        )}

        {/* ========== STEP 1: BASIC INFO ========== */}
        {currentStep === 1 && (
          <div className="bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">Basic Information</h2>
            <div className="mb-4">
              <label className="block text-sm font-bold mb-2">Contact Person Name *</label>
              <input type="text" value={basicInfo.full_name} onChange={(e) => setBasicInfo({...basicInfo, full_name: e.target.value})} className="w-full px-4 py-2 border rounded border-gray-300" />
            </div>
            
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-bold mb-2">Email *</label>
                <input
                  type="email"
                  value={basicInfo.email}
                  onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})}
                  className={`w-full px-4 py-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="supplier@company.com"
                />
                {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-bold mb-2">Password *</label>
                <input
                  type="password"
                  value={basicInfo.password}
                  onChange={(e) => setBasicInfo({...basicInfo, password: e.target.value})}
                  className={`w-full px-4 py-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Min 8 characters"
                />
                {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-bold mb-2">Confirm Password *</label>
                <input
                  type="password"
                  value={basicInfo.confirmPassword}
                  onChange={(e) => setBasicInfo({...basicInfo, confirmPassword: e.target.value})}
                  className={`w-full px-4 py-2 border rounded ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Confirm password"
                />
                {errors.confirmPassword && <p className="text-red-600 text-sm">{errors.confirmPassword}</p>}
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-bold mb-2">Company Legal Name *</label>
                <input
                  type="text"
                  value={basicInfo.company_legal_name}
                  onChange={(e) => setBasicInfo({...basicInfo, company_legal_name: e.target.value})}
                  className={`w-full px-4 py-2 border rounded ${errors.company_legal_name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="ABC Plastics Industries"
                />
                {errors.company_legal_name && <p className="text-red-600 text-sm">{errors.company_legal_name}</p>}
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-sm font-bold mb-2">GSTIN (15 digits) *</label>
                <input
                  type="text"
                  value={basicInfo.gstin}
                  onChange={(e) => setBasicInfo({...basicInfo, gstin: e.target.value.toUpperCase()})}
                  className={`w-full px-4 py-2 border rounded ${errors.gstin ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="27AABCT1234J1Z0"
                  maxLength={15}
                />
                {errors.gstin && <p className="text-red-600 text-sm">{errors.gstin}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold mb-2">Phone *</label>
                <input
                  type="tel"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})}
                  className={`w-full px-4 py-2 border rounded ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="+91-9876543210"
                />
                {errors.phone && <p className="text-red-600 text-sm">{errors.phone}</p>}
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-bold mb-2">Manufacturing State *</label>
                <select
                  value={basicInfo.manufacturing_state}
                  onChange={(e) => setBasicInfo({...basicInfo, manufacturing_state: e.target.value})}
                  className={`w-full px-4 py-2 border rounded ${errors.manufacturing_state ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select State</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Delhi">Delhi</option>
                </select>
                {errors.manufacturing_state && <p className="text-red-600 text-sm">{errors.manufacturing_state}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold mb-2">Factory Address *</label>
                <textarea
                  value={basicInfo.factory_address}
                  onChange={(e) => setBasicInfo({...basicInfo, factory_address: e.target.value})}
                  className={`w-full px-4 py-2 border rounded ${errors.factory_address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="123 Industrial Area, Mumbai"
                  rows={3}
                />
                {errors.factory_address && <p className="text-red-600 text-sm">{errors.factory_address}</p>}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={handleStep1Next}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700"
              >
                Next: Add Products →
              </button>
            </div>
            
            <div className="text-center mt-6 border-t pt-4">
               <button onClick={() => navigate('/supplier-signin')} className="text-sm font-bold text-gray-500 hover:text-blue-600">Already registerd? Skip to Sign In</button>
            </div>
          </div>
        )}

        {/* ========== STEP 2: PRODUCTS ========== */}
        {currentStep === 2 && (
          <div className="bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">Add Products & Pricing</h2>
            
            {/* Products Table */}
            {products.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="p-2 text-left border">Type</th>
                      <th className="p-2 text-left border">Grade</th>
                      <th className="p-2 text-right border">Price (₹/kg)</th>
                      <th className="p-2 text-right border">Discount %</th>
                      <th className="p-2 text-center border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b">
                        <td className="p-2 border">{product.plastic_type}</td>
                        <td className="p-2 border">{product.grade}</td>
                        <td className="p-2 border text-right">₹{product.price_per_unit}</td>
                        <td className="p-2 border text-right">{product.bulk_discount_percent}%</td>
                        <td className="p-2 border text-center">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Product Form */}
            <div className="bg-gray-50 p-4 rounded mb-6">
              <h3 className="font-bold mb-4">Add New Product</h3>
              
              {errors.duplicate && <p className="text-red-600 mb-2">{errors.duplicate}</p>}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Plastic Type */}
                <div>
                  <label className="block text-sm font-bold mb-1">Plastic Type *</label>
                  <select
                    value={newProduct.plastic_type}
                    onChange={(e) => setNewProduct({...newProduct, plastic_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select</option>
                    {plasticTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.plastic_type && <p className="text-red-600 text-xs">{errors.plastic_type}</p>}
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-bold mb-1">Grade *</label>
                  <select
                    value={newProduct.grade}
                    onChange={(e) => setNewProduct({...newProduct, grade: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                  {errors.grade && <p className="text-red-600 text-xs">{errors.grade}</p>}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-bold mb-1">Price (₹/kg) *</label>
                  <input
                    type="number"
                    value={newProduct.price_per_unit}
                    onChange={(e) => setNewProduct({...newProduct, price_per_unit: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  {errors.price_per_unit && <p className="text-red-600 text-xs">{errors.price_per_unit}</p>}
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-sm font-bold mb-1">Bulk Discount %</label>
                  <input
                    type="number"
                    value={newProduct.bulk_discount_percent}
                    onChange={(e) => setNewProduct({...newProduct, bulk_discount_percent: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              <button
                onClick={handleAddProduct}
                className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700"
              >
                + Add Product
              </button>
            </div>

            {errors.products && <p className="text-red-600 mb-4">{errors.products}</p>}

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-gray-400 text-white py-2 rounded font-bold hover:bg-gray-500"
              >
                ← Back
              </button>
              <button
                onClick={handleStep2Next}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700"
              >
                Next: Upload Documents →
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 3: DOCUMENTS ========== */}
        {currentStep === 3 && (
          <div className="bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">Upload Documents</h2>

            {/* Documents List */}
            {documents.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-3">Uploaded Documents</h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="bg-green-50 p-3 rounded border-l-4 border-green-600 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{doc.docType}</p>
                        <p className="text-sm text-gray-600">{doc.fileName}</p>
                      </div>
                      <button
                        onClick={() => setDocuments(documents.filter(d => d.id !== doc.id))}
                        className="text-red-600 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Form */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-bold mb-4">Add Document</h3>

              {errors.upload && <p className="text-red-600 mb-2">{errors.upload}</p>}
              {errors.file && <p className="text-red-600 mb-2">{errors.file}</p>}

              <div className="space-y-4">
                {/* Document Type */}
                <div>
                  <label className="block text-sm font-bold mb-2">Document Type *</label>
                  <select
                    value={uploadForm.docType}
                    onChange={(e) => setUploadForm({...uploadForm, docType: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Type</option>
                    {docTypes.map(doc => (
                      <option key={doc.value} value={doc.value}>{doc.label}</option>
                    ))}
                  </select>
                </div>

                {/* File Input */}
                <div>
                  <label className="block text-sm font-bold mb-2">Upload File (PDF, JPG, PNG - Max 5MB) *</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 border rounded"
                  />
                  {uploadForm.file && (
                    <p className="text-sm text-green-600 mt-1">✓ {uploadForm.file.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold mb-2">Description (Optional)</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="e.g., ISO 9001:2015 Certificate"
                    rows={2}
                  />
                </div>

                <button
                  onClick={handleUploadDocument}
                  disabled={uploadingDoc}
                  className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadingDoc ? 'AI Verifying Document...' : 'Upload & Verify Document'}
                </button>
              </div>
            </div>

            {errors.documents && <p className="text-red-600 mt-4">{errors.documents}</p>}

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-gray-400 text-white py-2 rounded font-bold hover:bg-gray-500"
              >
                ← Back
              </button>
              <button
                onClick={handleStep3Next}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700"
              >
                Next: Complete Profile →
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 4: PROFILE ========== */}
        {currentStep === 4 && (
          <div className="bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">Complete Your Profile (Optional)</h2>

            <div className="space-y-4">
              {/* Company Overview */}
              <div>
                <label className="block text-sm font-bold mb-2">Company Overview</label>
                <textarea
                  value={profile.company_overview}
                  onChange={(e) => setProfile({...profile, company_overview: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Tell us about your company..."
                  rows={3}
                />
              </div>

              {/* Company Size & Years */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Years in Business</label>
                  <input
                    type="number"
                    value={profile.years_in_business}
                    onChange={(e) => setProfile({...profile, years_in_business: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Company Size</label>
                  <select
                    value={profile.company_size}
                    onChange={(e) => setProfile({...profile, company_size: e.target.value})}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-sm font-bold mb-2">Primary Contact Name</label>
                <input
                  type="text"
                  value={profile.primary_contact_name}
                  onChange={(e) => setProfile({...profile, primary_contact_name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Website URL</label>
                <input
                  type="url"
                  value={profile.website_url}
                  onChange={(e) => setProfile({...profile, website_url: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Why Choose Us?</label>
                <textarea
                  value={profile.why_choose_us}
                  onChange={(e) => setProfile({...profile, why_choose_us: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Tell buyers what makes your company special..."
                  rows={3}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setCurrentStep(3)}
                className="flex-1 bg-gray-400 text-white py-2 rounded font-bold hover:bg-gray-500"
              >
                ← Back
              </button>
              <button
                onClick={handleStep4Next}
                className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700"
              >
                Next: Review & Submit →
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 5: REVIEW & SUBMIT ========== */}
        {currentStep === 5 && (
          <div className="bg-white p-8 rounded shadow">
            <h2 className="text-2xl font-bold mb-6">Review Your Information</h2>

            {/* Basic Info */}
            <div className="mb-6 border-b pb-6">
              <h3 className="font-bold mb-3">📋 Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-bold">{basicInfo.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Company</p>
                  <p className="font-bold">{basicInfo.company_legal_name}</p>
                </div>
                <div>
                  <p className="text-gray-600">GSTIN</p>
                  <p className="font-bold">{basicInfo.gstin}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-bold">{basicInfo.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Address</p>
                  <p className="font-bold">{basicInfo.factory_address}</p>
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="mb-6 border-b pb-6">
              <h3 className="font-bold mb-3">📦 Products ({products.length})</h3>
              <div className="text-sm space-y-1">
                {products.map((p, i) => (
                  <p key={i}>
                    {p.plastic_type} - {p.grade}: ₹{p.price_per_unit}/kg
                    {p.bulk_discount_percent > 0 && ` (${p.bulk_discount_percent}% discount)`}
                  </p>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="mb-6 border-b pb-6">
              <h3 className="font-bold mb-3">📄 Documents ({documents.length})</h3>
              <div className="text-sm space-y-1">
                {documents.map((d, i) => (
                  <p key={i}>{d.docType}</p>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 bg-gray-400 text-white py-2 rounded font-bold hover:bg-gray-500"
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating Account... Please wait' : '✅ Create Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
