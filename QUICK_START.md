# Quick Start - Symbol Analysis Feature

## Start Backend API

```bash
cd /home/ert/projects/trading/FFP_stock_ai/services/api

# Apply database migration first (one-time)
psql -h localhost -U postgres -d stock_db -f ../../supabase/migrations/098_symbol_analysis_tracking.sql

# Start the API service
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

## Verify Backend is Running

Open in browser or use curl:
```bash
curl http://localhost:8000/health
```

## Test the Symbol Analysis Endpoint

```bash
# Test with a symbol that has data
curl "http://localhost:8000/api/moonshot/symbol-analysis/PLTR?timeframes=5m,15m,30m&include_audio=false" | jq
```

## Frontend is Already Running

Your Next.js dev server is running on port 3026. Just click a symbol in the Tier Dashboard to test!

## Fix Hydration Error (Unrelated Issue)

The hydration error in `MarketConditionsCard.tsx` is due to timezone differences between server/client. This is NOT related to the symbol analysis feature, but you can fix it by using UTC or suppressing hydration for timestamps.

## Test Checklist

1. ✅ Backend API running on port 8000
2. ✅ Database migration applied
3. ✅ Frontend running on port 3026
4. ✅ Click a symbol in the table
5. ✅ Modal opens with analysis
6. ⚠️ Audio generation requires TTS service (optional)

