# AI Project Context

## 1. Project Summary

AdminGPH is a personal contractor dashboard ("Личный пульт управления") for a single software contractor. It tracks work tasks, worklogs (time entries), income projections after 13% NDFL tax, monthly expenses (manual + fixed-percentage "piggy banks"), a wishlist with reachability forecasts, a task calendar via FullCalendar, and generates formatted Excel monthly reports for client billing.

Built on **Next.js 16 App Router**, **Prisma + PostgreSQL (Neon)**, and **React 19**, with **Tailwind CSS v4 + CSS Modules** for styling. All data mutations go through **Server Actions**; there are no REST or tRPC API routes. The app has **no authentication** — it is a single-user local/private dashboard.

## 2. Tech Stack

| Category        | Technology                                                 | Version          |
| --------------- | ---------------------------------------------------------- | ---------------- |
| Framework       | Next.js (App Router)                                       | 16.2.9           |
| UI Library      | React                                                      | 19.2.4           |
| Language        | TypeScript                                                 | 5.x              |
| ORM             | Prisma                                                     | 5.22.0           |
| Database        | PostgreSQL (Neon serverless)                               | —                |
| Styling         | Tailwind CSS v4 + CSS Modules                              | 4.x              |
| Forms           | react-hook-form + @hookform/resolvers + zod                | 7.80 / 5.4 / 4.4 |
| Client State    | TanStack React Query (minimal — QueryClient provider only) | 5.101            |
| Tables          | TanStack React Table (used in tasks page)                  | 8.21             |
| Calendar        | FullCalendar (React wrapper)                               | 6.1.21           |
| Charts          | Recharts                                                   | 3.9              |
| Excel Export    | exceljs                                                    | 4.4              |
| Icons           | lucide-react                                               | 1.21             |
| Dates           | date-fns                                                   | 4.4              |
| Utilities       | clsx, tailwind-merge                                       | 2.1 / 3.6        |
| Analytics       | @vercel/speed-insights                                     | 2.0              |
| Package Manager | bun (bun.lock present)                                     | —                |
| Hosting         | Vercel (inferred from vercel-build script)                 | —                |

## 3. High-Level Architecture

The application follows a **Server Components + Server Actions** pattern (no API routes):

1. **Pages** (`app/*/page.tsx`) are async Server Components that fetch data directly from Prisma or via Server Actions, then pass it as props to Client Components.
2. **Mutations** use Next.js Server Actions (`actions/*.ts`, marked `"use server"`). They parse FormData with Zod schemas, write to Prisma, and call `revalidatePath()` to invalidate the Next.js full-route cache.
3. **Client Components** (`components/**/*.tsx`) are interactive islands for forms, tables, dialogs, and the calendar. They receive initial data as props and call Server Actions for mutations.
4. There is **no global state management** beyond React Query's cache (used only in `Providers`). All shared state flows through server-rendered props and `router.refresh()` after mutations.

Data flow: `Server Component (page.tsx)` → reads DB → passes to `Client Component` → user interaction → `Server Action` → writes DB → `revalidatePath()` → `router.refresh()` → re-render.

## 4. Directory Map

