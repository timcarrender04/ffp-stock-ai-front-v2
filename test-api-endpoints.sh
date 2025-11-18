#!/bin/bash

# ============================================
# FFP Stock AI Frontend - Comprehensive API Testing Script
# ============================================
# Tests all available data sources and endpoints
# Author: System
# Date: November 13, 2025
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="http://localhost:54321"
NEXT_API_URL="http://localhost:4008"
BACKEND_API_URL="http://localhost:8000"
OUTPUT_DIR="./api-test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Summary tracking
declare -A TEST_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ SUCCESS:${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

print_error() {
    echo -e "${RED}✗ FAILED:${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠ WARNING:${NC} $1"
}

# Test function
test_endpoint() {
    local name="$1"
    local url="$2"
    local headers="$3"
    local expected_status="${4:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "$name"
    
    local output_file="$OUTPUT_DIR/${name// /_}_$TIMESTAMP.json"
    
    # Make request and capture status code
    if [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "$headers" "$url" 2>&1) || {
            print_error "$name - Connection failed"
            TEST_RESULTS["$name"]="CONNECTION_FAILED"
            echo "Connection Error" > "$output_file"
            return 1
        }
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>&1) || {
            print_error "$name - Connection failed"
            TEST_RESULTS["$name"]="CONNECTION_FAILED"
            echo "Connection Error" > "$output_file"
            return 1
        }
    fi
    
    # Extract status code and body
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    # Save response to file
    echo "$body" | jq '.' 2>/dev/null > "$output_file" || echo "$body" > "$output_file"
    
    # Check status code
    if [ "$status_code" -eq "$expected_status" ]; then
        # Check if we got data
        local row_count=$(echo "$body" | jq '. | length' 2>/dev/null || echo "0")
        
        if [ "$row_count" = "null" ]; then
            # Single object response
            print_success "$name (Status: $status_code) - Got data"
            TEST_RESULTS["$name"]="SUCCESS_WITH_DATA"
        elif [ "$row_count" -gt 0 ]; then
            print_success "$name (Status: $status_code) - $row_count rows"
            TEST_RESULTS["$name"]="SUCCESS_${row_count}_ROWS"
        else
            print_warning "$name (Status: $status_code) - No data (empty array)"
            TEST_RESULTS["$name"]="SUCCESS_NO_DATA"
        fi
    else
        print_error "$name - Expected $expected_status but got $status_code"
        TEST_RESULTS["$name"]="FAILED_STATUS_$status_code"
    fi
    
    echo "  → Saved to: $output_file"
}

# ============================================
# 1. CHECK SERVICE AVAILABILITY
# ============================================
print_header "1. CHECKING SERVICE AVAILABILITY"

echo "Checking Supabase (PostgREST)..."
if curl -s -o /dev/null -w "%{http_code}" "$SUPABASE_URL/rest/v1/" | grep -q "200\|404"; then
    print_success "Supabase is running on $SUPABASE_URL"
else
    print_error "Supabase is NOT accessible on $SUPABASE_URL"
fi

echo -e "\nChecking Next.js API..."
if curl -s -o /dev/null -w "%{http_code}" "$NEXT_API_URL/api/test" | grep -q "200\|404"; then
    print_success "Next.js API is running on $NEXT_API_URL"
else
    print_error "Next.js API is NOT accessible on $NEXT_API_URL"
fi

echo -e "\nChecking Backend FastAPI..."
if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_API_URL/health" | grep -q "200\|404"; then
    print_success "Backend API is running on $BACKEND_API_URL"
else
    print_error "Backend API is NOT accessible on $BACKEND_API_URL"
fi

# ============================================
# 2. TEST SUPABASE DIRECT ENDPOINTS
# ============================================
print_header "2. TESTING SUPABASE POSTGREST ENDPOINTS"

# Get anon key from environment or use default
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE}"

AUTH_HEADER="apikey: $SUPABASE_ANON_KEY"

# Moonshot Schema
test_endpoint "Moonshot Top 25" \
    "$SUPABASE_URL/rest/v1/top_25?select=*&order=rank.asc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: moonshot"

