# FFP Stock AI Frontend

Moonshot internal dashboards powered by Next.js 15 (App Router), Supabase authentication, and HeroUI.

## Stack

- Next.js 15 (App Router, server actions)
- Supabase (auth + PostgREST data)
- HeroUI v2 + Tailwind CSS
- TypeScript / ESLint / Prettier

## Getting Started

```bash
npm install
npm run dev
```

The app expects Supabase credentials in `.env.local`. Copy the example file and adjust the values:

```bash
cp env.example .env.local
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | PostgREST endpoint exposed to the browser (e.g. `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key for client-side auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used by server routes for privileged reads |
| `SUPABASE_KONG_URL` | Optional Kong gateway URL (falls back to `SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL`) |

Restart the dev server after changing environment variables.

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

- `npm run dev` – start the Next.js dev server with Turbopack
- `npm run build` – production build
- `npm start` – serve the built app
- `npm run lint` – run ESLint with `--fix`

## License

MIT
