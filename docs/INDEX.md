# 📑 FFP Stock AI Frontend - Complete Documentation Index

Welcome! This folder contains comprehensive documentation and tools to help you set up and troubleshoot the FFP Stock AI system. Here's your guide to all available resources.

---

## 🚀 START HERE

### For First-Time Setup
1. **README_SETUP.md** ← Start with this! (5-10 min read)
   - Current status overview
   - What's working and what's not
   - Quick fix steps
   - Next actions

### For Quick Commands
2. **COMMANDS_CHEATSHEET.md**
   - Copy-paste ready commands
   - Every possible task covered
   - Organized by category

### For Detailed Setup
3. **SETUP_GUIDE.md**
   - Step-by-step instructions
   - Architecture diagrams
   - Prerequisites
   - Network configuration

---

## 📚 DOCUMENTATION FILES

### Overview & Status
- **README_SETUP.md** - Current system status and quick fix
- **SETUP_SUMMARY.md** - Quick reference guide
- **INDEX.md** - This file (navigation guide)

### Detailed Guides
- **SETUP_GUIDE.md** - Comprehensive setup instructions
- **TROUBLESHOOTING.md** - Fix common issues
- **COMMANDS_CHEATSHEET.md** - All commands in one place

### Configuration
- **env.example** - Environment variables with explanations

---

## 🛠️ HELPER SCRIPTS

### Diagnostic Tool
```bash
bash DIAGNOSTIC.sh
```
Checks:
- ✅ What services are running
- ✅ What ports are accessible
- ❌ What's broken or missing
- ⚠️ What needs to be fixed

### Quick Start
```bash
bash QUICK_START.sh
```
Automatically starts:
1. Supabase
2. Backend API
3. Frontend
4. Shows access points

---

## 🎯 QUICK NAVIGATION

### "I want to..."

#### ...get the system running
→ Read: **README_SETUP.md** (section "Quick Fix")
→ Run: `bash QUICK_START.sh`

#### ...understand the setup
→ Read: **SETUP_GUIDE.md**
→ Run: `bash DIAGNOSTIC.sh`

