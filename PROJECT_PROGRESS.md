# Campus Placement Management System (CPMS) — Project Progress

**Document Version:** 2.1  
**Last Updated:** Embedded DB Self-Healing, Stale Lock Auto-Cleanup & Dual-Role Demo Sign-In Verified  
**Target Roles:** Student & Placement Administrator  
**Architecture:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Prisma ORM, Embedded Persistent PostgreSQL (PGlite) / Remote PostgreSQL

---

## Overall Implementation Roadmap & Status

| Phase | Description | Status | Verification & Test Outcome |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Workspace review, requirements analysis, canonical files, and implementation planning | **COMPLETED** | Inspected environment (Node v24.22.1, npm 11.19.1, Git initialized), verified PRD, TRD, DESIGN_SPEC, and IMPLEMENTATION_PROMPT. Created `PROJECT_PROGRESS.md` and `README.md`. |
| **Phase 1** | Project foundation: Next.js App Router, TypeScript, Tailwind CSS, Design System, Prisma Schema, Seed Data | **COMPLETED** | Initialized Next.js App Router with TypeScript & Tailwind CSS; built design tokens, accessible UI components (Button, Badge, Card, Input, Select, StatusBadge, EligibilityBadge, EmptyState, LoadingSkeleton); established AppShell, Sidebar, TopBar; configured Prisma schema & repeatable seed script. |
| **Phase 2** | Authentication & Role-Based Permissions (Student & Admin, session cookies, bcrypt, route protection) | **COMPLETED** | Implemented session management via cryptographic signed cookies (jose), password hashing (bcryptjs), student self-registration with hardcoded STUDENT role, sign-in with account status validation, horizontal isolation guards (`assertCanAccessStudent`), `/unauthorized` route, and Vitest suite (8 tests passing). Next.js build validated. |
| **Phase 3** | Student Profile & Company Management (academic fields, CGPA, branch, skills; Admin Company CRUD & archive) | **COMPLETED** | Created Student Profile page (`/student/profile`) with dynamic completeness calculator, academic department, batch, CGPA, and tag-based skills. Built Admin Company Management (`/admin/companies`, `/admin/companies/[id]`) with search, filter tabs, modal CRUD, and soft archive protection against orphaned drives. Unit test suite expanded (12 tests passing). |
| **Phase 4** | Placement Drive Management (draft/publish/close/archive, eligibility rules, recruitment stages, deadlines) | **COMPLETED** | Implemented Admin Drive CRUD (`/admin/drives`, `/admin/drives/new`, `/admin/drives/[id]`), recruitment stage pipeline configuration, quick status updates (Draft/Published/Closed), Student Drive Catalog (`/student/drives`, `/student/drives/[id]`) with deadline indicators, and strict server-side draft hiding. Vitest suite passed (16 tests). |
| **Phase 5** | Eligibility Engine & Application Tracking (deterministic check: Eligible / Ineligible / Missing Info, My Applications, Admin candidate management) | **COMPLETED** | Created deterministic explanatory eligibility engine (`evaluateEligibility`) with criteria checklist; implemented server-verified application submission (`/api/student/applications`) enforcing duplicate prevention and deadline rejection; built My Applications (`/student/applications`) with status history timeline; added Admin Applicant Review (`/admin/applicants`) with transition dialog and student notifications. Vitest suite passing (23 tests). |
| **Phase 6** | Dashboards, In-App Notifications & Reports (Live metrics from DB, notifications, CSV export, accessible charts) | **COMPLETED** | Integrated live metrics for Student & Admin Dashboards; created Student Directory (`/admin/students`), In-App Notification Centers (`/student/notifications`, `/admin/notifications`) with read states, and secure CSV report export (`/api/admin/reports/export`) with audit logging. Metric definitions verified via Vitest (26 tests passing). |
| **Phase 7** | UI/UX Polish, Responsive Layouts & Accessibility (Mobile drawer, keyboard nav, ARIA, loading/empty states) | **COMPLETED** | Verified responsive layouts on mobile, tablet, and desktop; ensured mobile navigation drawer with backdrop; configured accessible custom 404 (`/not-found`) and global error boundary (`/error`); paired all status badges with Lucide icons and text labels. |
| **Phase 8** | Comprehensive Testing, Final Documentation & Handoff (Unit, Integration, E2E tests, beginner manual test plan) | **COMPLETED** | Automated Vitest test suite passing across all suites; verified clean Next.js 16 production build with Turbopack (0 errors); created complete `README.md` with cloud/local setup instructions, demo credentials, security safeguards, and manual test plan. |
| **Phase 9 (Enhancement)** | **Dark Theme Overhaul, Role-Separated Sign-In & Demo Sign-In Error Fix** | **COMPLETED** | Diagnosed and fixed database connection root cause with zero-config embedded persistent PostgreSQL (PGlite) + PrismaPGlite driver adapter; overhauled design with navy/charcoal theme (`#090d16` / `#0e1628` / `#111a2e`); created dual-role tabbed sign-in with 1-click autofill for Student & Admin; enforced server-side role validation (`intendedRole`) blocking students from Admin Login with 403; verified server RBAC redirects URL tampering to `/unauthorized`. All 30 unit tests and live E2E test passed. |

