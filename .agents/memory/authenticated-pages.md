---
name: Authenticated pages
description: Which auth hooks to use inside the PeopleHub React app.
---

The app has two auth hooks from `artifacts/hr-management/src/contexts/UserContext.tsx`:

- `useUser()` — Returns `currentUser: User | null`, `isLoading`, `isSignedIn`, `isAdmin`. Safe for layout/sidebar where null handling is needed.
- `useCurrentUser()` — Returns a non-null `User`. Use this inside any page wrapped by `AuthenticatedLayout`, which already guarantees the user is signed in. It throws if the user is not present, so it keeps TypeScript strict on pages that should never render for anonymous users.

**Why:** After replacing the mock role switcher with Clerk, the previous pattern of destructuring `currentUser` from `useUser()` caused many `possibly null` typecheck errors across pages. A dedicated non-null hook removes the noise while keeping the context reusable for the sidebar and redirects.
