from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth Models
class SupplierSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    company_legal_name: str
    gstin: str = Field(..., min_length=15, max_length=15)
    phone: str
    manufacturing_state: str
    factory_address: str
    products: Optional[List[Dict[str, Any]]] = []
    documents: Optional[List[Dict[str, Any]]] = []
    profile: Optional[Dict[str, Any]] = {}

class SupplierSigninRequest(BaseModel):
    email: EmailStr
    password: str

class SupplierChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)

# Profile Models
class SupplierProfileUpdateRequest(BaseModel):
    company_overview: Optional[str] = None
    years_in_business: Optional[int] = None
    company_size: Optional[str] = None
    annual_turnover: Optional[str] = None
    website_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    office_address: Optional[str] = None
    office_phone: Optional[str] = None
    support_email: Optional[EmailStr] = None
    why_choose_us: Optional[str] = None
    key_strengths: Optional[List[str]] = None

class SupplierProfileResponse(BaseModel):
    supplier_id: int
    company_legal_name: str
    email: str
    phone: str
    manufacturing_state: str
    factory_address: str
    company_overview: Optional[str]
    years_in_business: Optional[int]
    company_size: Optional[str]
    annual_turnover: Optional[str]
    website_url: Optional[str]
    linkedin_url: Optional[str]
    primary_contact_name: Optional[str]
    primary_contact_phone: Optional[str]
    primary_contact_email: Optional[str]
    office_address: Optional[str]
    office_phone: Optional[str]
    support_email: Optional[str]
    why_choose_us: Optional[str]
    key_strengths: Optional[List[str]]
    profile_completion_percentage: int

# Product Models
class SupplierProductRequest(BaseModel):
    plastic_type: str
    grade: str
    product_name: Optional[str] = None
    application: Optional[str] = None
    category: Optional[str] = None
    price_per_unit: float
    bulk_discount_percent: Optional[float] = 0
    currency: Optional[str] = "INR"
    min_bulk_quantity: Optional[int] = None

class SupplierProductResponse(BaseModel):
    id: int
    supplier_id: int
    plastic_type: str
    grade: str
    product_name: Optional[str]
    application: Optional[str]
    category: Optional[str]
    price_per_unit: float
    bulk_discount_percent: float
    currency: str
    min_bulk_quantity: Optional[int]
    created_at: datetime
    updated_at: datetime

# Dashboard Models
class DashboardResponse(BaseModel):
    supplier_id: int
    company_name: str
    email: str
    account_status: str
    total_products: int
    profile_completion: int
    pending_inquiries: int
    recent_orders: int
    verification_status: Dict[str, Any]
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    supplier_id: int
    email: str
    company_name: str