---

## Sign-In Demo Error: Root Cause & Resolution

### Root Cause Analysis
1. **Missing Local Database Service:** The workspace had `provider = "postgresql"` in `prisma/schema.prisma` with a fallback `DATABASE_URL` pointing to `postgresql://postgres:postgres@localhost:5432/campus_placement`. No local PostgreSQL service was running on port 5432 and no `.env` file was present.
2. **Crash on Query:** When users submitted the sign-in form using the demo student credentials, `/api/auth/sign-in` invoked `prisma.user.findUnique()`. The `pg.Pool` connection immediately threw `connect ECONNREFUSED 127.0.0.1:5432`, which was caught and returned to the browser as a generic `"An unexpected error occurred during sign in. Please try again."`
3. **Seed Script Incompatibility with Prisma 7:** Running `npm run prisma:seed` threw `PrismaClientInitializationError: PrismaClient was instantiated without any options. A driver adapter is required to connect to your database.`

### Implemented Resolution
1. **Zero-Configuration Resilient Database Layer (`src/lib/db.ts`):**
   - Configured dual-mode database adapter support:
     - If an external `DATABASE_URL` is set in `.env` (e.g. Neon, Supabase, RDS, or local PostgreSQL), it connects via `@prisma/adapter-pg`.
     - In local offline environments with no database server running, it automatically defaults to an **embedded persistent PostgreSQL engine** (`@electric-sql/pglite` and `pglite-prisma-adapter`) stored in `prisma/pgdata`.
     - Preserves 100% PostgreSQL schema compatibility: native Postgres `ENUM`s, scalar array fields (`TEXT[]`, `INTEGER[]`), cascading foreign keys, and indexes.
2. **Automated Schema Initialization & Demo Seeding (`src/lib/db-schema.ts`, `src/lib/seed-data.ts`):**
   - Implemented `ensureDatabaseReady()` which automatically applies the PostgreSQL DDL schema and seeds initial demo records if the database is unpopulated.
   - Refactored `prisma/seed.ts` to utilize the resilient `prisma` instance and `runSeed()` function, allowing `npm run prisma:seed` to execute cleanly from the CLI without errors.
3. **Multi-Worker Build Safeguard:**
   - Isolated build-time static page collection from file locking by using in-memory PGlite during `next build`, completely preventing multi-worker lock contention on Windows.
4. **Enhanced Server Logging & User-Friendly Errors (`src/app/api/auth/sign-in/route.ts`):**
   - Added descriptive server diagnostics via `console.warn` and `console.error` detailing authentication failures (user not found, password mismatch, role violations), while returning safe, contextual messages to the user.