| Path                                     | Purpose                                                                                                                 | Notes                                                                                            | Risk   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| `app/`                                   | Next.js App Router pages, layouts, CSS modules                                                                          | Root layout in `app/layout.tsx`, providers in `app/providers.tsx`                                | Medium |
| `app/page.tsx`                           | Dashboard home page (340 lines, large)                                                                                  | Complex: KPI cards, finance overview, wishlist preview, schedule                                 | High   |
| `app/tasks/`                             | Task management page                                                                                                    | Reads via `getTasksWithActualHours()`, renders `TaskTable`                                       | Medium |
| `app/calendar/`                          | FullCalendar-based schedule page                                                                                        | Needs verification: exact page content not reviewed                                              | Low    |
| `app/expenses/`                          | Monthly expenses planner                                                                                                | Renders `ExpensePlanner` client component                                                        | Low    |
| `app/finance/`                           | Finance/settings page                                                                                                   | Needs verification: exact page content not reviewed                                              | Low    |
| `app/reports/`                           | Monthly report generation + Excel export                                                                                | Has nested `reports/export/` route                                                               | Medium |
| `app/wishlist/`                          | Wishlist management                                                                                                     | Needs verification: exact page content not reviewed                                              | Low    |
| `app/worklog/`                           | Worklog (time entries) page                                                                                             | Needs verification: exact page content not reviewed                                              | Low    |
| `components/layout/`                     | `AppShell` (sidebar + main wrapper), `Sidebar`                                                                          | Sidebar is a client component, uses `usePathname`                                                | Medium |
| `components/dashboard/`                  | `KpiCards` — 7 KPI cards + circular progress dial                                                                       | Client component, receives `KpiData` as props                                                    | Low    |
| `components/tasks/`                      | `TaskTable` — full CRUD table with filters, sorting, dialogs (337 lines)                                                | Largest component, uses TanStack Table + react-hook-form                                         | High   |
| `components/finance/`                    | `ExpensePlanner`, `FinanceCards`, `WishlistPlanner`                                                                     | Expense form + summary cards                                                                     | Medium |
| `components/calendar/`                   | `CalendarView` — FullCalendar wrapper                                                                                   | Needs verification: not fully reviewed                                                           | Medium |
| `components/worklog/`                    | `WorklogTable` + `rep1.ps1`                                                                                             | **PowerShell script inside components folder — out of place**                                    | High   |
| `components/ui/`                         | Reusable primitives: Button, Card, Input, Select, Badge, Dialog, Switch, Table                                          | Custom, NOT based on shadcn/ui. Each has co-located CSS module                                   | Medium |
| `lib/db.ts`                              | Singleton PrismaClient instance                                                                                         | Standard Next.js global-cache pattern                                                            | Low    |
| `lib/utils.ts`                           | `formatCurrency`, `formatHours`, `formatPercent`                                                                        | Small, stable                                                                                    | Low    |
| `lib/validators.ts`                      | All Zod schemas: task, worklog, schedule, settings, expense, wishlist, report                                           | Single source of validation truth (98 lines)                                                     | Medium |
| `lib/money.ts`                           | NDFL rate (13%), fixed expense constants, `calculateFixedExpenseAmount`, `calculateAfterNdfl`, `calculateMonthsToReach` | Core financial math — changes here affect all money displays                                     | High   |
| `lib/finance-overview.ts`                | `getFinanceOverview()` — aggregates tasks, expenses, wishlist into dashboard DTO                                        | Central data-fetching function for dashboard and expenses pages (123 lines)                      | High   |
| `lib/task-metrics.ts`                    | `getCompletedTasksInRange`, `groupCompletedTasksByDate`                                                                 | Pure functions for filtering/grouping completed tasks                                            | Low    |
| `lib/reports.ts`                         | `generateMonthlyReport`, `buildMonthlyReportWorkbookBuffer` (ExcelJS), `storeMonthlyReport`                             | Excel report generation with hardcoded Russian template (248 lines)                              | High   |
| `lib/integrations/azure-devops/types.ts` | Stub interfaces for Azure DevOps sync                                                                                   | **Not implemented** — placeholder with "Future implementation" comment                           | Low    |
| `actions/`                               | 7 Server Action files: expense, settings, task, worklog, report, schedule, wishlist                                     | All follow same pattern: parse FormData → Prisma → revalidatePath                                | Medium |
| `prisma/schema.prisma`                   | Database schema: Task, Worklog, TaskSchedule, Settings, MonthlyExpense, WishlistItem, MonthlyReport                     | 7 models, string dates throughout, no enums                                                      | High   |
| `prisma/seed.ts`                         | Seed script with sample tasks, worklogs, schedules, report                                                              | Development-only                                                                                 | Low    |
| `prisma/migrations/`                     | Prisma migration history, включая добавление ставки за человеко-день                                                    | Critical — never edit manually                                                                   | High   |
| `generated/`                             | Stale Prisma client output                                                                                              | **Legacy** — appears to be from older Prisma version, `lib/db.ts` uses `@prisma/client` directly | Low    |
| `scripts/migrate-sqlite-to-postgres.ts`  | One-shot migration script from SQLite → PostgreSQL                                                                      | May still be relevant if dev.db is the old source                                                | Low    |
| `public/`                                | Static assets: SVG icons (file, globe, next, vercel, window)                                                            | Standard Next.js                                                                                 | Low    |
| `dev.db`                                 | SQLite database file in project root                                                                                    | **Legacy artifact** from pre-PostgreSQL era — 7+ MB                                              | Medium |

