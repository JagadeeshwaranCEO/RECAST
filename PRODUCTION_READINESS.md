# RECAST production-readiness map

This document separates the **verified hackathon product** from the controls required for a real multi-tenant SaaS. It prevents demo behavior from being mistaken for production guarantees.

| Layer | Current implementation | Current status | Production expansion |
| --- | --- | --- | --- |
| System design | One typed campaign aggregate, explicit fact-to-block dependency edges, immutable revisions | Ready for demo | Split durable campaign, asset, revision, and audit services only when scale requires it |
| Architecture | Next/Vinext UI on a Cloudflare Worker; deterministic engine in `lib/` | Ready for demo | Add a service boundary for generation jobs and tenant-scoped persistence |
| Frontend | Responsive studio, keyboard navigation, reduced-motion support, loading/error/recovery states | Verified by E2E and source review | Run assistive-technology and real-device testing before commercial launch |
| API/backend | Health endpoint plus Zod-validated multi-provider agent council route with timeouts, provenance, demo rate limiting and local fallback | Strong demo boundary | Add distributed rate limits, idempotency keys, durable job state, tenant budgets, and privacy-filtered provider telemetry |
| Database/storage | Campaign source is in memory; builder, uploads, poster and launch workspace are scoped to the current browser session; published text payloads can travel in a signed-off share URL | Safe for public demo | Use tenant-scoped Postgres/D1 plus object storage, migrations, backups, retention, malware scanning and row-level authorization |
| Authentication/permissions | Optional ChatGPT header helper exists but is not an active product boundary | Public demo | Enforce trusted-proxy identity, organization membership, campaign roles, and per-action authorization |
| Hosting/cloud | Cloudflare Worker and static assets; fixed canonical metadata origin | Ready | Add staged environments, rollbacks, regional/data-residency decisions, and budget controls |
| CI/CD/version control | GitHub Actions runs lint, typecheck, unit tests, build, and Playwright | Configured | Protect `main`, require checks/reviews, sign releases, and automate deploy previews |
| Security | CSP, anti-framing, `nosniff`, referrer/permissions policy; unused image-transform endpoint removed | Hardened for demo | Add SAST/dependency alerts, periodic threat-model review, incident process, and penetration testing |
| Rate limiting | Agent endpoint has an in-process 8-request/minute demo guard | Demo protection only | Replace with distributed per-user, per-tenant, concurrency and cost limits before public generation ships |
| Caching/CDN | Hashed JS/CSS are immutable; unversioned media uses short cache + stale revalidation | Configured | Add cache analytics, purge strategy, canonical API caching rules, and regional testing |
| Errors/logs | Route-level error boundary and structured browser console diagnostic; health endpoint | Baseline | Add privacy-filtered centralized errors, request IDs, retention rules, and operator runbooks |
| Monitoring/alerts | `/api/health` reports service mode and deterministic-engine readiness | Baseline | Add synthetic judge-flow monitoring, SLOs, quota/cost alerts, and on-call ownership |
| Testing | Unit coverage for revisions, research, agent governance and provider contracts; Playwright covers responsive authoring, launch locking, human sign-off and end-to-end production flows | Strong demo gate | Add live-provider canaries, persistence, authorization, load, visual-regression, and accessibility automation |
| Scaling | Stateless page/engine work scales at the edge; static media is CDN-friendly | Ready for demo traffic | Move generation to queues, make writes idempotent, and add backpressure before model workloads |

## Non-negotiable production gates

Before RECAST stores real client campaigns or supports multiple organizations:

1. Introduce verified authentication and tenant-scoped authorization on every server operation.
2. Persist campaigns, revisions, approvals, and audit events server-side with migrations and backups.
3. Treat browser state as a draft cache only; never as authoritative approval or asset-integrity evidence.
4. Add rate, concurrency, token, file-size, and cost limits before enabling AI generation or uploads.
5. Replace seeded integrity sentinels with cryptographic hashes of stored asset bytes.
6. Use only rights-cleared campaign imagery in any commercial deployment.
7. Add centralized, privacy-filtered monitoring and an incident-response owner.

## Current security review

The 2026-09-29 repository scan found two issues in the demo build: an unused public image-transform surface and durable shared-browser workspace persistence. The product source now removes that endpoint, stores workspace data in `sessionStorage`, clears the legacy key, and resets campaign, workspace, production and locally published preview data through one confirmed action. Launch is gated on a complete brief, council output, production master, current approvals and a valid destination.