#### ...fix an error
→ Run: `bash DIAGNOSTIC.sh` (see what's broken)
→ Read: **TROUBLESHOOTING.md** (find your error)

#### ...find a specific command
→ Read: **COMMANDS_CHEATSHEET.md** (search by task)

#### ...configure the environment
→ Read: **env.example** (see all variables)
→ File: `.env.local` (create/edit your config)

#### ...see what's running
→ Run: `bash DIAGNOSTIC.sh`

#### ...view system logs
→ Read: **COMMANDS_CHEATSHEET.md** (Logs section)
→ Example: `docker logs -f ffp-stock-ai-front-v2-frontend-1`

#### ...stop everything
→ Read: **COMMANDS_CHEATSHEET.md** (Stop section)
→ Quick: `docker-compose down` (in each directory)

#### ...reset and start fresh
→ Read: **TROUBLESHOOTING.md** (Reset Everything section)
→ Or: **COMMANDS_CHEATSHEET.md** (Cleanup section)

---

## 📊 CURRENT STATUS

As of last diagnostic check:

| Component | Status | Port | Issue |
|-----------|--------|------|-------|
| Supabase | ✅ Running | 54321 | - |
| Frontend | ✅ Running | 3075 | - |
| Backend API | ❌ NOT RUNNING | 8000 | ← FIX THIS |
| Redis | ✅ Running | 6380 | - |
| Networks | ✅ Created | - | - |

---

## 🔧 MOST COMMON TASKS

### Start Backend API (Primary Issue)
```bash
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d
sleep 10
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh
```

### Check System Status
```bash
bash DIAGNOSTIC.sh
```

### View Frontend Logs
```bash
docker logs -f ffp-stock-ai-front-v2-frontend-1
```

### View Backend Logs
```bash
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose logs -f api
```

### Stop All Services
```bash
# In each directory, run:
docker-compose down

# Frontend:
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker-compose down

# Backend:
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose down

# Supabase:
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose down
```

### Restart Frontend
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
docker-compose restart
# or
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📁 FILE STRUCTURE

```
/home/ert/projects/web-apps/ffp-stock-ai-front-v2/
├── README_SETUP.md               ← Start here!
├── SETUP_SUMMARY.md              ← Quick reference
├── SETUP_GUIDE.md                ← Detailed instructions
├── TROUBLESHOOTING.md            ← Fix issues
├── COMMANDS_CHEATSHEET.md        ← All commands
├── INDEX.md                      ← This file
├── env.example                   ← Template
├── .env                          ← Config (auto)
├── .env.local                    ← Your config (create)
├── DIAGNOSTIC.sh                 ← Check status
├── QUICK_START.sh                ← Auto start
├── docker-compose.yml            ← Frontend services
├── Dockerfile                    ← Build config
└── [other app files...]
```

---

## 🚨 COMMON ISSUES & QUICK FIXES

### Error: `ECONNREFUSED 127.0.0.1:54321`
**Status:** ✅ Already fixed in your setup
**What was needed:** Change localhost to `host.docker.internal`
**Your .env.local:** Already has correct URL

### Error: `Backend API not reachable`
**Status:** ❌ This is your current issue
**Fix:** 
```bash
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d
```

### Port Already in Use
**Fix:**
```bash
lsof -i :PORT_NUMBER
kill -9 PID
```

### Need New Supabase Keys
```bash
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp
docker-compose logs | grep -i "anon\|service"
```

---

## 🔗 SERVICE LOCATIONS

| Service | Directory | Port | Command |
|---------|-----------|------|---------|
| Frontend | `/home/ert/projects/web-apps/ffp-stock-ai-front-v2/` | 3075 | `docker-compose up -d` |
| Backend API | `/home/ert/projects/trading/FFP_stock_ai/` | 8000 | `docker-compose up -d` |
| Supabase | `/home/ert/projects/trading/FFP_stock_ai/supabase-ffp/` | 54321 | `docker-compose up -d` |

---

## 📞 HELP & SUPPORT MATRIX

| Need | Action | Resource |
|------|--------|----------|
| System overview | Run diagnostic | `bash DIAGNOSTIC.sh` |
| Step-by-step guide | Read | SETUP_GUIDE.md |
| Quick commands | Read | COMMANDS_CHEATSHEET.md |
| Troubleshoot error | Read | TROUBLESHOOTING.md |
| View configuration | Edit | `.env.local` |
| Check logs | Run | `docker logs -f <name>` |
| Understand URLs | Read | env.example |

---

## ✅ VERIFICATION CHECKLIST

After following the guides, check:

- [ ] Backend API running: `docker ps | grep stock_api`
- [ ] Frontend running: `docker ps | grep frontend`
- [ ] No ECONNREFUSED errors: `docker logs frontend | grep -i econnrefused`
- [ ] Supabase accessible: `curl http://localhost:54321`
- [ ] Backend API accessible: `curl http://localhost:8000/health`
- [ ] Frontend loads: `curl http://localhost:3075`
- [ ] Login works: Visit http://localhost:3075

---

## 🚀 GETTING STARTED RIGHT NOW

### Option 1: Automatic (Recommended)
```bash
bash QUICK_START.sh
```

### Option 2: Manual
```bash
# 1. Start backend
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d

# 2. Wait a bit
sleep 10

# 3. Check status
bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh

# 4. View in browser
open http://localhost:3075
```

### Option 3: Step by Step
Read **README_SETUP.md** for detailed instructions.

---

## 📖 SUGGESTED READING ORDER

For first-time users:
1. This file (INDEX.md) - You are here! 👈
2. README_SETUP.md (5 min) - Overview
3. SETUP_SUMMARY.md (10 min) - Commands
4. Run DIAGNOSTIC.sh - Check status

For troubleshooting:
1. Run DIAGNOSTIC.sh - Identify issue
2. Read TROUBLESHOOTING.md - Find solution
3. Use COMMANDS_CHEATSHEET.md - Copy commands

For detailed setup:
1. SETUP_GUIDE.md - Complete walkthrough
2. env.example - Understand variables
3. COMMANDS_CHEATSHEET.md - Reference

---

## 💾 FILE DESCRIPTIONS

| File | Purpose | Read Time |
|------|---------|-----------|
| INDEX.md | Navigation guide | 3 min |
| README_SETUP.md | Overview & current status | 5 min |
| SETUP_SUMMARY.md | Quick reference | 5 min |
| SETUP_GUIDE.md | Complete setup instructions | 15 min |
| TROUBLESHOOTING.md | Fix common issues | 10 min |
| COMMANDS_CHEATSHEET.md | Copy-paste commands | Reference |
| env.example | Configuration variables | 5 min |

---

## 🎓 LEARNING RESOURCES

### Understanding Docker
- How containers communicate via networks
- Port mapping and networking
- Environment variables in containers
- Docker compose orchestration

### Understanding the Architecture
- Supabase (PostgreSQL + Auth + API)
- Next.js frontend with server components
- FastAPI backend with microservices
- Inter-service communication via networks

### Key Concepts
- `host.docker.internal` - How containers reach the host
- Docker bridge networks - How services communicate
- Environment variables - How to configure services
- Container ports - How services expose interfaces

---

## ⚡ POWER USER TIPS

### Create Aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias ffp-start='bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/QUICK_START.sh'
alias ffp-status='bash /home/ert/projects/web-apps/ffp-stock-ai-front-v2/DIAGNOSTIC.sh'
alias ffp-logs='docker logs -f ffp-stock-ai-front-v2-frontend-1'
```

### Monitor in Real-Time
Open 4 terminals:
```bash
# Terminal 1: Supabase logs
cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp && docker-compose logs -f

# Terminal 2: Backend logs
cd /home/ert/projects/trading/FFP_stock_ai && docker-compose logs -f

# Terminal 3: Frontend logs
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && docker-compose logs -f

# Terminal 4: System stats
docker stats
```

### Quick Rebuild
```bash
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2 && docker-compose down && docker-compose build --no-cache && docker-compose up -d
```

---

## 🎯 NEXT STEPS

1. ✅ Read: **README_SETUP.md** (current status)
2. 🚀 Run: `bash QUICK_START.sh` (start services)
3. ✔️ Verify: `bash DIAGNOSTIC.sh` (check status)
4. 🌐 Visit: `http://localhost:3075` (see frontend)
5. 📖 Troubleshoot: Use TROUBLESHOOTING.md if needed

---

## 📝 NOTES

- All commands are copy-paste ready
- Documentation is up-to-date and tested
- Your setup is 95% complete (just need backend running)
- All environment variables are already configured correctly
- Docker networks are already created
- Frontend is already running correctly

---

## 🔗 QUICK LINKS

| Link | What It Does |
|------|--------------|
| http://localhost:3075 | Frontend (Next.js app) |
| http://localhost:8000 | Backend API (FastAPI) |
| http://localhost:54321 | Supabase (Database & Auth) |
| http://localhost:6380 | Redis (Cache) |

---

## 📞 SUPPORT

**Having trouble?** 

1. Run: `bash DIAGNOSTIC.sh`
2. Read: **TROUBLESHOOTING.md**
3. Check: **COMMANDS_CHEATSHEET.md**
4. Review: **SETUP_GUIDE.md**

Everything you need is in these files! 🎉

---

**Last Updated:** November 13, 2025
**Status:** ✅ Ready for use
**Next Action:** Start backend API!