## 5. Routing Structure

- **Router type**: App Router only (no Pages Router). No `/pages` directory.
- **Root layout**: `app/layout.tsx` — wraps everything in `<html dark>` with Geist fonts, `<Providers>`, `<SpeedInsights />`.
- **No nested layouts** — every page imports `<AppShell>` individually rather than using a route-group layout.
- **Pages**:

| Route             | File                    | Dynamic                                           |
| ----------------- | ----------------------- | ------------------------------------------------- |
| `/`               | `app/page.tsx`          | `force-dynamic`                                   |
| `/tasks`          | `app/tasks/page.tsx`    | `force-dynamic`                                   |
| `/calendar`       | `app/calendar/page.tsx` | Needs verification                                |
| `/expenses`       | `app/expenses/page.tsx` | `force-dynamic`                                   |
| `/finance`        | `app/finance/page.tsx`  | Needs verification                                |
| `/reports`        | `app/reports/page.tsx`  | Needs verification                                |
| `/reports/export` | `app/reports/export/`   | Needs verification (likely API for XLSX download) |
| `/wishlist`       | `app/wishlist/page.tsx` | Needs verification                                |
| `/worklog`        | `app/worklog/page.tsx`  | Needs verification                                |

- **Loading state**: `app/loading.tsx` exists at the root level. No per-route loading files observed.
- **No `error.tsx` / `not-found.tsx`** — no custom error or 404 pages.
- **No middleware.ts** — no auth guards, no redirects, no header rewriting.

## 6. Data Fetching

- **Pattern**: Pages are async Server Components. They either call Prisma directly (dashboard `page.tsx` calls `db.taskSchedule.findMany()`) or through Server Actions (`app/tasks/page.tsx` calls `getTasksWithActualHours()`).
- **All pages use `export const dynamic = "force-dynamic"`** — fully dynamic SSR, no SSG/ISR.
- **Almost no `fetch()` calls** — app data comes from Prisma, with one exception: wishlist product preview parsing fetches external product pages on the server (`lib/wishlist-product-preview.ts`) during create/update mutations.
- **TanStack React Query** is set up in `app/providers.tsx` with `staleTime: 30_000` but is **barely used**. No `useQuery` calls found in any client component. The QueryClientProvider exists but is effectively inert.
- **Revalidation**: After mutations, Server Actions call `revalidatePath()` for specific paths. Client components call `router.refresh()` to re-fetch server-rendered props.
- **No optimistic updates** — mutations wait for server response, then refresh the full page data.

## 7. State Management

- **Server state**: All persistent state lives in PostgreSQL via Prisma. Pages fetch fresh data on every request (force-dynamic).
- **Client state**: Minimal — `useState` for form inputs, dialog open/close, filter states. No global client store (no Redux, Zustand, Jotai, etc.).
- **Form state**: `react-hook-form` with `zodResolver` in `TaskTable`; plain `useState` + hidden inputs in `ExpensePlanner`.
- **Auth state**: None — no authentication.
- **URL state**: `usePathname()` in Sidebar for active link highlighting only.

## 8. API Layer

There is **no traditional API layer**. The project uses Next.js Server Actions instead of REST/GraphQL endpoints:

- `actions/task-actions.ts` — createTask, updateTask, deleteTask, getTask, getTasks, getTasksWithActualHours
- `actions/worklog-actions.ts` — createWorklog, updateWorklog, deleteWorklog, getWorklogs
- `actions/expense-actions.ts` — createExpense, updateExpense, deleteExpense, saveMonthlyExpenses (batch upsert)
- `actions/settings-actions.ts` — getSettings, updateSettings
- `actions/report-actions.ts` — generateReport, fetchStoredReports, fetchReport
- `actions/schedule-actions.ts` — createSchedule, updateSchedule, deleteSchedule, getSchedules
- `actions/wishlist-actions.ts` — createWishlistItem, updateWishlistItem, deleteWishlistItem