5. **PGlite Concurrency & Test Isolation Fix (`src/lib/db.ts`):**
   - **Root Cause Analysis:** 
     1. When tests (`npm test` / Vitest) were executed while the Next.js development server (`next dev`) was running, both processes concurrently opened `prisma/pgdata`. On Windows under OneDrive, this multi-process file contention caused WAL locks, leaving stale `postmaster.pid` files and corrupting the WAL recovery checkpoint.
     2. Awaiting `state.pglite.waitReady` at `src/lib/db.ts:87` consequently threw `RuntimeError: Aborted()`, causing sign-in requests to fail with HTTP 500.
     3. The temporary directories (`prisma/test_pgdata`, `prisma/test_clean_pgdata`, `prisma/test_heal_pgdata`) were diagnostic scratch paths used during earlier manual tests and are not part of the application.
   - **Resolution Implemented:**
     1. **Test Environment Isolation:** Configured `isTest` (`process.env.VITEST === "true" || process.env.NODE_ENV === "test"`) to strictly use an isolated in-memory PGlite instance (`new PGlite()`). Tests never access or lock `prisma/pgdata`, eliminating concurrent file locking between test runners and `next dev`.
     2. **Dedicated Development Database:** The development server strictly uses the persistent `prisma/pgdata` directory and never writes to test directories.
     3. **Preservation of User Data:** Removed any automatic directory deletion or account wiping. Existing user accounts and database folders are strictly preserved.
     4. **Stale Lock Cleanup:** Added safe `cleanStaleLock()` that only unlinks stale `postmaster.pid` if an ungraceful shutdown occurred, without touching database tables or WAL records.
     5. **Promise Recovery:** If an initialization error occurs, `state.initPromise` is cleared to allow subsequent requests to retry cleanly.

---

## Design Changes & UI Improvements

1. **Polished Dark Navy / Charcoal Theme:**
   - **Background:** Deep navy charcoal base (`#090d16` / `#0b0f19`) with elevated card surfaces (`#111a2e` / `#0e1628`) and subtle borders (`#1e2d4a`).
   - **Typography & Contrast:** Crisp white headings (`#ffffff`), readable slate text (`#f8fafc` / `#e2e8f0`), and soft secondary text (`#94a3b8`).
   - **Accents:** Electric royal blue (`#3b82f6`), indigo (`#6366f1`), vibrant emerald (`#10b981`), amber (`#f59e0b`), and crimson (`#ef4444`).
   - **Custom Scrollbar:** Sleek, minimal dark scrollbar in `src/app/globals.css`.
2. **Role-Separated Sign-In Interface (`src/app/(auth)/sign-in/page.tsx`):**
   - **Two Clear Choices:** Distinct **Student Login** and **Admin Login** selection tabs with dedicated icons (GraduationCap vs. ShieldCheck).
   - **Role Guidance Banners:** Contextual explainer panels detailing the purpose of each portal.
   - **Context-Aware 1-Click Autofill:**
     - Student Tab: Autofills `aarav.sharma@student.edu` / `StudentDemo@123`
     - Admin Tab: Autofills `admin@placement.edu` / `AdminDemo@123`
3. **Server-Enforced Role Security:**
   - Added `intendedRole` parameter to `/api/auth/sign-in` validated by Zod.
   - If a student tries to log in under Admin Login, the server rejects the request with **HTTP 403**: `"Access Denied: This account is registered as a Student. Please use the Student Login."`
   - Route-level security in `/admin/layout.tsx` (`requireAdmin`) strictly redirects any non-admin session to `/unauthorized` (HTTP 307), preventing URL manipulation.
4. **Responsive & Accessible Components:**
   - Updated `AppShell`, `Sidebar`, `TopBar`, `PageHeader`, `Card`, `Input`, `Select`, `Button`, `Badge`, `EligibilityBadge`, `StatusBadge`, and `EmptyState` for dark mode with accessible ARIA tags and keyboard focus rings.

---

## Files Touched in this Phase

