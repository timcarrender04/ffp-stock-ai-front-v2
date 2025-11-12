# Symbol Analysis Modal - Testing Guide

## Overview
This guide covers testing the AI-powered symbol analysis feature with entry/exit strategies and audio playback.

## Prerequisites

### Backend Setup
1. Ensure PostgreSQL database is running with the migration applied:
   ```bash
   cd /home/ert/projects/trading/FFP_stock_ai
   # Apply migration 098_symbol_analysis_tracking.sql
   psql -h localhost -U postgres -d stock_db -f supabase/migrations/098_symbol_analysis_tracking.sql
   ```

2. Verify required tables exist:
   ```sql
   -- Check moonshot.symbol_analyses table
   SELECT * FROM moonshot.symbol_analyses LIMIT 1;
   
   -- Check market data availability
   SELECT COUNT(*) FROM market_data.ohlcv_1min;
   
   -- Check technical indicators
   SELECT COUNT(*) FROM daily_scalp.ta_5m;
   SELECT COUNT(*) FROM daily_scalp.ta_15m;
   SELECT COUNT(*) FROM daily_scalp.ta_30m;
   ```

3. Ensure API service is running:
   ```bash
   cd /home/ert/projects/trading/FFP_stock_ai/services/api
   # Start the FastAPI service
   python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. Configure environment variables for TTS and Supabase:
   ```bash
   # In .env file
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   
   # Optional TTS providers (choose one):
   PIPER_TTS_HOST=http://localhost:5000  # Local Piper TTS
   ELEVENLABS_API_KEY=your_key            # ElevenLabs
   OPENAI_API_KEY=your_key                # OpenAI TTS
   ```

### Frontend Setup
1. Ensure Next.js development server is running:
   ```bash
   cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
   npm run dev
   ```

2. Verify environment variables:
   ```bash
   # In .env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Test Cases

### Test 1: Basic Modal Opening
**Objective**: Verify symbol click opens the modal

**Steps**:
1. Navigate to `http://localhost:3026` (or your configured port)
2. Scroll to "Moonshot Tier Monitor" section
3. Click on any symbol in the table (e.g., "PLTR", "DKNG")

**Expected Results**:
- Modal opens with loading spinner
- Symbol name appears in header
- Loading message displays "Analyzing {SYMBOL}..."

**Pass/Fail**: ___

---

### Test 2: Analysis Data Loading
**Objective**: Verify analysis data loads correctly

**Steps**:
1. Click on a symbol that has recent OHLC data
2. Wait for analysis to complete

**Expected Results**:
- Loading spinner disappears
- Current price displays in header
- Price change percentage shows (green for positive, red for negative)
- Volume displays formatted (e.g., "5.2M")
- Consensus section shows:
  - Action chip (BUY/SELL/HOLD)
  - Confidence percentage
  - Alignment status
  - Bullish/bearish timeframe counts

**Pass/Fail**: ___

---

### Test 3: Multi-Timeframe Analysis
**Objective**: Verify timeframe tabs work correctly

**Steps**:
1. Open symbol analysis modal
2. Click on each timeframe tab (5M, 15M, 30M)

**Expected Results**:
- Each tab shows different analysis data
- Technical indicators update per timeframe:
  - Trend (bullish/bearish/neutral)
  - Momentum indicators
  - RSI with color coding
  - MACD values
  - Bollinger Bands
  - ADX
  - EMA 9 and 21
  - ATR
  - Volume ratio

**Pass/Fail**: ___

---

### Test 4: Entry/Exit Strategy Display
**Objective**: Verify strategy calculations show when action is BUY or SELL

**Steps**:
1. Find a symbol with BUY or SELL recommendation
2. Review the Entry/Exit Strategy section

**Expected Results**:
- Entry price displayed
- Stop loss shown in red
- Three take profit targets shown in green (TP1, TP2, TP3)
- Risk/reward ratio calculated (e.g., "1:2.0")
- Position size percentage recommended
- Reasoning text explains the setup

