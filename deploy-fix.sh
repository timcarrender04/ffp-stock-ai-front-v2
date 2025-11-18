#!/bin/bash
# Deployment script to fix mixed content and network errors
# Run this script from the frontend project root

set -e  # Exit on error

echo "=================================================="
echo "FFP Stock AI Frontend - Deployment Fix"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found. Please run this script from the frontend project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Checking environment files...${NC}"
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Warning: .env.local not found. Please create it with the correct configuration.${NC}"
    echo "Refer to env.example for the required variables."
    read -p "Press Enter to continue or Ctrl+C to abort..."
fi

echo -e "${GREEN}✓ Environment files check complete${NC}"
echo ""

echo -e "${YELLOW}Step 2: Verifying Cloudflare Tunnel...${NC}"
echo "Checking if Cloudflare tunnel is configured for supabase.ffpstock.app..."

# Check if DNS is configured
if command -v dig &> /dev/null; then
    if dig +short supabase.ffpstock.app | grep -q .; then
        echo -e "${GREEN}✓ DNS record found for supabase.ffpstock.app${NC}"
    else
        echo -e "${RED}⚠ DNS record NOT found for supabase.ffpstock.app${NC}"
        echo "You need to add a CNAME record in Cloudflare pointing to your tunnel."
    fi
else
    echo -e "${YELLOW}⚠ dig command not found, skipping DNS check${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Stopping frontend container...${NC}"
docker-compose down
echo -e "${GREEN}✓ Frontend stopped${NC}"
echo ""

echo -e "${YELLOW}Step 4: Rebuilding frontend with new configuration...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓ Frontend rebuilt${NC}"
echo ""

echo -e "${YELLOW}Step 5: Starting frontend...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Frontend started${NC}"
echo ""

echo -e "${YELLOW}Step 6: Waiting for frontend to be ready...${NC}"
sleep 10

# Check if frontend is running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running. Check logs with: docker-compose logs -f${NC}"
    exit 1
fi
echo ""

echo "=================================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "Next Steps:"
echo "1. Ensure Cloudflare tunnel is restarted with the new config"
echo "   - Location: /home/ert/projects/trading/FFP_stock_ai/config/cloudflare-config.yml"
echo "   - Command: cd /home/ert/projects/trading/FFP_stock_ai && docker-compose restart cloudflared"
echo ""
echo "2. Add DNS record in Cloudflare:"
echo "   - Type: CNAME"
echo "   - Name: supabase"
echo "   - Target: <your-tunnel-id>.cfargotunnel.com"
echo "   - Proxy: Enabled (orange cloud)"
echo ""
echo "3. Test the endpoints:"
echo "   - Supabase: curl -I https://supabase.ffpstock.app/rest/v1/"
echo "   - Frontend: Open https://ffpstock.app in your browser"
echo "   - API Test: curl https://ffpstock.app/api/top/50?limit=50"
echo ""
echo "4. Monitor logs:"
echo "   - Frontend: docker-compose logs -f frontend"
echo "   - Tunnel: cd /home/ert/projects/trading/FFP_stock_ai && docker-compose logs -f cloudflared"
echo ""
echo "For detailed deployment instructions, see DEPLOYMENT_FIX.md"
echo ""

