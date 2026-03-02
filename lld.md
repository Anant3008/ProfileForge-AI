# Low Level Design - ProfileForge AI

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Design](#database-design)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [API Specifications](#api-specifications)
6. [AI Agent Implementation](#ai-agent-implementation)
7. [Authentication Flow](#authentication-flow)
8. [Data Flow Diagrams](#data-flow-diagrams)
9. [Error Handling](#error-handling)
10. [Security Implementation](#security-implementation)

---

## 1. System Overview

### Technology Stack

#### Backend
```
FastAPI 0.134.0
├── Python 3.14
├── SQLAlchemy 2.0.47 (ORM)
├── Uvicorn 0.41.0 (ASGI Server)
├── Pydantic 2.12.5 (Validation)
├── LangChain 1.2.10 (AI Framework)
├── langchain-google-genai 2.0.9 (Gemini Integration)
├── python-jose 3.3.0 (JWT)
├── passlib 1.7.4 (Password Hashing)
└── python-dotenv 1.2.1 (Environment)
```

#### Frontend
```
Next.js 16.1.6
├── React 18.x
├── TypeScript 5.6
├── TailwindCSS 3.x
└── lucide-react (Icons)
```

#### AI/LLM
```
Google Gemini API (gemini-2.0-flash-exp)
└── LangChain SQL Agent
```

#### Database
```
SQLite 3.x (Development/Production)
└── Upgrade Path: PostgreSQL
```

---

## 2. Database Design

### Entity-Relationship Diagram

```
┌─────────────────────┐
│     students        │
├─────────────────────┤
│ student_id (PK)     │◄──────┐
│ full_name           │       │
│ email (UNIQUE)      │       │
│ password_hash       │       │
│ phone               │       │
│ date_of_birth       │       │
│ city                │       │
│ created_at          │       │
└─────────────────────┘       │
         │                     │
         │ 1:N                 │ N:1
         ▼                     │
┌─────────────────────┐       │
│ education_details   │       │
├─────────────────────┤       │
│ education_id (PK)   │       │
│ student_id (FK)     │───────┘
│ tenth_board         │
│ tenth_percentage    │
│ twelfth_board       │
│ twelfth_percentage  │
└─────────────────────┘
         │
         │ 1
         │
         │ N:1
         │
┌─────────────────────┐       ┌─────────────────────┐
│   applications      │       │      courses        │
├─────────────────────┤       ├─────────────────────┤
│ application_id (PK) │       │ course_id (PK)      │
│ student_id (FK)     │───┐   │ title               │
│ course_id (FK)      │───┼──►│ description         │
│ status              │   │   │ duration            │
│ applied_at          │   │   │ fee                 │
│ reviewed_at (NULL)  │   │   │ level               │
└─────────────────────┘   │   │ created_at          │
                          │   └─────────────────────┘
                          │
                          └───N:1
```

### Table Schemas

#### 1. `students` Table
```sql
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_created_at ON students(created_at);
```

**Constraints:**
- `email`: Must be unique, valid email format
- `password_hash`: Bcrypt hashed (60 chars)
- `phone`: Required for registration
- `date_of_birth`: Must be valid date
- `city`: Required for registration

---

#### 2. `education_details` Table
```sql
CREATE TABLE education_details (
    education_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER UNIQUE NOT NULL,
    tenth_board VARCHAR(100),
    tenth_percentage DECIMAL(5, 2),
    twelfth_board VARCHAR(100),
    twelfth_percentage DECIMAL(5, 2),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_education_student ON education_details(student_id);
```

**Constraints:**
- `student_id`: One-to-one with students table
- `tenth_percentage`, `twelfth_percentage`: 0.00 to 100.00
- All fields nullable (optional during registration)

---

#### 3. `courses` Table
```sql
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    duration VARCHAR(50),
    fee DECIMAL(10, 2),
    level VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_created_at ON courses(created_at);
```

**Constraints:**
- `title`: Required, descriptive course name
- `duration`: e.g., "3 months", "6 weeks"
- `fee`: Decimal for price (e.g., 999.99)
- `level`: "Beginner", "Intermediate", "Advanced"

---

#### 4. `applications` Table
```sql
CREATE TABLE applications (
    application_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'accepted',
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    UNIQUE(student_id, course_id)  -- Prevent duplicate enrollments
);

-- Indexes
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_course ON applications(course_id);
CREATE INDEX idx_applications_status ON applications(status);
```

**Constraints:**
- `status`: "pending", "accepted", "rejected" (default: "accepted" for auto-enrollment)
- `applied_at`: Timestamp of enrollment
- `reviewed_at`: Nullable, set when admin reviews (future feature)
- Composite unique constraint on (student_id, course_id)

---

## 3. Backend Architecture

### Module Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── models.py              # SQLAlchemy ORM models
├── database.py            # Database connection & session management
├── auth.py                # JWT authentication utilities
├── agent.py               # LangChain SQL Agent
├── pyproject.toml         # Python dependencies
├── .env                   # Environment variables
└── data/
    ├── database.sqlite    # SQLite database file
    └── logs/
        └── ai_activity.jsonl  # AI interaction logs
```

### Component Diagram

```
┌────────────────────────────────────────────────────────────┐
│                      main.py (FastAPI App)                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Routers    │  │  Middleware  │  │   Startup    │   │
│  │              │  │              │  │   Events     │   │
│  │ /auth/*      │  │ CORS         │  │              │   │
│  │ /student/*   │  │ JWT Check    │  │ init_db()    │   │
│  │ /courses/*   │  │              │  │ seed_courses │   │
│  │ /chat        │  │              │  │ init_agent() │   │
│  │ /ai/logs     │  │              │  │              │   │
│  └──────┬───────┘  └──────────────┘  └──────────────┘   │
│         │                                                 │
└─────────┼─────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Injection                     │
├─────────────────────────────────────────────────────────────┤
│ get_db() → Session                                          │
│ get_current_student_id(token: str) → int                   │
└─────────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│ │   auth.py    │  │  agent.py    │  │ database.py  │     │
│ │              │  │              │  │              │     │
│ │ hash_pwd()   │  │ SQL Agent    │  │ SessionLocal │     │
│ │ verify_pwd() │  │ process()    │  │ init_db()    │     │
│ │ create_jwt() │  │ execute()    │  │ get_db()     │     │
│ │ decode_jwt() │  │ log_event()  │  │              │     │
│ └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                          │
├─────────────────────────────────────────────────────────────┤
│                     models.py (ORM)                         │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│ │  Student   │ │ Education  │ │   Course   │             │
│ └────────────┘ └────────────┘ └────────────┘             │
│ ┌────────────┐                                             │
│ │Application │                                             │
│ └────────────┘                                             │
└─────────────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database                           │
└─────────────────────────────────────────────────────────────┘
```

### Class Diagram

```python
# models.py

class Student(Base):
    __tablename__ = "students"
    
    student_id: int (PK)
    full_name: str
    email: str (unique)
    password_hash: str
    phone: str
    date_of_birth: date
    city: str
    created_at: datetime
    
    # Relationships
    education: EducationDetails (1:1)
    applications: List[Application] (1:N)

class EducationDetails(Base):
    __tablename__ = "education_details"
    
    education_id: int (PK)
    student_id: int (FK → students.student_id)
    tenth_board: Optional[str]
    tenth_percentage: Optional[float]
    twelfth_board: Optional[str]
    twelfth_percentage: Optional[float]
    
    # Relationships
    student: Student (N:1)

class Course(Base):
    __tablename__ = "courses"
    
    course_id: int (PK)
    title: str
    description: str
    duration: str
    fee: float
    level: str
    created_at: datetime
    
    # Relationships
    applications: List[Application] (1:N)

class Application(Base):
    __tablename__ = "applications"
    
    application_id: int (PK)
    student_id: int (FK → students.student_id)
    course_id: int (FK → courses.course_id)
    status: str
    applied_at: datetime
    reviewed_at: Optional[datetime]
    
    # Relationships
    student: Student (N:1)
    course: Course (N:1)
```

---

## 4. Frontend Architecture

### Component Hierarchy

```
app/
├── layout.tsx                    # Root layout (metadata, fonts)
│
├── page.tsx                      # Dashboard (Protected Route)
│   ├── ProfileSection
│   │   ├── ProfileCard
│   │   └── EditProfileForm
│   ├── EducationSection
│   │   ├── EducationCard (10th)
│   │   ├── EducationCard (12th)
│   │   └── EditEducationForm
│   ├── MyCoursesSection
│   │   └── CourseCard[]
│   ├── AvailableCoursesSection
│   │   └── CourseCard[]
│   └── AIActivitySection
│       └── ActivityLogCard[]
│
├── auth/
│   └── page.tsx                  # Auth Page
│       ├── LoginForm
│       └── RegisterForm
│           ├── Step1: BasicInfo
│           └── Step2: Education
│
├── lib/
│   └── api.ts                    # API Client
│       ├── authApi
│       ├── studentApi
│       ├── courseApi
│       └── chatApi
│
├── types.ts                      # TypeScript Interfaces
│   ├── Student
│   ├── Education
│   ├── Course
│   ├── Application
│   ├── ChatMessage
│   └── AIActivityLog
│
└── globals.css                   # Tailwind + Custom Styles
```

### State Management

```typescript
// page.tsx - Dashboard State

const Dashboard = () => {
  // Authentication
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  
  // Data State
  const [student, setStudent] = useState<Student | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [aiLogs, setAiLogs] = useState<AIActivityLog[]>([])
  
  // UI State
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingEducation, setIsEditingEducation] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'chat'>('profile')
  
  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Form State (Edit Mode)
  const [editForm, setEditForm] = useState<EditStudentData>({})
  const [educationForm, setEducationForm] = useState<EditEducationData>({})
  
  // Computed State
  const appliedCourseIds = useMemo(() => 
    new Set(applications.map(app => app.course_id)), 
    [applications]
  )
  
  const availableCourses = useMemo(() =>
    courses.filter(c => !appliedCourseIds.has(c.course_id)),
    [courses, appliedCourseIds]
  )
  
  // Lifecycle
  useEffect(() => {
    // Load token from localStorage
    // Fetch all data
    // Redirect if not authenticated
  }, [])
  
  return (/* JSX */)
}
```

### Component Communication

```
┌───────────────────────────────────────┐
│         page.tsx (Parent)             │
│  - Manages all state                  │
│  - Fetches data from API              │
│  - Passes props to children           │
└───────────────┬───────────────────────┘
                │
        ┌───────┴───────┬───────────┬─────────────┐
        │               │           │             │
        ▼               ▼           ▼             ▼
┌───────────┐   ┌───────────┐  ┌──────────┐  ┌──────────┐
│ Profile   │   │ Education │  │ Courses  │  │ AI Chat  │
│ Section   │   │ Section   │  │ Section  │  │ Sidebar  │
└───────────┘   └───────────┘  └──────────┘  └──────────┘
     │               │              │              │
     └───────────────┴──────────────┴──────────────┘
                     │
              (Event Handlers)
                     │
            ┌────────┴────────┐
            │  Parent Updates │
            │  - Edit Profile │
            │  - Edit Edu     │
            │  - Enroll       │
            │  - Send Chat    │
            └─────────────────┘
```

---

## 5. API Specifications

### Authentication Endpoints

#### POST `/auth/register`
```typescript
Request:
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "date_of_birth": "2000-01-01",
  "city": "New York",
  "tenth_board": "CBSE",         // Optional
  "tenth_percentage": 92.5,      // Optional
  "twelfth_board": "CBSE",       // Optional
  "twelfth_percentage": 88.3     // Optional
}

Response (201):
{
  "message": "Registration successful",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}

Errors:
- 400: Email already registered
- 422: Invalid email/password format
```

#### POST `/auth/login`
```typescript
Request:
{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}

Errors:
- 401: Invalid email or password
- 422: Missing required fields
```

---

### Student Endpoints (Protected)

#### GET `/student/profile`
```typescript
Headers:
{
  "Authorization": "Bearer <token>"
}

Response (200):
{
  "student_id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "date_of_birth": "2000-01-01",
  "city": "New York",
  "created_at": "2026-03-01T10:00:00"
}

Errors:
- 401: Unauthorized (invalid token)
```

#### PUT `/student/profile`
```typescript
Request:
{
  "full_name": "John Smith",
  "phone": "+0987654321",
  "city": "Los Angeles"
}

Response (200):
{
  "message": "Profile updated successfully"
}
```

#### GET `/student/education`
```typescript
Response (200):
{
  "education_id": 1,
  "student_id": 1,
  "tenth_board": "CBSE",
  "tenth_percentage": 92.5,
  "twelfth_board": "CBSE",
  "twelfth_percentage": 88.3
}

Response (404):
{
  "detail": "Education details not found"
}
```

#### PUT `/student/education`
```typescript
Request:
{
  "tenth_board": "ICSE",
  "tenth_percentage": 95.0,
  "twelfth_board": "ICSE",
  "twelfth_percentage": 90.0
}

Response (200):
{
  "message": "Education updated successfully"
}
```

#### GET `/student/applications`
```typescript
Response (200):
[
  {
    "application_id": 1,
    "student_id": 1,
    "course_id": 2,
    "status": "accepted",
    "applied_at": "2026-03-01T12:00:00",
    "reviewed_at": null,
    "course": {
      "course_id": 2,
      "title": "Machine Learning Fundamentals",
      "description": "...",
      "duration": "3 months",
      "fee": 999.99,
      "level": "Intermediate"
    }
  }
]
```

#### POST `/student/apply`
```typescript
Request:
{
  "course_id": 3
}

Response (201):
{
  "message": "Successfully enrolled in course",
  "application_id": 5
}

Errors:
- 400: Already enrolled in this course
- 404: Course not found
```

---

### Course Endpoints

#### GET `/courses`
```typescript
Response (200):
[
  {
    "course_id": 1,
    "title": "Introduction to Python",
    "description": "Learn Python from scratch...",
    "duration": "2 months",
    "fee": 499.99,
    "level": "Beginner",
    "created_at": "2026-01-01T00:00:00"
  },
  // ... more courses
]
```

---

### AI Chat Endpoint

#### POST `/chat`
```typescript
Request:
{
  "message": "What is my current GPA?"
}

Response (200):
{
  "response": "Based on your education records, you scored 92.5% in 10th grade and 88.3% in 12th grade. Your approximate GPA would be around 3.7 on a 4.0 scale."
}

Errors:
- 401: Unauthorized
- 500: AI processing error
```

---

### AI Logs Endpoint

#### GET `/ai/logs?limit=50`
```typescript
Response (200):
[
  {
    "ts": "2026-03-02T14:30:45.123456",
    "event": "query",
    "student_id": 1,
    "query": "What courses am I enrolled in?",
    "generated_sql": "SELECT * FROM applications WHERE student_id = 1",
    "row_count": 2,
    "response": "You are enrolled in: Machine Learning Fundamentals, Web Development Bootcamp"
  },
  {
    "ts": "2026-03-02T14:25:12.654321",
    "event": "command",
    "student_id": 1,
    "command": "Update my city to Boston",
    "generated_sql": "UPDATE students SET city = 'Boston' WHERE student_id = 1",
    "rows_affected": 1
  }
]
```

---

## 6. AI Agent Implementation

### Architecture

```python
class StudentSQLAgent:
    def __init__(self, engine, student_id: int):
        self.engine = engine
        self.student_id = student_id
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-exp",
            temperature=0,  # Deterministic
            max_retries=2
        )
        self.agent = self._create_agent()
    
    def _create_agent(self):
        """Initialize LangChain SQL Agent with safety constraints"""
        toolkit = SQLDatabaseToolkit(
            db=SQLDatabase(self.engine),
            llm=self.llm
        )
        
        prompt_template = f"""
        You are a SQL expert assistant for student profile management.
        
        CRITICAL RULES:
        1. ALWAYS add "WHERE student_id = {self.student_id}" to queries
        2. NEVER use DROP, DELETE, or TRUNCATE without confirmation
        3. For SELECT queries, return conversational responses
        4. For UPDATE queries, confirm changes made
        5. Access only: students, education_details, courses, applications
        
        Current student_id: {self.student_id}
        """
        
        return create_sql_agent(
            llm=self.llm,
            toolkit=toolkit,
            prompt=prompt_template,
            agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True
        )
```

### Query Processing Flow

```
User Input: "What's my phone number?"
    ↓
┌─────────────────────────────────────────┐
│   1. Validate Input                     │
│   - Check for malicious patterns        │
│   - Sanitize user message               │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   2. Send to LangChain Agent            │
│   - Inject student_id context           │
│   - Add safety constraints              │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   3. LLM Processes (Gemini)             │
│   - Understand intent                   │
│   - Generate SQL query                  │
│   - Output: SELECT phone FROM students  │
│              WHERE student_id = 1       │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   4. SQL Safety Validation              │
│   - Check for student_id clause         │
│   - Verify allowed tables               │
│   - Block destructive ops               │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   5. Execute Query                      │
│   - Run against SQLite                  │
│   - Fetch results                       │
│   - Result: ["+1234567890"]            │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   6. Generate Human Response            │
│   - LLM converts result to text         │
│   - Output: "Your phone number is       │
│             +1234567890"                │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   7. Log Activity (JSONL)               │
│   - Timestamp, event type, SQL, result  │
└─────────────┬───────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   8. Return to Frontend                 │
│   - JSON response with answer           │
└─────────────────────────────────────────┘
```

### Example Interactions

#### Query Example
```python
# Input
message = "Show me my enrolled courses"

# Generated SQL
sql = """
SELECT c.title, c.duration, a.applied_at 
FROM courses c
JOIN applications a ON c.course_id = a.course_id
WHERE a.student_id = 1
"""

# Output
response = """
You are currently enrolled in 2 courses:
1. Machine Learning Fundamentals (3 months) - enrolled on Mar 1, 2026
2. Web Development Bootcamp (6 weeks) - enrolled on Mar 2, 2026
"""
```

#### Command Example
```python
# Input
message = "Change my city to San Francisco"

# Generated SQL
sql = """
UPDATE students 
SET city = 'San Francisco' 
WHERE student_id = 1
"""

# Output
response = "I've updated your city to San Francisco successfully!"
```

---

## 7. Authentication Flow

### Sequence Diagram

```
┌──────┐          ┌──────────┐          ┌─────────┐          ┌──────────┐
│Client│          │ Frontend │          │ Backend │          │ Database │
└──┬───┘          └────┬─────┘          └────┬────┘          └────┬─────┘
   │                   │                     │                     │
   │ 1. Enter Credentials                    │                     │
   ├──────────────────►│                     │                     │
   │                   │                     │                     │
   │                   │ 2. POST /auth/login │                     │
   │                   ├────────────────────►│                     │
   │                   │                     │                     │
   │                   │                     │ 3. SELECT * FROM    │
   │                   │                     │    students         │
   │                   │                     ├────────────────────►│
   │                   │                     │                     │
   │                   │                     │ 4. User Record      │
   │                   │                     │◄────────────────────┤
   │                   │                     │                     │
   │                   │                     │ 5. Verify Password  │
   │                   │                     │    (bcrypt)         │
   │                   │                     │─────────┐           │
   │                   │                     │         │           │
   │                   │                     │◄────────┘           │
   │                   │                     │                     │
   │                   │                     │ 6. Generate JWT     │
   │                   │                     │─────────┐           │
   │                   │                     │         │           │
   │                   │                     │◄────────┘           │
   │                   │                     │                     │
   │                   │ 7. Return Token     │                     │
   │                   │◄────────────────────┤                     │
   │                   │                     │                     │
   │ 8. Store in localStorage                │                     │
   │◄──────────────────┤                     │                     │
   │                   │                     │                     │
   │ 9. Redirect to /  │                     │                     │
   ├──────────────────►│                     │                     │
   │                   │                     │                     │
   │                   │ 10. GET /student/profile                  │
   │                   │     Authorization: Bearer <token>         │
   │                   ├────────────────────►│                     │
   │                   │                     │                     │
   │                   │                     │ 11. Verify JWT      │
   │                   │                     │     Signature       │
   │                   │                     │─────────┐           │
   │                   │                     │         │           │
   │                   │                     │◄────────┘           │
   │                   │                     │                     │
   │                   │                     │ 12. Extract student_id
   │                   │                     │     from token      │
   │                   │                     │─────────┐           │
   │                   │                     │         │           │
   │                   │                     │◄────────┘           │
   │                   │                     │                     │
   │                   │                     │ 13. Fetch Profile   │
   │                   │                     ├────────────────────►│
   │                   │                     │                     │
   │                   │                     │ 14. Profile Data    │
   │                   │                     │◄────────────────────┤
   │                   │                     │                     │
   │                   │ 15. Return Profile  │                     │
   │                   │◄────────────────────┤                     │
   │                   │                     │                     │
   │ 16. Display Dashboard                   │                     │
   │◄──────────────────┤                     │                     │
```

### JWT Token Structure

```javascript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "sub": "1",                    // student_id
  "email": "john@example.com",
  "exp": 1646323200,             // Expiry (24 hours)
  "iat": 1646236800              // Issued at
}

// Signature
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  SECRET_KEY
)
```

### Token Validation Middleware

```python
async def get_current_student_id(
    token: str = Depends(oauth2_scheme)
) -> int:
    """
    Dependency to extract and validate student_id from JWT.
    Used in all protected endpoints.
    """
    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        student_id: int = int(payload.get("sub"))
        if student_id is None:
            raise HTTPException(401, "Invalid token")
        return student_id
    except JWTError:
        raise HTTPException(401, "Could not validate credentials")
