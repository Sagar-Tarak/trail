# Trail — Developer Guide

Trail is a React + TypeScript admin dashboard. It gives you a feature-complete starting point for any internal tool: authentication, a config-driven data table with server-side operations, an audit log, user management, and a live dashboard — all wired together with a clean architecture that scales.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Running the Project](#3-running-the-project)
4. [Architecture Overview](#4-architecture-overview)
5. [Routing](#5-routing)
6. [Authentication](#6-authentication)
7. [State Management](#7-state-management)
8. [API Layer](#8-api-layer)
9. [Mock System](#9-mock-system)
10. [DataTable Component](#10-datatable-component)
11. [MasterTablePage Layout](#11-mastertablepage-layout)
12. [Adding a New Feature Page](#12-adding-a-new-feature-page)
13. [Dashboard](#13-dashboard)
14. [Connecting a Real Backend](#14-connecting-a-real-backend)
15. [Conventions & Rules](#15-conventions--rules)

---

## 1. Tech Stack

| Layer | Library | Why |
|---|---|---|
| UI framework | React 19 | — |
| Language | TypeScript 6 | — |
| Routing | React Router v7 | Data router (`createBrowserRouter`) |
| Server state | TanStack Query v5 | Caching, prefetch, stale-while-revalidate |
| Table engine | TanStack Table v8 | Headless, server-side mode |
| Row virtualization | TanStack Virtual v3 | Handles 100k-row tables smoothly |
| Client state | Zustand v5 | Auth, layout, table preference persistence |
| HTTP client | Axios | Mock registry + interceptors |
| Component library | Ant Design v5 | Drawer, icons, form primitives |
| Styling | Tailwind CSS v4 | Utility-first, no CSS files |
| Charts | Recharts v3 | Dashboard visualizations |
| Build | Vite 8 | Fast HMR, code splitting per route |

---

## 2. Project Structure

```
src/
├── main.tsx                  # Entry point — QueryClient + RouterProvider
│
├── router/
│   ├── index.tsx             # Route tree (createBrowserRouter)
│   ├── routes.tsx            # ROUTES constants, NAV_ITEMS, ROUTE_TITLES
│   ├── ProtectedRoute.tsx    # Auth guard — redirects to /auth/login
│   └── PageSuspense.tsx      # Suspense wrapper for lazy pages
│
├── store/
│   ├── useAuthStore.ts       # Auth state (user, tokens, login, logout)
│   ├── useLayoutStore.ts     # Sidebar collapsed/expanded
│   └── useTableStore.ts      # Per-table column/density/pageSize prefs
│
├── lib/
│   ├── auth/
│   │   ├── auth.types.ts     # User, LoginCredentials, AuthTokens
│   │   └── auth.api.ts       # apiLogin(), apiLogout() — swap mock → real here
│   ├── api/
│   │   ├── client.ts         # Axios instance, mock registry, apiFetch()
│   │   ├── types.ts          # ApiPage<T>, ApiQueryParams, ApiError
│   │   └── queryUtils.ts     # buildApiParams(), toQueryString()
│   └── mock/
│       ├── mockUtils.ts      # delay(), parseParams(), sortItems(), paginate()
│       ├── activities.mock.ts # 10,000 Activity records
│       └── users.mock.ts      # 500 User records
│
├── components/
│   ├── layout/
│   │   ├── RootLayout.tsx    # Authenticated shell (Sidebar + Navbar + Outlet)
│   │   ├── Navbar.tsx        # Top bar — search, notifications, user menu
│   │   ├── Sidebar.tsx       # Collapsible nav sidebar
│   │   ├── SidebarItem.tsx   # Recursive nav item (supports nesting + badges)
│   │   ├── icons.tsx         # Ant Design icon re-exports
│   │   └── types.ts          # NavItem, SidebarProps, NavbarProps
│   ├── DataTable/            # Low-level table (see §10)
│   │   ├── DataTable.tsx
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── utils/
│   │   └── types/
│   ├── charts/               # Recharts wrappers (Area, Bar, Donut, Line, Sparkline)
│   └── page/
│       ├── PageShell.tsx     # Breadcrumbs + title + content wrapper
│       └── DataTable.tsx     # Simple client-side table (small lists)
│
├── layouts/
│   └── MasterTablePage/      # High-level CRUD page (see §11)
│       ├── MasterTablePage.tsx
│       ├── useTableController.ts
│       ├── Toolbar.tsx
│       ├── FilterPanel.tsx
│       ├── ActiveFilters.tsx
│       ├── BulkActionBar.tsx
│       ├── SavedViews.tsx
│       ├── RecordDrawer.tsx
│       ├── TableCore.tsx
│       ├── persistence.ts
│       └── types.ts
│
├── features/
│   ├── activities/           # Audit log page
│   │   ├── page.tsx          # Entry component
│   │   ├── activity.config.ts # MasterTableConfig
│   │   ├── activity.columns.tsx
│   │   ├── activity.filters.ts
│   │   ├── activity.actions.tsx
│   │   ├── activity.query.ts  # useActivitiesQuery()
│   │   ├── activity.drawer.tsx
│   │   └── activity.types.ts
│   └── users/                # User management page (same structure)
│
└── pages/
    ├── auth/
    │   ├── AuthLayout.tsx    # Shell for /auth/* — bounces to dashboard if logged in
    │   └── LoginPage.tsx
    ├── dashboard/
    │   ├── DashboardPage.tsx
    │   ├── api.ts            # fetchDashboardData() — swap mock → real
    │   └── components/       # StatCard, charts, feed, top-users
    ├── errors/
    │   ├── ErrorPage.tsx     # Router errorElement
    │   └── NotFoundPage.tsx  # 404 catch-all
    └── placeholder/
        └── PlaceholderPage.tsx  # Unimplemented pages
```

---

## 3. Running the Project

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # production bundle
pnpm tsc --noEmit # type-check only
```

**Dev login credentials:** `demo@trail.app` / `password`

Set `VITE_API_BASE_URL` in `.env` before going to production.

---

## 4. Architecture Overview

```
Browser
  │
  ▼
RouterProvider                 ← React Router data router
  │
  ├── /auth/login              ← AuthLayout (bounces away if logged in)
  │     └── LoginPage          ← calls useAuthStore.login()
  │
  └── / (ProtectedRoute)       ← redirects to /auth/login if not authenticated
        └── RootLayout         ← Sidebar + Navbar + Outlet
              ├── DashboardPage
              ├── ActivitiesPage ──→ MasterTablePage(activityConfig)
              └── UsersPage ──────→ MasterTablePage(userConfig)

Data flow per feature page:
  MasterTableConfig
    → useTableController     (search, filters, sort, pagination state + URL sync)
    → useActivitiesQuery     (React Query → apiFetch → mock or real backend)
    → ApiPage<Activity>
    → TableCore / DataTable  (TanStack Table + Virtual rendering)
```

**Three layers of state:**

| Layer | Tool | Examples |
|---|---|---|
| Server cache | React Query | paginated table data, dashboard stats |
| Persistent UI | Zustand + localStorage | auth session, sidebar, column prefs |
| Ephemeral UI | React `useState` | dropdowns, drawer open, search input |

---

## 5. Routing

**File:** `src/router/index.tsx`

The router has two top-level branches — public auth pages and protected app pages:

```
/auth/login        → AuthLayout → LoginPage
/                  → ProtectedRoute → RootLayout
  /                → DashboardPage
  /activities      → ActivitiesPage
  /users           → UsersPage
  /records         → PlaceholderPage
  /errors          → PlaceholderPage
  /software        → PlaceholderPage
  *                → NotFoundPage
```

**Key points:**

- All pages are `lazy()`-loaded — each gets its own JS chunk.
- `errorElement: <ErrorPage />` is set on both top-level routes so any thrown error or bad navigation is caught.
- `ProtectedRoute` uses an `<Outlet />` pattern — it's a layout route, not a per-component wrapper. This is intentional: transit-style per-route `access={...}` props get messy fast.
- `AuthLayout` handles the reverse guard — if you visit `/auth/login` while logged in, it redirects to `/`.

**Adding a route:**

```ts
// 1. Add the path to routes.tsx
export const ROUTES = {
  ...
  INVOICES: "/invoices",
} as const;

// 2. Optionally add to NAV_ITEMS in routes.tsx
{ label: "Invoices", href: ROUTES.INVOICES, icon: <InvoiceIcon /> }

// 3. Add to ROUTE_TITLES
[ROUTES.INVOICES]: "Invoices",

// 4. Add the lazy import + route in router/index.tsx
const InvoicesPage = lazy(() => import("@/features/invoices/page").then(...));

{ path: ROUTES.INVOICES, element: <PageSuspense><InvoicesPage /></PageSuspense> }
```

---

## 6. Authentication

### Flow

```
LoginPage.handleSubmit()
  → useAuthStore.login({ email, password })
    → auth.api.ts apiLogin()          ← swap mock for real here
    → set({ user, tokens, isAuthenticated: true })
    → persisted to localStorage "trail-auth"
  → navigate(from ?? "/")            ← goes back to originally requested URL
```

### Store — `src/store/useAuthStore.ts`

```ts
const { user, isAuthenticated, login, logout } = useAuthStore();
```

| Field | Type | Description |
|---|---|---|
| `user` | `User \| null` | Logged-in user (name, email, role, id) |
| `tokens` | `AuthTokens \| null` | accessToken + expiresAt |
| `isAuthenticated` | `boolean` | Derived from tokens presence |
| `login(credentials)` | `async` | Calls API, stores result, throws on failure |
| `logout()` | `async` | Clears state, best-effort server call |

### Protecting new routes

`ProtectedRoute` wraps the entire authenticated route tree — you don't need to do anything. New routes under `/` in `router/index.tsx` are automatically protected.

### Swapping to a real backend

Open `src/lib/auth/auth.api.ts`. Each function has a clear `--- MOCK ---` / `--- END MOCK ---` block. Delete the block and uncomment the real `apiClient.post()` line. The store and pages need no changes.

```ts
// Before (mock):
await new Promise((r) => setTimeout(r, 800));
if (credentials.email === "demo@trail.app" && ...) { return { user, tokens }; }
throw new Error("Invalid email or password");

// After (real):
const { data } = await apiClient.post<LoginResponse>("/auth/login", credentials);
return data;
```

### Adding token to API requests

Once you have a real token, wire it into the Axios instance in `src/lib/api/client.ts`:

```ts
apiClient.interceptors.request.use((config) => {
  const { tokens } = useAuthStore.getState();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});
```

---

## 7. State Management

Three Zustand stores, all with `persist` middleware:

### `useAuthStore` — `src/store/useAuthStore.ts`
Auth state. See §6.

### `useLayoutStore` — `src/store/useLayoutStore.ts`
```ts
const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
```
Persists to `trail-layout`. Controls sidebar width (w-14 collapsed, w-60 expanded).

### `useTableStore` — `src/store/useTableStore.ts`
```ts
const { getPrefs, setColumnVisibility, setPageSize } = useTableStore();
const prefs = getPrefs("activities-v1");
```
Stores per-table column visibility, pinning, page size, density, and zebra rows. Key is the feature's `persistenceKey` (e.g., `"activities-v1"`). Bump the version suffix when you change the column schema to avoid stale localStorage.

---

## 8. API Layer

### `apiFetch<T>` — `src/lib/api/client.ts`

The single function all data queries go through:

```ts
const page = await apiFetch<Activity>("/activities", params, signal);
// → ApiPage<Activity>: { items, total, page, pageSize, hasMore, nextCursor }
```

1. Checks the mock registry first. If a mock handler is registered for the route, it's called instead of the real network.
2. Otherwise does `GET ${route}?${toQueryString(params)}`.
3. Unwraps the backend pagination envelope (`{ paginationMetadata, data }`) into the flat `ApiPage<T>` shape.

### `buildApiParams` — `src/lib/api/queryUtils.ts`

Converts the UI's `QueryParams` object into a flat `ApiQueryParams` record ready for the query string:

```ts
buildApiParams({
  page: 2,
  pageSize: 50,
  search: "alice",
  sortKey: "createdAt",
  sortDir: "desc",
  filters: { status: ["active"], module: "auth" },
})
// → { page: 2, pageSize: 50, q: "alice", sort: "createdAt", dir: "desc",
//     "f.status": '["active"]', "f.module": '"auth"' }
```

Filters are JSON-serialised under `f.*` keys. The backend feature query files (`activity.query.ts`, `user.query.ts`) decode and map these to backend-specific field names.

### `ApiRequestError`

All HTTP errors are normalised by the Axios response interceptor into `ApiRequestError` instances with `.status`, `.code`, `.message`. Catch these in query `onError` handlers.

---

## 9. Mock System

The project ships with realistic mock data so you can develop without a backend.

### How it works

```ts
// In a query file:
registerMock("/activities", fetchActivitiesFromServer);

// fetchActivitiesFromServer reads ApiQueryParams, applies filters/sort/pagination,
// and returns ApiPage<Activity>.
```

`registerMock` adds the handler to a `Map` inside `client.ts`. When `apiFetch` is called for that route, the mock runs instead of a network call.

### Mock datasets

| File | Records | Details |
|---|---|---|
| `activities.mock.ts` | 10,000 | 16 users, 7 modules, 6 statuses, 6 severities, timestamps spread over last year |
| `users.mock.ts` | 500 | 25 name templates, 4 roles, 3 statuses |

### `mockUtils.ts` helpers

```ts
// Cancelable delay (respects AbortSignal)
await delay(300, signal);

// Parse flattened API params into structured object
const { page, pageSize, search, sort, filters } = parseParams(apiParams);

// Natural sort: "10 users" sorts after "9 users"
const sorted = sortItems(items, "name", "asc");

// Slice + build ApiPage with cursor
const page = paginate(filtered, params);
```

### Removing mocks

Delete the `registerMock(...)` call from the feature query file. `apiFetch` will fall through to the real network.

---

## 10. DataTable Component

**Location:** `src/components/DataTable/`

A low-level TanStack Table wrapper. Use this when you need a table without the full MasterTablePage overhead — e.g., a read-only embedded list.

```tsx
<DataTable
  tableId="my-table"
  columns={columns}          // ColumnDef<T>[] from TanStack Table
  queryResult={queryResult}  // { loading, error, data: ApiPage<T> }
  params={params}
  onParamsChange={setParams}
  filterDrawer={<MyFilters />}
  activeFilters={activeFilters}
  bulkActions={bulkActions}
/>
```

### Server-side model

TanStack Table runs in "manual" mode — `manualSorting`, `manualFiltering`, `manualPagination` are all true. The table does **not** transform data. It only tracks UI state. Every sort click / page change / search fires `onParamsChange`, your query refetches, and new data flows in.

### Virtualization

Rows are virtualized automatically when the row count exceeds 100. `@tanstack/react-virtual` renders only the visible window — you can display 50,000 rows without lag.

### Persistence

`useTablePersistence` watches for changes to column visibility, column pinning, and page size, then writes them to `useTableStore` under the `tableId` key. They're restored on next mount.

### Key constants (`constants.ts`)

```ts
DEFAULT_PAGE_SIZE = 20
SEARCH_DEBOUNCE_MS = 300
SKELETON_ROW_COUNT = 8
```

---

## 11. MasterTablePage Layout

**Location:** `src/layouts/MasterTablePage/`

The high-level orchestrator for full CRUD pages. Every feature page (Activities, Users) is just a `MasterTableConfig` object passed to `<MasterTablePage config={...} />`.

### Config shape (`types.ts`)

```ts
interface MasterTableConfig<T> {
  title: string;
  persistenceKey: string;     // localStorage key — bump version on schema change
  queryHook: (params) => QueryResult<T>;
  columns: ColumnDef<T>[];
  filters?: FilterDef[];
  rowActions?: RowAction<T>[];
  toolbarActions?: ToolbarAction[];
  bulkActions?: BulkAction<T>[];
  drawer?: DrawerDef<T>;
  permissions?: Permissions;
  emptyState?: { title; description };
  breadcrumbs?: { label; href }[];
}
```

### `useTableController`

The brains behind MasterTablePage. It manages:

- **URL sync** — `search`, `page`, and base64-encoded `filters` are in the URL so links are shareable and the browser Back button works.
- **Debounce** — search is debounced 300ms to avoid hammering the API.
- **Page reset** — page resets to 1 whenever search, filters, or sort change.
- **Selection** — clears when the user changes pages.
- **Saved views** — stored in localStorage under `mtp_views_${persistenceKey}`.
- **Preferences** — column visibility, density, and sort are saved in localStorage under `mtp_prefs_${persistenceKey}`.

### Filter types

```ts
type FilterType =
  | "text"          // free text input
  | "select"        // single value dropdown
  | "multi-select"  // multi-value dropdown (stored as JSON array)
  | "date"          // single date picker
  | "date-range"    // from / to date pickers
  | "boolean"       // Yes / No / Any toggle
  | "number-range"  // min / max number inputs
```

### Permissions

```ts
permissions: {
  create: true,    // shows "Add" toolbar button
  edit: true,      // shows "Edit" row action
  delete: false,   // hides "Delete" row action
  export: true,    // shows Export dropdown
  bulkDelete: false,
}
```

### Row actions

```ts
rowActions: [
  {
    label: "Edit",
    icon: <EditOutlined />,
    onClick: (row) => navigate(`/invoices/${row.id}/edit`),
  },
  {
    label: "Delete",
    icon: <DeleteOutlined />,
    danger: true,
    show: (row) => row.status !== "locked", // conditional visibility
    onClick: (row) => handleDelete(row),
  },
]
```

### Drawer

The drawer slides from the right and renders any component you provide:

```ts
drawer: {
  component: InvoiceDrawer,  // receives { record: T; onClose: () => void }
  width: 480,
  title: (record) => `Invoice #${record.number}`,
}
```

---

## 12. Adding a New Feature Page

Use the Activities feature as your template. Here's the complete checklist:

### Step 1 — Types (`invoice.types.ts`)

```ts
export interface Invoice {
  id: string;
  number: string;
  customer: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  createdAt: string;
}
```

### Step 2 — Mock data (`lib/mock/invoices.mock.ts`)

```ts
const INVOICES: Invoice[] = Array.from({ length: 500 }, (_, i) => ({ ... }));

export async function fetchInvoicesFromServer(
  params: ApiQueryParams,
  signal?: AbortSignal,
): Promise<ApiPage<Invoice>> {
  await delay(200, signal);
  const { page, pageSize, search, sort, filters } = parseParams(params);
  // filter, sort, paginate
  return paginate(results, { page, pageSize });
}
```

### Step 3 — React Query hook (`invoice.query.ts`)

```ts
import { useQuery } from "@tanstack/react-query";
import { registerMock, apiFetch } from "@/lib/api/client";
import { buildApiParams } from "@/lib/api/queryUtils";
import { fetchInvoicesFromServer } from "@/lib/mock/invoices.mock";
import type { QueryParams } from "@/layouts/MasterTablePage/types";

registerMock("/invoices", fetchInvoicesFromServer);

export function useInvoicesQuery(params: QueryParams) {
  const apiParams = buildApiParams(params);
  return useQuery({
    queryKey: ["invoices", apiParams],
    queryFn: ({ signal }) => apiFetch<Invoice>("/invoices", apiParams, signal),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
```

### Step 4 — Columns (`invoice.columns.tsx`)

```ts
export const invoiceColumns: ColumnDef<Invoice>[] = [
  {
    key: "number",
    title: "Invoice #",
    dataIndex: "number",
    sortable: true,
    defaultVisible: true,
  },
  {
    key: "status",
    title: "Status",
    dataIndex: "status",
    render: (value) => <StatusBadge status={value} />,
  },
  // ...
];
```

### Step 5 — Filters (`invoice.filters.ts`)

```ts
export const invoiceFilters: FilterDef[] = [
  {
    key: "status",
    label: "Status",
    type: "multi-select",
    options: [
      { label: "Draft", value: "draft" },
      { label: "Paid", value: "paid" },
    ],
  },
];
```

### Step 6 — Config (`invoice.config.ts`)

```ts
export const invoiceConfig: MasterTableConfig<Invoice> = {
  title: "Invoices",
  persistenceKey: "invoices-v1",
  queryHook: useInvoicesQuery,
  columns: invoiceColumns,
  filters: invoiceFilters,
  rowActions: [...],
  toolbarActions: [...],
  permissions: { create: true, edit: true, delete: false, export: true },
};
```

### Step 7 — Page (`page.tsx`)

```ts
import { MasterTablePage } from "@/layouts/MasterTablePage";
import { invoiceConfig } from "./invoice.config";

export function InvoicesPage() {
  return <MasterTablePage config={invoiceConfig} />;
}
```

### Step 8 — Wire up routing

Add to `routes.tsx` and `router/index.tsx` (see §5 Adding a route).

---

## 13. Dashboard

**Location:** `src/pages/dashboard/`

The dashboard uses a local `fetchDashboardData()` function in `api.ts` instead of `apiFetch` — dashboard data is not paginated and doesn't need a query string. Swap the mock in `api.ts` for a real `apiClient.get("/dashboard")` call when the backend is ready.

Auto-refetches every 60 seconds. Manual refresh button resets the "last updated" timestamp.

**Components:**

| Component | Data |
|---|---|
| `StatCard` | KPI value + delta + sparkline |
| `ActivityTrendChart` | Line chart — events per day over the last 30 days |
| `ModuleBarChart` | Bar chart — event count by module |
| `StatusDonut` | Pie chart — event status distribution |
| `RecentActivityFeed` | Last 10 events with user, action, timestamp |
| `TopUsersCard` | Top 5 users by event count |

---

## 14. Connecting a Real Backend

### Auth
See §6 — swap `src/lib/auth/auth.api.ts`.

### Table data

1. Delete the `registerMock(...)` call in the feature's `query.ts` file.
2. The response envelope from your backend must either:
   - Match `ApiPage<T>` directly (`{ items, total, page, pageSize }`), or
   - Wrap data in `{ data, paginationMetadata: { totalCount, pageNumber, pageSize, hasNextPage } }` — the client automatically unwraps this shape.

### Filter mapping

Each feature's `query.ts` file has a `toXxxBackendParams()` function that maps frontend filter keys to backend field names:

```ts
// activity.query.ts
function toActivityBackendParams(apiParams: ApiQueryParams) {
  return {
    ...apiParams,
    // rename frontend key → backend field
    "f.userId": apiParams["f.user"],
    "f.dateFrom": /* parse f.dateRange */ ...,
  };
}
```

Adjust this function to match whatever query format your backend expects.

### Token injection

Add a request interceptor to `src/lib/api/client.ts`:

```ts
apiClient.interceptors.request.use((config) => {
  const { tokens } = useAuthStore.getState();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});
```

### Token refresh

Add a response interceptor that detects 401, calls your refresh endpoint, and retries the original request:

```ts
apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      // call refresh endpoint, update store, retry
    }
    return Promise.reject(err);
  }
);
```

---

## 15. Conventions & Rules

### File naming
- Components: `PascalCase.tsx`
- Hooks, utilities, types: `camelCase.ts`
- Feature files: `featureName.purpose.ts` (e.g., `activity.columns.tsx`)

### Imports
Always use the `@/` alias — never relative paths that go up more than one level.

```ts
// Good
import { useAuthStore } from "@/store/useAuthStore";

// Bad
import { useAuthStore } from "../../store/useAuthStore";
```

### `persistenceKey` versioning
When you change a feature's column schema, filter shape, or preference structure, bump the version suffix:

```ts
persistenceKey: "activities-v2"  // was "activities-v1"
```

This prevents stale localStorage data from breaking the UI for existing users.

### No comments unless the WHY is non-obvious
Don't comment what code does — name it well instead. Only add a comment when there's a hidden constraint, a workaround, or a subtle invariant a reader would miss.

### Adding icons
All icons come from `@ant-design/icons`. Re-export from `src/components/layout/icons.tsx` if they're used across multiple layout components; import directly for feature-level usage.

### Environment variables
Vite exposes only `VITE_*` prefixed variables to the client. Never put secrets in `.env`.

```env
VITE_API_BASE_URL=https://api.yourapp.com
```

### Column schema migration
The `useTableStore` stores column visibility by column key. If you rename a key, existing localStorage entries will silently ignore the old key. Always bump `persistenceKey` when renaming columns.
