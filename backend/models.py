"""
Database models for ProfileForge AI
Using original Kalvium schema: students, courses, education_details, applications
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Date, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone


def utc_now():
    """Get current UTC time (Python 3.12+ compatible)"""
    return datetime.now(timezone.utc)

Base = declarative_base()


class Student(Base):
    """Student authentication model"""
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255))
    phone = Column(String(20))
    date_of_birth = Column(Date)
    city = Column(String(255))
    created_at = Column(DateTime, default=utc_now)
    
    # Relationships
    education = relationship("EducationDetails", back_populates="student", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")


class EducationDetails(Base):
    """Student education details model"""
    __tablename__ = "education_details"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    tenth_board = Column(String(255))
    tenth_percentage = Column(Float, CheckConstraint("tenth_percentage BETWEEN 0 AND 100"))
    
    twelfth_board = Column(String(255))
    twelfth_percentage = Column(Float, CheckConstraint("twelfth_percentage BETWEEN 0 AND 100"))
    
    # Relationship
    student = relationship("Student", back_populates="education")


class Course(Base):
    """Course model"""
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    duration_months = Column(Integer, CheckConstraint("duration_months > 0"))
    fee = Column(Float, CheckConstraint("fee >= 0"))
    
    # Relationships
    applications = relationship("Application", back_populates="course", cascade="all, delete-orphan")


class Application(Base):
    """Student course application model"""
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    
    status = Column(
        String(50),
        CheckConstraint("status IN ('submitted', 'under_review', 'accepted', 'rejected')"),
        default='submitted',
        nullable=False
    )
    
    applied_at = Column(DateTime, default=utc_now)
    reviewed_at = Column(DateTime)
    
    # Relationships
    student = relationship("Student", back_populates="applications")
    course = relationship("Course", back_populates="applications")
