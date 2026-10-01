# RECAST production-readiness map

This document separates the **verified hackathon product** from the controls required for a real multi-tenant SaaS. It prevents demo behavior from being mistaken for production guarantees.

| Layer | Current implementation | Current status | Production expansion |
| --- | --- | --- | --- |
| System design | One typed campaign aggregate, explicit fact-to-block dependency edges, immutable revisions | Ready for demo | Split durable campaign, asset, revision, and audit services only when scale requires it |
| Architecture | Next.js 16.3.8 on Vercel; deterministic engine in `lib/`; Supabase Auth/Postgres | Production-shaped beta | Move model generation behind durable jobs when synchronous volume justifies it |
| Frontend | Responsive studio, keyboard navigation, reduced-motion support, loading/error/recovery states | Verified by E2E and source review | Run assistive-technology and real-device testing before commercial launch |
| API/backend | Health endpoint plus bounded Zod-validated provider route, request IDs, timeouts, provenance, authenticated durable quota, local fallback and privacy-minimised structured events | Public-beta boundary | Add idempotent asynchronous jobs, tenant budgets and a central log drain before sustained model traffic |
| Database/storage | Supabase owner-scoped private workspaces and public-safe publication rows; browser uploads remain session-local | Durable text campaign beta | Add signed object storage, malware scanning, rights metadata, backups and retention policy for customer assets |
| Authentication/permissions | Supabase magic-link identity, owner-scoped RLS and authenticated AI-quota RPC | Single-owner beta | Add organizations, role membership, reviewer invitations, SSO and per-action authorization |
| Hosting/cloud | Vercel Next.js deployment, CDN assets, deployment-relative routes and canonical metadata | Ready | Add separate staging project, budget alerts and documented rollback ownership |
| CI/CD/version control | GitHub Actions runs lint, typecheck, unit tests, build, and Playwright | Configured | Protect `main`, require checks/reviews, sign releases, and automate deploy previews |
| Security | Full browser policy headers, strict campaign/model schemas, byte caps, RLS, server-only keys, patched dependencies and documented review | Hardened beta | Add external penetration test, central secrets rotation and an incident exercise before commercial data |
| Rate limiting | Atomic Postgres quota of 8 model calls/user/minute plus a cheap process-local abuse filter; failures fall back without provider spend | Distributed user protection | Add daily per-tenant token/cost budgets and concurrency controls before paid plans |
| Caching/CDN | Hashed JS/CSS are immutable; unversioned media uses short cache + stale revalidation | Configured | Add cache analytics, purge strategy, canonical API caching rules, and regional testing |
| Errors/logs | Route error boundary, request IDs, privacy-minimised JSON agent events and no-store health endpoint | Instrumented | Connect an approved central log/error destination and define retention |
| Monitoring/alerts | Vercel Analytics, Speed Insights, health endpoint and post-change Supabase advisors | Instrumented beta | Add synthetic judge-flow, fallback/cost/5xx alerts and on-call ownership |
| Testing | Unit coverage for revisions, research, agent governance and provider contracts; Playwright covers responsive authoring, launch locking, human sign-off and end-to-end production flows | Strong demo gate | Add live-provider canaries, persistence, authorization, load, visual-regression, and accessibility automation |
| Scaling | Stateless serverless page/API work, CDN assets, atomic shared quota and Postgres RLS | Ready for controlled beta | Move generation to queues, add idempotency/backpressure and load-test measured limits |

## Non-negotiable production gates

Before RECAST stores real client campaigns or supports multiple organizations:

1. Add organization roles and require server-side authorization for every shared-team operation.
2. Persist revisions, approval evidence and audit events; treat browser state as a draft cache only.
3. Add daily tenant token/cost budgets and queue concurrency limits before paid AI plans.
4. Move media to signed object uploads with malware scanning, rights metadata and cryptographic integrity hashes.
5. Use only rights-cleared campaign imagery in any commercial deployment.
6. Connect centralized, privacy-filtered monitoring and name an incident-response owner.
7. Complete an independent penetration test and restore drill before storing commercial campaign assets.

## Current security review

The 2026-10-01 repository and live-surface review fixed distributed AI-cost abuse, clickjacking/missing production browser policies, and malformed public-campaign payload crashes. The provider route now requires an authenticated atomic quota before paid AI, all degraded paths fail safely to the local planner, public payloads are checked at three layers, and launch adds a content-safety gate. The obsolete Cloudflare/Vinext/Drizzle toolchain was removed and both full and production npm audits were clean at review time. See [docs/SECURITY_AND_SCALE.md](./docs/SECURITY_AND_SCALE.md) for evidence, recent framework advisories, scaling stages and residual boundaries.