```

---

## 8. Data Flow Diagrams

### Course Enrollment Flow

```
┌────────┐
│ User   │ Clicks "Enroll" on course card
└───┬────┘
    ↓
┌───────────────────────────────────────┐
│ Frontend: availableCourses.tsx        │
│ - handleEnroll(courseId)              │
└───┬───────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ API Client: api.ts                    │
│ - courseApi.enroll(token, courseId)   │
└───┬───────────────────────────────────┘
    ↓
    HTTP POST /student/apply
    Headers: { Authorization: Bearer <token> }
    Body: { course_id: 3 }
    ↓
┌───────────────────────────────────────┐
│ Backend: main.py                      │
│ @app.post("/student/apply")           │
└───┬───────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ JWT Middleware                        │
│ - Validate token                      │
│ - Extract student_id = 1              │
└───┬───────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ Business Logic                        │
│ - Check if already enrolled           │
│ - Check if course exists              │
└───┬───────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ Database Write                        │
│ INSERT INTO applications              │
│   (student_id, course_id, status)     │
│ VALUES (1, 3, 'accepted')             │
└───┬───────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ Response                              │
│ { message: "Successfully enrolled" }  │
└───┬───────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ Frontend Update                       │
│ - Refresh applications list           │
│ - Update appliedCourseIds Set         │
│ - Remove course from available list   │
│ - Show success toast                  │
└───────────────────────────────────────┘
```

### AI Chat Message Flow

```
User types: "What's my 10th percentage?"
    ↓
