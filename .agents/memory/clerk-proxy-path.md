---
name: Clerk proxy path
description: Where the Clerk Frontend API proxy is mounted and how the frontend reaches it.
---

The Clerk Frontend API proxy is mounted on the API server at `/api/__clerk` (the `CLERK_PROXY_PATH` export from `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts`).

- The frontend in `App.tsx` defaults to `window.location.origin + basePath + '/api/__clerk'` when `VITE_CLERK_PROXY_URL` is not set.
- Replit's artifact routing sends `/api` traffic to the API server, so `/api/__clerk` is reachable at the same origin as the frontend.
- The proxy is only active when `NODE_ENV === 'production'`. In development, the middleware is a no-op and Clerk's dev API is used directly.

**Why:** Clerk recommends proxying the Frontend API to avoid CNAME/DNS complexity and to keep the publishable key from being used directly in production. Keeping the proxy under `/api` lets Replit's existing artifact routing handle it without extra Vite proxy configuration.
