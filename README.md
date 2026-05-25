<![CDATA[<div align="center">

# 🚀 FlowDesk

### AI-Powered Multi-Tenant Customer Support Platform

**Automating Customer Support from Query to Resolution**

[![Built With](https://img.shields.io/badge/Frontend-Next.js_16-black?logo=nextdotjs)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Express_5-green?logo=express)](https://expressjs.com/)
[![AI](https://img.shields.io/badge/AI-LangChain_+_Groq/OpenAI-blue?logo=openai)](https://langchain.com/)
[![Database](https://img.shields.io/badge/DB-Prisma_+_SQLite-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

*FlowDesk turns **any SaaS, hosting, cloud, fintech, or e-commerce business** into a self-service AI support center. Companies plug in their policies, APIs, and branding — and the AI handles tickets 24/7, escalating only when human expertise is truly needed.*

</div>

---

## 📑 Table of Contents

- [Why FlowDesk?](#-why-flowdesk)
- [Platform Features](#-platform-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [User Workflow — Step by Step](#-user-workflow--step-by-step)
- [AI Orchestration Pipeline](#-ai-orchestration-pipeline)
- [Dashboards](#-dashboards)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎉 Why FlowDesk?

| Problem | FlowDesk Solution |
|---------|-------------------|
| Support teams can't scale 24/7 | AI agent handles queries autonomously around the clock |
| Generic chatbots give irrelevant answers | RAG-based responses using **your actual policy documents** |
| No real-time customer data during chats | Live API calls fetch billing, usage, orders during conversation |
| Angry customers get stuck in loops | Sentiment analysis + confidence scoring auto-escalate to humans |
| Multi-company SaaS needs isolated data | Full multi-tenant architecture with per-company data isolation |
| No visibility into AI decision-making | Complete observability panel showing every AI reasoning step |

---

## ✨ Platform Features

### 🏢 Multi-Tenant Architecture
- **Complete data isolation** — each company gets its own sandboxed data, vector store, and API credentials
- **Self-service onboarding** — companies register, upload policies, configure APIs via a guided wizard
- **Domain-level validation** — prevents duplicate registrations per domain

### 🧠 AI-Powered Resolution Engine
- **5-stage orchestration pipeline** — Customer Validation → Issue Classification → Policy Retrieval (RAG) → Live API Calls → Resolution Generation
- **Dual AI provider support** — OpenAI GPT-4o (primary) or Groq Llama-3.3-70b (fallback)
- **13 issue categories** — bandwidth, billing, refunds, upgrades, login, API quota, orders, and more
- **Confidence scoring** — every response scored 0.0–1.0 based on data availability

### 📄 Organization-Specific RAG (Retrieval-Augmented Generation)
- **Upload policy documents** — supports PDF, DOCX, TXT, and Markdown files
- **Per-tenant vector stores** — AI only uses the specific company's uploaded documents
- **Automatic chunking** — documents split into searchable paragraphs for precise retrieval
- **Live rebuild** — vector stores refresh instantly when documents are added or removed

### 🔗 Live API Integration
- **Swagger/OpenAPI import** — paste your API spec and FlowDesk auto-discovers endpoints
- **Business concept mapping** — map concepts like "Bandwidth Usage" → `/api/user/usage`
- **Real-time data fetching** — AI pulls live billing, order, usage data during conversations
- **Auth support** — Bearer tokens, API keys, and custom headers

### 🚨 Smart Escalation System
- **Multi-signal escalation** — triggers on low confidence, negative sentiment, high turn count, or API failures
- **Configurable thresholds** — customize `ESCALATION_REPLY_THRESHOLD` per deployment
- **Seamless handoff** — escalated tickets appear instantly in the Executive Dashboard
- **Human reply system** — executives can respond directly within the platform

### 📊 Analytics & Observability
- **Real-time ticket metrics** — total tickets, pending, AI resolution rate, escalation rate
- **AI reasoning traces** — see every step: classification, retrieved chunks, API calls, confidence scores
- **API call logs** — full request/response audit trail for every external API interaction

### 🔌 Embeddable Widget
- **Plug-and-play widget** — embed AI support on any website via a single `<iframe>` tag
- **Company-specific routing** — widget auto-routes queries to the correct tenant's AI agent
- **Copy-paste deployment** — embed code generated in the dashboard settings

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 16)                    │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Landing  │ │   Auth    │ │  Onboarding  │ │   Widget     │  │
│  │  Page    │ │  Login/   │ │   Wizard     │ │  (Embed)     │  │
│  │          │ │  Register │ │              │ │              │  │
│  └──────────┘ └───────────┘ └──────────────┘ └──────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Dashboard Suite                       │   │
│  │  ┌─────────────┐ ┌───────────────┐ ┌─────────────────┐  │   │
│  │  │   Admin     │ │  Executive    │ │  Observability  │  │   │
│  │  │  Overview   │ │  Ticket Queue │ │   AI Traces     │  │   │
│  │  └─────────────┘ └───────────────┘ └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                     BACKEND (Express 5 + TypeScript)             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              AI Orchestration Pipeline                   │    │
│  │  Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5       │    │
│  │  Validate   Classify   RAG       API Call   Resolution  │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌──────────┐ ┌───────────────┐ ┌───────────┐ ┌────────────┐   │
│  │  Auth    │ │ Company CRUD  │ │  KB Docs  │ │  Chat API  │   │
│  │  JWT     │ │ Config/Setup  │ │  Upload   │ │  Pipeline  │   │
│  └──────────┘ └───────────────┘ └───────────┘ └────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Prisma ORM  →  SQLite (dev) / PostgreSQL (production)  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
            │                                 │
   ┌────────▼────────┐              ┌─────────▼─────────┐
   │   Groq / OpenAI │              │  Company's Own     │
   │   LLM Provider  │              │  REST APIs         │
   └─────────────────┘              └───────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript | SSR + Client-side dashboards |
| **Styling** | Tailwind CSS 4, Custom glassmorphic design | Premium dark-mode UI |
| **Backend** | Express 5, TypeScript, Node.js | REST API server |
| **AI/LLM** | LangChain, Groq (Llama-3.3-70b), OpenAI (GPT-4o) | Issue classification, RAG, resolution |
| **Database** | Prisma ORM, SQLite (dev), PostgreSQL (prod) | Multi-tenant data storage |
| **Auth** | JWT, bcrypt | Secure company authentication |
| **File Processing** | pdf-parse, mammoth | PDF & DOCX text extraction |
| **API Spec** | js-yaml | Swagger/OpenAPI parsing |
| **Containerization** | Docker Compose | PostgreSQL + Redis for production |

---

## 👤 User Workflow — Step by Step

### For Companies (Admins)

```
Step 1 ─── REGISTER
│   Visit the landing page → Click "Get Started"
│   Enter company name, email, password, category (SaaS/Hosting/Fintech/E-commerce)
│   System validates domain uniqueness and creates isolated tenant
│
Step 2 ─── ONBOARD (Guided Wizard)
│   ┌── Upload Policy Documents (PDF, DOCX, TXT, MD)
│   │   → Documents are parsed, chunked, and indexed into a per-company vector store
│   │
│   ├── Configure API Integration
│   │   → Set base URL, auth type (Bearer/API Key/Custom Headers)
│   │   → Import Swagger/OpenAPI spec for auto-discovery
│   │
│   └── Map Business Concepts
│       → Link concepts (e.g., "Bandwidth Usage") to API endpoints (e.g., /api/usage)
│       → AI uses these mappings to fetch live data during conversations
│
Step 3 ─── DEPLOY WIDGET
│   Go to Dashboard → Settings → Copy the widget embed code
│   Paste the <iframe> snippet into your website's HTML
│   Your customers can now interact with the AI agent directly
│
Step 4 ─── MONITOR & MANAGE
    ┌── Admin Dashboard: View ticket volumes, resolution rates, escalation metrics
    ├── Executive Dashboard: Handle escalated tickets, reply to customers manually
    └── Observability Panel: Inspect AI reasoning traces, API call logs, confidence scores
```

### For End Customers

```
Step 1 ─── SUBMIT QUERY
│   Open the embedded widget or direct URL
│   Enter email, subject, and describe the issue
│
Step 2 ─── AI PROCESSES (Behind the Scenes)
│   ┌── Stage 1: Customer is validated against company's API
│   ├── Stage 2: Issue is classified into one of 13 categories
│   ├── Stage 3: Relevant policy documents are retrieved via RAG
│   ├── Stage 4: Live API calls fetch real-time data (billing, usage, orders)
│   └── Stage 5: AI generates a contextual response with suggested actions
│
Step 3 ─── RECEIVE RESPONSE
│   If confidence is HIGH (≥ 0.6): Issue resolved by AI ✅
│   If confidence is LOW or sentiment is negative: Auto-escalated to human 🚨
│
Step 4 ─── CONTINUE CONVERSATION
    Multi-turn conversation support
    Each follow-up message goes through the full AI pipeline
    Escalation triggers at any point if needed
```

---

## 🤖 AI Orchestration Pipeline

Every customer message goes through a **5-stage pipeline**:

```
Customer Message
       │
       ▼
┌──────────────────────────────────────┐
│  STAGE 1: Customer Validation        │
│  Verify customer via company's API   │
│  (optional — skipped if no API)      │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  STAGE 2: Issue Classification       │
│  13 categories with confidence score │
│  (bandwidth, billing, refund, etc.)  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  STAGE 3: Policy Retrieval (RAG)     │
│  Similarity search on company's      │
│  uploaded policy documents           │
│  Returns top-3 relevant chunks       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  STAGE 4: Live API Decision Engine   │
│  Maps classification → API endpoints │
│  Fetches real-time data with auth    │
│  Logs every call for observability   │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  ESCALATION CHECK                    │
│  confidence < 0.3? → Escalate        │
│  turns >= threshold? → Escalate      │
│  negative sentiment? → Escalate      │
│  no API + low confidence? → Escalate │
└──────────────┬───────────────────────┘
               │
          ┌────┴────┐
     Escalated   Continue
          │         │
          ▼         ▼
   Notify human  ┌────────────────────────────┐
   executive     │ STAGE 5: Resolution Engine │
                 │ Combine: classification +   │
                 │ policy chunks + API data +   │
                 │ customer profile             │
                 │ → Generate contextual reply  │
                 │ → Suggest actions (upgrade,  │
                 │   reset, retry payment)      │
                 └─────────────────────────────┘
```

---

## 📊 Dashboards

### 1. Admin Dashboard (`/dashboard`)
| Section | What You See |
|---------|-------------|
| **Overview** | 📈 Total tickets, pending count, AI resolution rate, escalation rate |
| **Tickets** | 🎫 Full ticket list with status filters (Pending / Escalated / Resolved AI / Resolved Human) |
| **Settings** | ⚙️ Company info, API integration details, widget embed code |
| **Sidebar** | 📄 Knowledge base documents, quick actions, widget preview link |

### 2. Executive Dashboard (`/dashboard/executive`)
| Feature | Description |
|---------|-------------|
| **Live Queue** | Real-time list of escalated tickets requiring human attention |
| **Conversation Timeline** | Full message history (customer ↔ AI ↔ human) |
| **Manual Reply Editor** | Executives can respond directly to escalated tickets |
| **Ticket Assignment** | Assign tickets to specific support executives |

### 3. Observability Panel (`/dashboard/observability`)
| Feature | Description |
|---------|-------------|
| **AI Reasoning Trace** | Step-by-step breakdown of how the AI reached its decision |
| **Retrieved Policy Chunks** | Exact text snippets the RAG system pulled from documents |
| **API Call Logs** | Full request/response details for every external API call |
| **Confidence Scoring** | Visual indicator of AI certainty per response |

### 4. Knowledge Base Manager (`/dashboard/knowledge-base`)
| Feature | Description |
|---------|-------------|
| **Document List** | All uploaded policy files with type and timestamp |
| **Upload** | Drag-and-drop PDF, DOCX, TXT, or Markdown files |
| **Delete** | Remove documents (vector store rebuilds automatically) |

---

## 📁 Project Structure

```
Flowdesk/
├── frontend/                          # Next.js 16 Frontend
│   └── src/
│       ├── app/
│       │   ├── page.tsx               # Landing page with hero, features, workflow
│       │   ├── layout.tsx             # Root layout with metadata
│       │   ├── globals.css            # Glassmorphic design system
│       │   ├── company/
│       │   │   ├── auth/              # Login & Registration pages
│       │   │   └── onboarding/        # Multi-step onboarding wizard
│       │   ├── dashboard/
│       │   │   ├── page.tsx           # Admin dashboard (overview, tickets, settings)
│       │   │   ├── executive/         # Executive ticket queue
│       │   │   ├── observability/     # AI reasoning trace viewer
│       │   │   └── knowledge-base/    # KB document management
│       │   └── widget/
│       │       └── [companyId]/       # Embeddable chat widget per company
│       └── components/
│           ├── Navbar.tsx             # Global navigation
│           └── CursorGlow.tsx         # Mouse-follow glow effect
│
├── backend/                           # Express 5 Backend
│   └── src/
│       ├── index.ts                   # Server entry point (port 5001)
│       ├── routes/
│       │   ├── company.ts             # Auth, onboarding, KB upload, config
│       │   ├── chat.ts                # AI orchestration pipeline
│       │   ├── swagger.ts             # OpenAPI/Swagger spec parsing
│       │   └── mock-company.ts        # Mock API for demo/testing
│       └── prisma/
│           ├── schema.prisma          # Database schema (6 models)
│           └── migrations/            # Prisma migration history
│
├── legacy_python/                     # Legacy FastAPI implementation (reference)
│   ├── main.py                        # FastAPI entry point
│   ├── ai/                            # Original RAG logic
│   ├── org/                           # Organization management
│   ├── ticket/                        # Ticket processing
│   ├── services/                      # Business logic
│   ├── templates/                     # Jinja2 HTML templates
│   └── requirements.txt              # Python dependencies
│
├── docker-compose.yml                 # PostgreSQL + Redis containers
├── Procfile                           # Heroku/Railway deployment
├── package.json                       # Root monorepo scripts
├── .env.example                       # Environment variable template
└── .gitignore                         # Ignored files
```

---

## ⚙️ Setup & Installation

### Prerequisites
- **Node.js** ≥ 18
- **pnpm** (recommended) or npm
- **AI API Key** — either [Groq](https://console.groq.com/) (free) or [OpenAI](https://platform.openai.com/)

### Quick Start

```bash
# 1️⃣ Clone the repository
git clone https://github.com/Girishkumarsamal08/Flowdesk.git
cd Flowdesk

# 2️⃣ Install all dependencies (frontend + backend)
pnpm install

# 3️⃣ Set up environment variables
cp .env.example .env
# Edit .env → add your GROQ_API_KEY or OPENAI_API_KEY

# 4️⃣ Initialize the database
cd backend
npx prisma migrate dev --name init
cd ..

# 5️⃣ Start development servers (two terminals)
# Terminal 1 — Backend (http://localhost:5001)
pnpm run dev:backend

# Terminal 2 — Frontend (http://localhost:3000)
pnpm run dev:frontend
```

### First Run Walkthrough

1. Open **http://localhost:3000**
2. Click **"Get Started"** → Register your company
3. Complete the **Onboarding Wizard**:
   - Upload a policy document (e.g., the included `Flowdesk_Demo_Policy.docx`)
   - (Optional) Configure API integration with your Swagger spec
   - Map business concepts to API endpoints
4. Go to **Dashboard** → Copy the widget embed code or click **"Launch Preview"**
5. Try a customer query: *"My bandwidth is throttled"* or *"I need a refund"*
6. Check the **Observability Panel** to see the AI's reasoning trace

---

## 🔐 Environment Variables

Create a `.env` file in the **root** and/or **backend/** directory:

```env
# AI Provider (at least one required)
GROQ_API_KEY=your_groq_api_key_here        # Free at console.groq.com
OPENAI_API_KEY=your_openai_api_key_here     # Optional, takes priority if set

# Escalation Config
ESCALATION_REPLY_THRESHOLD=5               # Max AI turns before escalation

# Auth
JWT_SECRET=your_jwt_secret_here             # Used for company authentication

# Database (production only — dev uses SQLite automatically)
DATABASE_URL=postgresql://user:pass@host:5432/flowdesk
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/companies/register` | Register a new company (tenant) |
| `POST` | `/api/companies/login` | Login and get JWT token |

### Company Management (🔒 Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/companies/me` | Get company profile + dashboard data |
| `PUT` | `/api/companies/config` | Update API integration & concept mappings |
| `POST` | `/api/companies/upload-kb` | Upload policy document (PDF/DOCX/TXT/MD) |
| `DELETE` | `/api/companies/kb-documents/:id` | Delete a KB document |

### Ticket Management (🔒 Requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `PATCH` | `/api/companies/inquiries/:id/resolve` | Resolve inquiry manually |
| `PATCH` | `/api/companies/inquiries/:id/assign` | Assign ticket to executive |

### AI Chat (Public — uses companyId)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Submit customer message → AI pipeline |
| `GET` | `/api/inquiries/:id/reasoning` | Get AI reasoning logs for inquiry |
| `POST` | `/api/executive/reply` | Executive sends manual reply |

### Swagger
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/swagger/parse` | Parse Swagger/OpenAPI JSON or YAML |

---

## 🗄 Database Schema

FlowDesk uses **6 models** with full relational integrity:

```
Company (Tenant)
├── id, email, passwordHash, companyName, category
├── apiBaseUrl, apiAuthType, apiAuthToken, apiHeaders
├── swaggerSchema, parsedEndpoints, dataMappings
├── ──→ KBDocument[] (policy files)
├── ──→ Inquiry[] (support tickets)
└── ──→ APICallLog[] (audit trail)

KBDocument (Policy Files)
├── id, companyId, fileName, content, fileType

Inquiry (Support Ticket)
├── id, companyId, email, subject
├── status (pending | resolved_ai | resolved_human | escalated)
├── priority, sentiment, confidence, assignedTo
├── ──→ Message[] (conversation thread)
├── ──→ APICallLog[] (related API calls)
└── ──→ AIReasoningLog[] (AI traces)

Message (Conversation)
├── id, inquiryId, sender (customer | ai | human), content

APICallLog (API Audit)
├── id, companyId, inquiryId, endpoint, method
├── requestBody, responseBody, statusCode

AIReasoningLog (Observability)
├── id, inquiryId, retrievedChunks, confidenceScore
├── classification, decisionReason, apiCallTrace
```

---

## 🚀 Deployment

### Docker (Recommended for Production)

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Update backend/.env with PostgreSQL connection string
DATABASE_URL=postgresql://flowdesk_master:fd_admin_secret_99@localhost:5432/flowdesk_prod

# Build and start
pnpm build
pnpm run start:backend &
pnpm run start:frontend
```

### Heroku / Railway

```bash
# Procfile is already configured
git push heroku main
```

---

## 🗺 Roadmap

- [x] Multi-tenant architecture with data isolation
- [x] 5-stage AI orchestration pipeline
- [x] RAG with per-company vector stores
- [x] Live API integration with Swagger import
- [x] Smart escalation (confidence + sentiment + turn count)
- [x] Admin, Executive, and Observability dashboards
- [x] Embeddable chat widget
- [x] PDF, DOCX, TXT, Markdown document support
- [x] Glassmorphic premium UI with dark mode
- [ ] WebSocket real-time updates
- [ ] Email notification integration
- [ ] Kafka message queue for high-scale
- [ ] Multi-language support (i18n)
- [ ] Customer satisfaction (CSAT) surveys
- [ ] Role-based access control (RBAC) per company
- [ ] Analytics export (CSV/PDF reports)

---

## 🎯 Project Pitch

> *"I built FlowDesk as a full-scale AI-powered SaaS platform for customer support. It features a multi-tenant architecture where every company gets isolated data and a custom-trained AI agent. The backend runs a 5-stage AI orchestration pipeline using LangChain — from issue classification to live API data fetching to contextual resolution generation. The system autonomously handles support queries using RAG on company-specific policy documents, but uses real-time sentiment analysis, confidence scoring, and configurable thresholds to intelligently escalate complex cases to human agents. The platform includes three role-based dashboards: Admin analytics, Executive ticket management, and a full AI Observability panel that traces every decision the AI makes."*

---

## 📜 License

MIT © 2026 FlowDesk Team — feel free to fork, extend, and ship to your customers!

---

<div align="center">

**⭐ Star this repo if FlowDesk helped you!**

[Report Bug](https://github.com/Girishkumarsamal08/Flowdesk/issues) · [Request Feature](https://github.com/Girishkumarsamal08/Flowdesk/issues) · [Contribute](https://github.com/Girishkumarsamal08/Flowdesk/pulls)

</div>
]]>