┌──────────────────────────────────────┐
│ 1. Input Validation (Frontend)       │
│ - Trim whitespace                    │
│ - Check not empty                    │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 2. Set Loading State                 │
│ - setIsProcessing(true)              │
│ - Disable input/button               │
│ - Add user message to chat           │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 3. API Request                       │
│ POST /chat                           │
│ { message: "What's my 10th..." }     │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 4. Backend Processing                │
│ - Validate token → student_id = 1    │
│ - Create StudentSQLAgent(1)          │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 5. LangChain Agent Execution         │
│ - Send to Gemini LLM                 │
│ - Generate SQL query                 │
│ - Execute: SELECT tenth_percentage   │
│            FROM education_details    │
│            WHERE student_id = 1      │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 6. Database Query                    │
│ - Result: [92.5]                     │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 7. Generate Response                 │
│ - LLM converts to natural language   │
│ - "Your 10th grade percentage is     │
│    92.5%"                            │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 8. Log to JSONL                      │
│ {                                    │
│   "ts": "2026-03-02T14:30:45",      │
│   "event": "query",                  │
│   "student_id": 1,                   │
│   "query": "What's my 10th...",     │
│   "generated_sql": "SELECT...",      │
│   "response": "Your 10th..."         │
│ }                                    │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 9. Return to Frontend                │
│ { response: "Your 10th..." }         │
└───┬──────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│ 10. Update UI                        │
│ - Add AI response to chat            │
│ - setIsProcessing(false)             │
│ - Re-enable input                    │
│ - Clear input field                  │
│ - Scroll to bottom                   │
└──────────────────────────────────────┘
```

---

## 9. Error Handling

### Error Hierarchy

```python
# Backend Error Structure

