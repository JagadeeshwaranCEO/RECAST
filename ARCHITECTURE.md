# RECAST architecture

## Product contract

RECAST separates **campaign meaning** from **rendered creative**. Facts and claims are versioned source records. Asset blocks depend on them through explicit edges. A revision is a graph operation with an audit trail, not a global find-and-replace.

The production workspace adds a second contract: **AI may propose, but only governed brand inputs and approved evidence may ship.** Brand tokens, assets, agent findings, editable creative, approvals, hosted output and post-launch signals form one traceable loop.

```mermaid
flowchart LR
  Brief[Brand brief] --> BrandOS[Brand OS]
  BrandOS --> Council[Six-agent council]
  Assets[Owned asset vault] --> Studio[Poster studio]
  Council --> Studio
  Studio --> Review[Human review]
  Review --> Launch[Campaign page + channel queue]
  Launch --> Radar[Signal radar]
  Radar -->|approved insight| Brief
```

```mermaid
flowchart LR
  F["Fact · fact.price.v1"] -->|"displays price"| R["Reel · End card"]
  F -->|"displays price"| C["Carousel · Offer slide"]
  M["Approved claim · modular"] --> RS["Reel · Transit scene"]
  M --> CS["Carousel · System slide"]
  M --> LI["LinkedIn · Product proof"]
  L["Locked product image"] -. "integrity hash" .-> R
  L -. "integrity hash" .-> C
  L -. "integrity hash" .-> LI
```

LinkedIn has no price edge, so a price revision cannot change its blocks or approval.

## Revision flow

```mermaid
sequenceDiagram
  actor Editor
  participant Engine as Revision engine
  participant Graph as Dependency graph
  participant Assets as Asset blocks
  participant Review as Approval state
  Editor->>Engine: Change ₹2,499 to ₹2,299 at campaign v1
  Engine->>Engine: Reject if base version is stale
  Engine->>Graph: Find edges to fact.price.v1
  Graph-->>Engine: reel.price, carousel.slide4
  Engine->>Assets: Update only those two templated blocks
  Engine->>Graph: Repoint edges to fact.price.v2
  Engine->>Review: Mark Reel + Carousel stale
  Engine-->>Editor: Diff, preserved assets, revision report
```

## Data model

All structures are declared as Zod schemas in `lib/models.ts`, then inferred as TypeScript types:

- `Campaign`: aggregate root, version and status.
- `Fact`: versioned value with approved, superseded, removed, or prohibited state.
- `Claim`: approved/prohibited wording plus evidence.
- `BrandRule`: tone, colour, typography, CTA, or launch date.
- `CreativeConcept`: promise, metaphor, hook, and content plan.
- `Asset`: a channel output with a distinct storytelling role.
- `AssetBlock`: smallest selectively editable unit; may carry a template, removal fallback, text limit, lock, or integrity hash.
- `DependencyEdge`: explicit relation from one fact version to one asset block, with a human-readable reason.
- `Revision`: immutable change record with before/after copy, affected and preserved assets, reviewer state, and Markdown report.
- `ValidationResult`: evidence-bearing readiness check.
- `Approval`: per-output reviewer state.

The seed campaign is parsed by `CampaignSchema` before it reaches the UI. Export runs through the same schema.

## Selective update rules

1. Verify `baseCampaignVersion` equals the current campaign version.
2. Resolve the current approved fact by its stable logical key.
3. Find dependency edges pointing to that exact fact version.
4. Create a new immutable fact version.
5. Update only connected blocks using their deterministic templates or removal fallback.
6. Repoint or remove the relevant dependency edges.
7. Preserve unconnected asset objects unchanged.
8. Mark approvals stale only for assets containing changed blocks.
9. Record affected assets, preserved assets, block diffs, reasons, timestamps, and reviewer state.

## Claim safety

The deterministic guard compares requested wording with the controlled claim registry. Prohibited wording produces an `UnsupportedClaimError` with an approved replacement. The default UI does not expose an override, so unsupported wording cannot silently enter campaign output.

## Validation design

- **Price consistency:** every price edge resolves to a block containing the latest approved price.
- **Approved claims:** every dependency points to a current approved fact.
- **Asset integrity:** every locked block hash equals the seeded approved baseline.
- **Layout fit:** copy length stays within its template’s deterministic character limit.
- **Revision status:** changed outputs remain stale until human approval.
- **Tone and aesthetic quality:** explicitly marked for human judgment.

## Local-first reliability

Zustand holds the in-browser demo session. Builder and production work are scoped to `sessionStorage`, and campaign approval state remains in memory. No network service is required for revisions, checks, approvals, poster export, local campaign hosting or the governed agent fallback. When a model key is configured, `/api/agents` selects an organizer-listed OpenRouter, Gemini, Groq or NVIDIA NIM adapter (or the existing OpenAI adapter), requests structured JSON, and validates the result against the same Zod contract. Invalid, timed-out or unavailable responses fall back to the local council.

## Runtime trust boundaries

- **Public edge:** the Cloudflare Worker serves the Vinext app. RECAST removes the unused image-transform route, applies CSP and anti-framing headers, and uses different cache lifetimes for hashed bundles and unversioned media.
- **Browser workspace:** user-entered briefs and comments are local to the active browser tab. They are presentation state, not authoritative approvals or server records.
- **Uploaded assets:** PNG, JPEG and WebP files are MIME- and size-gated before browser-local ingestion. A commercial deployment must replace data URLs with signed object-storage uploads, malware scanning, rights metadata and tenant isolation.
- **Agent adapter:** `/api/agents` validates input, keeps every key server-side, selects only an explicitly configured provider, enforces a small in-process demo rate limit, applies a timeout, requests structured JSON and validates output before returning it. The response records provider/model provenance without exposing credentials. Distributed rate limiting and tenant budgets remain production gates.
- **Launch pages:** `/c/[slug]` renders a working browser-local campaign payload. Public multi-user hosting requires durable server persistence and globally unique tenant-aware slugs.
- **Signal radar:** bundled signals demonstrate interaction and the learning loop; the interface explicitly labels them as demo data until an authorised listening provider is connected.
- **Campaign engine:** only schema-valid campaign structures enter the deterministic revision engine. Base-version checks stop stale jobs, and explicit dependency edges define exactly what can change.
- **External research:** source links are static citations opened by the user. The server does not crawl or proxy them.
- **Future identity:** `chatgpt-auth.ts` is an optional trusted-proxy helper and is not an active authorization boundary in the public demo.

## Operational baseline

`/api/health` exposes non-sensitive service mode and engine readiness with `Cache-Control: no-store`. Route errors fall into a recoverable, accessible UI state. GitHub Actions enforces lint, typecheck, unit tests, production build, and the Playwright judge flow. See `PRODUCTION_READINESS.md` for the remaining multi-tenant gates.
