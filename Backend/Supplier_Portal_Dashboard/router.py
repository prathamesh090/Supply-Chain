from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File, Form  # type: ignore
from typing import Optional
from .models import (  # type: ignore
    SupplierSignupRequest, SupplierSigninRequest, SupplierChangePasswordRequest,
    SupplierProfileUpdateRequest, SupplierProductRequest,
    TokenResponse, DashboardResponse, SupplierProfileResponse
)
from .auth_service import SupplierAuthService  # type: ignore
from .database import SupplierPortalDB  # type: ignore
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/supplier-portal", tags=["Supplier Portal"])

def get_current_supplier(authorization: Optional[str] = Header(None)) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authorization scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    supplier_id = SupplierAuthService.verify_supplier_token(token)
    if not supplier_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return supplier_id

# --- AI Document Verification ---

@router.post("/documents/verify")
async def verify_document(file: UploadFile = File(...), doc_type: str = Form(...)):
    import PyPDF2
    from groq import Groq
    from .config import settings
    import io
    import json
    import re
    
    try:
        content = await file.read()
        text = ""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages[:3]:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as pdf_e:
            logger.error(f"Failed to read PDF: {pdf_e}")
            text = content.decode('utf-8', errors='ignore')[:4000]
        
        if len(text.strip()) < 10:
            return {"verified": False, "reason": "Could not extract readable text from the document. Please ensure it is a valid text-based PDF."}
            
        client = Groq(api_key=settings.GROQ_API_KEY)
        prompt = f"""You are a strict compliance AI for a manufacturing portal. Your job is to verify factory registration documents.
Does this document strictly match the required type: {doc_type}?

Document Text Analysis:
{text[:4000]}

Reply ONLY in valid JSON format exactly like this: {{"verified": true, "reason": "brief explanation"}} or {{"verified": false, "reason": "brief explanation"}}. Do NOT output any markdown blocks or intro text."""
        
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        response_text = completion.choices[0].message.content
        
        match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if match:
            result = json.loads(match.group(0))
        else:
            result = json.loads(response_text)
            
        return result
    except Exception as e:
        logger.error(f"Doc verification error: {e}")
        return {"verified": False, "reason": f"System error: {str(e)}"}


