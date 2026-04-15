# Frontend API Integration Standard

A clean, layered approach for API integration using **Axios**, **React Query (TanStack Query)**, and **Zod**.

---

## Architecture Overview

```
src/
├── data-access/          # Layer 1: API communication
│   ├── data-types.ts     # Shared response/entity types
│   ├── interceptor.ts    # Axios interceptors (auth, logging, etc.)
│   ├── payment.ts        # Domain-specific API functions
│   ├── prompt-template.ts
│   ├── user-management.ts
│   └── local.ts
├── hooks/                # Layer 2: React Query wrappers
│   ├── queries.ts        # All useQuery hooks
│   └── mutations.ts      # All useMutation hooks
├── components/
│   └── query-wrapper.tsx # Layer 3: Declarative query state rendering
└── utils/
    └── validations.ts    # Zod schemas + inferred request body types
```

---

## Layer 1: Data Access (`data-access/`)

Pure async functions that handle HTTP communication. **No React, no hooks, no UI logic.**

### Rules

1. **One Axios instance per backend service**, configured with its own `baseURL`.
2. **Attach shared interceptors** (e.g. auth token) at the instance level.
3. **Each function is a single API call** — takes typed params, returns typed data.
4. **Unwrap the response** (`return data.body`) so consumers never deal with Axios internals.
5. **Group by backend domain** — one file per microservice/API boundary.

### Shared Response Type

Define a generic `ApiResponse<T>` once and reuse everywhere:

```ts
// data-access/data-types.ts
export type ApiResponse<T = unknown> = {
  status: number;
  body: T;
};
```

### Axios Instance + Interceptor

```ts
// data-access/interceptor.ts
export function tokenInterceptor(config: InternalAxiosRequestConfig) {
  const token = accessTokenStorage.get();
  if (config.headers && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}
```

```ts
// data-access/user-management.ts
const userManagementApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_USER_API_URL,
});
userManagementApi.interceptors.request.use(tokenInterceptor);
```

### Function Signatures

```ts
// GET — simple
export const getProfile = async () => {
  const { data } = await userManagementApi.get<ApiResponse<Profile>>("users/profile");
  return data.body;
};

// GET — with param
export const getTemplate = async (templateId: string) => {
  const { data } = await promptTemplateApi.get<ApiResponse<Template>>(`template/${templateId}`);
  return data.body;
};

// POST — with typed body
export const postBookmark = async (body: { templateId: Template["_id"] }) => {
  const { data } = await userManagementApi.post<ApiResponse<unknown>>("users/bookmark", body);
  return data.body;
};

// DELETE — with id
export const deleteBookmark = async (bookmarkId: Bookmark["_id"]) => {
  const { data } = await userManagementApi.delete<ApiResponse<unknown>>(
    `users/bookmark/${bookmarkId}`,
  );
  return data.body;
};

// POST — with compound options object (when multiple params are needed)
export const postPrompt = async (options: { templateId: string; body: CreatePromptBody }) => {
  const { data } = await promptTemplateApi.post<ApiResponse<CreatePromptResponse>>(
    `template/${options.templateId}/generate`,
    options.body,
  );
  return data.body;
};
```

### Key Takeaways

- Functions are **framework-agnostic** — testable without React.
- Axios generics (`get<ApiResponse<T>>`) give full type safety end-to-end.
- Request body types come from **Zod schemas** in `utils/validations.ts` (single source of truth for both validation and types).

---

## Layer 2: React Query Hooks (`hooks/`)

Thin wrappers that connect data-access functions to React Query. **No direct Axios calls here.**

### `queries.ts` — Read Operations

```ts
import * as PromptTemplateDataAccessor from "@/data-access/prompt-template";
import { useQuery } from "@tanstack/react-query";

// Simple query
export const useGetAllTemplates = () => {
  return useQuery({
    queryKey: ["templates"],
    queryFn: PromptTemplateDataAccessor.getAllTemplates,
  });
};

// Parameterized query with `enabled` guard
export const useGetTemplate = (templateId: string) => {
  return useQuery({
    queryKey: ["templates", templateId],
    queryFn: () => PromptTemplateDataAccessor.getTemplate(templateId),
    enabled: Boolean(templateId),
  });
};

// Dependent query (waits for another query to resolve)
export const useGetActiveTemplateConfig = (activeTemplate?: Template) => {
  const { data: templateConfigs, isSuccess } = useGetTemplateConfigs();

  return useQuery({
    queryKey: ["template-config", activeTemplate?._id],
    enabled: Boolean(activeTemplate?._id) && isSuccess,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const activeConfig = templateConfigs?.find(
        (config) => config.name.toLowerCase() === activeTemplate?.name.toLowerCase(),
      );
      if (!activeConfig) return Promise.reject("Invalid Template");
      return Promise.resolve(activeConfig);
    },
  });
};
```