**Pass/Fail**: ___

---

### Test 5: Audio Playback
**Objective**: Verify TTS audio generation and playback

**Steps**:
1. Open symbol analysis modal (with audio enabled)
2. Wait for audio URL to load
3. Click play button (▶️ icon)
4. Wait for audio to start
5. Click pause button

**Expected Results**:
- Play button appears in modal header (if audio_url exists)
- Clicking play starts audio narration
- Icon changes to pause (⏸) while playing
- Audio describes the analysis summary
- Clicking pause stops the audio
- Audio stops automatically when complete

**Pass/Fail**: ___

**Note**: If audio doesn't generate:
- Check backend logs for TTS service errors
- Verify Supabase Storage bucket "analysis-audio" exists
- Check TTS provider configuration

---

### Test 6: Refresh Functionality
**Objective**: Verify refresh button forces new analysis

**Steps**:
1. Open symbol analysis modal
2. Wait for initial analysis to load
3. Click refresh button (🔄 icon in header)
4. Observe loading state

**Expected Results**:
- Refresh button shows loading spinner
- New analysis data fetches from backend
- Cache is bypassed (check network tab for `refresh=true` param)
- Updated timestamp in response

**Pass/Fail**: ___

---

### Test 7: Caching Behavior
**Objective**: Verify 15-minute caching works

**Steps**:
1. Open modal for symbol "PLTR"
2. Close modal
3. Immediately reopen modal for same symbol
4. Check browser network tab

**Expected Results**:
- Second request returns faster (cached)
- Network request shows 304 (if browser cached)
- Backend returns cached result within 15 minutes
- After 15 minutes, fresh analysis is generated

**Pass/Fail**: ___

---

### Test 8: Error Handling - No Data
**Objective**: Verify graceful error handling for symbols without data

**Steps**:
1. Click on a symbol that has no OHLC data
2. Observe error message

**Expected Results**:
- Error icon displays
- Error message: "Insufficient data for analysis" or similar
- "Try Again" button appears
- No crash or undefined errors in console

**Pass/Fail**: ___

---

### Test 9: Error Handling - API Failure
**Objective**: Verify error handling when backend is down

**Steps**:
1. Stop the backend API service
2. Click on a symbol
3. Observe error message

**Expected Results**:
- Error displays gracefully
- Error message indicates connection failure
- "Try Again" button appears
- User can close modal and try again

**Pass/Fail**: ___

---

### Test 10: Responsive Design
**Objective**: Verify modal works on different screen sizes

**Steps**:
1. Open modal on desktop (1920x1080)
2. Open modal on tablet size (768px width)
3. Open modal on mobile size (375px width)

**Expected Results**:
- Modal is scrollable on all sizes
- Content remains readable
- Buttons are accessible
- Tabs wrap appropriately
- No horizontal overflow

**Pass/Fail**: ___

---

### Test 11: Database Persistence
**Objective**: Verify analyses are stored in database

**Steps**:
1. Perform several symbol analyses
2. Check database:
   ```sql
   SELECT 
     id,
     symbol,
     analysis_timestamp,
     timeframes,
     audio_url,
     cached_until
   FROM moonshot.symbol_analyses
   ORDER BY analysis_timestamp DESC
   LIMIT 10;
   ```

**Expected Results**:
- Each analysis creates a record
- Symbol, timeframes, and timestamp are correct
- audio_url is populated (if TTS succeeded)
- cached_until is set to 15 minutes after creation

**Pass/Fail**: ___

---

### Test 12: Performance Test
**Objective**: Measure response time for analysis

**Steps**:
1. Open browser developer tools (Network tab)
2. Click on a symbol
3. Measure time to complete

**Expected Results**:
- First request (uncached): < 5 seconds
- Cached request: < 500ms
- No memory leaks after multiple opens/closes
- Smooth animations and transitions