# Auth Endpoints
@router.post("/auth/signup")
async def signup(request: SupplierSignupRequest):
    try:
        db = SupplierPortalDB.get_connection()
        try:
            cursor = db.cursor()
            cursor.execute("SELECT MAX(supplier_id) FROM supplier_auth")
            max_id = cursor.fetchone()[0]
            supplier_id = (max_id or 0) + 1
        finally:
            if db:
                db.close()

        password_hash = SupplierAuthService.hash_password(request.password)
        SupplierPortalDB.create_supplier_auth(supplier_id, request.email, password_hash)
        SupplierPortalDB.create_profile(supplier_id)
        
        # Populate extended profile data if provided
        if request.profile:
            SupplierPortalDB.update_profile(supplier_id, request.profile)
            
        # Append all products
        if request.products:
            for product in request.products:
                SupplierPortalDB.add_product(supplier_id, product)
                
        # (Assuming documents table logic will be built next, ignoring raw file blob insertion for now 
        # as the frontend only sends metadata instead of actual multipart/form-data blobs to this JSON endpoint)
        
        access_token = SupplierAuthService.create_access_token(supplier_id, request.email)
        
        return {
            "success": True,
            "supplier_id": supplier_id,
            "access_token": access_token,
            "email": request.email,
            "company_name": request.company_legal_name,
            "message": "Signup successful"
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.error(f"Signup error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/signin")
async def signin(request: SupplierSigninRequest):
    try:
        auth_record = SupplierPortalDB.get_supplier_auth(request.email)
        if not auth_record:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not SupplierAuthService.verify_password(request.password, auth_record['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        supplier_id = auth_record['supplier_id']
        SupplierPortalDB.update_last_login(supplier_id)
        
        access_token = SupplierAuthService.create_access_token(supplier_id, request.email)
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            supplier_id=supplier_id,
            email=request.email,
            company_name="Company Name"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signin error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/logout")
async def logout(supplier_id: int = Depends(get_current_supplier)):
    return {"success": True, "message": "Logged out successfully"}

@router.post("/auth/change-password")
async def change_password(request: SupplierChangePasswordRequest, supplier_id: int = Depends(get_current_supplier)):
    try:
        auth_record = SupplierPortalDB.get_supplier_auth("supplier@example.com")  # Get email from DB
        
        if not SupplierAuthService.verify_password(request.old_password, auth_record['password_hash']):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        new_hash = SupplierAuthService.hash_password(request.new_password)
        SupplierPortalDB.update_password(supplier_id, new_hash)
        
        return {"success": True, "message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Change password error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Dashboard
@router.get("/dashboard")
async def get_dashboard(supplier_id: int = Depends(get_current_supplier)):
    try:
        products = SupplierPortalDB.get_products(supplier_id)
        profile = SupplierPortalDB.get_profile(supplier_id)
        
        return DashboardResponse(
            supplier_id=supplier_id,
            company_name="Company",
            email="email@example.com",
            account_status="verified",
            total_products=len(products),
            profile_completion=profile['profile_completion_percentage'] if profile else 0,
            pending_inquiries=0,
            recent_orders=0,
            verification_status={"documents": "verified", "confidence_score": 95},
            created_at="2024-03-22"
        )
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/supplier/{supplier_id}/products")
async def get_supplier_overview(supplier_id: int):
    try:
        profile = SupplierPortalDB.get_profile(supplier_id)
        products = SupplierPortalDB.get_products(supplier_id)
        
        costs = [float(p.get('price_per_unit', 0)) for p in products] if products else []
        min_cost = min(costs) if costs else 0
        max_cost = max(costs) if costs else 0
        
        plastic_types = list(set([p.get('plastic_type', 'Unknown') for p in products])) if products else []
        
        mapped_products = []
        for p in products:
            mapped_products.append({
                "product_id": p.get('product_id'),
                "product_name": p.get('product_name'),
                "plastic_type": p.get('plastic_type'),
                "grade": p.get('grade'),
                "application": p.get('application'),
                "category": p.get('category'),
                "unit_cost": p.get('price_per_unit', 0)
            })
            
        return {
            "supplier_name": profile.get("company_legal_name", "Registered Supplier") if profile else "Registered Supplier",
            "country": "India",
            "plastic_types": plastic_types,
            "product_count": len(products),
            "cost_range": {"min": min_cost, "max": max_cost},
            "products": mapped_products
        }
    except Exception as e:
        logger.error(f"Overview error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Profile
@router.get("/profile")
async def get_profile(supplier_id: int = Depends(get_current_supplier)):
    try:
        profile = SupplierPortalDB.get_profile(supplier_id)
        if not profile:
            SupplierPortalDB.create_profile(supplier_id)
            profile = SupplierPortalDB.get_profile(supplier_id)
        
        return SupplierProfileResponse(
            supplier_id=supplier_id,
            company_legal_name="Company",
            email="email@example.com",
            phone="9999999999",
            manufacturing_state="Maharashtra",
            factory_address="Address",
            company_overview=profile.get('company_overview'),
            years_in_business=profile.get('years_in_business'),
            company_size=profile.get('company_size'),
            annual_turnover=profile.get('annual_turnover'),
            website_url=profile.get('website_url'),
            linkedin_url=profile.get('linkedin_url'),
            primary_contact_name=profile.get('primary_contact_name'),
            primary_contact_phone=profile.get('primary_contact_phone'),
            primary_contact_email=profile.get('primary_contact_email'),
            office_address=profile.get('office_address'),
            office_phone=profile.get('office_phone'),
            support_email=profile.get('support_email'),
            why_choose_us=profile.get('why_choose_us'),
            key_strengths=profile.get('key_strengths'),
            profile_completion_percentage=profile.get('profile_completion_percentage', 0)
        )
    except Exception as e:
        logger.error(f"Get profile error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/profile")
async def update_profile(request: SupplierProfileUpdateRequest, supplier_id: int = Depends(get_current_supplier)):
    try:
        profile_data = request.dict(exclude_none=True)
        SupplierPortalDB.update_profile(supplier_id, profile_data)
        return {"success": True, "message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Update profile error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# Products
@router.get("/products")
async def get_products(supplier_id: int = Depends(get_current_supplier)):
    try:
        products = SupplierPortalDB.get_products(supplier_id)
        return products
    except Exception as e:
        logger.error(f"Get products error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/products")
async def add_product(request: SupplierProductRequest, supplier_id: int = Depends(get_current_supplier)):
    try:
        product_data = request.dict()
        product_id = SupplierPortalDB.add_product(supplier_id, product_data)
        if not product_id:
            raise HTTPException(status_code=400, detail="Failed to add product")
        return {"success": True, "product_id": product_id, "message": "Product added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add product error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/products/{product_id}")
async def update_product(product_id: int, request: SupplierProductRequest, supplier_id: int = Depends(get_current_supplier)):
    try:
        product_data = request.dict()
        SupplierPortalDB.update_product(product_id, product_data)
        return {"success": True, "message": "Product updated successfully"}
    except Exception as e:
        logger.error(f"Update product error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/products/{product_id}")
async def delete_product(product_id: int, supplier_id: int = Depends(get_current_supplier)):
    try:
        SupplierPortalDB.delete_product(product_id)
        return {"success": True, "message": "Product deleted successfully"}
    except Exception as e:
        logger.error(f"Delete product error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/health")
async def health():
    return {"status": "ok"}
