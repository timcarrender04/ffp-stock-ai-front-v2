#!/bin/bash

# FFP Stock AI - Diagnostic Script
# This script helps identify what's running and what's not

echo "╔════════════════════════════════════════════════════╗"
echo "║   FFP Stock AI - System Diagnostic                 ║"
echo "║   $(date)                              ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

check_port() {
    local port=$1
    local service=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $service (port $port) is ${GREEN}RUNNING${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} $service (port $port) is ${RED}NOT RUNNING${NC}"
        return 1
    fi
}

# ============================================
# 1. CHECK DOCKER
# ============================================
echo -e "${BLUE}[1] Docker Status${NC}"
echo "────────────────────────────────────────"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is installed"
    
    if docker ps &>/dev/null; then
        echo -e "${GREEN}✓${NC} Docker daemon is running"
    else
        echo -e "${RED}✗${NC} Docker daemon is not running"
    fi
else
    echo -e "${RED}✗${NC} Docker is not installed"
fi

echo ""

# ============================================
# 2. CHECK RUNNING CONTAINERS
# ============================================
echo -e "${BLUE}[2] Running Containers${NC}"
echo "────────────────────────────────────────"

# Supabase containers
echo "Supabase Services:"
docker ps --filter "name=supabase" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "No Supabase containers found"

echo ""

# Backend containers
echo "Backend Services:"
docker ps --filter "name=stock_" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "No backend containers found"

echo ""

# Frontend containers
echo "Frontend Services:"
docker ps --filter "name=ffp-stock" --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || echo "No frontend containers found"

echo ""

# ============================================
# 3. CHECK PORT CONNECTIVITY
# ============================================
echo -e "${BLUE}[3] Port Connectivity${NC}"
echo "────────────────────────────────────────"

check_port 54321 "Supabase"
check_port 8000 "Backend API"
check_port 3075 "Frontend"
check_port 5432 "PostgreSQL"
check_port 6380 "Redis"

echo ""

# ============================================
# 4. DETAILED SERVICE STATUS
# ============================================
echo -e "${BLUE}[4] Detailed Service Status${NC}"
echo "────────────────────────────────────────"

echo "Supabase Network:"
docker network inspect supabase_network_supabase-ffp &>/dev/null && \
    echo -e "${GREEN}✓${NC} Network exists" || \
    echo -e "${RED}✗${NC} Network does not exist"

echo ""
echo "Stock Network:"
docker network inspect stock_network &>/dev/null && \
    echo -e "${GREEN}✓${NC} Network exists" || \
    echo -e "${RED}✗${NC} Network does not exist"

echo ""

# ============================================
# 5. FILE CONFIGURATIONS
# ============================================
echo -e "${BLUE}[5] Configuration Files${NC}"
echo "────────────────────────────────────────"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env exists"
else
    echo -e "${RED}✗${NC} Frontend .env NOT found (required!)"
fi

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env.local exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend .env.local NOT found (optional, but recommended)"
fi

echo ""

# ============================================
# 6. RECOMMENDED ACTIONS
# ============================================
echo -e "${BLUE}[6] Recommended Actions${NC}"
echo "────────────────────────────────────────"

ISSUES=0

if ! nc -z localhost 54321 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Supabase not running. Start it:"
    echo "   cd /home/ert/projects/trading/FFP_stock_ai/supabase-ffp"
    echo "   docker-compose up -d"
    ISSUES=$((ISSUES + 1))
fi

if ! nc -z localhost 8000 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Backend API not running. Start it:"
    echo "   cd /home/ert/projects/trading/FFP_stock_ai"
    echo "   docker-compose up -d"
    ISSUES=$((ISSUES + 1))
fi

if ! nc -z localhost 3075 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Frontend not running. Start it:"
    echo "   cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2"
    echo "   docker-compose up -d"
    ISSUES=$((ISSUES + 1))
fi

if [ -f ".env" ]; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env | cut -d'=' -f2)
    if [ "$SUPABASE_URL" = "http://127.0.0.1:54321" ]; then
        echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_SUPABASE_URL uses 127.0.0.1 (localhost)"
        echo "   For Docker: Change to http://host.docker.internal:54321"
        echo "   In .env file or set it as environment variable"
        ISSUES=$((ISSUES + 1))
    fi
fi

echo ""

# ============================================
# 7. SUMMARY
# ============================================
echo -e "${BLUE}[7] Summary${NC}"
echo "────────────────────────────────────────"

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ All services are running!${NC}"
    echo ""
    echo "Access points:"
    echo "  • Frontend: http://localhost:3075"
    echo "  • Backend API: http://localhost:8000"
    echo "  • Supabase: http://localhost:54321"
else
    echo -e "${YELLOW}⚠ Found $ISSUES issue(s) to fix${NC}"
fi

echo ""
echo "For detailed logs:"
echo "  • Frontend: docker logs -f ffp-stock-ai-front-v2-frontend-1"
echo "  • Backend:  docker-compose -f /home/ert/projects/trading/FFP_stock_ai/docker-compose.yml logs -f api"
echo "  • Supabase: docker-compose -f /home/ert/projects/trading/FFP_stock_ai/supabase-ffp/docker-compose.yml logs -f"
echo ""

