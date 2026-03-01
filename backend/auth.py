"""
JWT Authentication and password hashing utilities
Modified to work with Students table
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import Student

# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Password hashing (using Argon2 for Python 3.14+ compatibility)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Bearer token scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using Argon2"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Payload to encode (should include student_id)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> dict:
    """
    Decode and verify a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload dictionary
        
    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_student_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> int:
    """
    FastAPI dependency to get the current authenticated student ID
    
    Usage in endpoints:
        @app.get("/profile")
        def get_profile(student_id: int = Depends(get_current_student_id)):
            # student_id is automatically extracted from JWT
            ...
    
    Args:
        credentials: Bearer token from Authorization header
        db: Database session
        
    Returns:
        student_id: Authenticated student's ID
        
    Raises:
        HTTPException: If token is invalid or student doesn't exist
    """
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        student_id: int = payload.get("student_id")
        
        if student_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        # Verify student exists in database
        student = db.query(Student).filter(Student.id == student_id).first()
        if student is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Student not found"
            )
        
        return student_id
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def authenticate_student(email: str, password: str, db: Session) -> Optional[Student]:
    """
    Authenticate a student with email and password
    
    Args:
        email: Student's email
        password: Plain text password
        db: Database session
        
    Returns:
        Student object if authentication successful, None otherwise
    """
    student = db.query(Student).filter(Student.email == email).first()
    
    if not student:
        return None
    
    if not student.password or not verify_password(password, student.password):
        return None
    
    return student