HTTPException (FastAPI)
├── 400 Bad Request
│   ├── Invalid input data
│   ├── Already enrolled
│   └── Duplicate email
├── 401 Unauthorized
│   ├── Invalid token
│   ├── Token expired
│   └── Invalid credentials
├── 404 Not Found
│   ├── Student not found
│   ├── Course not found
│   └── Education details not found
├── 422 Unprocessable Entity
│   └── Pydantic validation errors
└── 500 Internal Server Error
    ├── Database errors
    ├── AI processing errors
    └── Unexpected exceptions
```

### Frontend Error Handling

```typescript
// api.ts - Centralized Error Handler

async function handleApiError(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    
    switch (response.status) {
      case 401:
        // Unauthorized - redirect to login
        localStorage.removeItem('token')
        window.location.href = '/auth'
        throw new Error('Session expired. Please login again.')
      
      case 400:
        // Bad Request - show user error
        throw new Error(error?.detail || 'Invalid request')
      
      case 404:
        // Not Found
        throw new Error(error?.detail || 'Resource not found')
      
      case 422:
        // Validation Error
        const messages = error?.detail?.map(e => e.msg).join(', ')
        throw new Error(messages || 'Validation failed')
      
      case 500:
        // Server Error
        throw new Error('Server error. Please try again later.')
      
      default:
        throw new Error('An unexpected error occurred')
    }
  }
  return response
}
```

### AI Agent Error Handling

```python
def process_query(self, message: str) -> str:
    """
    Process user query with comprehensive error handling
    """
    try:
        # Validate input
        if not message or len(message) > 500:
            return "Please provide a valid query."
        
        # Execute agent
        result = self.agent.run(message)
        
        # Log success
        self.log_ai_event("query", query=message, response=result)
        
        return result
        
    except SQLAlchemyError as e:
        # Database error
        self.log_ai_event("error", error=f"DB Error: {str(e)}")
        return "I encountered a database error. Please try again."
    
    except TimeoutError:
        # LLM timeout
        self.log_ai_event("error", error="Timeout")
        return "The request took too long. Please try again."
    
    except Exception as e:
        # Unexpected error
        self.log_ai_event("error", error=f"Unexpected: {str(e)}")
        return "I encountered an error processing your request."
