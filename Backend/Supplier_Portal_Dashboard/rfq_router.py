from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Optional, Dict, Any
from .database import SupplierPortalDB
from .models import (
    RFQCreateRequest,
    RFQQuoteRequest,
    RFQMessageRequest,
    RFQDecisionRequest,
    NotificationResponse
)
from .auth_service import SupplierAuthService
from .config import settings
from datetime import datetime
import base64
import json
import hashlib
import hmac

router = APIRouter(prefix="/api/procurement", tags=["Procurement & RFQs"])

def verify_token_unified(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token - supports both main.py tokens (with 'sub') and SupplierAuthService tokens (with 'supplier_id')
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Try main.py token format first
        encoded_header = parts[0].rstrip('=')
        encoded_payload = parts[1].rstrip('=')
        encoded_signature = parts[2].rstrip('=')
        
        # Verify signature (same for both token types since they use same SECRET_KEY)
        expected_signature = hmac.new(
            settings.SECRET_KEY.encode(),
            f"{encoded_header}.{encoded_payload}".encode(),
            hashlib.sha256
        ).digest()
        expected_encoded_signature = base64.urlsafe_b64encode(expected_signature).decode().rstrip('=')
        
        if hmac.compare_digest(encoded_signature, expected_encoded_signature):
            # Signature matches, decode payload
            padding = '=' * (-len(encoded_payload) % 4)
            payload_json = base64.urlsafe_b64decode((encoded_payload + padding).encode()).decode()
            payload = json.loads(payload_json)
            
            # Check expiration
            if datetime.utcnow().timestamp() > payload.get("exp", 0):
                return None
            
            return payload
    except Exception:
        pass
    
    # If standard JWT verification fails, try SupplierAuthService tokens
    return SupplierAuthService.decode_token(token)

def get_current_user_info(authorization: str = Header(...)) -> Dict[str, Any]:
    try:
        _, token = authorization.split(" ", 1)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    # Try to decode token using unified verification
    payload = verify_token_unified(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Support both token formats:
    # - main.py tokens: have "sub" (email), and we need to fetch user_id and role from DB
    # - SupplierAuthService tokens: have "supplier_id" and "email"
    user_id = payload.get("supplier_id")
    email = payload.get("email") or payload.get("sub")
    role = None
    
    if not user_id and email:
        # Token has email but no supplier_id (likely from main.py) - fetch from database
        db = SupplierPortalDB.get_connection()
        if not db:
            raise HTTPException(status_code=500, detail="Database connection failed")
        cursor = db.cursor(dictionary=True)
        try:
            cursor.execute("SELECT id, role FROM users WHERE email=%s", (email,))
            user = cursor.fetchone()
            if user:
                user_id = user["id"]
                role = user["role"]
            else:
                raise HTTPException(status_code=401, detail="User not found in database")
        finally:
            cursor.close()
            db.close()
    elif user_id:
        # Token has supplier_id - check if it's a supplier or fetch role from DB
        # Default to checking if they have supplier profile
        db = SupplierPortalDB.get_connection()
        if db:
            cursor = db.cursor(dictionary=True)
            try:
                cursor.execute("SELECT role FROM users WHERE id=%s", (user_id,))
                user = cursor.fetchone()
                if user:
                    role = user["role"]
                else:
                    role = "supplier"  # Default for supplier tokens
            finally:
                cursor.close()
                db.close()
        else:
            role = "supplier"

    if not user_id:
        raise HTTPException(status_code=401, detail="Could not determine user from token")
    
    if not role:
        raise HTTPException(status_code=401, detail="Could not determine user role")

    return {"user_id": user_id, "role": role}

def _serialize_dates(data: Any) -> Any:
    if isinstance(data, list):
        return [_serialize_dates(item) for item in data]
    if isinstance(data, dict):
        return {k: _serialize_dates(v) for k, v in data.items()}
    if isinstance(data, datetime):
        return data.isoformat()
    return data

@router.post("/rfqs")
def create_rfq(payload: RFQCreateRequest, user: Dict[str, Any] = Depends(get_current_user_info)):
    if user["role"] not in ["manufacturer", "admin", "user"]:
        raise HTTPException(status_code=403, detail="Only manufacturers can initiate RFQs")
    
    rfq_id = SupplierPortalDB.create_rfq(
        user["user_id"],
        payload.supplier_id,
        payload.product_name,
        payload.quantity,
        payload.budget_unit_price,
        payload.target_delivery_date,
        payload.specifications
    )
    
    # Create system message
    SupplierPortalDB.add_rfq_message(rfq_id, user["user_id"], f"RFQ created for {payload.product_name} (Qty: {payload.quantity})", is_system=True)
    
    # Create notification for supplier
    SupplierPortalDB.create_notification(
        payload.supplier_id,
        "New RFQ Received",
        f"You received a new RFQ for {payload.product_name} from a manufacturer.",
        f"/communication-hub?rfq={rfq_id}",
        rfq_id,
        "rfq_sent"
    )
    
    return {"success": True, "rfq_id": rfq_id}

@router.get("/rfqs")
def list_rfqs(user: Dict[str, Any] = Depends(get_current_user_info)):
    rfqs = SupplierPortalDB.get_rfqs(user["user_id"], user["role"])
    return _serialize_dates(rfqs)

@router.get("/comparison")
def get_comparison(product_name: str, user: Dict[str, Any] = Depends(get_current_user_info)):
    if user["role"] not in ["manufacturer", "admin", "user"]:
        raise HTTPException(status_code=403, detail="Only manufacturers can view comparisons")
    
    data = SupplierPortalDB.get_comparison_data(user["user_id"], product_name)
    return _serialize_dates(data)

@router.get("/rfqs/{rfq_id}")
def get_rfq_details(rfq_id: int, user: Dict[str, Any] = Depends(get_current_user_info)):
    details = SupplierPortalDB.get_rfq_details(rfq_id)
    if not details:
        raise HTTPException(status_code=404, detail="RFQ not found")
    
    # Verification: user must be part of this RFQ
    if details["manufacturer_id"] != user["user_id"] and details["supplier_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Mark as viewed if supplier is opening it for the first time
    if user["role"] == "supplier" and details.get("status") == "sent":
        SupplierPortalDB.update_rfq_status(rfq_id, "viewed")
        details["status"] = "viewed"
        # Notify manufacturer
        SupplierPortalDB.create_notification(
            details["manufacturer_id"],
            "RFQ Viewed",
            f"The supplier has viewed your RFQ for {details['product_name']}.",
            f"/communication-hub?rfq={rfq_id}",
            rfq_id,
            "rfq_viewed"
        )

    return _serialize_dates(details)

@router.post("/rfqs/{rfq_id}/quote")
def submit_quote(rfq_id: int, payload: RFQQuoteRequest, user: Dict[str, Any] = Depends(get_current_user_info)):
    if user["role"] != "supplier":
        raise HTTPException(status_code=403, detail="Only suppliers can submit quotes")
    
    details = SupplierPortalDB.get_rfq_details(rfq_id)
    if not details or details["supplier_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    quote_id = SupplierPortalDB.submit_quote(
        rfq_id,
        user["user_id"],
        payload.unit_price,
        payload.lead_time_days,
        payload.valid_until,
        payload.terms
    )
    
    SupplierPortalDB.add_rfq_message(rfq_id, user["user_id"], f"Submitted a quote: {payload.unit_price} / unit", is_system=True)
    
    # Notify manufacturer
    manufacturer_id = details["manufacturer_id"]
    SupplierPortalDB.create_notification(
        manufacturer_id,
        "New Quote Received",
        f"Supplier '{user.get('company_name', 'A supplier')}' submitted a quote for {details['product_name']}.",
        f"/communication-hub?rfq={rfq_id}",
        rfq_id,
        "quote_received"
    )
    
    return {"success": True, "quote_id": quote_id}

@router.post("/rfqs/{rfq_id}/message")
def send_message(rfq_id: int, payload: RFQMessageRequest, user: Dict[str, Any] = Depends(get_current_user_info)):
    details = SupplierPortalDB.get_rfq_details(rfq_id)
    if not details or (details["manufacturer_id"] != user["user_id"] and details["supplier_id"] != user["user_id"]):
        raise HTTPException(status_code=403, detail="Access denied")
    
    SupplierPortalDB.add_rfq_message(rfq_id, user["user_id"], payload.message)
    
    # Notify the recipient
    recipient_id = details["supplier_id"] if user["role"] == "manufacturer" else details["manufacturer_id"]
    
    # Check if status is moving to negotiating
    status_msg = ""
    if details["status"] == "quoted" and user["role"] == "manufacturer":
        status_msg = " Negotiation started."
        
    SupplierPortalDB.create_notification(
        recipient_id,
        "New Message" if not status_msg else "Negotiation Started",
        f"New message regarding RFQ: {details['product_name']}.{status_msg}",
        f"/communication-hub?rfq={rfq_id}" if user["role"] == "supplier" else f"/communication-hub?rfq={rfq_id}",
        rfq_id,
        "negotiation_started" if status_msg else "message"
    )
    
    return {"success": True}

@router.post("/rfqs/{rfq_id}/decision")
def make_decision(rfq_id: int, payload: RFQDecisionRequest, user: Dict[str, Any] = Depends(get_current_user_info)):
    if user["role"] not in ["manufacturer", "admin", "user"]:
        raise HTTPException(status_code=403, detail="Only manufacturers can make decisions on RFQs")
    
    details = SupplierPortalDB.get_rfq_details(rfq_id)
    if not details or details["manufacturer_id"] != user["user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    SupplierPortalDB.update_rfq_status(rfq_id, payload.action)
    SupplierPortalDB.add_rfq_message(rfq_id, user["user_id"], f"RFQ {payload.action}", is_system=True)
    
    # If accepted, we could trigger a formal connection if not already active
    if payload.action == "accepted":
        SupplierPortalDB.upsert_connection(user["user_id"], details["supplier_id"], "active")
        
    # Notify supplier
    SupplierPortalDB.create_notification(
        details["supplier_id"],
        f"RFQ {payload.action.capitalize()}",
        f"The manufacturer has {payload.action} your quote for {details['product_name']}.",
        f"/communication-hub?rfq={rfq_id}",
        rfq_id,
        f"rfq_{payload.action}"
    )
    
    return {"success": True}

@router.get("/notifications")
def list_notifications(user: Dict[str, Any] = Depends(get_current_user_info)):
    # I need to implement get_notifications in SupplierPortalDB
    # I'll add it to database.py next if I haven't already.
    # For now, let's assume it exists or implement a quick version here
    conn = SupplierPortalDB.get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM user_notifications WHERE user_id=%s ORDER BY created_at DESC LIMIT 50", (user["user_id"],))
        rows = cursor.fetchall()
        return _serialize_dates(rows)
    finally:
        cursor.close()
        conn.close()

@router.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int, user: Dict[str, Any] = Depends(get_current_user_info)):
    conn = SupplierPortalDB.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE user_notifications SET is_read=TRUE WHERE id=%s AND user_id=%s", (notification_id, user["user_id"]))
        conn.commit()
        return {"success": True}
    finally:
        cursor.close()
        conn.close()

@router.post("/notifications/read-all")
def mark_all_read(user: Dict[str, Any] = Depends(get_current_user_info)):
    conn = SupplierPortalDB.get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE user_notifications SET is_read=TRUE WHERE user_id=%s", (user["user_id"],))
        conn.commit()
        return {"success": True}
    finally:
        cursor.close()
        conn.close()
