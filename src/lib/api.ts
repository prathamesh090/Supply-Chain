import { toast } from '@/hooks/use-toast';

// API Base URLs
const COMPANY_API_BASE_URL = 'http://localhost:8000'; 
const ML_API_BASE_URL = 'http://localhost:5001';

// Create a dedicated ML API client
export const mlApi = {
  // Test endpoint
  testSample: async () => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/test-sample`);
      return await response.json();
    } catch (error) {
      console.error('ML API test failed:', error);
      throw error;
    }
  },

  // Batch prediction
  batchPredict: async (data: any) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/batch-predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Batch predict failed:', error);
      throw error;
    }
  },

  // Explain prediction
  explain: async (inputData: any) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
      });
      return await response.json();
    } catch (error) {
      console.error('Explain failed:', error);
      throw error;
    }
  },

  // Save analysis
  saveAnalysis: async (sessionData: any) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/save-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || `Save analysis failed (HTTP ${response.status})`);
      }
      return data;
    } catch (error) {
      console.error('Save analysis failed:', error);
      throw error;
    }
  },

  // Get recent sessions
  getRecentSessions: async (limit: number = 10) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/recent-sessions?limit=${limit}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Get sessions failed (HTTP ${response.status})`);
      }
      return data;
    } catch (error) {
      console.error('Get sessions failed:', error);
      throw error;
    }
  },

  // Get session by ID
  getSession: async (sessionId: string) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/session/${sessionId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `Get session failed (HTTP ${response.status})`);
      }
      return data;
    } catch (error) {
      console.error('Get session failed:', error);
      throw error;
    }
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/session/${sessionId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || data?.message || `Delete session failed (HTTP ${response.status})`);
      }
      return data;
    } catch (error) {
      console.error('Delete session failed:', error);
      throw error;
    }
  },

  // Get latest forecast for a product
  getLatestForecast: async (productId: string) => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/latest-forecast/${productId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            forecast: null,
            message: `No forecast available for product ${productId}`
          };
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Get latest forecast failed:', error);
      return {
        success: false,
        forecast: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Health check
  health: async () => {
    try {
      const response = await fetch(`${ML_API_BASE_URL}/api/ml/health`);
      return await response.json();
    } catch (error) {
      console.error('ML health check failed:', error);
      throw error;
    }
  }
};

// Auth API functions (keep your existing ones)
export const signUp = async (userData: {
  email: string;
  password: string;
  full_name: string;
  company_id?: string;
}) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Sign up failed');
  }

  return response.json();
};

export const signIn = async (credentials: {
  email: string;
  password: string;
  tenant?: string;
  role?: 'manufacturer' | 'supplier' | 'admin' | 'user';
}) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Sign in failed');
  }

  return response.json();
};

export const createCompany = async (companyData: {
  company_name: string;
  business_type?: string;
  industry?: string;
  company_location?: string;
  gstin?: string;
  pan?: string;
  country_code?: string;
  registration_number?: string;
}, token: string) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/auth/company`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(companyData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Company creation failed');
  }

  return response.json();
};

export const getCurrentUser = async (token: string) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
  }

  return response.json();
};

export type UserRole = 'manufacturer' | 'supplier' | 'admin' | 'user';

export interface AuthSession {
  token: string;
  role: UserRole;
  userId: number;
  email: string;
}

export interface SupplierProfilePayload {
  company_legal_name?: string;
  contact_person?: string;
  company_overview?: string;
  phone?: string;
  factory_address?: string;
  city?: string;
  manufacturing_state?: string;
  country?: string;
  support_email?: string;
  website?: string;
  categories?: string;
  technical_capabilities?: string;
  lead_time_defaults?: string;
  stock_service_notes?: string;
}

// Token management
export const storeToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const storeAuthSession = (session: AuthSession) => {
  localStorage.setItem('auth_token', session.token);
  localStorage.setItem('auth_session', JSON.stringify(session));
};

export const getAuthSession = (): AuthSession | null => {
  const raw = localStorage.getItem('auth_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const removeToken = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_session');
};

// Company Verification API functions
export const verifyCompany = async (verificationData: {
  gstin?: string;
  pan?: string;
  country?: string;
  foreign_registration?: string;
}) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/verifyCompany`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(verificationData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Verification failed');
  }

  return response.json();
};

export const verifyForeignCompanyWithDocuments = async (
  country: string,
  registrationNumber: string,
  email: string,
  files: File[]
) => {
  const formData = new FormData();
  formData.append('country', country);
  formData.append('registration_number', registrationNumber);
  formData.append('email', email);

  files.forEach(file => {
    formData.append('files', file);
  });

  const response = await fetch(`${COMPANY_API_BASE_URL}/verify-foreign-company`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Foreign company verification failed');
  }

  return response.json();
};

export const getVerificationStatus = async (verificationId: string) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/verification-status/${verificationId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get verification status');
  }

  return response.json();
};

// File validation utilities
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not allowed. Please upload PDF, JPG, PNG, or DOC files.'
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 10MB.'
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Add supplier risk API functions to your existing api.ts

