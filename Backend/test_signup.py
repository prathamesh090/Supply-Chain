import requests
import json

url = "http://localhost:8000/api/supplier-portal/auth/signup"
payload = {
    "email": "test100@example.com",
    "password": "password123",
    "company_legal_name": "Test Company",
    "gstin": "27AABCT1234J1Z0",
    "phone": "9999999999",
    "manufacturing_state": "Maharashtra",
    "factory_address": "Test Address",
    "profile": {
        "company_overview": "test overview",
        "years_in_business": "10",
        "company_size": "Large"
    },
    "products": [
        {
            "plastic_type": "PET",
            "grade": "Food Grade",
            "price_per_unit": "50.5",
            "bulk_discount_percent": 5
        }
    ],
    "documents": []
}

try:
    response = requests.post(url, json=payload)
    print("STATUS:", response.status_code)
    print("RESPONSE:", response.text)
except Exception as e:
    print("ERROR:", e)
