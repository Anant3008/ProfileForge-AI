# 🎓 ProfileForge AI

> AI-powered academic profile management system with natural language interface

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.134-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

ProfileForge AI is a modern student profile management system that combines traditional CRUD operations with AI-powered natural language processing. Students can manage their academic profiles either through a conventional UI or by simply chatting with an AI agent.

## 🚀 Live Demo & Design

**🌐 Live Application**: [https://profile-forge-ai.vercel.app/](https://profile-forge-ai.vercel.app/)  
**🎨 Figma Design**: [View Design System](https://www.figma.com/design/zF1od35xf71U7nZolODhcl/ProfileForge-AI?node-id=0-1&t=vIMJSpvnNw5CozvR-1)

> Try it now! Register a new account and explore the AI-powered profile management system.

---

## ✨ Features

### 🎯 Core Functionality
- **Dual Interface**: Traditional forms + AI chat for profile management
- **Smart Profile Management**: Update academic info, education, skills via UI or natural language
- **Course Enrollment**: Browse and enroll in available courses
- **AI Activity Logging**: Track all AI interactions with detailed audit logs
- **Secure Authentication**: JWT-based auth with bcrypt password hashing

### 🤖 AI Capabilities
- **Natural Language Queries**: "What's my GPA?" → Instant answers
- **Conversational Updates**: "Set my major to Computer Science" → Profile updated
- **Contextual Understanding**: AI understands student context and provides relevant responses
- **SQL Safety**: Built-in guards prevent destructive operations

### 🎨 User Experience
- **Futuristic Dark Theme**: Sleek violet/blue gradient design with glowing effects
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Instant feedback on all operations
- **Activity Dashboard**: Monitor AI interactions and system events

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│              (Next.js + React + TypeScript)                 │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/REST API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     JWT      │  │   LangChain  │  │    JSONL     │     │
│  │     Auth     │→ │  Agent Layer │→ │   Activity   │     │
│  └──────────────┘  └──────┬───────┘  │   Logger     │     │
│                           ↓           └──────────────┘     │
│                   ┌──────────────┐                         │
│                   │ Google Gemini│                         │
│                   │    AI (LLM)  │                         │
│                   └──────┬───────┘                         │
│                           ↓                                 │
│                   ┌──────────────┐                         │
│                   │  SQL Safety  │                         │
│                   │     Layer    │                         │
│                   └──────┬───────┘                         │
└──────────────────────────┼─────────────────────────────────┘
                           ↓
                   ┌──────────────┐
                   │    SQLite    │
                   │   Database   │
                   └──────────────┘
```

### Data Flow Example
1. User types: "Update my GPA to 3.9"
2. Frontend sends request to `/chat` endpoint with JWT token
3. Backend validates token and extracts `student_id`
4. LangChain agent sends prompt to Google Gemini
5. Gemini generates SQL: `UPDATE students SET gpa = 3.9 WHERE student_id = 1`
6. Safety layer validates query (user-scoped, safe operation)
7. SQL executes against SQLite database
8. Result logged to JSONL file
9. Human-readable response sent back to user
10. Frontend displays confirmation and refreshes data

---

## 🛠️ Tech Stack & Design Decisions

### Frontend: **Next.js 16 + React + TypeScript**

#### Why Next.js?
- **Server-Side Rendering**: Better SEO and initial load performance
- **App Router**: Modern routing with built-in layouts and loading states
- **Type Safety**: Full TypeScript support out of the box
- **Developer Experience**: Hot reload, automatic code splitting, built-in optimizations

#### Tradeoffs
✅ **Pros**: 
- Fast development with excellent DX
- Great for both static and dynamic content
- Strong ecosystem and community

❌ **Cons**: 
- Larger bundle size than vanilla React
- Vercel-specific features may create vendor lock-in
- Learning curve for App Router paradigm

**Alternatives Considered**: 
- **Vite + React**: Lighter but requires more configuration
- **Remix**: Great for forms but smaller ecosystem
- **SvelteKit**: Faster but less mature ecosystem

---

### Backend: **FastAPI + Python 3.14**

#### Why FastAPI?
- **Performance**: Comparable to Node.js/Go thanks to async support
- **Type Safety**: Pydantic models provide automatic validation
- **Auto Documentation**: Swagger UI generated automatically
- **Python Ecosystem**: Easy integration with AI/ML libraries

#### Tradeoffs
✅ **Pros**: 
- Best-in-class Python web framework for APIs
- Excellent for AI integration (LangChain, etc.)
- Strong typing prevents runtime errors

❌ **Cons**: 
- Python slower than compiled languages (Go, Rust)
- GIL limitations for CPU-bound tasks (not relevant here)
- Requires ASGI server (Uvicorn)

**Alternatives Considered**: 
- **Flask**: Too minimalist, lacks modern features
- **Django**: Too heavyweight for pure API
- **Node.js (Express/Fastify)**: Good but Python better for AI integration

---

### AI/LLM: **Google Gemini via LangChain**

#### Why Gemini?
- **Free Tier**: Generous quota for development (60 requests/minute)
- **Fast Model**: `gemini-2.5-flash` optimized for speed
- **Strong SQL**: Excellent at understanding and generating SQL
- **Multimodal**: Can handle text, images, etc. (future-proof)

#### Why LangChain?
- **Abstraction**: Easy to swap LLMs (OpenAI, Claude, etc.)
- **SQL Agent**: Pre-built agent for database interactions
- **Tooling**: Built-in memory, callbacks, and error handling

#### Tradeoffs
✅ **Pros**: 
- No cost during development
- Quick to implement
- Framework-agnostic approach

❌ **Cons**: 
- Gemini API less mature than OpenAI
- LangChain adds dependencies and complexity
- Free tier rate limits

**Alternatives Considered**: 
- **OpenAI GPT-4**: Better quality but costs money immediately
- **Claude 3 (Anthropic)**: Excellent but more expensive
- **Local LLMs (Ollama)**: Free but requires GPU and slower

---

### Database: **SQLite**

#### Why SQLite?
- **Zero Configuration**: No separate server process needed
- **ACID Compliant**: Full transactional support
- **Portable**: Single file, easy to backup
- **Sufficient**: Handles thousands of users easily

#### Tradeoffs
✅ **Pros**: 
- Simplest deployment (no DB server to manage)
- Perfect for prototypes and small-medium applications
- Built into Python

❌ **Cons**: 
- No horizontal scaling
- Limited concurrent writes
- Not ideal for 10,000+ users

**Alternatives Considered**: 
- **PostgreSQL**: Production-grade but overkill for MVP
- **MySQL**: Good middle ground but requires server
- **MongoDB**: NoSQL isn't needed here

**Migration Path**: Easy to upgrade to PostgreSQL later (SQLAlchemy supports both)

---

### Styling: **TailwindCSS**

#### Why Tailwind?
- **Utility-First**: Rapid prototyping without context switching
- **Consistency**: Design system enforced through utilities
- **Performance**: Purges unused styles automatically
- **Customization**: Easy to extend with custom themes

#### Tradeoffs
✅ **Pros**: 
- Fastest way to build custom UIs
- No CSS file management
- Great for responsive design

❌ **Cons**: 
- HTML can get verbose
- Learning curve for class names
- Not suitable for highly themed apps

**Alternatives Considered**: 
- **CSS Modules**: More verbose, harder to maintain
- **Styled Components**: Runtime overhead, slower
- **Chakra UI**: Component library, less customization

---

### Authentication: **JWT (JSON Web Tokens)**

#### Why JWT?
- **Stateless**: No server-side session storage needed
- **Scalable**: Works across multiple servers easily
- **Standard**: Industry-standard with broad support

#### Tradeoffs
✅ **Pros**: 
- Simple to implement
- Works well with REST APIs
- Mobile-friendly

❌ **Cons**: 
- Can't invalidate tokens before expiry
- Larger payload than session IDs
- Token theft concerns (mitigated by short expiry)

**Alternatives Considered**: 
- **Session Cookies**: Requires server-side storage
- **OAuth 2.0**: Overkill for this use case
- **Passport.js**: More complex setup

---


## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ (for frontend)
- **Python** 3.10+ (for backend)
- **Google Gemini API Key** ([Get it free](https://makersuite.google.com/app/apikey))

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Anant3008/ProfileForge-AI.git
cd ProfileForge-AI
```

### 2️⃣ Backend Setup
```bash
cd backend

# Install dependencies
pip install -e .
# Or with uv (faster):
uv sync

# Create .env file
cat > .env << EOF
GOOGLE_API_KEY=your_gemini_api_key_here
JWT_SECRET_KEY=$(openssl rand -hex 32)
EOF

# Run the server
python main.py
# Or: uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000  
API Docs: http://localhost:8000/docs

### 3️⃣ Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
EOF

# Run the dev server
npm run dev
```

Frontend will be available at: http://localhost:3000

### 4️⃣ Start Using

1. Visit http://localhost:3000/auth
2. **Register** a new account with your details
3. Log in and explore your dashboard
4. Try the **AI chat**: 
   - "What's my GPA?"
   - "Update my major to Computer Science"
   - "Show me my enrolled courses"

---

## 📦 Project Structure

```
ProfileForge-AI/
├── backend/                    # FastAPI backend
│   ├── main.py                # 🚪 API endpoints & app entry
│   ├── agent.py               # 🧠 AI agent with LangChain
│   ├── models.py              # 🗄️ SQLAlchemy models
│   ├── database.py            # 💾 Database connection
│   ├── auth.py                # 🔐 JWT authentication
│   ├── pyproject.toml         # Python dependencies
│   ├── .env                   # Environment variables (gitignored)
│   └── data/                  # SQLite database + logs
│       ├── database.sqlite    # Student profiles
│       └── logs/              # AI activity logs (JSONL)
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # Next.js app directory
│   │   ├── page.tsx           # 🏠 Main dashboard (protected)
│   │   ├── auth/              # Authentication pages
│   │   │   └── page.tsx       # Login/Register forms
│   │   ├── lib/               # Utilities
│   │   │   └── api.ts         # 🌐 API client functions
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles (Tailwind)
│   ├── package.json           # Node dependencies
│   ├── .env                   # Environment variables (gitignored)
│   └── next.config.ts         # Next.js configuration
│
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

---


## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow existing code style (use linters)
- Write tests for new features
- Update documentation as needed
- Keep commits atomic and well-described

---

## 📝 Future Enhancements

### Planned Features
- [ ] **Multi-language Support**: i18n for global users
- [ ] **Advanced Analytics**: Visualize academic progress over time
- [ ] **Document Upload**: Resume/transcript parsing with OCR
- [ ] **Recommendation Engine**: AI-powered course recommendations
- [ ] **Real-time Collaboration**: Share profiles with advisors
- [ ] **Mobile App**: React Native companion app

### Technical Improvements
- [ ] **PostgreSQL Migration**: Scale to 10,000+ users
- [ ] **Redis Caching**: Speed up frequent queries
- [ ] **GraphQL API**: More flexible data fetching
- [ ] **WebSocket Support**: Real-time updates
- [ ] **Microservices**: Separate AI service
- [ ] **Kubernetes Deployment**: Production-grade orchestration

---




## 📚 Resources

### Documentation
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [LangChain Docs](https://python.langchain.com/)
- [Google Gemini API](https://ai.google.dev/)

### Tutorials
- [Building REST APIs with FastAPI](https://realpython.com/fastapi-python-web-apis/)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [LangChain SQL Agent Tutorial](https://python.langchain.com/docs/use_cases/sql)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ and ☕ by Anant

</div>
