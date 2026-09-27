# RECAST

**A Meaning-Aware AI Campaign Studio for Consistent Brand Content**

RECAST treats a campaign as one connected source instead of a folder of unrelated files. Change an approved fact once and RECAST finds the exact content blocks that depend on it, updates those blocks, preserves unrelated creative, invalidates only affected approvals, and produces a reviewable audit trail.

Built by **Team PARADOX** for the AI Build Challenge 2026, Track: AI Content Studio for Brands & Creators.

## What works

- Campaign home with a complete seeded Stride launch campaign.
- Structured source of truth with versioned facts, claim evidence, prohibited wording, and editable brand rules.
- Two creative concepts with a real selection interaction.
- Connected Instagram Reel, Instagram Carousel, and LinkedIn previews with block-level fact references.
- Explicit dependency graph revision engine—no broad string replacement.
- Price revision from `₹2,499` to `₹2,299`, affecting only the Reel end card and Carousel offer slide.
- Recycled-nylon claim removal, with targeted fallback copy.
- Unsupported-claim guard that rejects “completely waterproof” and offers “water-resistant”.
- Stale-approval invalidation only for changed outputs.
- Evidence-based readiness checks for price, claims, locked assets, text fit, and approval state.
- Per-output approval, approve-all, revision history, and demo reset.
- Working downloads for campaign JSON, revision Markdown, LinkedIn text, and a clearly labelled simulated reel preview.
- Responsive keyboard-accessible UI, loading, empty, warning, success, and review states.

The core experience is fully deterministic and requires no API key.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Judge demo path

Open `/`, then follow:

`Campaign home → Revise → change price → inspect dependency diff → test waterproof claim → use approved replacement → Review → approve affected outputs → export report`

The exact three-minute narration is in [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).

## Verification

```bash
npm run test:unit
npm run test:e2e
npm run lint
npx tsc --noEmit
npm run build
```

The Playwright test may require a one-time browser install:

```bash
npx playwright install chromium
```

## Project structure

```text
app/
  CampaignStudio.tsx       Complete interactive product UI
  globals.css              Editorial design system and responsive layout
lib/
  models.ts                Zod schemas and inferred TypeScript models
  seed.ts                  Validated Stride demo campaign
  revision-engine.ts       Dependency traversal, selective updates, validation
store/
  campaign-store.ts        Local Zustand application state
tests/
  revision-engine.test.ts  Reliability tests for campaign semantics
  e2e/recast.spec.ts       Full judge-path browser test
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the graph and revision contract.

## Optional environment

Copy `.env.example` to `.env.local` only if an optional structured-copy provider is added. The submitted demo does not call an LLM and never depends on live image or video generation.

## Known limitations

- State is intentionally device-local and resets on refresh; team accounts and durable campaign storage are not part of the hackathon demo.
- Video export is a scene-plan preview, clearly labelled as simulated; a renderer is not configured.
- Product previews are deterministic, code-rendered campaign art. Final client photography could replace them without changing the dependency model.
- Tone and aesthetic quality remain human-review checks by design.
- Environment keys are reserved for a future structured suggestion adapter; no live AI provider is invoked in this build.

