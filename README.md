# Resumind - AI Resume Analyzer

Resumind is a full-stack React Router app that analyzes resumes against a target role and returns structured ATS feedback with category scores and actionable tips.

## What It Solves

Job seekers often get generic resume feedback. This app asks for:
- job title
- company name
- job description
- resume PDF

Then it produces structured feedback in JSON (ATS, tone/style, content, structure, skills), stores it, and renders a readable analysis report.

## Core Features

- Resume upload with PDF-only validation and size limits
- Optional first-page PDF preview generation
- AI analysis prompt tailored to provided job description
- Persisted analysis records in Puter KV storage
- Resume review page with overall and category-level scoring
- Demo sample analyses that work without authentication

## Tech Stack

- React 19 + React Router 7 (SSR-enabled)
- TypeScript
- Tailwind CSS 4
- Puter SDK (`auth`, `fs`, `kv`, `ai`)
- `pdfjs-dist` for first-page preview generation

## Quick Start

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Scripts

- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - serve built app
- `npm run typecheck` - route typegen + TypeScript checks
- `npm run test` - compile and run unit tests (`node:test`)

## Product Flow

1. Go to `/upload`.
2. Fill in role/company/description.
3. Upload a PDF resume.
4. App uploads file to Puter FS.
5. App requests AI analysis in a strict JSON format.
6. App saves analysis payload to Puter KV.
7. App redirects to `/resume/:id` and renders feedback.

You can also open preloaded demo analyses from the homepage cards.

## Project Structure

```text
app/
  components/     # UI components
  hooks/          # Puter integration hook
  lib/            # utilities (PDF conversion, feedback parsing, helpers)
  routes/         # route modules (home, upload, auth, resume)
constants/        # prompts, demo data, upload limits
tests/            # basic unit tests
```

## Production Notes

- Puter SDK script is loaded in the root layout.
- Real analysis pages require Puter auth; demo pages do not.
- Build output is generated into `build/client` and `build/server`.
- Dockerfile supports multi-stage build + runtime image.

## Current Gaps / Next Improvements

- Add end-to-end tests for full upload-to-analysis flow
- Improve observability (structured logs + request timing)
- Add a small dashboard with analysis history filters