1. `src/lib/db-schema.ts` — Created complete PostgreSQL DDL and `ensureSchema()` helper for embedded and external databases.
2. `src/lib/seed-data.ts` — Created reusable demo seeding module (`runSeed`) for admin, students, companies, drives, applications, and notifications.
3. `src/lib/db.ts` — Configured test environment in-memory isolation (`isTest`), stale lock file cleanup (`cleanStaleLock`), data preservation safeguard (no folder deletion), and dynamic Proxy client.
4. `src/lib/validation/auth.ts` — Added `intendedRole: z.enum(["STUDENT", "ADMIN"]).optional()` to `signInSchema`.
5. `src/app/api/auth/sign-in/route.ts` — Added role mismatch enforcement, safe user error messages, and server logging.
6. `prisma/seed.ts` — Updated to use resilient `prisma` client and `runSeed()` module.
7. `src/app/globals.css` — Defined dark navy design tokens, dark scrollbars, and dark theme class mappings.
8. `src/app/(auth)/sign-in/page.tsx` — Complete redesign with dual-role tabs, role guidance banners, dark styling, and 1-click demo autofill.
9. `src/app/(auth)/register/page.tsx` — Styled student registration page with dark theme tokens and responsive grid.
10. `src/app/page.tsx` — Elevated homepage with dark navy hero, seeded demo credentials box, and feature highlights.
11. `src/app/unauthorized/page.tsx` — Updated access denied page with dark theme styling.
12. `src/components/layout/AppShell.tsx` — Updated shell container to dark background `#090d16`.
13. `src/components/layout/Sidebar.tsx` — Updated sidebar navigation with dark navy surface and electric blue active glow.
14. `src/components/layout/TopBar.tsx` — Updated header bar with dark navy backdrop blur and high-contrast user pill.
15. `src/components/layout/PageHeader.tsx` — Updated page header borders and typography.
16. `src/components/ui/Card.tsx` — Updated cards with dark surface `#111a2e`, border `#1e2d4a`, and subtle elevation shadows.
17. `src/components/ui/Input.tsx` — Updated inputs with dark surface `#0c1322`, border `#223354`, and electric blue focus rings.
18. `src/components/ui/Select.tsx` — Updated selects with dark surface `#0c1322` and styled option dropdowns.
19. `src/components/ui/Button.tsx` — Added refined dark variants (primary glow, secondary dark navy, outline, danger).
20. `src/components/ui/Badge.tsx` — Updated translucent dark badge variants with glowing borders.
21. `src/components/ui/EligibilityBadge.tsx` — Enhanced eligibility badge colors for dark contrast.
22. `src/components/ui/EmptyState.tsx` — Updated empty state cards with dark styling.
23. `src/components/ui/LoadingSkeleton.tsx` — Updated skeletons with dark pulse styling.
24. `tests/unit/sign-in-flow.test.ts` — Added unit test suite for student/admin credential verification and role guards.
25. `PROJECT_PROGRESS.md` — Updated progress, root cause analysis, files touched, and terminal commands.

---

## Test Verification Results

### Automated Unit Test Suite (`npm test`)
- **Total Test Files:** 6 passed (6)
- **Total Tests:** 30 passed (30)
- **Suites:**
  1. `tests/unit/sign-in-flow.test.ts` (4 tests) — Demo student credentials, demo admin credentials, role mismatch rejection, `requireAdmin` server guard.
  2. `tests/unit/auth-permissions.test.ts` (8 tests) — Session tokens, password hashing, horizontal isolation, RBAC.
  3. `tests/unit/eligibility-applications.test.ts` (7 tests) — Branch, batch, CGPA, skills criteria checklists.
  4. `tests/unit/drives-management.test.ts` (4 tests) — Drive status filtering, draft hiding.
  5. `tests/unit/profile-company.test.ts` (4 tests) — Profile completeness, company archiving.
  6. `tests/unit/metrics-reporting.test.ts` (3 tests) — Live metric calculations and CSV export data.

### Production Build (`npm run build`)
- Next.js 16 (Turbopack) production build passed with **0 errors**.
- All static routes (`/`, `/sign-in`, `/register`, `/unauthorized`) and dynamic routes (`/student/*`, `/admin/*`, `/api/*`) successfully collected and compiled.

### Live End-to-End Test (`test-live-e2e.ts`)
1. **Student Sign-In:** `POST /api/auth/sign-in` with `aarav.sharma@student.edu` / `StudentDemo@123` returns 200, sets secure session cookie, and allows access to `/student/dashboard`.
2. **Server RBAC Protection:** Student session cookie attempting `GET /admin/dashboard` is strictly redirected to `/unauthorized` (HTTP 307).
3. **Role Mismatch Prevention:** Student credentials submitted with `intendedRole: "ADMIN"` is blocked with HTTP 403: `"Access Denied: This account is registered as a Student. Please use the Student Login."`
4. **Admin Sign-In:** `POST /api/auth/sign-in` with `admin@placement.edu` / `AdminDemo@123` returns 200 and allows access to `/admin/dashboard`.

---

## Terminal Commands for Running Locally

To run the application locally on your machine, simply execute the following in your terminal:

```powershell
# 1. Install dependencies (if needed)
npm install

# 2. Run the automated test suite (optional verification)
npm test

# 3. Seed demo accounts (optional — happens automatically on startup)
npm run prisma:seed

# 4. Start the development server
npm run dev
```

Open your browser at **`http://localhost:3000`** (or **`http://localhost:3000/sign-in`**).
You can now click either **Student Login** or **Admin Login**, use the **Click to Autofill** demo button, and sign in immediately with zero manual database setup required!

