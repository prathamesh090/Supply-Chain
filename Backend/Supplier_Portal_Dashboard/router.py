import logging
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException

from .auth_service import SupplierAuthService
from .database import SupplierPortalDB
from .models import (
    SupplierMaterialRequest,
    SupplierProfileUpdateRequest,
    SupplierSigninRequest,
    SupplierSignupRequest,
    TokenResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/supplier-portal", tags=["Supplier Portal"])


def get_current_supplier(authorization: str = Header(...)) -> int:
    try:
        _, token = authorization.split(" ", 1)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid authorization header") from exc

    supplier_id = SupplierAuthService.verify_supplier_token(token)
    if not supplier_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return supplier_id


@router.post("/auth/signup", response_model=TokenResponse)
def supplier_signup(payload: SupplierSignupRequest):
    db = SupplierPortalDB.get_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE email=%s", (payload.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, role) VALUES (%s,%s,%s,'supplier')",
            (payload.email, SupplierAuthService.hash_password(payload.password), payload.full_name),
        )
        user_id = int(cursor.lastrowid)
        db.commit()

        SupplierPortalDB.create_supplier_profile(
            user_id,
            {
                "company_legal_name": payload.company_legal_name,
                "phone": payload.phone,
                "manufacturing_state": payload.manufacturing_state,
                "factory_address": payload.factory_address,
                "company_overview": payload.company_overview,
                "email": payload.email,
            },
        )

        token = SupplierAuthService.create_access_token(
            supplier_id=user_id,
            email=payload.email,
            expires_delta=timedelta(minutes=60),
        )
        return TokenResponse(access_token=token, user_id=user_id, email=payload.email, role="supplier")
    finally:
        cursor.close()
        db.close()


@router.post("/auth/signin", response_model=TokenResponse)
def supplier_signin(payload: SupplierSigninRequest):
    db = SupplierPortalDB.get_connection()
    if not db:
        raise HTTPException(status_code=500, detail="Database connection failed")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, email, password_hash, role FROM users WHERE email=%s AND role='supplier'",
            (payload.email,),
        )
        user = cursor.fetchone()
        if not user or not SupplierAuthService.verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = SupplierAuthService.create_access_token(user["id"], user["email"])
        return TokenResponse(access_token=token, user_id=user["id"], email=user["email"], role="supplier")
    finally:
        cursor.close()
        db.close()


@router.get("/profile")
def get_profile(supplier_id: int = Depends(get_current_supplier)):
    profile = SupplierPortalDB.get_supplier_profile(supplier_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Supplier profile not found")
    return profile


@router.put("/profile")
def update_profile(payload: SupplierProfileUpdateRequest, supplier_id: int = Depends(get_current_supplier)):
    SupplierPortalDB.update_supplier_profile(supplier_id, payload.model_dump(exclude_none=True))
    return {"success": True}


@router.get("/materials")
def get_materials(supplier_id: int = Depends(get_current_supplier)):
    return SupplierPortalDB.get_supplier_materials(supplier_id)


@router.post("/materials")
def create_material(payload: SupplierMaterialRequest, supplier_id: int = Depends(get_current_supplier)):
    material_id = SupplierPortalDB.add_material(supplier_id, payload.model_dump())
    return {"success": True, "material_id": material_id}


@router.get("/health")
def health():
    return {"status": "ok"}