### `mutations.ts` — Write Operations

```ts
import * as UserManagementDataAccessor from "@/data-access/user-management";
import { useMutation } from "@tanstack/react-query";

// Simple mutation
export const useCreateBookmark = () => {
  return useMutation({
    mutationFn: UserManagementDataAccessor.postBookmark,
  });
};

// Mutation with side effect
export const useCreateCheckoutPortalSession = () => {
  return useMutation({
    mutationFn: PaymentDataAccessor.postCheckoutPortalSession,
    onSuccess: (response) => window.open(response.checkout_url, "_self"),
  });
};
```

### Rules

1. **Namespace imports** — `import * as XDataAccessor` keeps origins traceable and avoids name collisions.
2. **`queryKey` mirrors the resource hierarchy** — `["templates"]`, `["templates", id]`, `["templates", id, "prompts"]`.
3. **`enabled` guards** prevent firing queries when params are missing.
4. **One hook = one API call.** Compose hooks in components, not inside other hooks (except for dependent queries).
5. **Mutations stay generic** — `onSuccess`/`onError` callbacks that are UI-specific should live in the component via the `.mutate()` call, not in the hook definition. Only universal side effects (like redirects) belong here.
6. **All queries and mutations live in their respective single file** — no scattering across components.

---

## Layer 3: QueryWrapper Component

A declarative component that handles the three states of any query: **loading**, **error**, and **success**.

```tsx
interface QueryWrapperProps<TData = unknown>
  extends Partial<Pick<UseQueryResult<TData>, "isPending" | "error" | "data" | "isFetching">> {
  view: React.ReactNode;
  loadingView?: React.ReactNode;
  className?: string;
}

export function QueryWrapper<TData = unknown>(props: QueryWrapperProps<TData>) {
  const canShowView = props.data && !props.error && !props.isPending;
  const isErrored = props.error && !props.isFetching && !props.isPending;

  return (
    <AnimatePresence mode="wait">
      {props.isPending && (props.loadingView ?? <QueryLoadingIndicator />)}
      {isErrored && <QueryErrorIndicator title="..." message={getErrorMessage(props.error)} />}
      {canShowView && <FadeInDiv>{props.view}</FadeInDiv>}
    </AnimatePresence>
  );
}
```

### Usage

```tsx
const { data, isPending, error, isFetching } = useGetAllTemplates();

<QueryWrapper
  data={data}
  isPending={isPending}
  error={error}
  isFetching={isFetching}
  view={<TemplateList templates={data!} />}
/>;
```

### Why This Works

- **No repeated `if (isLoading)` / `if (error)` blocks** across every page.
- **Consistent UX** — same loading spinner and error display everywhere.
- **Animated transitions** between states via `AnimatePresence`.
- **Customizable** — override `loadingView` when a skeleton is more appropriate.

---

## Validation & Request Types (`utils/validations.ts`)

Zod schemas are the **single source of truth** for request body shapes:

```ts
export const promptSchema = z.object({
  userInputPrompt: z.string().min(1).optional(),
  aiResponse: z.string().min(1, "Please enter value for this field").optional(),
});

export type CreatePromptBody = Pick<z.infer<typeof promptSchema>, "userInputPrompt">;
export type EditPromptBody = Pick<z.infer<typeof promptSchema>, "aiResponse">;
```

- Forms validate with the Zod schema.
- Data-access functions accept the inferred type.
- **No drift** between what the form sends and what the API function expects.

---

## Quick Reference: Adding a New API Call

| Step | Where | What |
|------|-------|------|
| 1 | `data-access/data-types.ts` | Add response/entity types |
| 2 | `utils/validations.ts` | Add Zod schema + inferred body type (if POST/PUT) |
| 3 | `data-access/<domain>.ts` | Add async function with typed Axios call |
| 4 | `hooks/queries.ts` or `hooks/mutations.ts` | Add `useQuery` / `useMutation` hook |
| 5 | Component | Use the hook + `<QueryWrapper>` for queries |

---

## Principles

| Principle | How It's Applied |
|-----------|-----------------|
| **Separation of concerns** | Data-access knows HTTP. Hooks know caching. Components know UI. |
| **Single source of truth** | Types in `data-types.ts`, validation in `validations.ts`, API URLs in env vars. |
| **Type safety end-to-end** | Axios generics → data-access return types → hook inference → component props. |
| **Testability** | Data-access functions are pure async — mock Axios, test independently. |
| **Consistency** | `QueryWrapper` enforces uniform loading/error UX across all pages. |
| **Discoverability** | All queries in one file, all mutations in one file — easy to find and audit. |
