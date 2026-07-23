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
```

`SUPABASE_SECRET_KEY` is server-only. A legacy
`SUPABASE_SERVICE_ROLE_KEY` is also supported. Never prefix either key with
`VITE_` or place it in frontend code. Before enabling it, run
`supabase/migrations/20260720_api_rate_limits.sql` and
`supabase/migrations/20260723_eight_hour_usage_window.sql` in the Supabase SQL
Editor.
Without this variable, OrbitalAI uses an instance-local limit suitable for
development; the Supabase-backed limit is required for reliable enforcement
across Vercel serverless instances.

`AI_MESSAGE_WINDOW_LIMIT` and `DOCUMENT_WINDOW_LIMIT` control the separate
account allowances. Their defaults are 24 AI messages and 30 document reads.
`USAGE_WINDOW_HOURS` defaults to eight hours for both. When either allowance is
exhausted, the API returns the reset timestamp and the interface shows it in
the user's local timezone.

The Firebase project ID has a safe project-specific default, and the model
variables in `.env.example` are optional overrides.

## Firebase identity in Supabase

OrbitalAI sends the current Firebase ID token to Supabase so database and
storage policies can identify the user. In Supabase, open **Authentication →
Third-Party Auth**, add Firebase, and use project ID `orbital-ai-957b9`.
Then run `supabase/migrations/20260721_workspace_storage_rls.sql` in the
Supabase SQL Editor. The migration makes both OrbitalAI storage buckets private
and restricts workspace rows and stored files to the Firebase user whose ID is
stored in `user_id` or the first file-path segment.

## Commands

```bash
npm install
npm run dev
npm run build
```
