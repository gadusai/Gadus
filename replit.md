# Gadus

Gadus is a private, emerald-lit AI thinking workspace for deeper research, sharper ideas, and better work.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/gadus/src/App.tsx` — landing page, workspace shell, views, and core interactions
- `artifacts/gadus/src/index.css` — Gadus visual theme, glass surfaces, motion, and responsive utilities
- `artifacts/api-server/src/routes/gadus.ts` — typed dashboard, modes, conversation, message, prompt, and studio endpoints
- `lib/api-spec/openapi.yaml` — source of truth for the Gadus API contract
- `lib/db/src/schema/index.ts` — conversation, message, and studio asset tables

## Architecture decisions

- The first release uses the shared PostgreSQL database and generated OpenAPI client hooks, keeping UI state aligned with server data.
- Modes and prompt-library content are versioned product configuration; user-created conversations and messages are persisted records.
- Gadus routes every assistant response through the shared Groq client with the `llama-3.3-70b-versatile` model, specialized system prompts, SSE streaming, cancellation, and one delayed retry.
- The landing page remembers first entry locally and returns users directly to the workspace on later visits.

## Product

- Public landing experience for Gadus, with branded first entry and returning-user behavior
- Personalized dashboard with usage summary, daily tip, goals, recent threads, and quick-start composer
- Twelve specialized modes, persistent conversation history, message room, prompt library, studio gallery, rhythm analytics, profile, settings, search overlay, and mobile navigation

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
