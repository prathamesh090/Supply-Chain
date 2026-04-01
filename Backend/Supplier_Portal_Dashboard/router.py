import logging
from datetime import timedelta
from datetime import datetime
import re

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form
from io import BytesIO

from .auth_service import SupplierAuthService
from .config import ensure_groq_configured
from .database import SupplierPortalDB
from .groq_service import analyze_certificate_with_groq
from .models import (
    SupplierMaterialRequest,
    SupplierProfileUpdateRequest,
    SupplierSigninRequest,
    SupplierSignupRequest,
    TokenResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/supplier-portal", tags=["Supplier Portal"])

DOC_KEYWORDS = {
    "ISO 9001": ["iso", "9001", "quality management"],
    "BIS": ["bureau of indian standards", "bis", "isi"],
    "EPR": ["epr", "extended producer responsibility"],
    "Pollution Board": ["pollution control board", "pollution", "consent"],
}


def extract_text_from_file(file_bytes: bytes, content_type: str) -> str:
    extracted = ""
    if content_type == "application/pdf":
        try:
            import PyPDF2  # type: ignore

            pdf_reader = PyPDF2.PdfReader(BytesIO(file_bytes))
            for page in pdf_reader.pages[:5]:
                page_text = page.extract_text() or ""
                extracted += f" {page_text}"
        except Exception:
            extracted = ""
    elif content_type in {"image/jpeg", "image/png"}:
        try:
            import pytesseract  # type: ignore
            from PIL import Image  # type: ignore

            image = Image.open(BytesIO(file_bytes))
            extracted = pytesseract.image_to_string(image)
        except Exception:
            extracted = ""

    return extracted.lower()

def extract_expiry_date(text: str) -> datetime | None:
    patterns = [
        r"(?:valid\\s*(?:until|till)|expiry\\s*date|expires?\\s*on)\\s*[:\\-]?\\s*(\\d{1,2}[\\/\\-]\\d{1,2}[\\/\\-]\\d{2,4})",
        r"(\\d{4}[\\-\\/]\\d{1,2}[\\-\\/]\\d{1,2})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if not match:
            continue
        candidate = match.group(1).strip()
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y", "%Y-%m-%d", "%Y/%m/%d"):
            try:
                return datetime.strptime(candidate, fmt)
            except ValueError:
                continue
    return None


def validate_document_content(doc_type: str, filename: str, content_type: str, file_bytes: bytes) -> dict:
    keywords = DOC_KEYWORDS.get(doc_type, [])
    text = extract_text_from_file(file_bytes, content_type)
    filename_lower = (filename or "").lower()

    matched_keywords = [kw for kw in keywords if kw in text or kw in filename_lower]
    verified = len(matched_keywords) > 0
    reason = (
        f"{doc_type} validation passed (matched: {', '.join(matched_keywords)})"
        if verified
        else f"{doc_type} content validation failed. Expected one of: {', '.join(keywords)}"
    )
    expiry = extract_expiry_date(text)
    expiry_valid = bool(expiry and expiry.date() >= datetime.utcnow().date())

    try:
        groq = analyze_certificate_with_groq(doc_type, text)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception:
        groq = {
            "template_match": False,
            "document_type_valid": False,
            "summary": "AI validation unavailable",
            "signals": [],
        }

    template_match = bool(groq.get("template_match"))
    document_type_valid = bool(groq.get("document_type_valid")) or verified
    overall_verified = bool(document_type_valid and template_match and expiry_valid)
    reason = (
        f"{doc_type} validated. Expiry {'valid' if expiry_valid else 'missing/expired'}; template "
        f"{'consistent' if template_match else 'inconsistent'}."
    )
    return {
        "verified": overall_verified,
        "reason": reason,
        "matched_keywords": matched_keywords,
        "expiry_date": expiry.date().isoformat() if expiry else None,
        "expiry_valid": expiry_valid,
        "template_match": template_match,
        "document_type_valid": document_type_valid,
        "groq_summary": groq.get("summary"),
    }


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
                "contact_person": payload.full_name,
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
    profile["profile_completed"] = SupplierPortalDB.is_supplier_profile_complete(profile)
    return profile


@router.put("/profile")
def update_profile(payload: SupplierProfileUpdateRequest, supplier_id: int = Depends(get_current_supplier)):
    SupplierPortalDB.update_supplier_profile(supplier_id, payload.model_dump(exclude_none=True))
    profile = SupplierPortalDB.get_supplier_profile(supplier_id)
    return {"success": True, "profile_completed": SupplierPortalDB.is_supplier_profile_complete(profile)}


@router.get("/materials")
def get_materials(supplier_id: int = Depends(get_current_supplier)):
    return SupplierPortalDB.get_supplier_materials(supplier_id)


@router.post("/materials")
def create_material(payload: SupplierMaterialRequest, supplier_id: int = Depends(get_current_supplier)):
    material_id = SupplierPortalDB.add_material(supplier_id, payload.model_dump())
    return {"success": True, "material_id": material_id}


@router.post("/documents/verify")
async def verify_document(file: UploadFile = File(...), doc_type: str = Form(...)):
    ensure_groq_configured()
    allowed_types = {"application/pdf", "image/jpeg", "image/png"}
    if file.content_type not in allowed_types:
        return {"verified": False, "reason": f"Unsupported file type: {file.content_type}"}

    content = await file.read()
    if not content:
        return {"verified": False, "reason": "Uploaded file is empty"}

    content_result = validate_document_content(doc_type, file.filename or "", file.content_type, content)
    verification_id = SupplierPortalDB.save_certificate_verification(
        {
            "supplier_id": None,
            "doc_type": doc_type,
            "file_name": file.filename,
            "file_type": file.content_type,
            "expiry_date": content_result["expiry_date"],
            "expiry_valid": content_result["expiry_valid"],
            "template_match": content_result["template_match"],
            "document_type_valid": content_result["document_type_valid"],
            "verified": content_result["verified"],
            "reason": content_result["reason"],
            "matched_keywords": content_result["matched_keywords"],
        }
    )
    return {
        "verification_id": verification_id,
        "verified": content_result["verified"],
        "reason": content_result["reason"],
        "matched_keywords": content_result["matched_keywords"],
        "expiry_date": content_result["expiry_date"],
        "expiry_valid": content_result["expiry_valid"],
        "template_match": content_result["template_match"],
        "document_type_valid": content_result["document_type_valid"],
        "groq_summary": content_result["groq_summary"],
        "doc_type": doc_type,
        "file_name": file.filename,
    }


@router.post("/documents/verify-batch")
async def verify_documents_batch(
    files: list[UploadFile] = File(...),
    doc_type: str = Form(...),
):
    ensure_groq_configured()
    results = []
    for file in files:
        allowed_types = {"application/pdf", "image/jpeg", "image/png"}
        if file.content_type not in allowed_types:
            results.append({"file_name": file.filename, "verified": False, "reason": f"Unsupported file type: {file.content_type}"})
            continue
        content = await file.read()
        if not content:
            results.append({"file_name": file.filename, "verified": False, "reason": "Uploaded file is empty"})
            continue
        content_result = validate_document_content(doc_type, file.filename or "", file.content_type, content)
        verification_id = SupplierPortalDB.save_certificate_verification(
            {
                "supplier_id": None,
                "doc_type": doc_type,
                "file_name": file.filename,
                "file_type": file.content_type,
                "expiry_date": content_result["expiry_date"],
                "expiry_valid": content_result["expiry_valid"],
                "template_match": content_result["template_match"],
                "document_type_valid": content_result["document_type_valid"],
                "verified": content_result["verified"],
                "reason": content_result["reason"],
                "matched_keywords": content_result["matched_keywords"],
            }
        )
        results.append(
            {
                "verification_id": verification_id,
                "file_name": file.filename,
                "verified": content_result["verified"],
                "reason": content_result["reason"],
                "matched_keywords": content_result["matched_keywords"],
                "expiry_date": content_result["expiry_date"],
                "expiry_valid": content_result["expiry_valid"],
                "template_match": content_result["template_match"],
                "document_type_valid": content_result["document_type_valid"],
                "groq_summary": content_result["groq_summary"],
            }
        )

    return {"success": True, "doc_type": doc_type, "results": results}


@router.get("/health")
def health():
    return {"status": "ok"}
