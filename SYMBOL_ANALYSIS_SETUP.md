# Symbol Analysis Modal - Setup & Implementation Summary

## Overview
AI-powered symbol analysis feature that displays comprehensive technical analysis, entry/exit strategies with specific price targets, and text-to-speech audio summaries.

## Architecture

### Backend (FastAPI)
- **API Endpoint**: `/api/moonshot/symbol-analysis/{symbol}`
- **Services**:
  - `SymbolAnalysisService`: Integrates AI agents and performs multi-timeframe analysis
  - `TTSService`: Generates audio summaries and uploads to Supabase Storage
- **Database**: PostgreSQL with new `moonshot.symbol_analyses` table
- **Caching**: Redis (15-minute TTL)

### Frontend (Next.js + React)
- **Components**:
  - `SymbolAnalysisModal`: Main modal with tabs and audio player
  - Updated `TierDashboard`: Clickable symbol rows
- **Services**:
  - `symbolAnalysis.ts`: API integration and TypeScript types

## Files Created/Modified

### Backend Files
```
FFP_stock_ai/services/api/src/
├── services/
│   ├── symbol_analysis_service.py  [NEW]
│   └── tts_service.py              [NEW]
└── routes/
    └── moonshot_routes.py          [MODIFIED - added endpoint]

FFP_stock_ai/supabase/migrations/
└── 098_symbol_analysis_tracking.sql [NEW]
```

### Frontend Files
```
ffp-stock-ai-front-v2/
├── components/dashboard/
│   ├── SymbolAnalysisModal.tsx     [NEW]
│   └── TierDashboard.tsx           [MODIFIED]
└── lib/services/
    └── symbolAnalysis.ts           [NEW]
```

## Quick Setup

### 1. Apply Database Migration
```bash
cd /home/ert/projects/trading/FFP_stock_ai
psql -h localhost -U postgres -d stock_db -f supabase/migrations/098_symbol_analysis_tracking.sql
```

### 2. Install Python Dependencies (if needed)
```bash
cd /home/ert/projects/trading/FFP_stock_ai/services/api
pip install supabase gtts  # For Supabase storage and fallback TTS
```

### 3. Configure Environment Variables
```bash
# Backend .env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_service_role_key

# Optional TTS providers (choose one):
PIPER_TTS_HOST=http://localhost:5000
ELEVENLABS_API_KEY=your_key
OPENAI_API_KEY=your_key
```

```bash
# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Create Supabase Storage Bucket
Option A - Via Supabase Dashboard:
1. Go to Storage section
2. Create new bucket: `analysis-audio`
3. Make it public
4. Set file size limit: 10MB

Option B - Via SQL:
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-audio', 'analysis-audio', true);
```

### 5. Restart Services
```bash
# Backend
cd /home/ert/projects/trading/FFP_stock_ai/services/api
python -m uvicorn src.main:app --reload

# Frontend
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
npm run dev
```

## Usage

1. Navigate to the homepage
2. Scroll to "Moonshot Tier Monitor" section
3. Click any symbol in the table
4. Modal opens with:
   - Current price and % change
   - AI consensus (BUY/SELL/HOLD)
   - Multi-timeframe analysis (5m, 15m, 30m tabs)
   - Entry/exit strategy with specific prices
   - Audio playback button
5. Click play button to hear analysis summary
6. Click refresh button to force new analysis

## Features

### Analysis Data
- ✅ Current price and % change
- ✅ Volume with formatting
- ✅ Consensus action with confidence
- ✅ Timeframe alignment (strong/moderate/weak)
- ✅ Bullish vs bearish timeframe counts

### Technical Indicators (per timeframe)
- ✅ Trend (bullish/bearish/neutral)
- ✅ Momentum indicators
- ✅ RSI with color coding
- ✅ MACD (line, signal, histogram)
- ✅ Bollinger Bands (upper, middle, lower)
- ✅ ADX (trend strength)
- ✅ EMA 9 and 21
- ✅ ATR (volatility)
- ✅ Volume ratio

### Entry/Exit Strategy
- ✅ Entry price
- ✅ Stop loss (1.5x ATR)
- ✅ Take profit 1 (2x ATR - 1:1.33 R:R)
- ✅ Take profit 2 (3x ATR - 1:2 R:R)
- ✅ Take profit 3 (4.5x ATR - 1:3 R:R)
- ✅ Risk/reward ratio calculation
- ✅ Position size recommendation (1-3% of portfolio)
- ✅ Reasoning explanation

### Audio Features
- ✅ Text-to-speech generation
- ✅ Multiple TTS provider support:
  - Piper (local, fast)
  - ElevenLabs (high quality)
  - OpenAI (reliable)
  - gTTS (fallback)
- ✅ Upload to Supabase Storage
- ✅ Browser audio player with play/pause
- ✅ Audio caching (hourly buckets)

### Performance
- ✅ Redis caching (15-minute TTL)
- ✅ Database persistence
- ✅ Hybrid data approach (cached + fresh from Alpaca)
- ✅ Optimized OHLC queries (4-hour window)
- ✅ Responsive modal design

## API Endpoints

### Get Symbol Analysis
```
GET /api/moonshot/symbol-analysis/{symbol}
```

**Query Parameters**:
- `timeframes` (string): Comma-separated list (default: "5m,15m,30m")
- `refresh` (boolean): Force refresh cache (default: false)
- `include_audio` (boolean): Generate TTS audio (default: true)

