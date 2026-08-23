# 📡 Flowdesk — Complete API Breakdown

> All routes are registered in [`index.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/index.ts) and handled by controllers in `backend/src/controllers/`.
> Base URL: `http://localhost:5001`

---

## 🔐 AUTHENTICATION
> File: [`routes/company-new.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/company-new.ts) → [`controllers/companyController.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/controllers/companyController.ts)
> Mounted at: `/api/companies`

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `POST` | `/api/companies/register` | **Register Company** | Creates a brand new company (tenant) account. Hashes the password, checks for duplicate email/domain, saves company to DB, and returns a JWT token. This is the **onboarding entry point** — without this, no company exists in the system. |
| `POST` | `/api/companies/login` | **Login Company** | Verifies email + password, returns a **JWT token** valid for 7 days. Every subsequent API call needs this token in the `Authorization` header. This is the **authentication gate** for all protected routes. |

---

## 🏢 COMPANY PROFILE
> File: [`routes/company-new.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/company-new.ts) → [`controllers/companyController.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/controllers/companyController.ts)
> All require `Authorization: Bearer <token>`

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `GET` | `/api/companies/me` | **Get My Profile** | Called when the **company dashboard loads**. Returns everything about the logged-in company: profile info, API config (swagger, endpoints, auth), all KB documents, and all inquiries with their chat messages. This is the **single big load call** for the dashboard. |
| `GET` | `/api/companies/:companyId` | **Get Company Details (Public)** | A **public endpoint** (no auth needed). The customer-facing chat widget calls this using the companyId in the URL to fetch public info like company name, support email, category. Used to **initialize the chat widget** on a customer's page. |
| `PUT` | `/api/companies/profile` | **Update Company Profile** | Called from settings page when admin changes **company name, support email, or industry category**. Saves those changes to the DB. |
| `PUT` | `/api/companies/config` | **Update API Configuration** | Called when admin connects their **backend API stack** to Flowdesk — sets `apiBaseUrl`, `apiAuthType`, `apiAuthToken`, custom headers, and data mappings. This lets Flowdesk's AI know how to call the company's own APIs to answer customer questions. |

---

## 📄 DOCUMENTS (Knowledge Base)
> File: [`routes/company-new.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/company-new.ts) → [`controllers/companyController.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/controllers/companyController.ts)
> All require `Authorization: Bearer <token>`

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `GET` | `/api/companies/documents` | **Get All Documents** | Lists all uploaded KB (Knowledge Base) documents for the company with pagination. Called when the admin opens the **Documents section** to see what's been uploaded. |
| `GET` | `/api/companies/documents/:documentId` | **Get Document By ID** | Fetches a specific document's full content. Called when admin wants to **preview a single document** in detail. |
| `POST` | `/api/companies/upload` | **Upload Document** | Accepts file upload (PDF, DOCX, TXT, MD), **extracts text content**, saves it to DB. This is how a company feeds its policies, FAQs, or product manuals into Flowdesk's AI so it can answer customer questions using RAG (Retrieval-Augmented Generation). |
| `DELETE` | `/api/companies/documents/:documentId` | **Delete Document** | Removes a KB document from DB and disk. Called when admin wants to **remove outdated or wrong documents** from the AI's knowledge base. |

> **Note:** There's also a legacy `POST /api/companies/upload-kb` in [`routes/company.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/company.ts) which does the same thing but also rebuilds the in-memory vector store. The new route goes through `companyController`.

---

## 💬 CHAT & CONVERSATIONS
> File: [`routes/chat-new.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/chat-new.ts) → [`controllers/chatController.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/controllers/chatController.ts)
> Mounted at: `/api`
> All require `Authorization: Bearer <token>`

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `POST` | `/api/chat` | **Process Customer Chat** | The **core AI endpoint**. Called every time a customer sends a message. It: (1) finds the company, (2) calls `chatService.processChat()` which runs the AI pipeline (RAG + LLM), (3) classifies the message, (4) saves the conversation, (5) returns the AI response. This is the **heart of Flowdesk**. |
| `GET` | `/api/chat/history` | **Get Chat History** | Fetches the last 50 messages for a specific customer email. Called when admin opens a **customer's conversation history** in the dashboard, or when the chat widget needs to show previous messages. |

---

## 🎫 INQUIRIES & TICKETS
> File: [`routes/inquiries.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/inquiries.ts) → [`controllers/inquiryController.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/controllers/inquiryController.ts)
> Mounted at: `/api/inquiries`
> All require `Authorization: Bearer <token>`

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `GET` | `/api/inquiries` | **Get All Inquiries** | Loads the **full ticket list** for the company's inbox. Supports `?status=open/in_progress/resolved/closed` filter and pagination. Called every time the admin opens the **Tickets/Inbox page**. |
| `GET` | `/api/inquiries/:inquiryId` | **Get Inquiry By ID** | Fetches one specific inquiry with its **full message thread** (all messages ordered chronologically). Called when admin **clicks on a ticket** to view the full conversation. |
| `GET` | `/api/inquiries/customer` | **Get Customer Inquiries** | Fetches all inquiries from a **specific customer email** (`?customerEmail=...`). Called when the admin searches for a customer's history or when the chat widget loads a returning customer's prior tickets. |
| `PUT` | `/api/inquiries/:inquiryId/status` | **Update Inquiry Status** | Changes a ticket's status to `open`, `in_progress`, `resolved`, or `closed`. Called when a support agent manually **updates ticket progress** from the dashboard. |

> **Also in legacy [`routes/company.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/company.ts):**
> - `PATCH /api/companies/inquiries/:id/resolve` — marks ticket as `resolved_human` and adds a system message
> - `PATCH /api/companies/inquiries/:id/assign` — assigns ticket to a named executive, sets status to `escalated`

---

## 📊 DASHBOARD & ANALYTICS
> File: [`routes/inquiries.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/inquiries.ts) → [`controllers/inquiryController.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/controllers/inquiryController.ts)
> Mounted at: `/api/inquiries`
> Requires `Authorization: Bearer <token>`

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `GET` | `/api/inquiries/dashboard` | **Get Company Dashboard** | The **analytics endpoint** for the home dashboard. Returns: company info, total chats count, total documents count, last 5 recent chats, ticket status breakdown (open/closed/etc.), and category distribution of messages. Called when admin **opens the dashboard/analytics page**. |

---

## 🛡️ ADMIN APIs
> File: [`routes/admin.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/admin.ts) → [`controllers/adminController.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/controllers/adminController.ts)
> Mounted at: `/api/admin`
> ⚠️ Currently **NO authentication** — marked with TODO in the code

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `GET` | `/api/admin/companies` | **Get All Companies** | Returns a paginated list of all companies registered on the Flowdesk platform. Called by the **super-admin panel** to see all tenants. Supports `?search=` for finding specific companies. |
| `GET` | `/api/admin/companies/:companyId` | **Get Company Admin Details** | Returns a single company's full details including their KB documents and all inquiries. Called when super-admin **drills into a specific company's details**. |
| `GET` | `/api/admin/companies/:companyId/stats` | **Get Company Statistics** | Returns analytics for one company: total docs, total chats, unique customer count, and chat breakdown by category. Called for **per-company reporting** in admin panel. |
| `GET` | `/api/admin/stats` | **Get Platform Statistics** | Returns platform-wide stats: total companies, total chats across all tenants, total documents, and companies grouped by industry category. Called for the **Flowdesk super-admin overview dashboard**. |
| `DELETE` | `/api/admin/companies/:companyId` | **Delete Company** | **Permanently deletes** a company and ALL its associated data (documents, chat messages, inquiries). Called when offboarding a tenant or removing a test account. **Irreversible.** |

---

## 🩺 UTILITY
> File: [`index.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/index.ts)
> No auth required

| Method | Full URL | Name | Why It's Called |
|--------|----------|------|-----------------|
| `GET` | `/health` | **Health Check** | Returns `{ status: 'ok', version: '2.0.0' }`. Called by **deployment platforms** (Railway, Render, Docker) to verify the server is alive. Also used for uptime monitoring. |

---

## 🗺️ How All Routes Are Wired Together

```
index.ts
├── /api/companies     → routes/company-new.ts  → controllers/companyController.ts
├── /api               → routes/chat-new.ts     → controllers/chatController.ts
├── /api/admin         → routes/admin.ts        → controllers/adminController.ts
├── /api/inquiries     → routes/inquiries.ts    → controllers/inquiryController.ts
├── /api/swagger       → routes/swagger.ts      (Swagger UI)
├── /api/mock-company  → routes/mock-company.ts (Test data)
└── /health            → inline handler
```

---

## ⚠️ Legacy vs Active Routes

| File | Status | Notes |
|------|--------|-------|
| [`routes/company-new.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/company-new.ts) | ✅ **ACTIVE** | Currently used in `index.ts` |
| [`routes/chat-new.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/chat-new.ts) | ✅ **ACTIVE** | Currently used in `index.ts` |
| [`routes/company.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/company.ts) | ⚠️ **LEGACY** | Not imported in `index.ts` — old monolithic file with all logic inline (no controllers). Has extra endpoints: `upload-kb`, `kb-documents/:id`, `inquiries/:id/resolve`, `inquiries/:id/assign` that **don't exist** in the new routes. |
| [`routes/chat.ts`](file:///Users/girishkumarsamal/Downloads/Flowdesk/backend/src/routes/chat.ts) | ⚠️ **LEGACY** | Not imported in `index.ts` |
