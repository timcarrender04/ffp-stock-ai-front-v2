# AI Agent Chat Room - Integration Guide

## Overview

This document provides instructions for integrating the AI Agent Chat Room system into your FFP Stock AI application.

## What's Been Implemented

### Backend Services (Python/FastAPI)
- ✅ Database migrations for `ai_chat` schema
- ✅ Market Context Service - aggregates OHLC, news, social sentiment, moonshot data
- ✅ AI Agent Orchestrator - manages 4 AI agent personas (Nova, Atlas, Cipher, Sentinel)
- ✅ Grok News Validator - validates news impact using Grok API
- ✅ Conversation Scheduler - manages agent speaking turns and market pulse updates
- ✅ WebSocket endpoint `/ws/ai-chat` for real-time agent message streaming
- ✅ Chat Archival Service - 24-hour message retention with automatic cleanup

### Frontend Components (Next.js/React)
- ✅ ChatProvider - global state management with hybrid WebSocket + Supabase Realtime
- ✅ AgentCard - displays agent info, activity, and confidence
- ✅ ChatMessage - renders messages with tagging, confidence bars, inline market data
- ✅ MentionInput - rich input with @agent and $symbol autocomplete
- ✅ AIAgentChatRoom - complete chat interface with message stream and agent cards
- ✅ FloatingChatWidget - minimizable/expandable floating chat widget

## Integration Steps

### Step 1: Wrap App with ChatProvider

Edit `/home/ert/projects/web-apps/ffp-stock-ai-front-v2/app/providers.tsx`:

```typescript
"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { ChatProvider } from "@/lib/ai-chat/ChatProvider"; // Add this

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <AuthProvider>
          <ChatProvider>  {/* Add this wrapper */}
            {children}
          </ChatProvider>
        </AuthProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
```

### Step 2: Add Floating Widget to Layout

Edit `/home/ert/projects/web-apps/ffp-stock-ai-front-v2/app/layout.tsx`:

```typescript
import { FloatingChatWidget } from "@/components/ai-chat/FloatingChatWidget";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>
          <div className="relative flex flex-col h-screen">
            <Navbar />
            <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
              {children}
            </main>
            <footer className="w-full flex items-center justify-center py-3">
              {/* ...footer content... */}
            </footer>
            <FloatingChatWidget /> {/* Add this */}
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

### Step 3: Integrate with TierDashboard

Edit `/home/ert/projects/web-apps/ffp-stock-ai-front-v2/components/dashboard/TierDashboard.tsx`:

Add import at top:
```typescript
import { useChat } from "@/lib/ai-chat/ChatProvider";
```

Inside component:
```typescript
export function TierDashboard() {
  const { addSymbolToWatch, openChat } = useChat(); // Add this
  
  // ... existing code ...
  
  const handleSymbolClick = (symbol: string) => {
    setSelectedSymbol(symbol);
    setIsModalOpen(true);
    
    // Also add to chat room context
    addSymbolToWatch(symbol);
    openChat(); // Optional: auto-open chat
  };
  
  // ... rest of component ...
}
```

## Backend Setup

### Step 4: Run Database Migrations

```bash
cd /home/ert/projects/trading/FFP_stock_ai

# Apply chat schema migration
psql $DATABASE_URL -f supabase/migrations/110_ai_agent_chat.sql
psql $DATABASE_URL -f supabase/migrations/111_enable_realtime_chat.sql
```

### Step 5: Add AI Chat Routes to FastAPI

Edit `/home/ert/projects/trading/FFP_stock_ai/services/api/src/main.py`:

```python
# Add near other route imports (around line 285)
from src.routes.ai_chat_routes import router as ai_chat_router
app.include_router(ai_chat_router)
```

### Step 6: Environment Variables

Add to `/home/ert/projects/trading/FFP_stock_ai/.env`:

```bash
# AI Chat Configuration
AI_CHAT_ENABLED=true
AI_CHAT_PULSE_INTERVAL=120  # seconds between market pulse updates
AI_CHAT_MAX_HISTORY=1000

# LLM API Keys (if not already set)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Grok API (optional, for news validation)
XAI_API_KEY=your_xai_key_here
```

Add to `/home/ert/projects/web-apps/ffp-stock-ai-front-v2/.env.local`:

```bash
# Backend API URL (should already exist)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase config (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Step 7: Install Python Dependencies

```bash
cd /home/ert/projects/trading/FFP_stock_ai/services/api

# Add to requirements.txt if not present:
# openai>=1.0.0
# anthropic>=0.8.0
# httpx>=0.25.0

pip install -r requirements.txt
```

### Step 8: Start Services

