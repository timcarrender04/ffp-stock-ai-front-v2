# FFP Stock AI - Troubleshooting Guide

## Error: `ECONNREFUSED 127.0.0.1:54321`

This is the exact error you're seeing. Let me explain what it means and how to fix it.

### What's Happening?

```
Frontend Container
    ↓
Tries to connect to 127.0.0.1:54321  ← This is "localhost" inside the container!
    ↓
But that address doesn't exist inside the container
    ↓
ECONNREFUSED (Connection Refused)
```

### Root Cause

The frontend is using `127.0.0.1` (localhost) as the Supabase URL. Inside a Docker container, `127.0.0.1` refers to the container itself, not the host machine. Since Supabase runs on the host (port 54321), the connection fails.

### Solution

Change the Supabase URL from `127.0.0.1` to `host.docker.internal`. This is a special hostname that Docker provides for containers to communicate with the host.

---

## How to Fix It

### Option 1: Update `.env.local` (Recommended)

**Frontend directory:** `/home/ert/projects/web-apps/ffp-stock-ai-front-v2/`

Create or edit `.env.local`:

```env
# Change THIS:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# To THIS:
NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321

# Also update other localhost references:
NEXT_PUBLIC_API_URL=http://host.docker.internal:8000
SUPABASE_URL=http://host.docker.internal:54321
```

### Option 2: Check docker-compose.yml

Your `docker-compose.yml` already has this configured:

```yaml
services:
  frontend:
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-http://host.docker.internal:54321}
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-http://host.docker.internal:8000}
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

✓ This is already correct! Make sure your `.env` or `.env.local` matches.

### Option 3: Docker Network Configuration

Verify that `extra_hosts` is in your docker-compose.yml:

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

This tells Docker to map `host.docker.internal` to the host machine's gateway.

---

## Step-by-Step Fix

### 1. Stop the Frontend Container

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker-compose down
```

### 2. Create/Update `.env.local`

```bash
cat > .env.local << 'EOF'
# Supabase (Browser Client)
NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API
NEXT_PUBLIC_API_URL=http://host.docker.internal:8000

# Supabase (Server Side)
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Node
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
```

### 3. Get the Supabase Keys

```bash
# Navigate to Supabase directory
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp

# Check logs for the anonymous key
docker-compose logs supabase_kong_supabase-ffp | grep -i "anon"

# Or check the local dashboard at http://localhost:54321
```

### 4. Update `.env.local` with Real Keys

Replace `your-anon-key-here` and `your-service-role-key-here` with actual values from Supabase.

### 5. Rebuild and Start Frontend

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Rebuild the image with new environment variables
docker-compose build --no-cache

# Start the container
docker-compose up -d

# Check logs for errors
docker-compose logs -f
```

### 6. Verify Connection

```bash
# Check if frontend is running
docker ps | grep frontend

# Check logs for "ECONNREFUSED" errors
docker-compose logs | grep -i econnrefused

# If no errors appear in logs, you're good!
```

---

## Verification Checklist

After making changes:

- [ ] `.env.local` exists and has `host.docker.internal` URLs
- [ ] Supabase is running: `curl http://localhost:54321`
- [ ] Backend API is running: `curl http://localhost:8000/health`
- [ ] Frontend container restarted
- [ ] No `ECONNREFUSED` in docker logs
- [ ] Frontend logs show successful connections

---

## Quick Diagnostic

```bash
# Run the diagnostic script
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
bash DIAGNOSTIC.sh
```

This will tell you:
- ✓ What services are running
- ✓ What ports are accessible
- ✗ What's missing or broken
- ⚠ What needs to be fixed

---

## Common Scenarios

### Scenario 1: "Running locally (not Docker)"

If you want to run the frontend on your host machine (not in Docker):

```bash
# Update env file
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_API_URL=http://localhost:8000
SUPABASE_URL=http://localhost:54321

# Install dependencies
npm install

# Run in dev mode
npm run dev

# Or build and start
npm run build
npm start
```