```

---

## 10. Security Implementation

### Password Security

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hashing
hashed = pwd_context.hash("user_password")
# Result: $2b$12$KIXqJ9Z... (60 chars)

# Verification
is_valid = pwd_context.verify("user_password", hashed)
```

### SQL Injection Prevention

**✅ Safe (Parameterized)**
```python
# SQLAlchemy ORM - automatically parameterized
student = db.query(Student).filter(
    Student.email == user_email
).first()
```

**❌ Unsafe (Never do this)**
```python
# String concatenation - VULNERABLE
query = f"SELECT * FROM students WHERE email = '{user_email}'"
```

### CORS Configuration

```python
# Production-ready CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600  # Cache preflight for 1 hour
)
```

### Rate Limiting Considerations

```python
# Future Implementation (not currently implemented)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/chat")
@limiter.limit("10/minute")  # Max 10 AI requests per minute
async def chat_endpoint():
    ...
```

### Environment Variable Security

```bash
# .env (NEVER commit to git)
GOOGLE_API_KEY=AIzaSy...actual_key_here
JWT_SECRET_KEY=$(openssl rand -hex 32)

# .env.example (commit this)
GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

---

## Deployment Configuration

### Backend (Render)

```yaml
# render.yaml
services:
  - type: web
    name: profileforge-backend
    env: python
    buildCommand: "pip install ."
    startCommand: "uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: GOOGLE_API_KEY
        sync: false
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: PYTHON_VERSION
        value: "3.14"
