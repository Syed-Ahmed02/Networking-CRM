## Networking CRM (CoffeeAgent.AI)

CoffeeAgent.AI is an AI-assisted networking CRM that helps operators research companies, discover key people, and run highly-personalized outreach. It combines a modern Next.js front end with Convex for realtime data, Clerk for authentication, and AI agents powered by OpenRouter and Exa search.

---

## Feature Highlights

- **AI Copilot** — conversational agent that can research companies, surface decision makers, and summarize findings directly in the dashboard chat.
- **Contact & Outreach Workspace** — track contacts, outreach history, follow-up recommendations, and AI-generated messaging in one place.
- **Calendar-Aware CRM** — see scheduled meetings, upcoming follow-ups, and activity history seeded with realistic demo data.
- **Data Persistence via Convex** — realtime backend functions handle contacts, outreach, activity logs, integrations, and seeding workflows.
- **Authentication & Theming** — Clerk handles sign in/out; dark/light theme toggle persists across the app with `next-themes`.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19 and TypeScript
- **Backend**: Convex for serverless database + functions
- **Authentication**: Clerk
- **AI & Search**: `@ai-sdk/react`, OpenRouter (Claude 3.5 Sonnet), Exa search
- **UI**: Tailwind CSS v4, Radix UI primitives, shadcn-inspired components, Lucide icons, Framer Motion
- **Data Grid**: TanStack Table

---

## Project Structure

- `app/` – Next.js routes/layouts for marketing site and authenticated dashboard (calendar, chat, contacts, outreach, settings).
- `components/` – Reusable UI primitives, layout chrome, and marketing sections.
- `convex/` – Convex schema, server functions, and seed scripts powering CRM data.
- `lib/` – AI agent implementations, configuration, and utilities.
- `hooks/` – Reusable React hooks (`use-media-query`, `use-mobile`).
- `public/` – Static assets.

---

## Getting Started

### Prerequisites

- Node.js 20+
- PNPM (recommended) or another Node package manager
- Convex CLI (`npm install -g convex` or `pnpm add -D convex` to use locally)

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root and provide the following values:

```bash
# Next.js ↔ Convex
NEXT_PUBLIC_CONVEX_URL="https://<your-convex-deployment>.convex.cloud"

# Convex auth integration
CLERK_JWT_ISSUER_DOMAIN="https://<your-clerk-issuer>.clerk.accounts.dev"

# Clerk (frontend + backend)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI + Search providers
OPENROUTER_API_KEY="or_prod_..."
EXA_API_KEY="ex_prod_..."
```

Additional Convex environment (e.g. `CONVEX_DEPLOYMENT`, `NEXT_PUBLIC_APP_URL`) can be managed via `npx convex env set` or `.env.local` as needed by your deployment.

### Running Locally

The Convex backend and Next.js frontend run as separate processes:

```bash
# Start Convex (database + functions)
npx convex dev

# In a separate terminal, start the Next.js app
pnpm dev
```

Visit `http://localhost:3000` for the marketing site and `http://localhost:3000/dashboard` after signing in with Clerk.

---

## Seeding Demo Data

1. Ensure a Clerk user exists that matches the placeholder ID in `convex/seed.ts` (`DEFAULT_CLERK_USER_ID`). Update the ID if you want to seed data for a different user.
2. With Convex running (`npx convex dev`), execute:

```bash
npx convex run seed:init
```

This populates contacts, follow-up recommendations, outreach messages, activity logs, and calendar events for the selected user.

---

## Available Scripts

```bash
pnpm dev      # Run Next.js in development mode
pnpm build    # Create a production build
pnpm start    # Serve the production build
pnpm lint     # Run ESLint across the project
```

---

## Deployment Notes

- Deploy the Next.js app (e.g. Vercel) and Convex separately. Update `NEXT_PUBLIC_CONVEX_URL` to the production Convex deployment URL.
- Configure Clerk production keys and issuer domain in the hosting provider’s environment settings.
- Provision OpenRouter and Exa API keys with sufficient quotas for AI research features.

---

## Contributing

1. Fork and clone the repository.
2. Create a feature branch.
3. Make your changes and run `pnpm lint`.
4. Submit a PR describing the update, screenshots of UI changes, and any new environment requirements.

---

## License

This project is currently unlicensed. All rights reserved to the CoffeeAgent.AI team. Reach out before using any code in production.
