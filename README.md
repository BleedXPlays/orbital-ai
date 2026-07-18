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
```

The model variables in `.env.example` are optional overrides.

## Commands

```bash
npm install
npm run dev
npm run build
```