```

### Frontend (Vercel)

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "@backend-url"
  }
}
```

---

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_applications_student ON applications(student_id);
CREATE INDEX idx_applications_course ON applications(course_id);
```

### Frontend Optimizations
- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: React.lazy() for heavy components
- **Memoization**: useMemo for expensive computations

### Backend Optimizations
- **Connection Pooling**: SQLAlchemy pool_size=10
- **Lazy Loading**: ORM relationships loaded on demand
- **Response Caching**: Future: Redis for profile data

---

## Monitoring & Logging

### JSONL Log Format
```json
{
  "ts": "2026-03-02T14:30:45.123456",
  "event": "query",
  "student_id": 1,
  "query": "What's my GPA?",
  "generated_sql": "SELECT ... WHERE student_id = 1",
  "row_count": 1,
  "response": "Your approximate GPA is 3.7"
}
```

### Future: Structured Logging
```python
import logging
import structlog

logger = structlog.get_logger()
logger.info("student_login", student_id=1, ip="192.168.1.1")
logger.error("ai_failure", student_id=1, error="Timeout")
```

---

## Testing Strategy

### Backend Tests
```python
# test_auth.py
def test_register_success():
    response = client.post("/auth/register", json={...})
    assert response.status_code == 201
    assert "access_token" in response.json()