---

## Phase 10 — Database Verification, Deadline Retention Fix & Company Profile Expansion

### 1. Database Architecture & Lifecycle Verification
- **Engine & Provider:** Embedded Persistent PostgreSQL 17.5 via WebAssembly (`@electric-sql/pglite` v0.4.3 + `pglite-prisma-adapter` v0.7.2). When external `DATABASE_URL` is unset, zero-configuration local embedded mode is used.
- **Storage Location:** Strictly persistent on disk at `prisma/pgdata` (contains PostgreSQL `global/`, `base/`, `pg_wal/`, `pg_control`).
- **Lifecycle (Frontend to Disk):**
  1. Frontend submits React form / action.
  2. Next.js App Router API route parses request and validates with Zod.
  3. Route calls `prisma.<model>.<action>()`.
  4. Prisma Client sends query through `PrismaPGlite` driver adapter.
  5. The adapter passes query to WebAssembly PostgreSQL engine (`PGlite`).
  6. PGlite executes relational SQL in Emscripten and flushes WAL / table records to disk under `prisma/pgdata`.
- **Persistence Verification:**
  - Preserved existing user created records including company `"Test company 01"` (`cmvxhq1ho0000wcujy7wnocsj`) alongside all seeded accounts and placement drives.
  - Verified persistence across sign-out/sign-in and complete development server restarts.
  - Configured `serverExternalPackages: ["@electric-sql/pglite", "pglite-prisma-adapter"]` in `next.config.ts` to prevent Turbopack from sandboxing native URL instances when loading WebAssembly assets.

### 2. Placement Drive Application Deadline Fix
- **Root Cause:**
  1. HTML5 `<input type="datetime-local">` strictly expects local format `YYYY-MM-DDTHH:mm`. Passing standard ISO UTC strings caused browser validation to reject the value and clear the field.
  2. Dark theme background rendered native browser date/clock picker indicator icons invisible in Chromium/Edge.
  3. Reopening an expired drive retained the past deadline timestamp, immediately blocking student applications.
  4. Display utility `formatDate` only showed `MMM D, YYYY`, omitting time of day.
- **Resolution:**
  - Added `formatDateTimeLocal()` in `src/lib/utils.ts` for bidirectional conversion with `<input type="datetime-local">`.
  - Added `[color-scheme:dark]` to `Input.tsx` to ensure native calendar/time picker glyphs are bright and visible.
  - Built interactive `EditDriveModal` (`src/components/admin/EditDriveModal.tsx`) allowing full modification and retention of deadline date and time.
  - Reopen drive action prompts for deadline extension when reopening expired drives.
  - Updated all student and admin views to `formatDateTime()` showing both date and time (e.g. `Nov 15, 2026, 11:45 PM`).

### 3. Company Profile Form Enhancement
- **Data Model Updates:** Added optional `logoUrl String?` and `companySize String?` to `model Company` in `prisma/schema.prisma` and non-destructive `ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS ...` in `src/lib/db-schema.ts`.
- **Validation & API:** Updated `companySchema` in `src/lib/validation/company.ts` and API handlers (`/api/admin/companies`, `/api/admin/companies/[id]`). Existing company records remain 100% valid.
- **UI Enhancements:**
  - Modal form provides optional Company Logo URL input and Company Size dropdown selector.
  - Company cards in `/admin/companies` and detail view `/admin/companies/[id]` display company logo (with graceful initial fallback) and company size badge.
  - Role-specific recruitment details remain strictly on the Placement Drive model.
- **Test Suite:** All 32 automated unit tests across 6 test files passing cleanly.

---

## PostgreSQL Server Migration Plan & Preparation

### 1. Database Inspection Findings
- **PostgreSQL Server Status:** Inspected Windows services (`Get-Service *postgres*`), port 5432 availability (`Test-NetConnection -Port 5432`), and path/directories (`where.exe psql`, `where.exe postgres`, `C:\Program Files\PostgreSQL`). **PostgreSQL Server is NOT currently installed or running on port 5432**.
- **Active Database:** Embedded PGlite in `prisma/pgdata`.
- **Existing Records Verified:**
  - 4 Users (Admin: Prof. Rajesh Kumar; Students: Aarav Sharma, Priya Patel, Rahul Verma)
  - 3 Student Profiles
  - 4 Companies (including user-created `Test company 01`)
  - 5 Placement Drives
  - 2 Recruitment Rounds
  - 1 Application (`drive-acme-sde` -> `SHORTLISTED`)
  - 1 Application Status Log
  - 2 Notifications
  - 2 Audit Logs

