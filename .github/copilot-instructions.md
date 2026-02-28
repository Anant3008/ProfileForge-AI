# ProfileForge AI – Copilot Context

This is an AI-powered academic profile management system with a FastAPI backend and Next.js frontend.

## Project Structure
- `/backend` - FastAPI REST API with AI-powered chatbot
- `/frontend` - Next.js 15 with TypeScript UI

## Core Features
The system allows users to:
- Register and authenticate with JWT
- View and manually update their academic profile
- Use an AI chatbot to update profile data via natural language
- Query profile information using conversational AI

## Technical Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite with SQLAlchemy ORM
- **AI/LLM**: Google Gemini API (via `google-generativeai`)
- **Agent**: LangChain SQL Agent for natural language to SQL
- **Auth**: JWT-based authentication
- **Runtime**: Python 3.14+, Uvicorn ASGI server

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: TailwindCSS (assumed based on Next.js setup)

## Critical Security Constraints
- **DO NOT modify database schema** once established
- **ALWAYS scope ALL queries to authenticated user_id**
- Prevent unsafe SQL operations (DROP, DELETE without WHERE, etc.)
- The AI agent must ONLY access the logged-in user's data
- Never allow cross-user data access
- Validate and sanitize all user inputs

## AI Chatbot Architecture
```
User Input → FastAPI Endpoint → LangChain Agent → Google Gemini LLM
    ↓                                                      ↓
Frontend ← JSON Response ← Safety Filter ← SQL Executor ← Generated SQL
```

### AI Agent Responsibilities
1. Parse natural language intent
2. Generate safe, scoped SQL queries (with user_id filter)
3. Execute queries on SQLite database
4. Return human-readable responses
5. Handle both SELECT (queries) and UPDATE (modifications)

### AI Safety Rules
- Restrict SQL operations to allowed tables only
- Always inject `WHERE user_id = {current_user_id}`
- Block destructive operations without explicit confirmation
- Validate generated SQL before execution
- Log all AI-generated queries for audit

## Development Guidelines
- Write **clean, modular, production-ready** Python/TypeScript code
- Use **type hints** in Python and **strict TypeScript** types
- Follow **RESTful API conventions**
- Implement proper **error handling** and **validation**
- Use **environment variables** for secrets (API keys, JWT secret)
- Write **docstrings** for all functions and classes
- Keep **security-first** mindset in all implementations

## Environment Variables
```
GOOGLE_API_KEY=<gemini-api-key>
JWT_SECRET_KEY=<secret-for-jwt>
DATABASE_URL=sqlite:///./profile.db
```