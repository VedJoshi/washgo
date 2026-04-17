# WashGo Copilot

Hackathon MVP for Tasco Open Mobility built with React, TypeScript, Vite, Tailwind, mock vehicle data, and Supabase Auth.

## Supabase Auth Setup

This app uses **Supabase Auth only** on the frontend. No service-role keys or database logic are required for the current MVP.

Create a `.env.local` file in the project root with:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can also copy from `.env.example`.

### Recommended Supabase settings

- Enable **Email** provider in Supabase Auth
- Use **magic links** for the demo login flow
- Add your local dev URL to allowed redirect URLs, for example:
  - `http://localhost:5173`

## Run Locally

```bash
npm install
npm run dev:local
```

Then open [http://localhost:5173](http://localhost:5173), sign in with a magic link, and test all flows locally (including Lens).

Optional production-like local check:

```bash
npm run build
npm run preview:local
```

Open [http://localhost:4173](http://localhost:4173).

## Deploy to Vercel (Optional)

This is a standard **Vite static frontend** deployment. No custom backend, serverless API, or service-role key is needed.

### Vercel project settings

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`

### Vercel environment variables

Add these in Vercel for **Production** and **Preview**:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Auth redirect setup

Set your Supabase **Site URL** to your primary deployed app URL, for example:

```bash
https://your-project-name.vercel.app
```

Add these to **Additional Redirect URLs**:

```bash
http://localhost:5173/**
https://your-project-name.vercel.app/**
https://*-your-team-or-account-slug.vercel.app/**
```

If you later add a custom domain, add that too and make it the Supabase Site URL.

### Deploy steps

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Add the two `VITE_` environment variables in Vercel.
4. Deploy.
5. Copy the production Vercel URL into Supabase **Site URL**.
6. Add the local, production, and preview redirect URLs in Supabase Auth.
7. Redeploy once if you changed env vars after the first deploy.

## Notes

- Vehicle, booking, and assistant data are still mock-driven
- Auth session persists across refresh via Supabase client storage
- Only the public Supabase URL and anon key belong in the frontend
- `vercel.json` is included only to support SPA route refreshes like `/vehicle` and `/assistant`