### 2. Data Protection & Cold Backup
- **Backup Created:** `backups/pgdata_backup_before_postgres_switch` contains an exact, untouched copy of `prisma/pgdata`.
- **Git Tracking:** Added `/backups` to `.gitignore` to ensure backups and database dumps never leak into source control.
- **Data Integrity:** `prisma/pgdata` remains untouched and functional while preparing the migration.

### 3. Codebase & Infrastructure Updates
- **`src/lib/db.ts`:**
  - Removed artificial exclusion of `localhost:5432/campus_placement`.
  - Added connection pooling via `pg.Pool` and `@prisma/adapter-pg`.
  - Added automatic schema verification on PostgreSQL Server via `SCHEMA_SQL`.
  - Implemented graceful connection cleanup for both `pgPool` and `pglite`.
  - Preserved transparent fallback to PGlite if `DATABASE_URL` is omitted.
- **`scripts/migrate_to_postgres.ts`:**
  - Created automated, idempotent migration tool that reads all 10 tables from PGlite and inserts them into PostgreSQL Server in foreign-key topological order.
  - Automatically verifies target record counts against source records.

### 4. Switch Status
- **Status:** Ready for local PostgreSQL Server installation, database creation, and data migration. PGlite remains active until PostgreSQL Server is verified.

---

## Expanded Demo Dataset & Sign-In Navigation Resolution

### 1. Expanded Dataset Architecture (3,280 Linked Records)
- **Dataset Generation:** Built [scripts/seed_demo_data.ts](file:///c:/Users/Vijaykumar/OneDrive/Desktop/Campus%20Placement%20Management%20System/scripts/seed_demo_data.ts) with high-performance chunked batch inserts (`createMany({ skipDuplicates: true })`).
- **Record Breakdown:**
  - 200 Fictional Students (`User` + `StudentProfile`)
  - 30 Companies across major Indian tech and core hubs
  - 50 Placement Drives (38 Published, 6 Draft, 4 Closed, 2 Archived)
  - 100 Recruitment Rounds (2 sequential rounds per drive)
  - 1,000 Student Applications (5 distinct drives per student)
  - 1,000 Application Status Logs (audit trail of status history)
  - 300 Application Round Results
  - 300 Student Notifications
  - 100 Admin Audit Logs
- **Safe Cleanup:** Built [scripts/clean_demo_data.ts](file:///c:/Users/Vijaykumar/OneDrive/Desktop/Campus%20Placement%20Management%20System/scripts/clean_demo_data.ts) to purge `demo-` records in reverse foreign-key order without touching existing data.

### 2. Sign-In Navigation Diagnosis & Resolution
- **Root Cause Identified:**
  1. In [src/app/(auth)/sign-in/page.tsx](file:///c:/Users/Vijaykumar/OneDrive/Desktop/Campus%20Placement%20Management%20System/src/app/%28auth%29/sign-in/page.tsx), calling `router.push()` followed immediately by `router.refresh()` in Next.js Turbopack caused the client router to refresh `/sign-in` while the navigation was in-flight, leaving the submit button permanently in an `isLoading: true` ("Signing in...") spinning state.
  2. Additionally, 3 older placement drive rows (`demo-drive-10`, `11`, `12`) created by an earlier seed run resulted in duplicate React keys, triggering reconciliation warnings.
- **Fix Applied:**
  - Replaced soft `router.push()` / `router.refresh()` with hard `window.location.href = destination` in both [sign-in/page.tsx](file:///c:/Users/Vijaykumar/OneDrive/Desktop/Campus%20Placement%20Management%20System/src/app/%28auth%29/sign-in/page.tsx) and [register/page.tsx](file:///c:/Users/Vijaykumar/OneDrive/Desktop/Campus%20Placement%20Management%20System/src/app/%28auth%29/register/page.tsx). This guarantees that the new HttpOnly session cookie is dispatched directly in the HTTP request headers.
  - Cleaned the 3 duplicate older drive rows using replica session role.
  - Verified both Admin (`admin@placement.edu`) and Student (`aarav.sharma@student.edu`) logins load dashboards and drive pages with HTTP 200 in <350ms.