**Error handling**: Actions throw errors that propagate to the client. No structured error responses, no try-catch in most actions. The `saveMonthlyExpenses` action is the only one with explicit validation error messages.

**The `app/reports/export/` route** likely exports Excel files — this may be the only non-action HTTP endpoint. Needs verification.

## 9. Authentication & Authorization

**None.** The app is a single-user personal dashboard with no login, no sessions, no roles, no middleware guards. The database connection string is in `.env` (Neon PostgreSQL). This is intentional for a solo contractor tool.

- **No middleware.ts** — no route protection.
- **No session/cookie logic** — no `next-auth`, no JWT.
- **No user model** in the schema — `Settings` has a hardcoded `id: "default"` singleton pattern.

## 10. UI System

- **Custom component library** in `components/ui/` — NOT shadcn/ui, NOT Radix. All primitives are hand-built:
  - `Button` — 4 variants (default, outline, ghost, destructive), 3 sizes, uses `forwardRef`
  - `Card` — with `Card.Header`, `Card.Content`, and `hover` prop
  - `Input` — with `label` and `error` props, forwards ref for react-hook-form
  - `Select` — native `<select>` wrapper with label
  - `Badge` — with variant/color mapping and size
  - `Dialog` — custom implementation with `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogBody`, `DialogFooter`
  - `Switch`, `Table` — also custom
- **Layout**: `AppShell` + `Sidebar` pattern. `AppShell` is a Server Component wrapping every page. `Sidebar` is a Client Component with mobile hamburger + overlay.
- **Icons**: lucide-react exclusively.
- **No design system tokens** beyond Tailwind CSS v4 utilities and CSS custom properties for fonts (`--font-geist-sans`, `--font-geist-mono`).
- **Dark mode is forced** — `<html>` tag hardcodes `className="dark"`.

## 11. Forms & Validation

- **Library**: `react-hook-form` v7 + `@hookform/resolvers` with `zod` v4.
- **Validation schemas**: All in `lib/validators.ts` (98 lines): `createTaskSchema`, `updateTaskSchema`, `createWorklogSchema`, `updateWorklogSchema`, `createScheduleSchema`, `updateSettingsSchema`, `generateReportSchema`, `createExpenseSchema`, `updateExpenseSchema`, `createWishlistItemSchema`, `updateWishlistItemSchema`.
- **Usage**:
  - `TaskTable` uses full react-hook-form with zodResolver for task create/edit dialog.
  - `ExpensePlanner` uses plain `useState` + hidden `<input>` fields — form submission calls `saveMonthlyExpenses` Server Action which batch-upserts all expense categories.
- **Inconsistency**: Task form uses react-hook-form + Zod. Expense form uses uncontrolled native inputs + FormData. Settings form pattern unknown (needs verification).
- **Server-side validation**: Actions call `.parse()` on schemas (throws on failure). No try-catch to return structured field errors — Zod errors bubble up as unhandled exceptions.

## 12. Styling

- **Tailwind CSS v4** via `@tailwindcss/postcss` plugin. Config in `postcss.config.mjs` (empty plugins object — Tailwind v4 uses CSS-based config).
- **CSS Modules** (`*.module.css`) co-located with every component and page. This is the **primary styling approach** — components import their `.module.css` file directly.
- **Global styles**: `app/globals.css` (needs verification for content).
- **No SCSS/SASS**, no styled-components, no CSS-in-JS.
- **Class merging**: `clsx` and `tailwind-merge` are in dependencies but usage of `tailwind-merge` is not obvious in reviewed files (may be used in unreviewed pages).
- **Responsive**: Sidebar has mobile hamburger pattern with overlay. Grid layouts use CSS modules for breakpoints.

## 13. Testing

**There are no tests.** Zero test files, zero test scripts in `package.json`, no testing libraries in dependencies (no Jest, Vitest, Playwright, Testing Library).

- `npm run lint` / `bun lint` runs ESLint (Next.js core-web-vitals + typescript configs).

## 14. Build, Scripts & Tooling

| Script                       | Purpose                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `dev`                        | `next dev --webpack` - local development server; avoids Turbopack HMR reload loops in synced folders |
| `dev:turbo`                  | `next dev --turbopack` - optional Turbopack development server for explicit testing |
| `build`                      | `next build` — production build                                              |
| `start`                      | `next start` — production server                                             |
| `lint`                       | `eslint` — lint all files                                                    |
| `postinstall`                | `prisma generate` — auto-generate Prisma client after install                |
| `vercel-build`               | `prisma generate && prisma migrate deploy && next build` — Vercel deployment |
| `seed`                       | `bun prisma/seed.ts` — seed database with sample data                        |
| `migrate:sqlite-to-postgres` | `bun scripts/migrate-sqlite-to-postgres.ts` — one-shot migration             |

- **Package manager**: bun (indicated by `bun.lock` and `bun` in scripts).
- **Linting**: ESLint v9 with flat config (`eslint.config.mjs`), using `eslint-config-next` v16 (core-web-vitals + typescript). No Prettier config found.

## 15. Legacy Zones

| Path                                     | Why Legacy                                             | Risks                                                                        | How to Safely Change                                                                               |
| ---------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `generated/`                             | Old Prisma client output directory                     | Out of sync with current `@prisma/client`; confusing to developers           | Delete after confirming `prisma generate` outputs elsewhere (likely `node_modules/.prisma/client`) |
| `dev.db`                                 | SQLite file in project root (7+ MB)                    | Leftover from pre-PostgreSQL migration; could be accidentally used           | Confirm `DATABASE_URL` points to PostgreSQL, then remove. Keep backup.                             |
| `scripts/migrate-sqlite-to-postgres.ts`  | One-shot migration script                              | May reference old schema; could fail if re-run                               | Review before deleting. Ensure PostgreSQL is the canonical source.                                 |
| `components/worklog/rep1.ps1`            | PowerShell script inside components directory          | Not a component; unclear purpose; could be dangerous if executed unknowingly | Move to `scripts/` or delete after understanding its purpose.                                      |
| `lib/integrations/azure-devops/types.ts` | Stub interfaces with "Future implementation" comment   | Not connected to anything; dead code                                         | Safe to delete or keep as reference. No runtime impact.                                            |
| String date fields in Prisma schema      | All date/time fields are `String` type, not `DateTime` | No date validation at DB level; timezone ambiguity; ordering issues          | Migration to `DateTime` is high-effort. Keep as-is unless strong reason to change.                 |

## 16. Dangerous / Sensitive Areas

These files and folders should not be modified without thorough review:

- **`prisma/schema.prisma`** — The entire data model. Changes require migrations. Breaking changes cascade to all actions, lib functions, and components.
- **`prisma/migrations/`** — Never edit manually. Only add new migrations via `prisma migrate dev`.
- **`lib/money.ts`** — Contains NDFL tax rate (13%) and fixed expense percentages (40% apartment, 5% education). Changing these constants silently alters all financial calculations.
- **`lib/finance-overview.ts`** — Central aggregator for the dashboard. Called from multiple pages. Changes affect the main dashboard, expenses page, and wishlist.
- **`lib/reports.ts`** — Excel report generation with hardcoded Russian template text and formatting. Changes can break client-facing billing documents.
- **`lib/db.ts`** — Database singleton. Changing the connection pattern could cause connection leaks.
- **`actions/`** — All 7 files are the only write paths to the database. A bug here can corrupt data.
- **`lib/wishlist-product-preview.ts`** — External HTML/meta parsing for marketplace pages. Fragile by nature: third-party markup changes or anti-bot responses can silently degrade preview extraction.
- **`app/providers.tsx`** — Root client wrapper. Breaking changes affect the entire app.
- **`app/layout.tsx`** — Root layout. Metadata, fonts, forced dark mode, global CSS imports.
- **`.env`** — Contains live database credentials. Never commit changes without checking.

## 17. Common Change Recipes

### How to Add a New Page

1. Create `app/your-route/page.tsx` as an async Server Component.
2. Add `export const dynamic = "force-dynamic";` (follow existing convention).
3. Import `<AppShell>` and wrap your content.
4. Create `page.module.css` for page-specific styles.
5. Add a nav item in `components/layout/sidebar.tsx` (`navItems` array).
6. If the page needs data: call Prisma directly or create/use a Server Action.

### How to Add an API Request (Server Action)

1. Add Zod schema to `lib/validators.ts`.
2. Create/edit an action file in `actions/`, mark it `"use server"`.
3. Pattern: parse FormData → Prisma operation → `revalidatePath()` for relevant routes.
4. Import and use in a Client Component via form `action` prop or explicit call.

### How to Add a Component

1. Create folder under appropriate `components/<domain>/`.
2. Create `component-name.tsx` + `component-name.module.css`.
3. If it needs data from the server: receive it as props from the parent Server Component.
4. For mutations: import Server Actions, use `useTransition` for loading states.
5. For reusable UI primitives: add to `components/ui/`.

### How to Add a Form

1. Use `react-hook-form` + `zodResolver` for complex forms (see `TaskTable`).
2. For simple forms: use native `<form action={serverAction}>` with hidden inputs (see `ExpensePlanner`).
3. Always validate on the server side with Zod `.parse()`.
4. Call `router.refresh()` after successful mutation to re-render server props.

### How to Safely Refactor Legacy Code

1. `generated/` — check if `prisma generate` outputs to `node_modules/.prisma/client` (standard behavior). If yes, delete `generated/`.
2. `dev.db` — verify DATABASE_URL in `.env` points to PostgreSQL. If confirmed, backup and delete.
3. `components/worklog/rep1.ps1` — read it first, understand its purpose, move to `scripts/` if still needed.
4. String date fields — do NOT migrate to DateTime without a full impact analysis. Every query that filters/comparates dates relies on string comparison.

## 18. Code Review Checklist for AI Agents

When making changes to this project, verify:

- [ ] **TypeScript**: Run `bun lint` (or `npm run lint`). Ensure no new type errors.
- [ ] **Prisma schema consistency**: If you changed `schema.prisma`, run `prisma generate` and verify all imports still work.
- [ ] **Server Actions**: Every mutation must call `revalidatePath()` for affected routes AND the dashboard (`/`) since it aggregates data from all modules.
- [ ] **Client Components**: Do NOT import Prisma or Server Actions marked `"use server"` directly into client code. They must be called as form actions or passed as props.
- [ ] **CSS Modules**: Don't mix Tailwind utility classes with CSS Module classes without testing — specificity conflicts can occur.
- [ ] **String dates**: All date fields are strings. Use `date-fns` `format()` and string comparison (`gte`, `lte`). Do NOT use `new Date()` comparison without formatting.
- [ ] **No auth**: Don't add authentication guards or session checks — this is intentionally single-user.
- [ ] **Sidebar nav**: If adding a route, update `sidebar.tsx` `navItems` array.
- [ ] **Money math**: Changes to `lib/money.ts` affect all financial displays. Double-check NDFL calculations.
- [ ] **Excel reports**: Changes to `lib/reports.ts` affect client billing. Verify output format matches the hardcoded template.

**Настройки ставки**: `Settings.dailyRate` — основной редактируемый тариф за 8 часов. `hourlyRate` сохраняется синхронно как `dailyRate / 8` для совместимости; финансовые расчеты используют производную почасовую ставку.

**Common mistakes to avoid**:

- Importing `db` directly in Client Components — will cause build errors.
- Forgetting `revalidatePath("/")` after mutations — dashboard won't update.
- Using `DateTime` in Prisma — the schema uses String for all dates.
- Adding authentication — breaks the single-user model.
- Deleting `dev.db` without verifying it's not the active database.

## 19. Known Risks and Technical Debt

1. **Zero test coverage** — no unit, integration, or e2e tests. All verification is manual.
2. **String dates everywhere** — Prisma schema uses `String` for all date fields (createdAt, updatedAt, plannedDate, completedAt, scheduleDate, workDate). This is a SQLite compatibility artifact. Date queries rely on `yyyy-MM-dd` string comparison, which works for ISO format but lacks timezone safety and DB-level validation.
3. **Large files**: `app/page.tsx` (340 lines), `components/tasks/task-table.tsx` (337 lines), `lib/reports.ts` (248 lines). These are hard to reason about and prone to merge conflicts.
4. **No error boundaries** — no `error.tsx` at any route level. Unhandled errors in Server Components or Server Actions will show the default Next.js error page.
5. **No structured error handling in actions** — Zod `.parse()` throws on invalid input. No try-catch to return user-friendly field errors.
6. **Inconsistent form patterns**: `TaskTable` uses react-hook-form, `ExpensePlanner` uses uncontrolled inputs. No standard approach.
7. **React Query set up but unused** — adds dependency weight without benefit. Could be removed or properly utilized for client-side caching.
8. **Direct Prisma calls in Server Components** — `app/page.tsx` calls `db.taskSchedule.findMany()` directly while other pages go through action wrappers. Inconsistent data access pattern.
9. **No loading skeleton per route** — only root `loading.tsx`. No Suspense boundaries for granular loading states.
10. **PowerShell script in components** — `components/worklog/rep1.ps1` is out of place and its purpose is unclear.
11. **Dead stub code** — `lib/integrations/azure-devops/types.ts` has "Future implementation" comments with no actual implementation.
12. **Hardcoded Russian text** — all UI strings, Excel report templates, and validation messages are in Russian. No i18n infrastructure.
13. **`forecastMode` field** — the Settings model has a `forecastMode` field with only one value (`"CURRENT_MONTH_PACE"`). Dead enum until more modes are added.
14. **No pagination** — `getTasks()` fetches all tasks without limit/offset. Will degrade with many tasks.
15. **Wishlist preview parsing is best-effort** — Wildberries/Ozon/Avito may change markup or block requests, so product images can disappear without code changes. The feature must tolerate missing previews.

## 20. Recommended Agent Workflow

When an AI agent (Codex, Cline, Copilot, etc.) works with this repository:

1. **Read this file first** — `AI_PROJECT_CONTEXT.md` at repo root.
2. **Identify the domain** you're touching (tasks, expenses, calendar, reports, etc.).
3. **Read the relevant Server Action file** in `actions/` to understand the mutation pattern.
4. **Read the relevant lib file** if business logic is involved (`lib/finance-overview.ts` for dashboard, `lib/reports.ts` for reports, etc.).
5. **Find the page** in `app/<domain>/page.tsx` to understand the data flow.
6. **Find the component** in `components/<domain>/` that you need to modify.
7. **Check for similar implementations** — adding a new feature? See how an existing one is done in the same domain.
8. **After changes**: run `bun lint` (or `npm run lint`). If you modified `schema.prisma`, run `prisma generate`.
9. **Verify revalidation**: if you added/removed data writes, ensure `revalidatePath` covers the dashboard (`/`).
10. **Do NOT scan the entire project** — focus on the relevant domain folder + shared files (`lib/`, `actions/`, `components/ui/`).

---

## Last Analyzed

- **Date**: 2026-07-01
- **Analysis scope**: All top-level config files (`package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.env`, `postcss.config.mjs`); root layout and providers (`app/layout.tsx`, `app/providers.tsx`); dashboard page (`app/page.tsx`); expenses page (`app/expenses/page.tsx`); tasks page (`app/tasks/page.tsx`); all 7 Server Action files; all files in `lib/` (db, utils, validators, money, finance-overview, task-metrics, reports, integrations/azure-devops/types); Prisma schema and seed; layout components (`AppShell`, `Sidebar`); KPI cards; task table; expense planner; UI primitives (Button). Pages not fully reviewed: `app/calendar/`, `app/finance/`, `app/reports/`, `app/reports/export/`, `app/wishlist/`, `app/worklog/` — marked as "Needs verification" where applicable. Components not reviewed: `CalendarView`, `FinanceCards`, `WishlistPlanner`, `WorklogTable`.
- **Confidence**: 8/10 — core architecture, data flow, and business logic are well understood. Some pages and components were not fully read (see scope above). The `app/globals.css` and some CSS modules were not reviewed in detail.