def test_login_invalid_password():
    response = client.post("/auth/login", json={...})
    assert response.status_code == 401
```

### Frontend Tests
```typescript
// page.test.tsx
describe('Dashboard', () => {
  it('redirects to login if no token', () => {
    render(<Dashboard />)
    expect(window.location.href).toBe('/auth')
  })
  
  it('fetches and displays profile', async () => {
    render(<Dashboard />)
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })
})
```

---

## Appendix: File Structure Detail

```
ProfileForge-AI/
├── backend/
│   ├── main.py (571 lines)
│   │   ├── FastAPI app initialization
│   │   ├── CORS middleware
│   │   ├── Pydantic models (15 models)
│   │   ├── 13 API endpoints
│   │   └── Startup events (init_db, seed_courses)
│   ├── agent.py (120 lines)
│   │   ├── StudentSQLAgent class
│   │   ├── LangChain initialization
│   │   └── JSONL logging
│   ├── models.py (80 lines)
│   │   └── 4 SQLAlchemy models
│   ├── database.py (30 lines)
│   │   ├── Engine creation
│   │   └── Session management
│   ├── auth.py (60 lines)
│   │   ├── Password hashing
│   │   ├── JWT creation/validation
│   │   └── get_current_student_id dependency
│   └── pyproject.toml (25 lines)
│       └── 19 dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx (742 lines)
│   │   │   ├── Dashboard component
│   │   │   ├── 5 major sections
│   │   │   ├── AI chat sidebar
│   │   │   └── 20+ useState hooks
│   │   ├── auth/page.tsx (428 lines)
│   │   │   ├── Login/Register forms
│   │   │   └── 2-step registration
│   │   ├── lib/api.ts (102 lines)
│   │   │   └── 10 API methods
│   │   ├── types.ts (85 lines)
│   │   │   └── 7 interfaces
│   │   ├── layout.tsx (40 lines)
│   │   └── globals.css (120 lines)
│   ├── package.json
│   └── next.config.ts
│
├── README.md (532 lines)
├── LOW_LEVEL_DESIGN.md (this file)
└── .gitignore
```

---

**Document Version**: 1.0  
**Last Updated**: March 2, 2026  
**Author**: Anant Panditrao  
**Status**: Complete
