"""
ProfileForge AI - FastAPI Backend
AI-powered student profile management with natural language interface
Using Kalvium schema: students, courses, education_details, applications
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
import json
from datetime import date, datetime, timezone
import os
from dotenv import load_dotenv

# Import local modules
from database import get_db, init_db, SessionLocal
from models import Student, EducationDetails, Course, Application
from auth import (
    get_password_hash,
    authenticate_student,
    create_access_token,
    get_current_student_id
)
from agent import get_sql_agent, LOG_PATH

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="ProfileForge AI API",
    description="AI-powered student profile management with natural language interface",
    version="1.0.0"
)

# CORS middleware (configure for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============= Pydantic Models (Request/Response Schemas) =============

class StudentRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    date_of_birth: date
    city: str
    # Education details (optional during registration)
    tenth_board: Optional[str] = None
    tenth_percentage: Optional[float] = None
    twelfth_board: Optional[str] = None
    twelfth_percentage: Optional[float] = None

class StudentLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    student_id: int

class EducationDetailsResponse(BaseModel):
    id: int
    student_id: int
    tenth_board: Optional[str]
    tenth_percentage: Optional[float]
    twelfth_board: Optional[str]
    twelfth_percentage: Optional[float]
    
    class Config:
        from_attributes = True

class StudentResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    date_of_birth: Optional[date]
    city: Optional[str]
    education: Optional[EducationDetailsResponse] = None
    
    class Config:
        from_attributes = True

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    city: Optional[str] = None

class EducationDetailsUpdate(BaseModel):
    tenth_board: Optional[str] = None
    tenth_percentage: Optional[float] = None
    twelfth_board: Optional[str] = None
    twelfth_percentage: Optional[float] = None

class CourseResponse(BaseModel):
    id: int
    title: str
    duration_months: Optional[int]
    fee: Optional[float]
    
    class Config:
        from_attributes = True

class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    status: str
    applied_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    success: bool


class AIActivityLog(BaseModel):
    ts: str
    student_id: int
    kind: str

    class Config:
        extra = "allow"


# ============= Startup Event =============

@app.on_event("startup")
async def startup_event():
    """Initialize database and agent on startup"""
    print("🚀 Starting ProfileForge AI Backend...")
    init_db()

    # Seed starter courses if none exist
    try:
        seed_courses()
    except Exception as e:
        print(f"⚠️  Warning: Could not seed courses: {e}")
    
    # Warm up the SQL agent
    try:
        get_sql_agent()
        print("🤖 SQL Agent initialized successfully")
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize SQL agent: {e}")
        print("    Make sure GOOGLE_API_KEY is set in your .env file")
    
    print("✅ Backend ready!")


# ============= Health Check =============

@app.get("/")
def root():
    """API health check"""
    return {
        "status": "online",
        "service": "ProfileForge AI",
        "version": "1.0.0"
    }


def seed_courses():
    """Seed initial courses if none exist"""
    session = SessionLocal()
    try:
        existing = session.query(Course).count()
        if existing > 0:
            return

        demo_courses = [
            {"title": "Full-Stack Web Development", "duration_months": 6, "fee": 45000},
            {"title": "Data Science & ML Foundations", "duration_months": 5, "fee": 52000},
            {"title": "Cloud & DevOps Essentials", "duration_months": 4, "fee": 48000},
            {"title": "Cybersecurity Fundamentals", "duration_months": 4, "fee": 41000},
            {"title": "Mobile App Development (Flutter)", "duration_months": 5, "fee": 47000},
        ]

        for course in demo_courses:
            session.add(Course(**course))

        session.commit()
        print(f"📚 Seeded {len(demo_courses)} demo courses")
    finally:
        session.close()


# ============= AI Activity Logs =============


@app.get("/ai/logs", response_model=List[AIActivityLog])
def get_ai_logs(
    limit: int = 50,
    student_id: int = Depends(get_current_student_id),
):
    """Return recent AI activity logs for the authenticated student."""
    if limit <= 0:
        limit = 1
    if limit > 200:
        limit = 200

    if not os.path.exists(LOG_PATH):
        return []

    entries: List[AIActivityLog] = []
    try:
        with open(LOG_PATH, "r", encoding="utf-8") as f:
            lines = f.readlines()

        for line in reversed(lines):
            try:
                event = json.loads(line)
            except Exception:
                continue

            if event.get("student_id") != student_id:
                continue

            entries.append(event)
            if len(entries) >= limit:
                break

        entries.reverse()
        return entries
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to read AI activity logs: {str(e)}"
        )


# ============= Authentication Endpoints =============

@app.post("/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(student_data: StudentRegister, db: Session = Depends(get_db)):
    """
    Register a new student
    """
    # Check if student already exists
    existing_student = db.query(Student).filter(Student.email == student_data.email).first()
    if existing_student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create student
    hashed_password = get_password_hash(student_data.password)
    new_student = Student(
        email=student_data.email,
        password=hashed_password,
        full_name=student_data.full_name,
        phone=student_data.phone,
        date_of_birth=student_data.date_of_birth,
        city=student_data.city
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    # Create education details if any provided
    if any([student_data.tenth_board, student_data.tenth_percentage, 
            student_data.twelfth_board, student_data.twelfth_percentage]):
        education = EducationDetails(
            student_id=new_student.id,
            tenth_board=student_data.tenth_board,
            tenth_percentage=student_data.tenth_percentage,
            twelfth_board=student_data.twelfth_board,
            twelfth_percentage=student_data.twelfth_percentage
        )
        db.add(education)
        db.commit()
    
    # Generate token
    access_token = create_access_token(data={"student_id": new_student.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "student_id": new_student.id
    }


@app.post("/auth/login", response_model=TokenResponse)
def login(credentials: StudentLogin, db: Session = Depends(get_db)):
    """
    Authenticate student and return JWT token
    """
    student = authenticate_student(credentials.email, credentials.password, db)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token(data={"student_id": student.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "student_id": student.id
    }


# ============= Student Profile Endpoints =============

@app.get("/student/profile", response_model=StudentResponse)
def get_student_profile(
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    Get current student's profile
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    return StudentResponse.from_orm(student)


@app.put("/student/profile", response_model=StudentResponse)
def update_student_profile(
    student_data: StudentUpdate,
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    Update student's profile information
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update fields if provided
    update_data = student_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(student)
    
    return StudentResponse.from_orm(student)


# ============= Education Details Endpoints =============

@app.get("/student/education", response_model=EducationDetailsResponse)
def get_education_details(
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    Get student's education details
    """
    education = db.query(EducationDetails).filter(EducationDetails.student_id == student_id).first()
    
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education details not found"
        )
    
    return EducationDetailsResponse.from_orm(education)


