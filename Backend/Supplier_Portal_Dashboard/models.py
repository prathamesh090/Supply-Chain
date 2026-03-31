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

class SupplierSigninRequest(BaseModel):
    email: EmailStr
    password: str

class SupplierProfileUpdateRequest(BaseModel):
    company_legal_name: Optional[str] = None
    phone: Optional[str] = None
    manufacturing_state: Optional[str] = None
    factory_address: Optional[str] = None
    company_overview: Optional[str] = None
    website_url: Optional[str] = None
    support_email: Optional[EmailStr] = None

class SupplierMaterialRequest(BaseModel):
    material_name: str
    category: Optional[str] = None
    technical_specifications: Optional[str] = None
    lead_time_days: Optional[int] = None
    stock_status: Literal["in_stock", "low_stock", "out_of_stock"] = "in_stock"

class SupplierConnectionRequest(BaseModel):
    supplier_id: int

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