export interface SupplierRiskData {
  supplier_name: string;
  delivery_delay_days?: number;
  defect_rate_pct?: number;
  price_variance_pct?: number;
  compliance_flag?: number;
  trust_score?: number;
  Plastic_Type?: string;
  defective_units?: number;
  quantity?: number;
  unit_price?: number;
  negotiated_price?: number;
  compliance?: string;
  order_date?: string;
  delivery_date?: string;
}

export interface SupplierRiskPrediction {
  success: boolean;
  supplier_name: string;
  predicted_risk: string;
  risk_score: number;
  risk_score_ui: number;
  probabilities: Record<string, number>;
  risk_summary: string;
  analysis_date: string;
}

export interface BatchPredictionResult {
  success: boolean;
  total_suppliers: number;
  successful_predictions: number;
  predictions: Array<{
    supplier_name: string;
    predicted_risk: string;
    risk_score: number;
    risk_score_ui: number;
    probabilities: Record<string, number>;
    risk_summary: string;
    error?: string;
  }>;
}

export interface SupplierRanking {
  supplier_name: string;
  predicted_risk: string;
  risk_score: number;
  risk_score_ui: number;
  risk_level: string;
  probabilities: Record<string, number>;
  avg_delivery_delay_days: number;
  avg_defect_rate_percent: number;
  avg_price_variance_percent: number;
  compliance_rate: number;
  trust_score: number;
  plastic_types: string[];
  risk_summary: string;
  risk_rank: number;
  total_suppliers: number;
}

export interface RiskDistribution {
  total_suppliers: number;
  risk_distribution: Record<string, number>;
  risk_distribution_percent: Record<string, number>;
  average_risk_score: number;
  median_risk_score: number;
  risk_score_range: {
    min: number;
    max: number;
  };
}

// Supplier Risk API functions
export const checkSupplierRiskHealth = async (): Promise<{status: string, predictor_available: boolean, message: string}> => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/health`);
  if (!response.ok) {
    throw new Error(`Supplier risk health check failed: ${response.statusText}`);
  }
  return response.json();
};

export const getSupplierRiskModelInfo = async () => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/model-info`);
  if (!response.ok) {
    throw new Error(`Failed to get model info: ${response.statusText}`);
  }
  return response.json();
};

export const predictSupplierRisk = async (data: SupplierRiskData): Promise<SupplierRiskPrediction> => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/predict`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(`Supplier risk prediction failed: ${response.statusText}`);
  }
  
  return response.json();
};

export const predictBatchSupplierRisk = async (suppliers: SupplierRiskData[]): Promise<BatchPredictionResult> => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/predict/batch`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ suppliers })
  });
  
  if (!response.ok) {
    throw new Error(`Batch prediction failed: ${response.statusText}`);
  }
  
  return response.json();
};

export const getAllSuppliersRisk = async () => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/all-suppliers`, {
    headers: { 
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get all suppliers: ${response.statusText}`);
  }
  
  return response.json();
};

export const getSupplierRankings = async (): Promise<{success: boolean, rankings: SupplierRanking[]}> => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/rankings`, {
    headers: { 
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get rankings: ${response.statusText}`);
  }
  
  return response.json();
};

export const getRiskDistribution = async (): Promise<{success: boolean, distribution: RiskDistribution}> => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/distribution`, {
    headers: { 
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get risk distribution: ${response.statusText}`);
  }
  
  return response.json();
};

export const getSupplierRiskFeatures = async () => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-risk/features`, {
    headers: { 
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get features: ${response.statusText}`);
  }
  
  return response.json();
};


export const supplierSignUp = async (payload: {
  email: string;
  password: string;
  full_name: string;
  company_legal_name: string;
  phone: string;
  manufacturing_state?: string;
  factory_address?: string;
  company_overview?: string;
}) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-portal/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Supplier signup failed');
  return data;
};

export const supplierSignIn = async (payload: { email: string; password: string }) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-portal/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Supplier signin failed');
  return data;
};

export const getSupplierProfile = async () => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-portal/profile`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to load supplier profile');
  return data;
};

export const saveSupplierProfile = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-portal/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to save supplier profile');
  return data;
};

export const getManufacturerProfile = async () => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/manufacturer/profile`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to load manufacturer profile');
  return data;
};

export const saveManufacturerProfile = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/manufacturer/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to save manufacturer profile');
  return data;
};

export const getSupplierProducts = async () => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-portal/materials`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to load materials');
  return data;
};

export const saveSupplierPricing = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/supplier-portal/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to save material');
  return data;
};

export const getDiscoverySuppliers = async (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/manufacturer/suppliers?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to load suppliers');
  return data;
};

export const getNetworkSuppliers = async (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/manufacturer/suppliers/network?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to load supplier network');
  return data;
};

export const connectSupplier = async (supplier_id: number) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/manufacturer/suppliers/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify({ supplier_id }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to connect supplier');
  return data;
};

export const getSupplierDetailById = async (supplierId: number) => {
  const response = await fetch(`${COMPANY_API_BASE_URL}/api/manufacturer/suppliers/${supplierId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Failed to load supplier detail');
  return data;
};

export const logout = () => {
  removeToken();
};