```bash
# Terminal 1: Start Backend
cd /home/ert/projects/trading/FFP_stock_ai
docker-compose up -d  # or your preferred method

# Terminal 2: Start Frontend
cd /home/ert/projects/web-apps/ffp-stock-ai-front-v2
npm run dev
```

## Usage

### For Users

1. **Open Chat**: Click the floating green button in bottom-right corner (or press Alt+C)
2. **Ask Questions**: Type naturally, mention agents with @nova, @atlas, etc.
3. **Add Symbols**: Click any symbol in the dashboard, or type $PLTR in chat
4. **View Agent Analysis**: See real-time analysis from 4 different AI perspectives
5. **Resize**: Click expand/minimize buttons in chat header
6. **Close**: Click X button or press Alt+C again

### For Developers

#### Testing Locally

```bash
# Test WebSocket connection
wscat -c ws://localhost:8000/api/ai-chat/ws/chat

# Send init message
{"type": "init", "data": {"symbols": ["PLTR", "NVDA"]}}

# Send user message
{"type": "user_message", "data": {"content": "What do you think about PLTR?", "user_id": "test-user"}}
```

#### API Endpoints

- `GET /api/ai-chat/session` - Get or create active session
- `GET /api/ai-chat/messages` - Get recent messages
- `POST /api/ai-chat/symbols/add` - Add symbols to watch
- `GET /api/ai-chat/agent/{agent_id}/stats` - Get agent statistics
- `POST /api/ai-chat/archive` - Manually trigger archival
- `WS /api/ai-chat/ws/chat` - WebSocket for real-time messages

## Agent Personas

### Nova 🔬 (Technical Analyst)
- **Specialty**: Chart patterns, indicators, support/resistance
- **LLM**: OpenAI GPT-4o
- **Style**: Precise, data-driven, references specific levels

### Atlas 🌍 (Macro Trader)
- **Specialty**: Market sentiment, economic indicators, news
- **LLM**: Anthropic Claude Sonnet
- **Style**: Strategic, contextual, narrative-driven

### Cipher 📊 (Quantitative Strategist)
- **Specialty**: Statistical models, volume analysis, correlations
- **LLM**: OpenAI GPT-4o
- **Style**: Quantitative, probability-based, data-heavy

### Sentinel 🛡️ (Risk Manager)
- **Specialty**: Risk assessment, position sizing, volatility
- **LLM**: Anthropic Claude Sonnet
- **Style**: Risk-focused, protective, balanced

## Troubleshooting

### WebSocket Not Connecting

1. Check backend is running: `curl http://localhost:8000/health`
2. Verify CORS settings in backend allow frontend origin
3. Check browser console for errors
4. Ensure firewall allows WebSocket connections

### Agents Not Responding

1. Check LLM API keys are set correctly
2. Verify database has data in required schemas (market_data, moonshot, etc.)
3. Check backend logs: `docker-compose logs api`
4. Ensure conversation scheduler is started

### Messages Not Persisting

1. Verify database migrations ran successfully
2. Check Supabase Realtime is enabled
3. Ensure session was created properly
4. Check database connection in backend

### High API Costs

1. Reduce `AI_CHAT_PULSE_INTERVAL` (increase seconds between updates)
2. Limit number of symbols being watched
3. Adjust agent `max_tokens` in agent_behaviors.py
4. Use fewer agents or disable some

## Performance Optimization

### Reduce Token Usage

Edit `/home/ert/projects/trading/FFP_stock_ai/services/api/src/agents/agent_behaviors.py`:

```python
# Reduce max_tokens for all agents
max_tokens=150  # instead of 300
```

### Adjust Update Frequency

Edit conversation scheduler or set environment variable:

```bash
AI_CHAT_PULSE_INTERVAL=300  # 5 minutes instead of 2
```

### Limit Active Symbols

In ChatProvider, limit how many symbols can be watched:

```typescript
const addSymbolToWatch = useCallback((symbol: string) => {
  if (activeSymbols.length >= 5) {  // Add limit
    console.log("Max symbols reached");
    return;
  }
  // ... rest of code
}, [activeSymbols]);
```

## Future Enhancements

- [ ] Voice input/output for messages
- [ ] Agent personality customization
- [ ] Custom agent creation
- [ ] Message search and filtering
- [ ] Export conversation history
- [ ] Share insights directly to social media
- [ ] Multi-user room support
- [ ] Private agent conversations
- [ ] Integration with trading execution
- [ ] Mobile app support

## Support

For issues or questions:
1. Check logs: `docker-compose logs api`
2. Review browser console for frontend errors
3. Verify all environment variables are set
4. Ensure database migrations completed
5. Test WebSocket connection manually

## License

Part of FFP Stock AI Platform - All rights reserved

