import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import bcrypt

from .config import settings


class SupplierAuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt(rounds=10)
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    @staticmethod
    def _b64_encode(payload: Dict[str, Any]) -> str:
        raw = json.dumps(payload, separators=(",", ":")).encode('utf-8')
        return base64.urlsafe_b64encode(raw).decode('utf-8').rstrip('=')

    @staticmethod
    def _b64_decode(value: str) -> Dict[str, Any]:
        padding = '=' * (-len(value) % 4)
        return json.loads(base64.urlsafe_b64decode((value + padding).encode('utf-8')).decode('utf-8'))

    @staticmethod
    def create_access_token(supplier_id: int, email: str, expires_delta: Optional[timedelta] = None) -> str:
        expire_at = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "supplier_id": supplier_id,
            "email": email,
            "type": "access",
            "exp": int(expire_at.timestamp()),
        }

        encoded_header = SupplierAuthService._b64_encode(header)
        encoded_payload = SupplierAuthService._b64_encode(payload)
        message = f"{encoded_header}.{encoded_payload}".encode('utf-8')
        signature = hmac.new(settings.SECRET_KEY.encode('utf-8'), message, hashlib.sha256).digest()
        encoded_signature = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip('=')
        return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

    @staticmethod
    def decode_token(token: str) -> Optional[Dict[str, Any]]:
        try:
            parts = token.split('.')
            if len(parts) != 3:
                return None

            encoded_header, encoded_payload, encoded_signature = parts
            message = f"{encoded_header}.{encoded_payload}".encode('utf-8')
            expected_signature = hmac.new(settings.SECRET_KEY.encode('utf-8'), message, hashlib.sha256).digest()
            expected_encoded = base64.urlsafe_b64encode(expected_signature).decode('utf-8').rstrip('=')
            if not hmac.compare_digest(encoded_signature, expected_encoded):
                return None

            payload = SupplierAuthService._b64_decode(encoded_payload)
            if datetime.utcnow().timestamp() > payload.get("exp", 0):
                return None
            return payload
        except Exception:
            return None

    @staticmethod
    def verify_supplier_token(token: str) -> Optional[int]:
        payload = SupplierAuthService.decode_token(token)
        if not payload:
            return None
        if payload.get("type") != "access":
            return None
        return payload.get("supplier_id")
