/** Cloudflare Worker entry point for RECAST. */
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function contentSecurityPolicy(url: URL): string {
  const localDevelopment = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self'${localDevelopment ? " ws: wss:" : ""}`,
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
  ].join("; ");
}

function withPlatformHeaders(response: Response, url: URL): Response {
  const headers = new Headers(response.headers);
  headers.set("Content-Security-Policy", contentSecurityPolicy(url));
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  const contentType = headers.get("Content-Type") ?? "";
  const isHashedBundle = /\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]{8,}\.(?:css|js)$/.test(url.pathname);
  if (isHashedBundle) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (url.pathname.startsWith("/assets/") || /\.(?:avif|gif|ico|jpe?g|png|webp)$/.test(url.pathname)) {
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  } else if (contentType.includes("text/html")) {
    headers.set("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=600");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const response = await handler.fetch(request, env, ctx);
    return withPlatformHeaders(response, url);
  },
};

export default worker;
