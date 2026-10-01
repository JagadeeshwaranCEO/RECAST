# RECAST security policy

## Supported version

Security fixes are applied to the current `main` branch and the production deployment at `https://recast-ai-studio.vercel.app`.

## Reporting a vulnerability

Do not open a public issue with exploit details. Send the affected URL or commit, reproduction steps, impact, and any safe proof-of-concept evidence to the repository owner through GitHub's private security-advisory flow. Do not access other users' data, run denial-of-service tests, or retain data discovered during research.

We aim to acknowledge a complete report within 3 business days, validate severity within 7 business days, and coordinate disclosure after a fix is deployed.

## Current controls

- Supabase passwordless authentication and owner-scoped Row Level Security for private workspaces.
- An atomic, per-user Postgres quota before any paid model call; anonymous and degraded requests fail safely to the local governed planner.
- Strict Zod contracts and byte limits on campaign briefs, model output, share payloads, and public campaign records.
- Human approval, evidence, destination, production-master, and content-safety launch gates.
- CSP, anti-framing, MIME sniffing, referrer, permissions, opener, resource, and cross-domain policy headers.
- Server-only provider credentials, request timeouts, no-store API responses, request IDs, and privacy-minimised structured logs.
- Dependency audit, lint, type checking, unit tests, production build, and Playwright checks in CI.

## Explicit boundaries

Browser-uploaded images are session-local and are not cloud-published. Social publishing, listening integrations, malware scanning, enterprise SSO, and a central error/log drain require production connectors before those capabilities can be claimed. See [docs/SECURITY_AND_SCALE.md](./docs/SECURITY_AND_SCALE.md).
