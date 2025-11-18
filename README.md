# FFP Stock AI Frontend

Moonshot internal dashboards powered by Next.js 15 (App Router), Supabase authentication, and HeroUI.

**Status**: ✅ Production Ready | 🚀 Deployed on GitHub  
**Repository**: https://github.com/timcarrender04/ffp-stock-ai-front-v2  
**Docker Image**: `ffp-stock-ai-frontend:latest`

## Stack

- Next.js 15 (App Router, server actions)
- Supabase (auth + PostgREST data)
- HeroUI v2 + Tailwind CSS
- TypeScript / ESLint / Prettier
- Docker (multi-stage production build)
- Portainer-ready deployment

## Getting Started

```bash
npm install
npm run dev
```

### Environment loading

- `.env` is now the **canonical env file** for both Docker and the local dev server. Keep the production-mirroring values (Supabase/API URLs, keys, etc.) inside this file so everything matches.
- If `.env` is missing, `npm run dev` falls back to `ffp.env.text`, which still contains the same defaults checked into the repo.
- Update whichever file you’re using and restart `npm run dev` to pick up changes.

> `.env.local` from `env.example` is optional; it’s fine to keep using it for ad-hoc overrides, but the standard workflow expects `.env`.

## Supabase workflow

Local Supabase resources live in `../trading/FFP_stock_ai/supabase`. To bootstrap the database and seed data:

```bash
cd ../trading/FFP_stock_ai
supabase db reset --seed
```

The seed file now provisions a default dashboard user:

- Email: `tim.carrender@gmail.com`
- Password: `Jayson09`

You can log in via `/login` using those credentials. Run the reset command again if you need to recreate the user.

## Scripts

### NPM Scripts

- `npm run dev` – start the Next.js dev server with Turbopack
- `npm run build` – production build
- `npm start` – serve the built app
- `npm run lint` – run ESLint with `--fix`

### Utility Scripts

Additional utility scripts are available in the [`scripts/`](./scripts/) directory:
- `DIAGNOSTIC.sh` – Run diagnostic checks
- `QUICK_START.sh` – Quick start script
- `PUSH_TO_GIT.sh` – Git push with checks
- See [`scripts/README.md`](./scripts/README.md) for details

## Deployment

### Docker Deployment (Recommended)

**Local testing:**
```bash
docker-compose up -d
curl http://localhost:3000
docker-compose down
```

**Production (Portainer):**
1. Open Portainer: `http://your-server:9000`
2. Containers → Create Container
3. Image: `ffp-stock-ai-frontend:latest`
4. Port: 3000:3000
5. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` (from Supabase dashboard)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Supabase dashboard)
   - `NEXT_PUBLIC_API_URL` (optional, your backend API)
6. Click Deploy!

### Documentation

All project documentation has been organized in the [`docs/`](./docs/) directory:

**Quick Links:**
- **[Getting Started Guide](./docs/START_HERE.md)** – Main entry point for new developers
- **[Quick Start](./docs/QUICK_START.md)** – Get up and running quickly
- **[Authentication Guide](./docs/START_HERE_AUTHENTICATION.md)** – Auth setup and usage
- **[AI Agent Integration](./docs/AI_AGENT_CHAT_INTEGRATION.md)** – AI agents and chat features
- **[Deployment Guide](./docs/QUICK_DEPLOY.md)** – Deploy the application
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** – Common issues and solutions

See the complete **[Documentation Index](./docs/README.md)** for all available guides organized by category.

## License

MIT