### Scenario 2: "Supabase not reachable"

Check if Supabase is actually running:

```bash
# Check running containers
docker ps | grep supabase

# Start Supabase if not running
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose up -d

# Wait 30 seconds for it to initialize
sleep 30

# Test connection
curl http://localhost:54321
```

### Scenario 3: "Backend API not reachable"

Check if Backend API is running:

```bash
# Check running containers
docker ps | grep stock_api

# Start backend if not running
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d

# Wait 10 seconds
sleep 10

# Test connection
curl http://localhost:8000/health
```

### Scenario 4: "Port already in use"

If port 54321 or 8000 is already in use:

```bash
# Find what's using port 54321
lsof -i :54321

# Kill the process (replace PID with actual ID)
kill -9 <PID>

# Or use a different port in docker-compose (not recommended)
```

---

## Docker Network Deep Dive

### The Problem (Simplified)

```
Host Machine                      Docker Container
┌─────────────────┐               ┌──────────────────┐
│ Supabase        │               │ Frontend App     │
│ Port: 54321     │◄──┐           │ Tries to reach   │
│                 │   │           │ 127.0.0.1:54321  │
│ (Real!)         │   │           │ (Not Real!)      │
│                 │   │           │                  │
└─────────────────┘   │           └──────────────────┘
    Host OS           │
    Network Stack     └─ These are different!
```

### The Solution

```
Host Machine                      Docker Container
┌─────────────────┐               ┌──────────────────┐
│ Supabase        │               │ Frontend App     │
│ Port: 54321     │◄──────────────│ Tries to reach   │
│                 │               │ host.docker.     │
│ (Real!)         │               │ internal:54321   │
│                 │               │ (Maps to Host!)  │
└─────────────────┘               └──────────────────┘
    Host OS                       Docker Bridge
    Network Stack                 Network Driver
```

Docker's bridge network driver maps `host.docker.internal` to the host machine's IP.

---

## Environment Variable Differences

| Scenario | NEXT_PUBLIC_SUPABASE_URL | SUPABASE_URL |
|----------|--------------------------|--------------|
| **Docker** | `http://host.docker.internal:54321` | `http://host.docker.internal:54321` |
| **Local Dev** | `http://localhost:54321` | `http://localhost:54321` |
| **Production** | `https://your-supabase-domain.supabase.co` | `https://your-supabase-domain.supabase.co` |

---

## Need More Help?

### Check Logs

```bash
# Frontend logs
docker-compose logs -f

# Supabase logs
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose logs -f

# Backend logs
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose logs -f api
```

### Test Connectivity Inside Container

```bash
# Enter the frontend container
docker-compose exec frontend bash

# Test Supabase connection
curl http://host.docker.internal:54321

# Test Backend API
curl http://host.docker.internal:8000/health

# Exit container
exit
```

### Reset Everything

If you want a clean slate:

```bash
# Stop all containers
docker-compose down

# Remove volumes (optional - careful with data!)
docker-compose down -v

# Remove image and rebuild
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

---

## Quick Reference Commands

```bash
# Diagnostic
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh

# Quick start all services
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/QUICK_START.sh

# Check specific container
docker ps -a | grep frontend

# View live logs
docker-compose logs -f

# Enter a container
docker-compose exec frontend bash

# Restart a service
docker-compose restart frontend

# View environment variables
docker-compose config
```

---

## Still Having Issues?

1. Run the diagnostic script first
2. Check that all services are running
3. Verify environment variables are set correctly
4. Check Docker logs for specific error messages
5. Ensure ports 54321, 8000, and 3075 are not already in use

If you're still stuck, collect this information:
- Output from `DIAGNOSTIC.sh`
- Docker logs (all services)
- Contents of `.env.local` (sanitize keys!)
- Docker version: `docker --version`
- Docker Compose version: `docker-compose --version`

