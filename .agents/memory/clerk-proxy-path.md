---
name: Clerk proxy path
description: Where the Clerk Frontend API proxy is mounted and how the frontend reaches it.
---

The Clerk Frontend API proxy is mounted on the API server at `/api/__clerk` (the `CLERK_PROXY_PATH` export from `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`).

- The backend proxy is **only active in production**. In development, `clerkProxyMiddleware()` is a no-op because Clerk proxying does not work with dev instances.
- The frontend in `App.tsx` sets the `proxyUrl` only when `import.meta.env.PROD` is true. In development it leaves `proxyUrl` undefined so Clerk loads its JS from Clerk's own dev Frontend API. Passing the same-origin proxy URL in development causes the app to render a blank screen with a `failed_to_load_clerk_js` error because the backend proxy does not forward the request.
- In production, the frontend falls back to `${window.location.origin}${basePath}/api/__clerk` when `VITE_CLERK_PROXY_URL` is not set.
- Replit's artifact routing sends `/api` traffic to the API server, so `/api/__clerk` is reachable at the same origin as the frontend.

**Why:** Clerk recommends proxying the Frontend API in production to avoid CNAME/DNS complexity. Keeping the proxy under `/api` lets Replit's existing artifact routing handle it without extra Vite proxy configuration, but the proxy must be disabled in development because Clerk dev instances cannot be served through a same-origin proxy.