test_endpoint "Moonshot Top 50" \
    "$SUPABASE_URL/rest/v1/top_50?select=*&order=rank.asc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: moonshot"

test_endpoint "Moonshot Top 100" \
    "$SUPABASE_URL/rest/v1/top_100?select=*&order=rank.asc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: moonshot"

test_endpoint "Moonshot Trading Recommendations" \
    "$SUPABASE_URL/rest/v1/trading_recommendations?select=*&order=recommendation_timestamp.desc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: moonshot"

test_endpoint "Moonshot Master Trade Decisions" \
    "$SUPABASE_URL/rest/v1/master_trade_decisions?select=*&order=decision_timestamp.desc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: moonshot"

# Market Schema
test_endpoint "Market Conditions" \
    "$SUPABASE_URL/rest/v1/conditions?select=*&order=date.desc&limit=5" \
    "$AUTH_HEADER
Accept-Profile: market"

test_endpoint "Market Daily Breadth" \
    "$SUPABASE_URL/rest/v1/daily_breadth?select=*&order=date.desc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: market"

test_endpoint "Market Daily Sentiment" \
    "$SUPABASE_URL/rest/v1/daily_sentiment?select=*&order=date.desc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: market"

# Daily Scalp Schema
test_endpoint "Daily Scalp Performance Metrics" \
    "$SUPABASE_URL/rest/v1/performance_metrics?select=*&order=trade_date.desc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: daily_scalp"

test_endpoint "Daily Scalp Positions" \
    "$SUPABASE_URL/rest/v1/positions?select=*&order=entry_timestamp.desc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: daily_scalp"

test_endpoint "Daily Scalp Orders to Execute" \
    "$SUPABASE_URL/rest/v1/orders_to_execute?select=*&order=created_at.desc&limit=10" \
    "$AUTH_HEADER
Accept-Profile: daily_scalp"

# ============================================
# 3. TEST NEXT.JS API ROUTES
# ============================================
print_header "3. TESTING NEXT.JS API ROUTES"

test_endpoint "Next.js Test Endpoint" \
    "$NEXT_API_URL/api/test" \
    ""

test_endpoint "Next.js Moonshot Top 25" \
    "$NEXT_API_URL/api/moonshot/top-25?limit=10" \
    ""

test_endpoint "Next.js Top Tier 25" \
    "$NEXT_API_URL/api/top/25?limit=10" \
    ""

test_endpoint "Next.js Top Tier 50" \
    "$NEXT_API_URL/api/top/50?limit=10" \
    ""

test_endpoint "Next.js Top Tier 100" \
    "$NEXT_API_URL/api/top/100?limit=10" \
    ""

test_endpoint "Next.js Moonshot Recommendations" \
    "$NEXT_API_URL/api/moonshot/recommendations?limit=10" \
    ""

test_endpoint "Next.js Moonshot Consensus" \
    "$NEXT_API_URL/api/moonshot/consensus?limit=10" \
    ""

test_endpoint "Next.js Trading Recommendations" \
    "$NEXT_API_URL/api/trading-recommendations?limit=10" \
    ""

# ============================================
# 4. TEST BACKEND FASTAPI ENDPOINTS
# ============================================
print_header "4. TESTING BACKEND FASTAPI ENDPOINTS"

# Health check
test_endpoint "Backend Health Check" \
    "$BACKEND_API_URL/health" \
    ""

# Symbol Analysis (if AAPL data exists)
test_endpoint "Backend Symbol Analysis AAPL" \
    "$BACKEND_API_URL/api/moonshot/symbol-analysis/AAPL?timeframes=5m,15m,30m&include_audio=false" \
    ""

test_endpoint "Backend Symbol Analysis TSLA" \
    "$BACKEND_API_URL/api/moonshot/symbol-analysis/TSLA?timeframes=5m,15m,30m&include_audio=false" \
    ""

# OHLC Data
test_endpoint "Backend OHLC Data AAPL" \
    "$BACKEND_API_URL/api/ohlc/AAPL?timeframe=1M&limit=10" \
    ""