**Response**:
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
    "alignment": "strong"
  },
  "strategy": {
    "entry_price": 25.50,
    "stop_loss": 24.80,
    "take_profit_1": 26.20,
    "take_profit_2": 26.90,
    "take_profit_3": 27.95,
    "risk_reward_ratio": 2.0,
    "position_size_pct": 2.0
  },
  "audio_url": "https://..."
}
```

## Data Flow

1. User clicks symbol in table
2. Frontend opens modal with loading state
3. Frontend calls `/api/moonshot/symbol-analysis/{symbol}`
4. Backend checks Redis cache (15 min)
5. If not cached:
   - Fetch OHLC data (last 4 hours)
   - Aggregate to 5m, 15m, 30m
   - Fetch TA indicators from database
   - Analyze each timeframe
   - Generate consensus
   - Calculate entry/exit strategy
   - Generate summary text
   - Call TTS service
   - Upload audio to Supabase
   - Store in database
   - Cache in Redis
6. Return analysis to frontend
7. Frontend displays data in modal
8. User can play audio summary

## TTS Service Details

### Supported Providers
1. **Piper TTS** (Recommended for local)
   - Fast, neural TTS
   - Runs locally
   - No API costs
   - Setup: https://github.com/rhasspy/piper

2. **ElevenLabs**
   - High quality voices
   - API-based
   - Requires API key
   - Cost per character

3. **OpenAI TTS**
   - Reliable quality
   - API-based
   - Requires API key
   - Cost per character

4. **gTTS** (Fallback)
   - Google Text-to-Speech
   - Free but quality varies
   - Used when other providers fail

### Audio File Management
- Files stored in Supabase Storage bucket: `analysis-audio`
- Naming: `{SYMBOL}_{YYYYMMDD}_{HH}.mp3`
- Hourly caching (avoid regeneration)
- Optional: Clean up files older than 7 days

## Database Schema

### moonshot.symbol_analyses
```sql
CREATE TABLE moonshot.symbol_analyses (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  analysis_timestamp TIMESTAMPTZ DEFAULT NOW(),
  timeframes TEXT[] NOT NULL,
  analysis_data JSONB NOT NULL,
  audio_url TEXT,
  cached_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_symbol_analyses_symbol ON moonshot.symbol_analyses(symbol);
CREATE INDEX idx_symbol_analyses_timestamp ON moonshot.symbol_analyses(analysis_timestamp DESC);
CREATE INDEX idx_symbol_analyses_cached_until ON moonshot.symbol_analyses(cached_until);
```

## Troubleshooting

### "Insufficient data for analysis"
- Ensure OHLC data exists in `market_data.ohlcv_1min`
- Check TA indicators in `daily_scalp.ta_5m`, `ta_15m`, `ta_30m`
- Run data collection services

### Audio not playing
- Check TTS service logs
- Verify Supabase Storage bucket exists
- Check browser console for CORS errors
- Try fallback TTS provider

### Slow performance
- Verify Redis is running and configured
- Check database indexes
- Optimize OHLC query time range
- Monitor backend logs

### CORS errors
- Verify `NEXT_PUBLIC_API_URL` in frontend
- Check backend CORS middleware
- Ensure Supabase Storage bucket is public

## Performance Optimization

### Current Optimizations
- Redis caching (15-minute TTL)
- OHLC query limited to 4 hours
- Database indexes on symbol, timestamp
- Audio file caching (hourly buckets)
- Frontend component memoization

### Future Optimizations
- WebSocket for real-time updates
- Progressive loading of timeframes
- Image caching for frequent symbols
- CDN for audio files
- Server-side rendering for initial load

## Security Considerations

- ✅ Input validation on symbol parameter
- ✅ Rate limiting via Redis cache
- ✅ SQL injection prevention (parameterized queries)
- ✅ Audio file size limits (10MB)
- ✅ Public storage bucket (read-only)
- ⚠️ Consider: API authentication for production
- ⚠️ Consider: User-specific rate limits

## Monitoring & Maintenance

### Metrics to Track
- API response times
- Cache hit rates
- Analysis success/failure rates
- Audio generation success rates
- Storage usage
- User engagement (clicks per symbol)

### Maintenance Tasks
- Clean up old analyses (7+ days)
- Clean up old audio files
- Monitor storage usage
- Review error logs
- Update AI models/strategies

### Cleanup Function
```sql
-- Run daily to delete old records
SELECT moonshot.cleanup_old_symbol_analyses();
```

## Future Enhancements

### Planned Features
- [ ] Export analysis as PDF
- [ ] Save favorite symbols
- [ ] Compare multiple symbols
- [ ] Historical analysis charts
- [ ] Backtest strategy suggestions
- [ ] Email/SMS alerts for signals
- [ ] Customizable TA parameters
- [ ] Multi-language TTS
- [ ] Voice selection (male/female)

### Integration Ideas
- [ ] Connect to broker for live trading
- [ ] Integrate with portfolio tracker
- [ ] Add social sentiment scores
- [ ] Include news catalyst analysis
- [ ] Add options flow data
- [ ] Implement paper trading simulator

## Support

For issues or questions:
1. Check testing guide: `SYMBOL_ANALYSIS_TESTING.md`
2. Review backend logs: `/home/ert/projects/trading/FFP_stock_ai/logs/`
3. Check frontend console errors
4. Verify database connection and data availability

## License & Credits

Built with:
- FastAPI (backend)
- Next.js + React (frontend)
- PostgreSQL (database)
- Redis (caching)
- Supabase (storage)
- Various TTS providers

---

**Last Updated**: 2025-11-12
**Version**: 1.0.0
**Status**: Production Ready ✅

