# Flowdesk - Multi-Tenant AI Support SaaS

Flowdesk is a universal, multi-tenant AI-powered customer support platform. It allows any organization to onboard, upload their specific policy documents, and instantly deploy an autonomous AI agent to handle their customer queries.

## 🚀 Key Features

- **Multi-Tenant Architecture**: Isolate data (tickets, customers, policies) between different organizations.
- **Organization-Specific RAG**: AI agents only use the specific policy documents uploaded by their respective company.
- **Dynamic Escalation Rules**: Configure `max_reply_count` and `sentiment_threshold` per organization.
- **Advanced Sentiment Analysis**: Real-time monitoring of customer frustration for immediate human intervention.
- **Modular Design**: Clean separation of concerns across `ai`, `org`, `ticket`, and `email` modules.

## 📂 Project Structure

```text
├── ai/                 # RAG logic and AI service
├── org/                # Organization management and routes
├── ticket/             # Ticket processing and routing
├── email/              # Email integration service
├── core/               # App configuration and WebSocket manager
├── db/                 # Database models and session management
├── data/policies/      # Directory for organization policy documents
├── static/             # Frontend assets (CSS, JS)
├── templates/          # Jinja2 HTML templates
└── main.py             # Application entry point
```

## 🛠️ How to Set Up and Run

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up Environment Variables**:
   Copy `.env.example` to `.env` and add your `GROQ_API_KEY`.
   ```bash
   cp .env.example .env
   ```

3. **Initialize the Database**:
   This will create the database schema and populate it with a default test organization (`Apple Inc.`).
   ```bash
   python init_db.py
   ```

4. **Start the Application**:
   ```bash
   uvicorn main:app --reload
   ```

## 🖥️ Usage & Demo Flow

### 1. Registering an Organization
You can register a new company via the API:
`POST /api/orgs/` with `{ "name": "Company Name", "domain": "company.com" }`

### 2. Uploading Policies
Upload policy `.txt` files for a specific organization:
`POST /api/orgs/{org_id}/policies` (Select a file to upload)

### 3. Customer Interaction (Public Form)
Navigate to: `http://localhost:8000/?org_id=1`
Submit a ticket to see the AI agent in action using Org 1's specific policies.

### 4. Agent Dashboard
Navigate to: `http://localhost:8000/dashboard?org_id=1`
Monitor tickets, view AI-generated summaries for escalated cases, and take over conversations.

### 5. Live Analytics
Navigate to: `http://localhost:8000/analytics?org_id=1`
View real-time ticket distribution, volume, and customer sentiment metrics.

---

## 🎯 Interview Pitch

*"I transformed Flowdesk into a full-scale SaaS platform. It's built with a multi-tenant architecture where every organization has its own isolated data and custom-trained AI agent. I implemented a modular backend using FastAPI and LangChain, featuring a dynamic RAG system that loads company policies on-the-fly. The system autonomously handles support queries but uses real-time sentiment analysis and keyword detection to escalate complex issues to human agents, ensuring high-quality support at scale."*
