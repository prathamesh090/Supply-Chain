from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    company_id: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    tenant: Optional[str] = None

class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    company_name: str
    business_type: Optional[str] = None
    industry: Optional[str] = None
    company_location: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    country_code: Optional[str] = None
    registration_number: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None