# OrbitalAI

OrbitalAI is a three-provider AI workspace:

- OpenAI handles general chat, clarifying questions, conversation memory, and
  voice transcription.
- Claude handles long-document analysis, detailed writing, decision support,
  and coding.
- Gemini handles image understanding, visual-data analysis, and multimodal
  research.

## Environment variables

Copy `.env.example` to `.env` for local development and add the same variables
to the Vercel project:

```text
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
FIREBASE_PROJECT_ID=orbital-ai-957b9
SUPABASE_URL=https://yffkeluziizwhwlvgtnh.supabase.co
SUPABASE_SECRET_KEY=
AI_MESSAGE_WINDOW_LIMIT=24
DOCUMENT_WINDOW_LIMIT=30
USAGE_WINDOW_HOURS=8
PROVIDER_TIMEOUT_MS=45000
```

`SUPABASE_SECRET_KEY` is server-only. A legacy
`SUPABASE_SERVICE_ROLE_KEY` is also supported. Never prefix either key with
`VITE_` or place it in frontend code. Production API routes intentionally
return a temporary-unavailable response when this key or the usage-limit RPC
is missing, rather than allowing unmetered provider calls. Local development
can still use the instance-local limiter.

`AI_MESSAGE_WINDOW_LIMIT` and `DOCUMENT_WINDOW_LIMIT` control the separate
account allowances. Their defaults are 24 AI messages and 30 document reads.
`USAGE_WINDOW_HOURS` defaults to eight hours for both. When either allowance is
exhausted, the API returns the reset timestamp and the interface shows it in
the user's local timezone.

`PROVIDER_TIMEOUT_MS` controls the OpenAI, Claude, and Gemini request timeout.
It defaults to 45 seconds and is clamped between 5 and 120 seconds.

The Firebase project ID has a project-specific default, and the model
variables in `.env.example` are optional overrides.

## Firebase identity in Supabase

OrbitalAI sends the current Firebase ID token to Supabase so database and
storage policies can identify the user. In Supabase, open **Authentication →
Third-Party Auth**, add Firebase, and use project ID `orbital-ai-957b9`.
Then run `supabase/migrations/20260721_workspace_storage_rls.sql` in the
Supabase SQL Editor. The migration makes both OrbitalAI storage buckets private
and restricts workspace rows and stored files to the Firebase user whose ID is
stored in `user_id` or the first file-path segment.

## Supabase migration order

For a new or existing deployment, run these SQL files in order in the Supabase
SQL Editor:

1. `supabase/migrations/20260724_workspaces_schema.sql`
2. `supabase/migrations/20260721_workspace_storage_rls.sql`
3. `supabase/migrations/20260720_api_rate_limits.sql`
4. `supabase/migrations/20260723_eight_hour_usage_window.sql`

The first migration creates or repairs the complete workspace schema and
applies private 50 MB storage-bucket restrictions. The Firebase policy
migration binds rows and stored files to the signed-in user. The final two
migrations create the server-only usage-limit table and eight-hour RPC.

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

GitHub Actions runs lint, tests, and a production build for pushes to `main`
and for pull requests.