**Pass/Fail**: ___

---

## Backend API Testing

### Direct API Test
Test the endpoint directly:

```bash
# Test symbol analysis endpoint
curl -X GET "http://localhost:8000/api/moonshot/symbol-analysis/PLTR?timeframes=5m,15m,30m&include_audio=true" \
  -H "Content-Type: application/json" | jq

# Test with refresh
curl -X GET "http://localhost:8000/api/moonshot/symbol-analysis/PLTR?refresh=true" \
  -H "Content-Type: application/json" | jq
```

**Expected Response Structure**:
```json
{
  "symbol": "PLTR",
  "timestamp": "2025-11-12T10:30:00Z",
  "current_price": 25.50,
  "price_change_pct": 2.5,
  "volume": 5200000,
  "timeframe_analyses": {
    "5m": { ... },
    "15m": { ... },
    "30m": { ... }
  },
  "consensus": {
    "action": "BUY",
    "confidence": 0.75,
    "bullish_timeframes": 2,
    "bearish_timeframes": 0,
    "neutral_timeframes": 1,
    "avg_signal_strength": 65,
    "alignment": "strong"
  },
  "strategy": {
    "action": "BUY",
    "entry_price": 25.50,
    "stop_loss": 24.80,
    "take_profit_1": 26.20,
    "take_profit_2": 26.90,
    "take_profit_3": 27.95,
    "risk_reward_ratio": 2.0,
    "position_size_pct": 2.0,
    "reasoning": "..."
  },
  "summary_text": "Analysis for PLTR...",
  "audio_url": "https://your-supabase-url/storage/v1/object/public/analysis-audio/PLTR_20251112_10.mp3"
}
```

---

## Supabase Storage Testing

### Verify Storage Bucket

1. Log into Supabase Dashboard
2. Navigate to Storage
3. Check for "analysis-audio" bucket
4. Verify:
   - Bucket is public
   - Files are being created
   - Files are accessible via URL
   - Old files are being cleaned up (optional)

### Create Bucket Manually (if needed)
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-audio', 'analysis-audio', true);

-- Set file size limits and policies
-- (Configure through Supabase dashboard or SQL)
```

---

## Common Issues and Fixes

### Issue: Modal doesn't open
**Fix**: Check browser console for errors. Ensure import path is correct.

### Issue: "Insufficient data for analysis"
**Fix**: 
- Verify OHLC data exists in `market_data.ohlcv_1min` for the symbol
- Check that TA data exists in `daily_scalp.ta_*` tables
- Run data collection services to populate data

### Issue: Audio doesn't play
**Fix**:
- Check TTS service configuration
- Verify Supabase credentials
- Check browser console for CORS errors
- Try different TTS provider (fallback to gTTS)

### Issue: Slow performance
**Fix**:
- Check database indexes are created
- Verify Redis cache is working
- Optimize OHLC queries (limit time range)
- Check network connection between services

### Issue: "Failed to fetch analysis"
**Fix**:
- Verify backend API is running
- Check CORS configuration
- Verify API URL in frontend .env
- Check backend logs for errors

---

## Success Criteria

✅ All test cases pass
✅ No console errors in browser
✅ Backend logs show no errors
✅ Database records are created
✅ Audio files are stored and playable
✅ Caching works correctly
✅ Performance is acceptable (< 5s initial, < 500ms cached)
✅ Mobile responsive works
✅ Error handling is graceful

---

## Next Steps After Testing

1. Monitor production logs for errors
2. Set up automated cleanup of old analyses (7 days)
3. Implement rate limiting if needed
4. Add user analytics to track usage
5. Consider adding more TTS voices/languages
6. Add keyboard shortcuts (ESC to close, etc.)
7. Implement favorite symbols feature
8. Add export analysis as PDF/image

---

## Date Tested: __________
## Tested By: __________
## Overall Status: PASS / FAIL
## Notes:

