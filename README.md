# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Connected company workspace

The frontend uses the backend in `../Trio-trail`. Start its database/Redis services
and API using the backend's local setup documentation, then run:

```sh
npm install
npm run dev
```

Open http://localhost:5199. Vite proxies `/trio-trail/api` to
`http://localhost:3000`. For another API host, copy `.env.example` to `.env`
and set `VITE_API_BASE_URL` to the full prefix (including `/trio-trail/api`).
Allow the frontend origin in the backend's `TRIOTRAIL_ALLOWED_ORIGINS`.

Register a company at `/auth/sign-up`, or sign in with an existing account.
The workspace uses the authenticated tenant for all API requests:

- Overview: actual audit counts, tables, severity and daily activity.
- Activities: cursor-paginated search with date, table, actor, operation, severity,
  description and changed-field filters; inspect before/after data and transactions.
- Records: table and record ID lookup for the complete record lifecycle.
- Errors: search ERROR or CRITICAL events.
- Team & account: create tenant users and view your active sessions. The backend
  currently exposes user creation only, so a complete team directory, editing and
  deletion are not offered. User creation does not send an email.
- Database: test PostgreSQL credentials, configure capture, install and verify the
  outbox, activate capture, inspect status and stop streaming. These actions modify
  the connected database; the UI asks for confirmation for setup, install and stop.

Registration creates a new company and its ADMIN account. To add someone to an
existing company, use Team & account. Activity records are produced by database
capture, rather than manually creating audit history in the frontend.
Expired or revoked sessions return to sign-in. API/network errors offer retry;
no demo login or sample activity is used by these routes. Password reset and a
cross-company selector require backend support and are not exposed.

Validation: `npm run build` and `npm run lint`.

## Company trail workflows

The frontend in `trail` uses the backend in the sibling `Trio-trail` directory.
Run `pnpm start-dev` in that backend (with its database, Redis, and environment
configured), then `pnpm dev` here. Open `http://localhost:5199`. Development API
requests go through Vite to `http://localhost:3000/trio-trail/api`; production can
set `VITE_API_BASE_URL` using `.env.example`.

- Register a company workspace at `/auth/sign-up`, or sign in using email or username.
- The dashboard displays the signed-in company's audit statistics.
- **Database** tests PostgreSQL connectivity, configures capture, installs the
  outbox with optional application role grants, verifies it, and activates or
  resumes capture. Application actor attribution requires the backend SDK/outbox
  integration. Stopping capture is available on the same screen.
- **Activities** filters captured changes by table, actor, business operation,
  changed field, severity, text, and date. Inspect an event for before/after values,
  related transactions, and links to record history for single-column primary keys.
- **Transactions** browses grouped changes and filters by business operation or actor.
  List counts reflect changes in the current API result; open a transaction for its
  full details.
- **Records** shows a chronological history with expandable changes. The current
  backend returns at most 200 changes from the past year and does not paginate
  record history.
- **Team & account** creates a company member with an initial password, lists your
  sessions, and supports signing out all devices. The backend currently has no
  user-list or user-edit routes, so those are not exposed.

All company data comes from authenticated, tenant-scoped backend endpoints.
Identity changes clear the query cache. API errors provide retry controls.

Validation: `pnpm build` and targeted ESLint checks for company, authentication,
router, and API files. Browser checks using a temporary synthetic API fixture
cover login, dashboard data, event comparisons, record links, and transactions;
these checks do not confirm live PostgreSQL replication.

### What happened, and when

Open **Activity timeline** (`/timeline`) for a day-by-day event history with exact
seconds, actor, table, description, and changed fields. The default period covers
the last seven calendar days. Use the date/time range presets or custom bounds
to investigate earlier activity; narrow results by actor, table, description, or
created/updated/deleted actions. Date filters use the device's time zone.

The display selector switches between device time and UTC, regrouping events by
the chosen zone without changing the underlying filter period. **Load older
activity** follows the backend event cursor. **See changes** shows before/after
values and a copyable original UTC timestamp; related transaction details are
available in the same drawer. Sensitive field-level values remain as returned
by the backend, including its redaction markers.

Verify timestamp ordering, day boundaries and daylight-saving behavior during staging acceptance.

### Company setup guide

`/getting-started` is available before signing in. It explains all seven setup
steps, required details with examples, the person responsible, readiness checks,
and links to the appropriate screens. Authenticated users access the same guide
from **Setup guide** at `/setup`. A successful company registration opens Step 2
with a welcome message. Step selection is preserved in the URL (`?step=2`).

The guide distinguishes company credentials from database credentials and team
roles from application database roles. It covers PostgreSQL preparation, testing
and configuring capture, outbox installation and developer actor integration,
verification, activation, checking activity, and team accounts. It uses only the
current product workflows and does not mark capture steps complete without
verification. Registration, database setup, and the dashboard link to the guide.

### Backend model and response alignment

The company screens consume the authenticated backend response envelopes
(`statusCode` and `data`) and reject failed or missing-data responses. Authentication
requires the backend user, company and issued token; nullable company slugs are
supported. Account forms and backend email validation follow the user model's
100-character email column limit.

Audit event views distinguish source event time from received time, expose the
backend outcome, source and risk score, flag `DIRECT_DB` writes, and explain
`PARTIAL`/`UNKNOWN` comparison quality. Serialized field-detail strings are shown
without added JSON quotes. Missing values are distinguished from null, zero and
false. Sensitive details are redacted in comparisons, and raw row snapshots are
excluded from the metadata view.

Database status uses the actual replication-status enum. `eventsProcessed`
remains a string, matching the API's BigInt serialization. Null device, IP,
actor, table, description and activity values have explicit display fallbacks.

Generated local test files were removed. Verify authenticated workflows against a configured staging database before deployment.
