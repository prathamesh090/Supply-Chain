from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pandas as pd
from pathlib import Path
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import os
import shutil
import mysql.connector
from mysql.connector import Error
from pydantic import BaseModel, EmailStr
import json
import hashlib
import hmac
import base64
from dotenv import load_dotenv
try:
    from supplier_risk import router as supplier_router
    SUPPLIER_RISK_AVAILABLE = True
except ImportError as e:
    print(f"Note: Supplier risk module not available: {e}")
    SUPPLIER_RISK_AVAILABLE = False

# Load environment variables
load_dotenv()

app = FastAPI(
    
    title="Company Verification API",
    description="API for verifying company details including Indian companies via GSTIN/PAN and foreign companies",
    version="1.0.0"
)




# Enable CORS (so frontend can call backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve data file paths relative to this file
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
INDIAN_CSV = DATA_DIR / "indian_companies_cleaned.csv"
FOREIGN_CSV = DATA_DIR / "non_indian_companies_cleaned.csv"

# In-memory storage for verification sessions (use database in production)
verification_sessions = {}
uploaded_documents = {}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
if SUPPLIER_RISK_AVAILABLE:
    app.include_router(supplier_router)
    print("✓ Supplier risk routes registered")
else:
    print("✗ Supplier risk routes not available")
# Environment Variables
SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key-change-in-production')
ALGORITHM = os.getenv('ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '30'))

# Database Configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'chainlink_pro'),
    'port': os.getenv('DB_PORT', '3306')
}

# Security
security = HTTPBearer()

# Pydantic Models
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

# Database Utilities
def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        logger.error(f"Error connecting to MySQL: {e}")
        return None

