---
name: PeopleHub auth
description: How Clerk auth is wired in the PeopleHub HR app and how new users are provisioned.
---

PeopleHub uses Replit-managed Clerk for authentication.

- **Why Replit-managed Clerk:** It is the platform default for generic auth requests and avoids manual Clerk dashboard setup.
- **JIT provisioning:** The `requireAuth` middleware in `artifacts/api-server/src/middlewares/auth.ts` creates a local `users` row the first time a Clerk-authenticated request arrives. If the `users` table is empty, the new user is made an **Admin**; otherwise they become an **Employee**.
- **Local mapping:** The `users` table has a `clerk_id` column that maps each Clerk account to the local user record.
- **First signup rule:** Because the first person to sign up becomes Admin, do not seed sample users if you want the first real signup to be the admin. Conversely, seeding users before production deployment means the first real signup will not be admin unless you manually set the role.

**Why:** The app needs role-based access control (Admin vs Employee) and a local user record for foreign keys (requests, time entries, shifts). Clerk handles identities; the local table handles app-specific roles and relationships.
