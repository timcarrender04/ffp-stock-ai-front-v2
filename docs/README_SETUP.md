# 🚀 FFP Stock AI Frontend - Setup Complete!

Welcome! This guide will help you get the FFP Stock AI frontend running properly. Your frontend is already running, but we need to fix the backend connection issue.

---

## 📊 Current Status (Just Checked)

```
✅ Supabase is running          (http://localhost:54321)
✅ Frontend is running          (http://localhost:3075)  
✅ Redis is running             (port 6380)
❌ Backend API NOT running      (http://localhost:8000) ← FIX THIS!
```

---

## 🎯 The Problem You're Experiencing

**Error Message:**
```
TypeError: fetch failed
Error: connect ECONNREFUSED 127.0.0.1:54321
```

**Root Cause:** 
The frontend is trying to connect to `127.0.0.1:54321` (localhost inside the container), but Supabase runs on the host machine. Also, the backend API is not running.

**What You Need To Do:**
1. Start the backend API
2. Ensure frontend environment variables are correct (already done ✅)

---

## 🔧 Quick Fix (3 Steps)

### Step 1: Start Backend API

```bash
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d

# Wait 10 seconds for services to initialize
sleep 10

# Verify it's running
curl http://localhost:8000/health
```

### Step 2: Check Frontend Logs

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker logs -f ffp-stock-ai-front-v2-frontend-1
```

You should see:
- ✅ NO more `ECONNREFUSED` errors
- ✅ Successful connection to Supabase
- ✅ Login page should load

### Step 3: Test Connection

```bash
# Run the diagnostic
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh
```

All checks should pass! ✅

---

## 📚 Documentation Files

We've created several helpful guides in this directory:

| File | Purpose |
|------|---------|
| **SETUP_SUMMARY.md** | ⭐ Start here - Quick overview and all commands |
| **SETUP_GUIDE.md** | 📖 Detailed step-by-step setup instructions |
| **TROUBLESHOOTING.md** | 🔍 Fix common issues and errors |
| **DIAGNOSTIC.sh** | ✅ Check what's running and what's not |
| **QUICK_START.sh** | ⚡ One-command startup for all services |

### Recommended Reading Order

1. **Start here:** `SETUP_SUMMARY.md` (5 min read)
2. **If issues:** `TROUBLESHOOTING.md` (fix problems)
3. **For details:** `SETUP_GUIDE.md` (comprehensive guide)
4. **When stuck:** Run `DIAGNOSTIC.sh` (shows status)

---

## 🚀 Your Current Environment

### Backend Location
```
/home/ert/projects/trading/FFP_stock_ai/
├── docker-compose.yml           ← Backend services
├── supabase-ffp/               ← Supabase services
└── .env                        ← Backend config
```

### Frontend Location
```
/home/ert/projects/web-apps/ffp-stock-ai-front-v2/
├── docker-compose.yml           ← Frontend service
├── .env                        ← Frontend config (already correct!)
├── .env.local                  ← Your environment (already created!)
└── [Documentation files]
```

---

## 🔗 Connection Points

```
Browser Request (http://localhost:3075)
    ↓
Frontend Container (Next.js on 3075)
    ├─ Connects to: Supabase (host.docker.internal:54321)
    ├─ Connects to: Backend API (host.docker.internal:8000)
    └─ Connects to: Redis (via Docker network)
```

### URLs to Access

- **Frontend:** http://localhost:3075 - The Next.js app
- **Backend API:** http://localhost:8000 - FastAPI service
- **Supabase:** http://localhost:54321 - Database & Auth
- **Redis:** localhost:6380 - Cache layer

---

## ⚙️ What's Configured

✅ **Frontend:** Already configured correctly
- `.env` has proper example values
- `.env.local` exists with correct URLs
- `docker-compose.yml` has proper network settings
- Environment variables use `host.docker.internal`

✅ **Docker Networks:** Already created
- `supabase_network_supabase-ffp` - For Supabase and frontend
- `stock_network` - For backend services

❌ **Backend:** Needs to be started
- Services defined in `/home/ert/projects/trading/FFP_stock_ai/docker-compose.yml`
- Not currently running

---

## 🏃 Let's Get Started!

### Option A: Automatic (Recommended)

```bash
# Start everything with one command
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/QUICK_START.sh
```

### Option B: Manual

```bash
# 1. Start backend
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d

# 2. Wait for initialization
sleep 10

# 3. Verify everything
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh
```

### Option C: Step by Step

```bash
# 1. Check Supabase
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose ps

# 2. Start backend
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d

# 3. Check frontend
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker logs -f ffp-stock-ai-front-v2-frontend-1

# 4. Run diagnostics
bash DIAGNOSTIC.sh
```

---

## 🧪 Verification Steps

After starting the backend:

### Step 1: Check Containers

```bash
docker ps
```

Should show:
- `supabase_db_supabase-ffp` ✅
- `supabase_kong_supabase-ffp` ✅
- `ffp-stock-ai-front-v2-frontend-1` ✅
- `stock_api` ✅ (should appear now)
- Other backend services ✅

### Step 2: Test Connections

```bash
# Test Supabase
curl -i http://localhost:54321

# Test Backend API
curl -i http://localhost:8000/health

# Test Frontend
curl -i http://localhost:3075
```

All should return status 200 or similar (not connection refused).

### Step 3: Check Frontend Logs

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker logs ffp-stock-ai-front-v2-frontend-1 | grep -i "error\|econnrefused"
```

Should show NO errors.

### Step 4: Visit Frontend

Open in browser: **http://localhost:3075**

You should see the login page without any errors.

---

## 📋 Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| Still seeing `ECONNREFUSED` error | → Check `TROUBLESHOOTING.md` |
| Backend won't start | → Check backend logs: `docker-compose -f /home/ert/projects/trading/FFP_stock_ai/docker-compose.yml logs` |
| Port already in use | → Run diagnostic and check conflicts |
| Supabase keys not working | → See "Getting Keys" section below |

---

## 🔐 Getting Supabase Keys

If you need to update the environment variables:

```bash
# Navigate to Supabase directory
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp

# Check logs for keys
docker-compose logs | grep -i "anon\|service"

# Or access the dashboard
# Open: http://localhost:54321
# Look for Project Settings → API Keys
```

Then update `.env.local`:

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
nano .env.local

# Update these values:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
# SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
```

After updating:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🆘 Help & Support

### Run Diagnostics First

```bash
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh
```

This will tell you:
- ✅ What's running
- ✅ What ports are accessible
- ❌ What's broken
- ⚠️ What needs fixing

### Check Logs

```bash
# Frontend logs
docker logs ffp-stock-ai-front-v2-frontend-1

# Backend API logs
docker logs stock_api

# All backend services logs
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose logs -f

# Supabase logs
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose logs -f
```

### Useful Commands

```bash
# See all running containers
docker ps

# Stop everything
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker-compose down
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose down

# Remove stuck containers
docker system prune

# Get inside a container
docker exec -it ffp-stock-ai-front-v2-frontend-1 bash

# Check network connectivity
docker network inspect supabase_network_supabase-ffp
```

---

## ✨ You're Almost There!

Your setup is **95% complete**:
- ✅ Frontend is running
- ✅ Supabase is running
- ✅ Environment variables are configured
- ❌ Backend API needs to start (1 command!)

**Next Action:** Start the backend API, then you're done!

```bash
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d
```

Then verify with:

```bash
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh
```

---

## 📞 Questions?

All your questions should be answered in these docs:
1. **SETUP_SUMMARY.md** - Quick reference
2. **SETUP_GUIDE.md** - Detailed instructions
3. **TROUBLESHOOTING.md** - Common issues
4. **DIAGNOSTIC.sh** - Run to see status

Good luck! 🚀

