---
name: Generated API hooks
description: Quirks of using Orval-generated React Query hooks in this project.
---

The API client is generated from `lib/api-spec/openapi.yaml` by Orval into `lib/api-client-react/src/generated/api.ts`.

- **`queryKey` is required:** The generated `useQuery` hooks (e.g., `useGetMe`) require an explicit `queryKey` in the `query` option. If you omit it, TypeScript reports that `queryKey` is missing in the options object.
- **Regenerate after spec changes:** Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`.

**Why:** The generated typings wrap TanStack Query's options and keep `queryKey` as a required field, unlike typical `useQuery` calls that compute a key from the query function. Forgetting this causes build failures.
