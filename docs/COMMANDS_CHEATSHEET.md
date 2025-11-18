# FFP Stock AI - Commands Cheatsheet

Copy and paste these commands to get everything running!

---

## 🚀 QUICK START (Copy These Commands)

### Start Everything (Recommended)

```bash
# 1. Start Supabase (if not already running)
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose up -d && sleep 10

# 2. Start Backend API
cd /home/ert/projects/trading/FFP_stock_ai && docker-compose up -d && sleep 10

# 3. Frontend should already be running, but verify
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && docker-compose ps

# 4. Check everything is good
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh
```

### One-Line Version (Copy Entire Block)

```bash
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose up -d && sleep 10 && cd /home/ert/projects/trading/FFP_stock_ai && docker-compose up -d && sleep 10 && cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && bash DIAGNOSTIC.sh
```

---

## 🔧 INDIVIDUAL SERVICE COMMANDS

### Supabase

```bash
# Start Supabase
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose up -d

# Stop Supabase
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f kong
docker-compose logs -f postgres
```

### Backend API

```bash
# Start Backend
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d

# Stop Backend
docker-compose down

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f market-data-engine
docker-compose logs -f ta-processor

# View only errors
docker-compose logs | grep -i error
```

### Frontend

```bash
# Start Frontend
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker-compose up -d

# Stop Frontend
docker-compose down

# View logs
docker-compose logs -f

# View detailed logs
docker logs -f ffp-stock-ai-front-v2-frontend-1
```

---

## 📊 VERIFICATION COMMANDS

### Check All Services

```bash
# Quick status
docker ps

# Full details
docker ps -a

# Network info
docker network ls
docker network inspect supabase_network_supabase-ffp
docker network inspect stock_network
```

### Test Connectivity

```bash
# Test Supabase
curl http://localhost:54321

# Test Backend API
curl http://localhost:8000/health

# Test Frontend
curl http://localhost:3075

# Detailed response
curl -v http://localhost:8000/health
```

### Check Ports

```bash
# List all listening ports
lsof -i -P -n | grep LISTEN

# Check specific ports
lsof -i :54321
lsof -i :8000
lsof -i :3075
lsof -i :5432
lsof -i :6380
```

### Run Diagnostics

```bash
# Full diagnostic
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
bash DIAGNOSTIC.sh

# Check for specific errors
docker logs ffp-stock-ai-front-v2-frontend-1 | grep -i error
docker logs ffp-stock-ai-front-v2-frontend-1 | grep -i econnrefused
```

---

## 🐛 TROUBLESHOOTING COMMANDS

### See Frontend Errors

```bash
# Live logs with errors only
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker logs ffp-stock-ai-front-v2-frontend-1 | grep -i "error\|econnrefused\|failed"

# See last 50 lines
docker logs --tail 50 ffp-stock-ai-front-v2-frontend-1
```

### See Backend Errors

```bash
# Backend logs
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose logs | grep -i "error\|failed"

# API service only
docker logs stock_api | grep -i error
```

### See Supabase Errors

```bash
# Supabase logs
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose logs | grep -i "error"

# Kong (API gateway) logs
docker logs supabase_kong_supabase-ffp | grep -i error
```

### Enter a Container

```bash
# Enter frontend container
docker exec -it ffp-stock-ai-front-v2-frontend-1 bash

# Enter backend container
docker exec -it stock_api bash

# Once inside, you can:
# - Check network: ping host.docker.internal
# - Check files: ls /app
# - Run commands: curl http://host.docker.internal:54321
# - Exit: exit
```

### Kill Stuck Services

```bash
# Find process on port 54321
lsof -i :54321

# Kill the process (replace PID)
kill -9 <PID>

# Force Docker cleanup
docker system prune -f

# Remove stuck container
docker rm -f ffp-stock-ai-front-v2-frontend-1
```

---

## 🔑 ENVIRONMENT & CONFIGURATION

### View Current Configuration

```bash
# Frontend env
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
cat .env.local

# Backend env
cd /home/ert/projects/trading/FFP_stock_ai
cat .env
```

### Update Frontend Environment

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Create/edit .env.local
nano .env.local

# Or create new one
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
NEXT_PUBLIC_API_URL=http://host.docker.internal:8000
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_SERVICE_ROLE_KEY=your-key-here
EOF
```

### Get Supabase Keys

```bash
# From Supabase container logs
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose logs | grep -i "anon\|service\|key"

# Or check environment
docker exec -it supabase_kong_supabase-ffp env | grep -i "anon\|key"
```

---

## 📦 REBUILD & DEPLOY

### Rebuild Frontend

```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Rebuild image
docker-compose build --no-cache

# Rebuild and start
docker-compose up --build -d
```

### Rebuild Backend

```bash
cd /home/ert/projects/trading/FFP_stock_ai

# Rebuild image
docker-compose build --no-cache