@app.post("/student/education", response_model=EducationDetailsResponse)
def create_education_details(
    edu_data: EducationDetailsUpdate,
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    Create student's education details
    """
    # Check if already exists
    existing = db.query(EducationDetails).filter(EducationDetails.student_id == student_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Education details already exist for this student"
        )
    
    education = EducationDetails(
        student_id=student_id,
        **edu_data.model_dump(exclude_unset=True)
    )
    db.add(education)
    db.commit()
    db.refresh(education)
    
    return EducationDetailsResponse.from_orm(education)


@app.put("/student/education", response_model=EducationDetailsResponse)
def update_education_details(
    edu_data: EducationDetailsUpdate,
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    Update student's education details
    """
    education = db.query(EducationDetails).filter(EducationDetails.student_id == student_id).first()
    
    if not education:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Education details not found"
        )
    
    # Update fields
    update_data = edu_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(education, field, value)
    
    db.commit()
    db.refresh(education)
    
    return EducationDetailsResponse.from_orm(education)


# ============= Course & Application Endpoints =============

@app.get("/courses", response_model=List[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    """
    List all available courses
    """
    courses = db.query(Course).all()
    return [CourseResponse.from_orm(c) for c in courses]


@app.get("/student/applications", response_model=List[ApplicationResponse])
def get_student_applications(
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    Get current student's course applications
    """
    applications = db.query(Application).filter(Application.student_id == student_id).all()
    
    return [ApplicationResponse.from_orm(app) for app in applications]


@app.post("/student/apply", response_model=ApplicationResponse)
def apply_for_course(
    course_id: int,
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    Apply for a course
    """
    # Check if course exists
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if already applied
    existing = db.query(Application).filter(
        Application.student_id == student_id,
        Application.course_id == course_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already applied for this course"
        )
    
    # Auto-accept enrollment
    application = Application(
        student_id=student_id,
        course_id=course_id,
        status="accepted",
        reviewed_at=datetime.now(timezone.utc)
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    
    return ApplicationResponse.from_orm(application)


# ============= AI Chat Endpoint (The Star of the Show!) =============

@app.post("/chat", response_model=ChatResponse)
def chat_with_agent(
    message: ChatMessage,
    student_id: int = Depends(get_current_student_id),
    db: Session = Depends(get_db)
):
    """
    AI-powered natural language interface to query/update student data
    
    Examples:
    - "What courses have I applied to?"
    - "Update my phone number to 9876543210"
    - "What are my education details?"
    - "Show me available courses"
    """
    try:
        agent = get_sql_agent()
        
        # Determine if it's a query or command
        is_command = any(word in message.message.lower() for word in 
                        ['update', 'change', 'set', 'add', 'remove', 'delete', 'apply'])
        
        if is_command:
            result = agent.execute_command(message.message, student_id, db)
        else:
            result = agent.process_query(message.message, student_id, db)
        
        return ChatResponse(
            response=result["response"],
            success=result["success"]
        )
        
    except Exception as e:
        return ChatResponse(
            response=f"Sorry, I encountered an error: {str(e)}",
            success=False
        )


# ============= Run Server (Development) =============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

