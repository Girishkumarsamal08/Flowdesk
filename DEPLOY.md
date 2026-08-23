# Flowdesk — Deployment Guide

## Overview

Flowdesk is a monorepo with:
- **Backend** — Node.js/Express + Prisma + PostgreSQL (port 5001)
- **Frontend** — Next.js (port 3000)

---

## Option 1: Render (Recommended)

Render provides free-tier managed PostgreSQL and easy Node.js deployments.

### Steps

1. **Fork / push** this repo to GitHub.

2. Go to [render.com](https://render.com) → **New → Blueprint**.

3. Connect your GitHub repo — Render will detect `render.yaml` automatically.

4. Set the following **secret env vars** in the Render dashboard (they are marked `sync: false` in `render.yaml`):
   - `GROQ_API_KEY` or `OPENAI_API_KEY`
   - `ALLOWED_ORIGIN` — set to your frontend URL after the frontend is deployed

5. Click **Apply** — Render will:
   - Provision a managed PostgreSQL database
   - Build and deploy the backend
   - Run `prisma migrate deploy` on first boot

6. **Frontend**: Deploy separately to [Vercel](https://vercel.com):
   - Root directory: `frontend`
   - Set `NEXT_PUBLIC_API_URL` to your Render backend URL (e.g. `https://flowdesk-backend.onrender.com`)

---

## Option 2: Railway

1. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub**.

2. Add a **PostgreSQL** service from the Railway marketplace.

3. Set env vars:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | From Railway PostgreSQL service (auto-linked) |
   | `JWT_SECRET` | Any long random string |
   | `ADMIN_SECRET` | Any secure string |
   | `GROQ_API_KEY` | Your key |
   | `ALLOWED_ORIGIN` | Your frontend URL |

4. Railway will run `npm run build` then `npm run start` in `backend/`.

5. For the frontend, add another Railway service or deploy to Vercel.

---

## Option 3: Local Docker (Full Stack)

Run the complete stack locally using Docker Compose.

### Prerequisites
- Docker Desktop installed and running

### Steps

```bash
# 1. Clone and navigate to project
git clone <your-repo-url> flowdesk
cd flowdesk

# 2. Copy env template
cp .env.example .env
# Edit .env — set GROQ_API_KEY or OPENAI_API_KEY at minimum

# 3. Build and start all services
docker compose up --build

# 4. Access the app
# Frontend: http://localhost:3000
# Backend:  http://localhost:5001
# Health:   http://localhost:5001/health
```

### Stop everything
```bash
docker compose down          # stop containers
docker compose down -v       # stop + delete volumes (fresh DB)
```

---

## Option 4: Manual / VPS

### Backend

```bash
cd backend
cp ../.env.example ../.env   # fill in values
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start                 # runs on PORT (default 5001)
```

### Frontend

```bash
cd frontend
NEXT_PUBLIC_API_URL=https://your-backend-url npm run build
npm run start                 # runs on port 3000
```

---

## Environment Variables Reference

See [`.env.example`](./.env.example) for the full list with descriptions.

### Minimum required for production

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Random 32+ char string for JWT signing |
| `ADMIN_SECRET` | Secret for admin API routes |
| `GROQ_API_KEY` or `OPENAI_API_KEY` | AI provider key |
| `ALLOWED_ORIGIN` | Frontend URL (for CORS) |
| `NEXT_PUBLIC_API_URL` | Backend URL (used by Next.js) |

---

## Health Check

Once deployed, verify the backend is running:

```bash
curl https://your-backend-url/health
# Expected: {"status":"ok","message":"Flowdesk Backend API is running","version":"2.0.0"}
```
