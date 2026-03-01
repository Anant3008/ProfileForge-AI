# ProfileForge AI - Backend

AI-powered academic profile management system with natural language interface.

## 🏗️ Architecture

```
User → FastAPI → LangChain Agent → Google Gemini LLM
  ↓                                        ↓
JWT Auth → SQL Safety Layer → SQLite Database
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Using uv (recommended)
uv sync

# Or using pip
pip install -e .
```

### 2. Setup Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Google Gemini API key
# Get it from: https://makersuite.google.com/app/apikey
```

### 3. Run the Server

```bash
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000

**API Documentation**: http://localhost:8000/docs

## 📁 Project Structure

```
backend/
├── main.py          # FastAPI app with all endpoints
├── agent.py         # 🧠 SQL Agent (Heart of the system)
├── models.py        # SQLAlchemy database models
├── database.py      # Database connection & session management
├── auth.py          # JWT authentication utilities
├── .env.example     # Environment variables template
└── profile.db       # SQLite database (auto-created)
```

## 🔑 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Profile Management
- `GET /profile` - Get current user's profile (requires auth)
- `PUT /profile` - Update profile manually (requires auth)

### AI Chat Interface
- `POST /chat` - Natural language query/command (requires auth)

## 🤖 AI Agent Usage

The SQL Agent converts natural language to safe SQL queries:

### Query Examples
```
"What's my GPA?"
"Show me my skills"
"What is my major?"
```

### Command Examples
```
"Update my GPA to 3.9"
"Add Python to my skills"
"Change my major to Computer Science"
"Set my location to New York"
```

## 🔒 Security Features

1. **JWT Authentication** - All endpoints (except auth) require valid token
2. **User Scoping** - Agent automatically filters queries by `user_id`
3. **SQL Safety** - Forbidden operations blocked (DROP, DELETE, etc.)
4. **Password Hashing** - Bcrypt for secure password storage

## 🧪 Testing with curl

### Register a User
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securepass123",
    "name": "John Doe",
    "major": "Computer Science"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "securepass123"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:8000/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Chat with AI Agent
```bash
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Update my GPA to 3.9"
  }'
```

## 🛠️ Development

### Database Reset
```bash
# Delete the database file
rm profile.db

# Restart the server (will recreate tables)
python main.py
```

### Enable Debug Logging
In `database.py`, set `echo=True` to see all SQL queries.

## 📦 Dependencies

- **FastAPI** - Modern web framework
- **SQLAlchemy** - ORM for database
- **LangChain** - Agent framework
- **Google Gemini** - LLM for natural language processing
- **python-jose** - JWT token handling
- **passlib** - Password hashing
- **uvicorn** - ASGI server

## 🚨 Important Notes

1. **Never modify the database schema after initial creation**
2. **Always scope queries to authenticated user_id**
3. **Use environment variables for secrets**
4. **In production, use PostgreSQL instead of SQLite**
5. **Change JWT_SECRET_KEY in production**

## 📄 License

MIT License
