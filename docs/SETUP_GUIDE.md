# FFP Stock AI Frontend - Setup Guide

## Overview

The frontend is a Next.js application that needs to connect to:
1. **Supabase** (Authentication & Database) running on port **54321** (local development)
2. **Backend API** (FastAPI) running on port **8000** (stock_api container)

Both services run in Docker containers on separate networks that need to communicate with each other.

---

## Architecture

```
┌─────────────────────────────────────┐
│ Frontend (Next.js)                  │
│ - Port: 3075                        │
│ - Network: supabase_network_supabase-ffp │
└──────────────┬──────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────────┐    ┌──────────────┐
│ Supabase    │    │ FastAPI      │
│ Port: 54321 │    │ Port: 8000   │
└─────────────┘    └──────────────┘
```

---

## Prerequisites

- Docker & Docker Compose installed
- Both backend and frontend folders available
- Environment variables properly configured

---

## Step 1: Set Up Supabase (Backend Infrastructure)

### 1.1 Navigate to Supabase Project

```bash
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
```

### 1.2 Start Supabase Locally

```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- Supabase API (port 54321)
- Kong (API Gateway - port 8000)

### 1.3 Verify Supabase is Running

```bash
docker-compose ps
```

You should see containers like:
- `supabase_db_supabase-ffp` (PostgreSQL)
- `supabase_kong_supabase-ffp` (API Gateway)
- `supabase_auth_supabase-ffp` (Auth)

### 1.4 Get Supabase Credentials

Once Supabase is running, you can find credentials:

```bash
# Get the anonymous key
docker-compose logs supabase_kong_supabase-ffp | grep "anon"

# Or check the Supabase dashboard typically at:
# http://localhost:54321 (or via their local dashboard)
```

---

## Step 2: Set Up Backend Services

### 2.1 Navigate to Backend

```bash
cd /home/ert/projects/trading/FFP_stock_ai
```

### 2.2 Create `.env` file

Copy and configure environment variables:

```bash
cp .env.example .env
```

**Key variables to set:**

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=postgres

# Supabase URLs (local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_KEY=your-service-key-here

# API Keys (get from Supabase after setup)
ALPACA_API_KEY=your-alpaca-key
ALPACA_API_SECRET=your-alpaca-secret
FINNHUB_API_KEY=your-finnhub-key

# LLM Configuration
OLLAMA_HOST=https://ollama.timcarrender.me
OLLAMA_MODEL=llama3.2

# Optional: External Services
TAVILY_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
GROK_API_KEY=
```

### 2.3 Start Backend Services

```bash
docker-compose up -d
```

This starts all services including the FastAPI backend on port 8000.

### 2.4 Verify Backend is Running

```bash
# Check if API is healthy
curl http://localhost:8000/health

# View logs
docker-compose logs -f api
```

---

## Step 3: Configure Frontend Environment

### 3.1 Navigate to Frontend

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
```

### 3.2 Create `.env.local` File

The frontend needs to know where to find Supabase and the Backend API.

**For Docker environment**, create `.env.local`:

```env
# Supabase Configuration (from inside Docker container)
# Use host.docker.internal to reach host services
NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase

# Backend API (from inside Docker container)
NEXT_PUBLIC_API_URL=http://host.docker.internal:8000

# Server-side Supabase credentials (for server components)
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Node Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 3.3 Install Dependencies

```bash
npm install
```

---

## Step 4: Build & Run Frontend in Docker

### 4.1 Build Docker Image

```bash
docker build -t ffp-stock-ai-frontend:latest \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321 \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg NEXT_PUBLIC_API_URL=http://host.docker.internal:8000 \
  --build-arg SUPABASE_URL=http://host.docker.internal:54321 \
  .
```

### 4.2 Run Frontend Container

```bash
docker run -d \
  --name ffp-frontend \
  -p 3075:3075 \
  --network supabase_network_supabase-ffp \
  --add-host host.docker.internal:host-gateway \
  -e NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321 \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8000 \
  ffp-stock-ai-frontend:latest
```

### 4.3 Using docker-compose (Recommended)

Update the `docker-compose.yml` in the frontend directory, then:

```bash
docker-compose up -d
```

---

## Step 5: Fix the Connection Error

The error `ECONNREFUSED 127.0.0.1:54321` means:
- The frontend is trying to connect to `127.0.0.1:54321`
- But that address doesn't exist in the Docker network

**Solution:**

1. **For frontend running in Docker**: Change to `http://host.docker.internal:54321`
2. **For frontend running locally**: Change to `http://localhost:54321`

### Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321
```

---

## Troubleshooting

### Issue 1: `ECONNREFUSED 127.0.0.1:54321`

**Solution:**
```bash
# Check if Supabase is running
docker-compose -f /home/ert/projects/trading/FFP_stock_ai/supabase-ffp/docker-compose.yml ps

# Restart Supabase
docker-compose -f /home/ert/projects/trading/FFP_stock_ai/supabase-ffp/docker-compose.yml restart
```

### Issue 2: Frontend can't reach Backend API

**Solution:**
```bash
# Verify backend is running
curl http://localhost:8000/health

# Check network connection
docker exec ffp-stock-ai-front-v2-frontend-1 ping host.docker.internal
```

### Issue 3: Supabase Credentials Not Found

**Solution:**
```bash
# Check Supabase logs for keys
docker-compose logs supabase_kong_supabase-ffp | grep -i "anon\|service"

# Visit dashboard (once available)
# http://localhost:54321/
```

### Issue 4: Port Already in Use

```bash
# Find what's using the port
lsof -i :54321
lsof -i :8000
lsof -i :3075

# Kill process
kill -9 <PID>
```

---

## Quick Start Script

Create `setup.sh`:

```bash
#!/bin/bash

echo "Starting FFP Stock AI Setup..."

# 1. Start Supabase
echo "1️⃣ Starting Supabase..."
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose up -d
sleep 10

# 2. Start Backend Services
echo "2️⃣ Starting Backend Services..."
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d
sleep 10

# 3. Start Frontend
echo "3️⃣ Starting Frontend..."
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker-compose up -d

echo "✅ Setup complete!"
echo ""
echo "Access points:"
echo "- Frontend: http://localhost:3075"
echo "- Supabase: http://localhost:54321"
echo "- Backend API: http://localhost:8000"
```

Run it:
```bash
chmod +x setup.sh
./setup.sh
```

---

## Verification Checklist

- [ ] Supabase running: `docker ps | grep supabase`
- [ ] Backend API running: `curl http://localhost:8000/health`
- [ ] Frontend running: `docker ps | grep frontend`
- [ ] Frontend can reach Supabase: `docker logs ffp-stock-ai-front-v2-frontend-1`
- [ ] No `ECONNREFUSED` errors in frontend logs

---

## Environment Variables Reference

| Variable | Location | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend .env | Browser Supabase endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend .env | Browser Auth token |
| `NEXT_PUBLIC_API_URL` | Frontend .env | Backend API endpoint |
| `SUPABASE_URL` | Frontend .env | Server-side Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Frontend .env | Server-side Auth |

---

## Next Steps

1. Get Supabase credentials from running instance
2. Add credentials to both `.env` files
3. Verify all services communicate
4. Run migrations if needed
5. Test login functionality