# Rebuild and start
docker-compose up --build -d
```

### Full Clean Rebuild

```bash
# Stop everything
docker-compose -f /home/ert/projects/trading/FFP_stock_ai/supabase-ffp/docker-compose.yml down
docker-compose -f /home/ert/projects/trading/FFP_stock_ai/docker-compose.yml down
docker-compose -f /home/ert/projects/web-apps/ffp-stock-ai-front-v2/docker-compose.yml down

# Remove images
docker rmi ffp-stock-ai-frontend:latest
docker image prune -a -f

# Rebuild from scratch
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose build --no-cache && docker-compose up -d
cd /home/ert/projects/trading/FFP_stock_ai && docker-compose build --no-cache && docker-compose up -d
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && docker-compose build --no-cache && docker-compose up -d
```

---

## 🗑️ CLEANUP & RESET

### Stop All Services

```bash
# Stop in order (most dependent first)
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && docker-compose down
cd /home/ert/projects/trading/FFP_stock_ai && docker-compose down
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose down
```

### Remove Everything & Start Fresh

```bash
# Stop all
docker-compose -f /home/ert/projects/web-apps/ffp-stock-ai-front-v2/docker-compose.yml down
docker-compose -f /home/ert/projects/trading/FFP_stock_ai/docker-compose.yml down
docker-compose -f /home/ert/projects/trading/FFP_stock_ai/supabase-ffp/docker-compose.yml down

# Remove all containers
docker container prune -f

# Remove all images
docker image prune -a -f

# Remove volumes (careful - deletes data!)
docker volume prune -f

# Check everything is gone
docker ps -a
docker images
docker volume ls
```

### Delete Frontend Container Only

```bash
docker rm -f ffp-stock-ai-front-v2-frontend-1
```

---

## 📈 PERFORMANCE & MONITORING

### View Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats ffp-stock-ai-front-v2-frontend-1
```

### Check Disk Usage

```bash
# Docker total usage
docker system df

# See what's using space
docker system df -v
```

---

## 🚨 COMMON ERROR FIXES

### `ECONNREFUSED 127.0.0.1:54321`

```bash
# Solution: Restart frontend with correct env
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2

# Verify env
cat .env.local | grep NEXT_PUBLIC_SUPABASE_URL

# Should show: http://host.docker.internal:54321 (NOT 127.0.0.1)

# Restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port Already in Use

```bash
# Find what's using port 8000 (example)
lsof -i :8000

# Kill the process
kill -9 <PID>

# Verify it's free
lsof -i :8000 # Should return nothing
```

### Backend Won't Start

```bash
# Check backend logs
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose logs | head -50

# Check if networks exist
docker network ls | grep supabase
docker network ls | grep stock_network

# Create networks if missing
docker network create supabase_network_supabase-ffp
docker network create stock_network

# Try again
docker-compose up -d
```

### Container Keeps Crashing

```bash
# Check logs for errors
docker logs <container-name>

# Try rebuilding
docker-compose build --no-cache

# Check resource limits
docker stats

# Try with debug output
docker-compose up --verbose
```

---

## 📞 QUICK REFERENCE MATRIX

| Task | Command |
|------|---------|
| Start everything | `cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose up -d && cd /home/ert/projects/trading/FFP_stock_ai && docker-compose up -d` |
| Stop everything | `docker-compose down` (run in each directory) |
| Check status | `bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh` |
| View all logs | `docker logs -f <container-name>` |
| Enter container | `docker exec -it <container-name> bash` |
| Rebuild all | `docker-compose down && docker-compose build --no-cache && docker-compose up -d` |
| Clean up | `docker system prune -f` |

---

## 🎯 Most Common Workflow

```bash
# 1. Start everything
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose up -d
cd /home/ert/projects/trading/FFP_stock_ai && docker-compose up -d

# 2. Check status
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh

# 3. View frontend
open http://localhost:3075  # or your browser

# 4. Check logs if issues
docker logs -f ffp-stock-ai-front-v2-frontend-1

# 5. When done, stop services
docker-compose down  # Run in each directory
```

---

## 💡 Pro Tips

### Monitor Everything in Real-Time

```bash
# Terminal 1: Supabase logs
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose logs -f

# Terminal 2: Backend logs
cd /home/ert/projects/trading/FFP_stock_ai && docker-compose logs -f

# Terminal 3: Frontend logs
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && docker-compose logs -f

# Terminal 4: System monitoring
docker stats
```

### Create Alias for Quick Commands

```bash
# Add to ~/.bashrc or ~/.zshrc
alias ffp-status='bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh'
alias ffp-start='cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose up -d && cd /home/ert/projects/trading/FFP_stock_ai && docker-compose up -d'
alias ffp-stop='cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && docker-compose down && cd /home/ert/projects/trading/FFP_stock_ai && docker-compose down'
alias ffp-logs='docker logs -f ffp-stock-ai-front-v2-frontend-1'

# Then you can just run:
ffp-status
ffp-start
ffp-logs
```

---

Save this file and refer back whenever you need a command! 📋

