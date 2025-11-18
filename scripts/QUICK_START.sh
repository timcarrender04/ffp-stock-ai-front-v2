#!/bin/bash

# FFP Stock AI - Quick Start Script
# This script automates the startup of all required services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SUPABASE_PATH="/home/ert/projects/trading/FFP_stock_ai/supabase-ffp"
BACKEND_PATH="/home/ert/projects/trading/FFP_stock_ai"
FRONTEND_PATH="/home/ert/projects/web-apps/ffp-stock-ai-front-v2"

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   FFP Stock AI - Quick Start                       ║"
echo "║   Starting all services...                         ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# ============================================
# Step 1: Check Docker
# ============================================
echo -e "${BLUE}[1/4]${NC} Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is available${NC}"
echo ""

# ============================================
# Step 2: Start Supabase
# ============================================
echo -e "${BLUE}[2/4]${NC} Starting Supabase..."
cd "$SUPABASE_PATH" || exit 1

echo "    Creating/checking networks..."
docker network create supabase_network_supabase-ffp 2>/dev/null || true

echo "    Starting Supabase containers (this may take a minute)..."
docker-compose up -d > /dev/null 2>&1

echo "    Waiting for Supabase to be ready..."
sleep 15  # Give Supabase time to start

# Check if Supabase is up
if nc -z localhost 54321 2>/dev/null; then
    echo -e "${GREEN}✓ Supabase is running (port 54321)${NC}"
else
    echo -e "${YELLOW}⚠ Supabase is starting up, but may not be fully ready yet${NC}"
fi
echo ""

# ============================================
# Step 3: Start Backend Services
# ============================================
echo -e "${BLUE}[3/4]${NC} Starting Backend Services..."
cd "$BACKEND_PATH" || exit 1

echo "    Creating/checking networks..."
docker network create stock_network 2>/dev/null || true

echo "    Starting backend containers (this may take a minute)..."
docker-compose up -d > /dev/null 2>&1

echo "    Waiting for services to be ready..."
sleep 10

# Check if API is up
if nc -z localhost 8000 2>/dev/null; then
    echo -e "${GREEN}✓ Backend API is running (port 8000)${NC}"
else
    echo -e "${YELLOW}⚠ Backend is starting up, but may not be fully ready yet${NC}"
fi
echo ""

# ============================================
# Step 4: Start Frontend
# ============================================
echo -e "${BLUE}[4/4]${NC} Starting Frontend..."
cd "$FRONTEND_PATH" || exit 1

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠ .env.local not found!${NC}"
    echo ""
    echo "Please create ${FRONTEND_PATH}/.env.local with the following content:"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<get-from-supabase-dashboard>"
    echo "NEXT_PUBLIC_API_URL=http://host.docker.internal:8000"
    echo "SUPABASE_URL=http://host.docker.internal:54321"
    echo "SUPABASE_SERVICE_ROLE_KEY=<get-from-supabase-dashboard>"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "    Starting frontend container..."
docker-compose up -d > /dev/null 2>&1

echo "    Waiting for frontend to be ready..."
sleep 5

if nc -z localhost 3075 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend is running (port 3075)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend is starting up...${NC}"
fi
echo ""

# ============================================
# Summary
# ============================================
echo "╔════════════════════════════════════════════════════╗"
echo "║   ✓ All Services Started!                          ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Access Points:${NC}"
echo "  • Frontend:       ${BLUE}http://localhost:3075${NC}"
echo "  • Backend API:    ${BLUE}http://localhost:8000${NC}"
echo "  • Supabase:       ${BLUE}http://localhost:54321${NC}"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  • View frontend logs:  docker logs -f ffp-stock-ai-front-v2-frontend-1"
echo "  • View backend logs:   docker-compose -f $BACKEND_PATH/docker-compose.yml logs -f api"
echo "  • View Supabase logs:  docker-compose -f $SUPABASE_PATH/docker-compose.yml logs -f"
echo "  • Run diagnostics:     bash $FRONTEND_PATH/DIAGNOSTIC.sh"
echo ""
echo -e "${YELLOW}Note:${NC} It may take a minute or two for all services to fully initialize."
echo "If you see connection errors, wait a bit and refresh your browser."
echo ""