# Signals
test_endpoint "Backend Trading Signals" \
    "$BACKEND_API_URL/api/signals?limit=10" \
    ""

# Opportunities
test_endpoint "Backend Trading Opportunities" \
    "$BACKEND_API_URL/api/opportunities?limit=10" \
    ""

# Market Movers
test_endpoint "Backend Top Gainers" \
    "$BACKEND_API_URL/api/top-gainers?limit=10" \
    ""

test_endpoint "Backend Top Losers" \
    "$BACKEND_API_URL/api/top-losers?limit=10" \
    ""

test_endpoint "Backend Market Movers" \
    "$BACKEND_API_URL/api/market-movers?mover_type=both&limit=10" \
    ""

# Watchlist
test_endpoint "Backend Watchlist" \
    "$BACKEND_API_URL/api/watchlist?active_only=true" \
    ""

# Alerts
test_endpoint "Backend Alerts" \
    "$BACKEND_API_URL/api/alerts?limit=10" \
    ""

# ============================================
# 5. GENERATE SUMMARY REPORT
# ============================================
print_header "5. TEST SUMMARY"

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "\nSuccess Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%"

echo -e "\n${BLUE}Detailed Results:${NC}"
for test_name in "${!TEST_RESULTS[@]}"; do
    result="${TEST_RESULTS[$test_name]}"
    if [[ $result == SUCCESS* ]]; then
        echo -e "  ${GREEN}✓${NC} $test_name: $result"
    elif [[ $result == CONNECTION_FAILED* ]]; then
        echo -e "  ${RED}✗${NC} $test_name: $result"
    else
        echo -e "  ${RED}✗${NC} $test_name: $result"
    fi
done

# Generate JSON summary
SUMMARY_FILE="$OUTPUT_DIR/test_summary_$TIMESTAMP.json"
cat > "$SUMMARY_FILE" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "total_tests": $TOTAL_TESTS,
  "passed": $PASSED_TESTS,
  "failed": $FAILED_TESTS,
  "success_rate": $(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}"),
  "results": $(printf '%s\n' "${!TEST_RESULTS[@]}" | jq -R . | jq -s 'map({(.): $TEST_RESULTS[.]}) | add')
}
EOF

echo -e "\n${GREEN}All results saved to: $OUTPUT_DIR${NC}"
echo -e "${GREEN}Summary report: $SUMMARY_FILE${NC}"

# ============================================
# 6. DATA AVAILABILITY ANALYSIS
# ============================================
print_header "6. DATA AVAILABILITY ANALYSIS"

echo "Analyzing which tables have data..."
echo ""

# Check for empty results
echo -e "${BLUE}Tables WITH Data:${NC}"
for test_name in "${!TEST_RESULTS[@]}"; do
    result="${TEST_RESULTS[$test_name]}"
    if [[ $result == SUCCESS_*_ROWS ]]; then
        rows=$(echo "$result" | sed 's/SUCCESS_//;s/_ROWS//')
        echo -e "  ${GREEN}✓${NC} $test_name: $rows rows"
    elif [[ $result == SUCCESS_WITH_DATA ]]; then
        echo -e "  ${GREEN}✓${NC} $test_name: Has data"
    fi
done

echo ""
echo -e "${YELLOW}Tables WITHOUT Data (Empty):${NC}"
for test_name in "${!TEST_RESULTS[@]}"; do
    result="${TEST_RESULTS[$test_name]}"
    if [[ $result == SUCCESS_NO_DATA ]]; then
        echo -e "  ${YELLOW}⚠${NC} $test_name: Empty"
    fi
done

echo ""
echo -e "${RED}Failed/Unavailable Endpoints:${NC}"
for test_name in "${!TEST_RESULTS[@]}"; do
    result="${TEST_RESULTS[$test_name]}"
    if [[ $result == FAILED* ]] || [[ $result == CONNECTION_FAILED ]]; then
        echo -e "  ${RED}✗${NC} $test_name: $result"
    fi
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Complete!${NC}"
echo -e "${BLUE}========================================${NC}"

