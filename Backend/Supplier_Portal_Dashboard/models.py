from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal

UserRole = Literal["manufacturer", "supplier"]

class SupplierSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str
    company_legal_name: str
    phone: str
    manufacturing_state: Optional[str] = None
    factory_address: Optional[str] = None
    company_overview: Optional[str] = None
    gstin: Optional[str] = None

class SupplierSigninRequest(BaseModel):
    email: EmailStr
    password: str

class SupplierProfileUpdateRequest(BaseModel):
    company_legal_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    manufacturing_state: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    factory_address: Optional[str] = None
    company_overview: Optional[str] = None
    categories: Optional[str] = None
    technical_capabilities: Optional[str] = None
    lead_time_defaults: Optional[str] = None
    stock_service_notes: Optional[str] = None
    website: Optional[str] = None
    website_url: Optional[str] = None
    support_email: Optional[EmailStr] = None
    new_password: Optional[str] = Field(None, min_length=8)

class SupplierMaterialRequest(BaseModel):
    material_name: str
    category: Optional[str] = None
    technical_specifications: Optional[str] = None
    lead_time_days: Optional[int] = None
    stock_status: Literal["in_stock", "low_stock", "out_of_stock"] = "in_stock"

class SupplierConnectionRequest(BaseModel):
    supplier_id: int

class ConnectionResponseRequest(BaseModel):
    id: int  # Connection ID
    action: Literal["active", "rejected"]

class SupplierInquiryRequest(BaseModel):
    supplier_id: int
    subject: str
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: EmailStr
    role: UserRole

class SupplierSummary(BaseModel):
    supplier_id: int
    company_name: str
    short_bio: Optional[str] = None
    phone: Optional[str] = None
    support_email: Optional[str] = None
    connection_status: Optional[str] = None

class SupplierDetailResponse(BaseModel):
    supplier_id: int
    company_name: str
    short_bio: Optional[str] = None
    phone: Optional[str] = None
    support_email: Optional[str] = None
    manufacturing_state: Optional[str] = None
    factory_address: Optional[str] = None
    materials: List[dict]

class RFQCreateRequest(BaseModel):
    supplier_id: int
    product_name: str
    quantity: int
    budget_unit_price: Optional[float] = None
    target_delivery_date: Optional[str] = None
    specifications: Optional[str] = None

class RFQQuoteRequest(BaseModel):
    unit_price: float
    lead_time_days: int
    valid_until: Optional[str] = None
    terms: Optional[str] = None

class RFQMessageRequest(BaseModel):
    message: str

class RFQDecisionRequest(BaseModel):
    action: Literal["accepted", "rejected", "closed"]

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: str