def init_database():
    """Initialize database tables"""
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor()
            
            # Create users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(255) NOT NULL,
                    company_id VARCHAR(255),
                    role ENUM('admin', 'user') DEFAULT 'user',
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ''')
            
            # Create companies table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS companies (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    company_name VARCHAR(255) NOT NULL,
                    business_type VARCHAR(100),
                    industry VARCHAR(100),
                    company_location TEXT,
                    gstin VARCHAR(20),
                    pan VARCHAR(20),
                    country_code VARCHAR(10),
                    registration_number VARCHAR(100),
                    verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                    verification_data JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            ''')
            
            # Create user_company mapping table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_company (
                    user_id INT,
                    company_id INT,
                    is_primary BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
                    PRIMARY KEY (user_id, company_id)
                )
            ''')
            
            connection.commit()
            logger.info("Database tables created successfully")
            
        except Error as e:
            logger.error(f"Error creating tables: {e}")
        finally:
            cursor.close()
            connection.close()

# Password Hashing
def get_password_hash(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return get_password_hash(plain_password) == hashed_password

# JWT Token Functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = data.copy()
    payload.update({"exp": expire.timestamp()})
    
    # Simple JWT implementation
    header = {"alg": "HS256", "typ": "JWT"}
    encoded_header = base64.urlsafe_b64encode(json.dumps(header).encode()).decode()
    encoded_payload = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()
    
    signature = hmac.new(
        SECRET_KEY.encode(),
        f"{encoded_header}.{encoded_payload}".encode(),
        hashlib.sha256
    ).digest()
    encoded_signature = base64.urlsafe_b64encode(signature).decode()
    
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

def verify_token(token: str):
    """Verify JWT token"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        encoded_header, encoded_payload, encoded_signature = parts
        
        # Verify signature
        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            f"{encoded_header}.{encoded_payload}".encode(),
            hashlib.sha256
        ).digest()
        expected_encoded_signature = base64.urlsafe_b64encode(expected_signature).decode()
        
        if not hmac.compare_digest(encoded_signature, expected_encoded_signature):
            return None
            
        # Decode payload
        payload_json = base64.urlsafe_b64decode(encoded_payload + '==').decode()
        payload = json.loads(payload_json)
        
        # Check expiration
        if datetime.utcnow().timestamp() > payload.get("exp", 0):
            return None
            
        return payload
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return None

# Authentication Dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT id, email, full_name, role, is_active, created_at FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if user is None:
                raise HTTPException(status_code=401, detail="User not found")
            return UserResponse(**user)
        except Error as e:
            raise HTTPException(status_code=500, detail="Database error")
        finally:
            cursor.close()
            connection.close()
    else:
        raise HTTPException(status_code=500, detail="Database connection failed")

# Authentication Endpoints
@app.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """User registration endpoint"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
        existing_user = cursor.fetchone()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user (without company_id for now)
        hashed_password = get_password_hash(user_data.password)
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s)",
            (user_data.email, hashed_password, user_data.full_name)
        )
        user_id = cursor.lastrowid
        
        # Get the created user
        cursor.execute("SELECT id, email, full_name, role, is_active, created_at FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_data.email}, expires_delta=access_token_expires
        )
        
        connection.commit()
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(**user)
        }
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    """User login endpoint"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Find user by email
        cursor.execute("SELECT id, email, password_hash, full_name, role, is_active, created_at FROM users WHERE email = %s", (login_data.email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(login_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not user['is_active']:
            raise HTTPException(status_code=401, detail="Account is deactivated")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user['email']}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(**user)
        }
        
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/company")
async def create_company(company_data: CompanyCreate, current_user: UserResponse = Depends(get_current_user)):
    """Create company profile"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Insert company
        cursor.execute(
            """INSERT INTO companies 
            (company_name, business_type, industry, company_location, gstin, pan, country_code, registration_number) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (company_data.company_name, company_data.business_type, company_data.industry,
             company_data.company_location, company_data.gstin, company_data.pan,
             company_data.country_code, company_data.registration_number)
        )
        company_id = cursor.lastrowid
        
        # Link user to company as primary
        cursor.execute(
            "INSERT INTO user_company (user_id, company_id, is_primary) VALUES (%s, %s, %s)",
            (current_user.id, company_id, True)
        )
        
        connection.commit()
        
        return {"message": "Company created successfully", "company_id": company_id}
        
    except Error as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user

# Existing CSV loading functions
def _load_csv(path: Path) -> pd.DataFrame:
    """Load CSV file with proper error handling"""
    if not path.exists():
        logging.error("CSV file not found: %s", path)
        return pd.DataFrame()
    try:
        df = pd.read_csv(path)
        logging.info("Successfully loaded CSV: %s with %d records", path, len(df))
        return df
    except Exception as e:
        logging.exception("Failed to read CSV %s: %s", path, e)
        return pd.DataFrame()

# Load company data
df_indian = _load_csv(INDIAN_CSV)
df_foreign = _load_csv(FOREIGN_CSV)

def _validate_company_data(df: pd.DataFrame, required_columns: List[str]) -> bool:
    """Validate that the dataframe has required columns"""
    if df.empty:
        return False
    
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        logging.warning("Missing columns in data: %s", missing_columns)
        return False
    
    return True

# Validate Indian company data
indian_required_columns = ['gstin', 'pan', 'company_name', 'state', 'city', 'country', 'status']
if not _validate_company_data(df_indian, indian_required_columns):
    logging.warning("Indian company data validation failed")

# Validate Foreign company data
foreign_required_columns = ['country', 'foreign_registration', 'company_name', 'status']
if not _validate_company_data(df_foreign, foreign_required_columns):
    logging.warning("Foreign company data validation failed")

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "Company Verification API is running",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "data_loaded": {
            "indian_companies": len(df_indian),
            "foreign_companies": len(df_foreign)
        }
    }

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": {
            "indian_companies_loaded": not df_indian.empty,
            "indian_companies_count": len(df_indian),
            "foreign_companies_loaded": not df_foreign.empty,
            "foreign_companies_count": len(df_foreign)
        }
    }

@app.post("/verifyCompany")
async def verify_company(
    gstin: Optional[str] = Body(None),
    pan: Optional[str] = Body(None),
    country: Optional[str] = Body(None),
    foreign_registration: Optional[str] = Body(None)
):
    """
    Verify a company.
    For Indian companies: provide gstin and pan
    For Foreign companies: provide country and foreign_registration
    """
    logger.info(f"Verification request - GSTIN: {gstin}, PAN: {pan}, Country: {country}, Foreign Registration: {foreign_registration}")
    
    # Create verification session
    verification_id = str(uuid.uuid4())
    verification_sessions[verification_id] = {
        "id": verification_id,
        "timestamp": datetime.now().isoformat(),
        "status": "processing",
        "type": "indian" if gstin else "foreign",
        "data": {
            "gstin": gstin,
            "pan": pan,
            "country": country,
            "foreign_registration": foreign_registration
        }
    }

    # Case 1: Indian company (verify by GSTIN and PAN)
    if gstin:
        if df_indian.empty:
            verification_sessions[verification_id]["status"] = "error"
            raise HTTPException(
                status_code=500, 
                detail="Indian company data not loaded on server."
            )
        
        # Clean and validate GSTIN
        gstin_clean = gstin.upper().strip()
        if len(gstin_clean) != 15:
            verification_sessions[verification_id]["status"] = "invalid_gstin"
            raise HTTPException(
                status_code=400,
                detail="GSTIN must be exactly 15 characters"
            )
        
        # Search for company by GSTIN (case-insensitive)
        match = df_indian[df_indian["gstin"].str.upper() == gstin_clean]
        
        if not match.empty:
            company_data = match.iloc[0].replace({pd.NaT: None, pd.NA: None}).to_dict()
            
            # Verify PAN matches if provided
            if pan:
                db_pan = str(company_data.get("pan", "")).upper().strip()
                input_pan = pan.upper().strip()
                
                if db_pan and db_pan != input_pan:
                    verification_sessions[verification_id]["status"] = "pan_mismatch"
                    raise HTTPException(
                        status_code=400,
                        detail=f"PAN does not match our records. Expected: {db_pan}, Provided: {input_pan}"
                    )
            
            # Prepare response based on company status
            company_status = str(company_data.get("status", "unknown")).lower()
            response_data = {
                "verification_id": verification_id,
                "status": company_status,
                "message": "Company successfully verified",
                **company_data
            }
            
            # Update session status
            if company_status == 'active':
                verification_sessions[verification_id]["status"] = "verified_active"
                verification_sessions[verification_id]["company_name"] = company_data.get("company_name")
            elif company_status == 'inactive':
                verification_sessions[verification_id]["status"] = "verified_inactive"
                verification_sessions[verification_id]["company_name"] = company_data.get("company_name")
            else:
                verification_sessions[verification_id]["status"] = "verified_unknown"
                verification_sessions[verification_id]["company_name"] = company_data.get("company_name")
            
            logger.info(f"Company verified successfully: {company_data.get('company_name')} - Status: {company_status}")
            return response_data
            
        else:
            verification_sessions[verification_id]["status"] = "not_found"
            raise HTTPException(
                status_code=404, 
                detail=f"Company not found with GSTIN: {gstin}"
            )

    # Case 2: Non-Indian company (verify by country + foreign_registration)
    if country and foreign_registration:
        if df_foreign.empty:
            verification_sessions[verification_id]["status"] = "error"
            raise HTTPException(
                status_code=500, 
                detail="Foreign company data not loaded on server."
            )
        
        # Clean inputs
        country_clean = country.upper().strip()
        registration_clean = foreign_registration.upper().strip()
        
        # Search for company
        match = df_foreign[
            (df_foreign["country"].str.upper() == country_clean) &
            (df_foreign["foreign_registration"].str.upper() == registration_clean)
        ]
        
        if not match.empty:
            company_data = match.iloc[0].replace({pd.NaT: None, pd.NA: None}).to_dict()
            company_status = str(company_data.get("status", "unknown")).lower()
            
            response_data = {
                "verification_id": verification_id,
                "status": company_status,
                "message": "Company successfully verified",
                **company_data
            }
            
            # Update session status
            if company_status == 'active':
                verification_sessions[verification_id]["status"] = "verified_active"
            elif company_status == 'inactive':
                verification_sessions[verification_id]["status"] = "verified_inactive"
            else:
                verification_sessions[verification_id]["status"] = "verified_unknown"
            
            verification_sessions[verification_id]["company_name"] = company_data.get("company_name")
            logger.info(f"Foreign company verified: {company_data.get('company_name')} - Status: {company_status}")
            return response_data
            
        else:
            verification_sessions[verification_id]["status"] = "not_found"
            raise HTTPException(
                status_code=404,
                detail=f"Company not found in {country} with registration: {foreign_registration}"
            )

    # If neither case matched
    verification_sessions[verification_id]["status"] = "invalid_request"
    raise HTTPException(
        status_code=400,
        detail="Please provide either 'gstin' for Indian companies or 'country' and 'foreign_registration' for foreign companies"
    )

@app.post("/verify-foreign-company")
async def verify_foreign_company_with_files(
    country: str = Form(...),
    registration_number: str = Form(...),
    email: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Verify foreign company with document upload
    """
    logger.info(f"Foreign company verification - Country: {country}, Registration: {registration_number}, Email: {email}, Files: {len(files)}")
    
    # Validate file count
    if len(files) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least 2 supporting documents are required"
        )
    
    if len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 documents allowed"
        )

    # Create verification session
    verification_id = str(uuid.uuid4())
    
    # Create upload directory
    upload_dir = Path("uploads") / verification_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    saved_files = []
    total_size = 0
    
    # Validate and save uploaded files
    allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
    max_file_size = 10 * 1024 * 1024  # 10MB
    
    for file in files:
        if not file.filename:
            continue
            
        # Check file extension
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_extension} not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is too large. Maximum size is 10MB"
            )
        
        # Save file
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            buffer.write(content)
            total_size += len(content)
        
        saved_files.append({
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(content),
            "path": str(file_path)
        })
        
        # Reset file pointer for potential future use
        await file.seek(0)
    
    # Check if company exists in database
    company_exists = False
    company_data = {}
    
    if not df_foreign.empty:
        # Clean the registration number for matching
        registration_clean = registration_number.upper().strip()
        country_clean = country.upper().strip()
        
        logger.info(f"Searching for company: Country={country_clean}, Registration={registration_clean}")
        
        # Try exact match first
        match = df_foreign[
            (df_foreign["country"].str.upper() == country_clean) &
            (df_foreign["foreign_registration"].str.upper() == registration_clean)
        ]
        
        # If no exact match, try partial match on registration number
        if match.empty:
            match = df_foreign[
                (df_foreign["country"].str.upper() == country_clean) &
                (df_foreign["foreign_registration"].str.contains(registration_clean, case=False, na=False))
            ]
        
        if not match.empty:
            company_exists = True
            company_data = match.iloc[0].replace({pd.NaT: None, pd.NA: None}).to_dict()
            logger.info(f"Company found: {company_data.get('company_name')}")
        else:
            logger.info("No company found in database")
    
    # Store verification session
    verification_sessions[verification_id] = {
        "id": verification_id,
        "timestamp": datetime.now().isoformat(),
        "type": "foreign",
        "status": "pending_verification",
        "country": country,
        "registration_number": registration_number,
        "email": email,
        "company_exists": company_exists,
        "files_uploaded": len(files),
        "total_size": total_size,
        "file_paths": [f["path"] for f in saved_files],
        "company_data": company_data if company_exists else {},
        "estimated_completion": (datetime.now() + timedelta(days=3)).isoformat()
    }
    
    # Prepare response - ALWAYS include company data if found
    response_data = {
        "verification_id": verification_id,
        "status": "pending_verification",
        "message": "Documents uploaded successfully and verification process started",
        "company_exists": company_exists,
        "documents_received": len(files),
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "estimated_time": "2-3 working days",
        "next_steps": f"We will send verification updates to {email}",
        "email": email
    }
    
    # Always include company data if found, regardless of status
    if company_exists and company_data:
        response_data.update({
            "company_name": company_data.get("company_name"),
            "registration_number": company_data.get("foreign_registration"),
            "country": company_data.get("country"),
            "business_type": company_data.get("business_type"),
            "status": company_data.get("status", "active"),
            "address": company_data.get("address"),
            "incorporation_date": company_data.get("incorporation_date")
        })
    else:
        # If company not found, still show the submitted registration number
        response_data.update({
            "company_name": "Under Verification",
            "registration_number": registration_number,
            "country": country
        })
    
    logger.info(f"Foreign company verification session created: {verification_id}, Company exists: {company_exists}")
    return response_data

@app.get("/verification-status/{verification_id}")
async def get_verification_status(verification_id: str):
    """Get the status of a verification session"""
    if verification_id not in verification_sessions:
        raise HTTPException(status_code=404, detail="Verification session not found")
    
    session = verification_sessions[verification_id]
    return {
        "verification_id": verification_id,
        "status": session["status"],
        "timestamp": session["timestamp"],
        "type": session["type"],
        "company_name": session.get("company_name"),
        "data": session["data"] if session["type"] == "indian" else {
            "country": session.get("country"),
            "registration_number": session.get("registration_number"),
            "company_exists": session.get("company_exists"),
            "files_uploaded": session.get("files_uploaded"),
            "estimated_completion": session.get("estimated_completion")
        }
    }

@app.get("/detailed-verification-status/{verification_id}")
async def get_detailed_verification_status(verification_id: str):
    """Get detailed verification status including documents"""
    if verification_id not in verification_sessions:
        raise HTTPException(status_code=404, detail="Verification session not found")
    
    session = verification_sessions[verification_id]
    return session

@app.post("/update-verification-status")
async def update_verification_status(
    verification_id: str = Body(...),
    status: str = Body(...),
    notes: str = Body(None)
):
    """Update verification status (for admin use)"""
    if verification_id not in verification_sessions:
        raise HTTPException(status_code=404, detail="Verification session not found")
    
    verification_sessions[verification_id]["status"] = status
    verification_sessions[verification_id]["updated_at"] = datetime.now().isoformat()
    verification_sessions[verification_id]["admin_notes"] = notes
    
    logger.info(f"Verification status updated: {verification_id} -> {status}")
    return {"message": "Status updated successfully", "verification_id": verification_id}

@app.get("/company/{gstin}")
async def get_company_by_gstin(gstin: str):
    """Get company details by GSTIN (for debugging)"""
    if df_indian.empty:
        raise HTTPException(status_code=500, detail="Indian company data not loaded")
    
    match = df_indian[df_indian["gstin"].str.upper() == gstin.upper()]
    if match.empty:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_data = match.iloc[0].replace({pd.NaT: None, pd.NA: None}).to_dict()
    return company_data

@app.get("/foreign-company/{country}/{registration}")
async def get_foreign_company(country: str, registration: str):
    """Get foreign company details (for debugging)"""
    if df_foreign.empty:
        raise HTTPException(status_code=500, detail="Foreign company data not loaded")
    
    match = df_foreign[
        (df_foreign["country"].str.upper() == country.upper()) &
        (df_foreign["foreign_registration"].str.upper() == registration.upper())
    ]
    if match.empty:
        raise HTTPException(status_code=404, detail="Company not found")
    
    company_data = match.iloc[0].replace({pd.NaT: None, pd.NA: None}).to_dict()
    return company_data

@app.get("/stats")
async def get_stats():
    """Get verification statistics"""
    total_sessions = len(verification_sessions)
    successful_verifications = len([s for s in verification_sessions.values() if s["status"].startswith("verified")])
    active_companies = len([s for s in verification_sessions.values() if s["status"] == "verified_active"])
    pending_verifications = len([s for s in verification_sessions.values() if s["status"] == "pending_verification"])
    
    return {
        "total_verification_sessions": total_sessions,
        "successful_verifications": successful_verifications,
        "active_companies_verified": active_companies,
        "pending_foreign_verifications": pending_verifications,
        "indian_companies_in_db": len(df_indian),
        "foreign_companies_in_db": len(df_foreign),
        "uptime": datetime.now().isoformat()
    }

@app.delete("/verification-session/{verification_id}")
async def delete_verification_session(verification_id: str):
    """Delete a verification session (for cleanup)"""
    if verification_id not in verification_sessions:
        raise HTTPException(status_code=404, detail="Verification session not found")
    
    # Clean up uploaded files
    session = verification_sessions[verification_id]
    if session["type"] == "foreign" and "file_paths" in session:
        for file_path in session["file_paths"]:
            try:
                Path(file_path).unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Failed to delete file {file_path}: {e}")
    
    del verification_sessions[verification_id]
    return {"message": "Verification session deleted successfully"}

# Cleanup old sessions (basic implementation)
def cleanup_old_sessions():
    """Clean up verification sessions older than 24 hours"""
    now = datetime.now()
    expired_sessions = []
    
    for session_id, session in verification_sessions.items():
        session_time = datetime.fromisoformat(session["timestamp"])
        if now - session_time > timedelta(hours=24):
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        try:
            # Clean up uploaded files for foreign companies
            session = verification_sessions[session_id]
            if session["type"] == "foreign" and "file_paths" in session:
                for file_path in session["file_paths"]:
                    Path(file_path).unlink(missing_ok=True)
            del verification_sessions[session_id]
        except Exception as e:
            logger.warning(f"Failed to cleanup session {session_id}: {e}")
    
    if expired_sessions:
        logger.info(f"Cleaned up {len(expired_sessions)} expired verification sessions")

# Add startup event to log loaded data
@app.on_event("startup")
async def startup_event():
    logger.info("Company Verification API starting up...")
    logger.info(f"Loaded {len(df_indian)} Indian companies")
    logger.info(f"Loaded {len(df_foreign)} foreign companies")
    
    # Initialize database
    init_database()
    
    # Create uploads directory
    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)
    
    if not df_indian.empty:
        sample_indian = df_indian.iloc[0]
        logger.info(f"Sample Indian company: {sample_indian['company_name']} - GSTIN: {sample_indian['gstin']}")
    
    if not df_foreign.empty:
        sample_foreign = df_foreign.iloc[0]
        logger.info(f"Sample Foreign company: {sample_foreign['company_name']} - Country: {sample_foreign['country']}")

# Start server when running this file directly
# At the bottom of main.py, change this:
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Company Verification API server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,  
        reload=True,
        log_level="info"
    )