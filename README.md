# Campus Placement Management System (CPMS)

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-7.10.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Embedded_%26_Remote-336791?logo=postgresql)](https://www.postgresql.org/)
[![Vitest](https://img.shields.io/badge/Vitest-36_Tests_Passing-6E9F18?logo=vitest)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A production-ready, centralized university placement management platform engineered to automate campus recruitment drives, verify multi-factor student eligibility in real-time, track end-to-end recruitment pipelines, and empower placement coordinators with live analytics and compliance reporting.

---

## 📑 Table of Contents

- [Overview & Value Proposition](#-overview--value-proposition)
- [System Architecture & Engineering Design](#-system-architecture--engineering-design)
  - [High-Level Architectural Diagram](#high-level-architectural-diagram)
  - [Dual-Engine Database Architecture (PGlite + PostgreSQL)](#dual-engine-database-architecture)
  - [Deterministic Explanatory Eligibility Engine](#deterministic-explanatory-eligibility-engine)
  - [Recruitment Pipeline & Application Lifecycle](#recruitment-pipeline--application-lifecycle)
  - [Security, RBAC & Data Isolation](#security-rbac--data-isolation)
- [Feature Catalog](#-feature-catalog)
  - [Student Portal](#1-student-portal)
  - [Placement Administrator Portal](#2-placement-administrator-portal)
  - [Analytics, Reports & Audit Trails](#3-analytics-reports--audit-trails)
- [Quick Start & Installation Guide](#-quick-start--installation-guide)
  - [Prerequisites](#1-prerequisites)
  - [Option A: One-Click Windows Launchers (Recommended)](#option-a-one-click-windows-launchers-recommended)
  - [Option B: Zero-Config Local Setup (Embedded PostgreSQL)](#option-b-zero-config-local-setup-embedded-postgresql)
  - [Option C: Remote / Cloud PostgreSQL Setup](#option-c-remote--cloud-postgresql-setup-neonsupabase)
- [Pre-Seeded Demo Accounts & Credentials](#-pre-seeded-demo-accounts--credentials)
- [Database Schema & Data Model Reference](#-database-schema--data-model-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Available Scripts Reference](#-available-scripts-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Comprehensive Manual Walkthrough Plan](#-comprehensive-manual-walkthrough-plan)
- [Self-Healing Recovery & Reliability Safeguards](#-self-healing-recovery--reliability-safeguards)
- [License & Acknowledgments](#-license--acknowledgments)

---

## 🌟 Overview & Value Proposition

University recruitment drives often suffer from scattered Google Forms, manual Excel CGPA verification, opaque eligibility criteria, and lack of candidate pipeline visibility. 

**Campus Placement Management System (CPMS)** solves these challenges through:
- **Zero-Friction Student Discovery:** Students view active corporate placement drives with clear eligibility status, deadlines, compensation brackets, and multi-round schedules.
- **Granular Explanatory Eligibility:** Instant feedback showing exactly why a student is eligible or which specific criteria are missing (CGPA cutoff, branch restrictions, graduation batch, or required skill tags).
- **End-to-End Application Tracking:** Full chronological timeline tracking candidate status from initial application through technical interviews, selection, or offer letter issuance.
- **Corporate & Drive Management:** Administrative controls for managing company profiles, scheduling multi-stage recruitment rounds, locking expired drives, and archiving historical data.
- **Institutional Analytics & CSV Compliance:** De-duplicated placement rate calculations, department distribution charts, salary percentiles, and 1-click audit-logged CSV exports.

---

## 🏗 System Architecture & Engineering Design

### High-Level Architectural Diagram

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER (Next.js 16)                         │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────┐  │
│  │   Student Portal        │  │  Placement Admin Portal  │  │ Dual-Role Auth   │  │
│  │  - Dashboard & Deadlines│  │  - Drive & Company CRUD  │  │  - Student Tab   │  │
│  │  - Drive Catalog        │  │  - Applicant Review Hub  │  │  - Admin Tab     │  │
│  │  - Profile & Skills Tag │  │  - Real-Time Analytics   │  │  - 1-Click Auto  │  │
│  │  - Applications Funnel  │  │  - CSV Compliance Export │  │  - Role Guarding │  │
│  └─────────────────────────┘  └──────────────────────────┘  └──────────────────┘  │
│         Tailwind CSS v4  •  Dark Navy Theme Tokens  •  Accessible ARIA Controls   │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │ Server Actions & REST API (/api/*)
┌─────────────────────────────────────────▼─────────────────────────────────────────┐
│                    APPLICATION & BUSINESS LOGIC LAYER                             │
│  ┌──────────────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │ Deterministic Eligibility    │  │ Role-Based Access Control (RBAC)          │  │
│  │ Engine (evaluateEligibility) │  │  - HttpOnly JWT Sessions (`jose`)         │  │
│  │  - Branch / Department       │  │  - Salted Password Hashing (`bcryptjs`)   │  │
│  │  - Graduation Year Batch     │  │  - Role-Mismatch Protection (HTTP 403)    │  │
│  │  - Minimum CGPA Cutoff       │  │  - Horizontal Data Isolation              │  │
│  │  - Technical Skill Tags      │  │    (`assertCanAccessStudent`)             │  │
│  └──────────────────────────────┘  └───────────────────────────────────────────┘  │
│  ┌──────────────────────────────┐  ┌───────────────────────────────────────────┐  │
│  │ Zod Runtime Validation       │  │ Notification & Audit Logging Engine       │  │
│  │  - Strict Request Payloads   │  │  - Application Stage Notifications        │  │
│  │  - Type-Safe Boundary Errors │  │  - Admin Action Audit Logs                │  │
│  └──────────────────────────────┘  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │ Prisma ORM 7.x
┌─────────────────────────────────────────▼─────────────────────────────────────────┐
│                   RESILIENT DUAL-ENGINE DATA LAYER                                │
│                                                                                   │
│   ┌─────────────────────────────────────┐   ┌─────────────────────────────────┐   │
│   │   MODE A: Embedded PGlite Engine    │   │   MODE B: Cloud / Remote Postgres│  │
│   │   (Default Offline / Zero-Config)   │   │   (Production / CI / Docker)    │   │
│   │                                     │   │                                 │   │
│   │  • WASM PostgreSQL 17.5 Engine     │   │  • Neon / Supabase / AWS RDS    │   │
│   │  • Disk Persistence: prisma/pgdata  │   │  • Pooled Connection via pg.Pool│  │
│   │  • Native ENUMs & Array Types       │   │  • High-throughput Concurrency  │   │
│   │  • Self-Healing WAL Recovery        │   │  • Zero Code Changes Needed     │   │
│   └─────────────────────────────────────┘   └─────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

### Dual-Engine Database Architecture

CPMS features an adaptive database layer (`src/lib/db.ts`) that runs seamlessly across both local zero-dependency environments and production cloud clusters:

1. **Embedded Persistent PostgreSQL (PGlite):**
   - Built on `@electric-sql/pglite` (PostgreSQL 17.5 compiled to WebAssembly) and `pglite-prisma-adapter`.
   - Stores full PostgreSQL tables, indexes, and Write-Ahead Logs (WAL) locally under `prisma/pgdata`.
   - **Zero external software required:** Developers and evaluators can run the full system immediately without installing PostgreSQL, Docker, or configuring local database daemons.
   - Fully supports native PostgreSQL types: `ENUM` types, scalar array fields (`TEXT[]`, `INTEGER[]`), and cascading foreign keys.

2. **Cloud / Remote PostgreSQL Server:**
   - When `DATABASE_URL` is configured in `.env`, the system automatically switches to connection-pooled client execution via `pg.Pool` and `@prisma/adapter-pg`.
   - Compatible with [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), AWS RDS, Google Cloud SQL, Azure Database, or local PostgreSQL instances on port 5432.

3. **Isolated Test Database:**
   - During automated test execution (`npm test`), Vitest automatically instantiates an isolated in-memory PGlite instance (`new PGlite()`).
   - Prevents multi-process file contention and eliminates file lock collisions between test runners and the live Next.js development server.

---

### Deterministic Explanatory Eligibility Engine

Rather than returning a simplistic boolean `eligible: true/false`, the core engine (`src/lib/eligibility/evaluator.ts`) evaluates student eligibility through a 4-dimensional criteria matrix and produces transparent explanations:

```typescript
type EligibilityStatus = "ELIGIBLE" | "NOT_ELIGIBLE" | "INCOMPLETE_PROFILE";
```

| Criterion | Evaluation Rule | Explanatory Output (Examples) |
| :--- | :--- | :--- |
| **Academic Department** | Student's department must exist in `drive.eligibleBranches` | `✓ Eligible branch (Computer Science & Engineering)`<br>`✗ Ineligible branch: Electronics & Communication` |
| **Graduation Year** | Student's batch must exist in `drive.eligibleGradYears` | `✓ Eligible batch (2026)`<br>`✗ Ineligible batch: 2025` |
| **CGPA Cutoff** | Student's recorded CGPA >= `drive.minimumCgpa` | `✓ CGPA 8.75 meets cutoff 7.50`<br>`✗ CGPA 6.80 below minimum cutoff 7.00`<br>`⚠ Incomplete profile: CGPA missing` |
| **Required Skills** | Student skill tags are matched case-insensitively | `✓ Possesses 3/3 required skills`<br>`ℹ Missing skills: Docker, Kubernetes` |

---

### Recruitment Pipeline & Application Lifecycle

Every placement drive supports customizable sequential recruitment stages (e.g., Online Assessment ➔ Technical Interview ➔ HR Interview). Candidate progression is tracked through state transitions with complete audit logging:

```
[ APPLIED ] 
     │
     ▼
[ UNDER_REVIEW ] 
     │
     ▼
[ SHORTLISTED ] ───► [ REJECTED ]
     │
     ▼
[ ASSESSMENT_SCHEDULED ] ───► [ REJECTED ]
     │
     ▼
[ INTERVIEW_SCHEDULED ] ───► [ REJECTED ]
     │
     ▼
[ SELECTED ] 
     │
     ▼
[ OFFER_RECORDED ]
```

- **Duplicate Submission Guard:** Enforced via a composite unique database index (`@@unique([studentId, placementDriveId])`) and server-side pre-flight verification.
- **Deadline Guard:** Drive status changes automatically or rejects submissions if `Date.now() > drive.deadlineAt`.
- **Status Audit Trail:** Each status transition logs an immutable `ApplicationStatusLog` record and automatically delivers an in-app notification to the student.

---

### Security, RBAC & Data Isolation

1. **Tamper-Proof Session Management:**
   - Stateless cryptographic session tokens created with `jose` using HMAC-SHA256.
   - Stored in secure `HttpOnly`, `SameSite=Lax`, server-guarded cookies (`cpms_session`).
2. **Salted Password Hashing:**
   - Passwords hashed using `bcryptjs` with salt rounds = 10.
3. **Role-Separated Authentication & Server Route Guards:**
   - Explicit `intendedRole` parameter prevents cross-role logins. If a registered student attempts to authenticate via the Admin portal, the server rejects the request with **HTTP 403 Forbidden**.
   - Admin layouts and server actions execute `requireAdmin()`, strictly redirecting unauthorized sessions to `/unauthorized` (HTTP 307).
4. **Horizontal Privilege Isolation (`assertCanAccessStudent`):**
   - Ensures students can only query, view, and modify their own applications and profiles. Modifying student IDs in request bodies or URL parameters immediately throws an authorization error.
5. **Relational Deletion Protection:**
   - Companies associated with active or historical placement drives cannot be deleted (enforced via foreign key `onDelete: Restrict` and administrative soft-archive flags).

---

## ⚡ Feature Catalog

### 1. Student Portal

- **Dual-Role Sign-In & Self-Registration:** Dedicated student login tab with 1-click demo autofill; student self-registration hardcoding the `STUDENT` role.
- **Academic Profile Manager (`/student/profile`):**
  - Department, student roll number, graduation year, and validated CGPA (0.0 to 10.0 scale).
  - Dynamic skill tag adder (React, Node.js, Python, TypeScript, etc.).
  - Real-time profile completeness progress bar with prompt reminders.
- **Placement Drive Catalog (`/student/drives`):**
  - Real-time drive cards showing company branding, job type, compensation range, and deadline status.
  - Explanatory eligibility badge (`ELIGIBLE`, `NOT_ELIGIBLE`, `INCOMPLETE_PROFILE`).
  - Search and filter by job role, branch, and company name.
- **Detailed Drive View (`/student/drives/[id]`):**
  - Granular eligibility breakdown checklist with green/red checkmarks.
  - Multi-round recruitment timeline inspection.
  - One-click application submission with instant confirmation.
- **My Applications Hub (`/student/applications`):**
  - Real-time status badge (`Applied`, `Shortlisted`, `Interview Scheduled`, `Selected`, etc.).
  - Interactive chronological status history timeline with coordinator notes.
- **Notification Center (`/student/notifications`):**
  - Real-time alerts for application receipts, interview round schedules, and offer updates.
  - Mark as read / mark all as read support.

---

### 2. Placement Administrator Portal

- **Admin Dashboard (`/admin/dashboard`):**
  - High-level KPIs: Total Companies, Active Drives, Total Applicants, Offers Extended, and Overall Placement Rate.
  - Approaching application deadline alerts.
  - Recent applicant activity stream.
- **Company Directory (`/admin/companies`):**
  - Administrative CRUD for recruiting partners (Name, Description, Website, Industry, Location, Logo URL, Company Size).
  - Search and filter tabs (Active vs. Archived).
  - Soft-archive protection against orphaned drive references.
- **Placement Drive Manager (`/admin/drives`):**
  - Drive builder: Job title, detailed description, job type, location, CTC range (LPA), currency, and application deadline date-time picker.
  - Multi-factor eligibility configuration: target branches, target graduation years, minimum CGPA cutoff, and required skill tags.
  - Multi-stage recruitment pipeline designer: Online Assessment, Technical Interview, HR Interview, Group Discussion.
  - Status management: `DRAFT`, `PUBLISHED`, `CLOSED`, `ARCHIVED`. Strict server guards prevent students from viewing draft drives.
  - Interactive drive editor (`EditDriveModal`) with deadline extension capabilities.
- **Candidate Review Hub (`/admin/applicants`):**
  - Filter applicants by specific drive and recruitment status.
  - Instant search by student name or university email.
  - Status transition modal with candidate feedback notes and automatic student notification delivery.
- **Student Directory (`/admin/students`):**
  - Searchable list of all registered students with department, batch, CGPA, skills, and application counts.

---

### 3. Analytics, Reports & Audit Trails

- **Interactive Analytics View (`/admin/analytics`):**
  - **De-duplicated Placement Rate:** Rigorously calculates placement percentage by dividing unique placed students by total registered candidates (preventing multiple offers to the same student from skewing institutional metrics).
  - **Department-wise Placement Breakdown:** Visual distribution of placed vs. unplaced students across CSE, ECE, ME, Civil, IT, etc.
  - **Salary Package Analytics:** Highest CTC, Average CTC, and Median CTC calculations.
  - **Company Hiring Conversion Funnel:** Tracks candidate transition rates per recruiting partner.
- **CSV Compliance Report Export (`/api/admin/reports/export`):**
  - Exports complete institutional candidate and placement records formatted for accreditation and audit compliance.
  - Automatically records an entry in the system `AuditLog` table.

---

## 🚀 Quick Start & Installation Guide

### 1. Prerequisites

- **Node.js:** v18.x, v20.x, v22.x, or v24.x (verified on Node `v24.22.1`)
- **npm:** v9.x, v10.x, or v11.x
- **Git**

---

### Option A: One-Click Windows Launchers (Recommended)

For Windows developers and evaluators, CPMS includes automated batch launchers that handle dependency checking, port clearing, database verification, demo seeding, and browser launching automatically:

#### 1. Daily One-Click Launcher (`start.bat`)
Double-click `start.bat` or run:
```cmd
start.bat
```
*What it does:*
- Verifies Node.js installation.
- Installs dependencies if `node_modules` is missing.
- Terminates any stale processes hanging on port 3000.
- Removes any orphaned database locks (`postmaster.pid`).
- Verifies the database and seeds demo records if empty.
- Automatically opens `http://localhost:3000` in your default browser.
- Launches the Next.js development server.

#### 2. Full Nuclear Reset & Repair Tool (`repair-and-start.bat`)
If you ever encounter corrupted build caches or want to reset the database to a pristine demo state:
```cmd
repair-and-start.bat
```
*What it does:*
- Clears port 3000 conflicts.
- Deletes stale `.next` build caches.
- Backs up existing database to `backups/` and recreates a clean schema.
- Seeds all demo accounts and realistic drives.
- Launches the server cleanly.

---

### Option B: Zero-Config Local Setup (Embedded PostgreSQL)

If you are on macOS, Linux, or prefer running standard terminal commands:

#### 1. Clone the Repository
```bash
git clone https://github.com/vdeepika292007-gif/campus-placement-management-system.git
cd campus-placement-management-system
```

#### 2. Install Project Dependencies
```bash
npm install
```

#### 3. Seed Demo Records
```bash
# Seeds admin, eligible student, incomplete student, sample companies & drives
npm run prisma:seed
```

*(Optional) Seed Expanded High-Volume Dataset:*
```bash
# Seeds 200 students, 30 companies, 50 drives, and 1,000 linked applications
npm run seed:demo
```

#### 4. Launch the Development Server
```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

### Option C: Remote / Cloud PostgreSQL Setup (Neon/Supabase)

If deploying to production or connecting to an external PostgreSQL database:

#### 1. Configure `.env`
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```env
# 1. PostgreSQL Connection URL (e.g. Free Serverless Cloud PostgreSQL from Neon.tech)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 2. Authentication Secret (At least 32 characters long)
AUTH_SECRET="cpms-super-secure-production-secret-min-32-chars-long"

# 3. Application Base URL
APP_URL="http://localhost:3000"
```

> **Setting up Free Cloud PostgreSQL in 2 minutes:**
> 1. Sign up for free at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
> 2. Create a new project called `campus-placement`.
> 3. Copy the pooled connection string and paste it into `.env`.

#### 2. Push Database Schema & Seed
```bash
# Push schema tables and enum types to your PostgreSQL database
npx prisma db push

# Seed demo accounts and drives
npm run prisma:seed
```

#### 3. Build & Start Production Server
```bash
npm run build
npm start
```

---

## 👥 Pre-Seeded Demo Accounts & Credentials

The system comes pre-configured with demo accounts covering all primary test scenarios. On the `/sign-in` page, click either the **Student Login** or **Admin Login** tab and use the **"Click to Autofill Demo Credentials"** button for instant access.

| Role | Portal Tab | Email | Password | Academic Profile / Attributes |
| :--- | :--- | :--- | :--- | :--- |
| **Placement Admin** | Admin Login | `admin@placement.edu` | `AdminDemo@123` | Head Placement Coordinator with full administrative control |
| **Eligible Student** | Student Login | `aarav.sharma@student.edu` | `StudentDemo@123` | B.Tech CSE (2026 Batch), CGPA: 8.75 / 10, Skills: React, TypeScript, Node.js |
| **Student (Different Branch)** | Student Login | `priya.patel@student.edu` | `StudentDemo@123` | B.Tech ECE (2026 Batch), CGPA: 7.40 / 10, Skills: C++, Embedded, Python |
| **Incomplete Profile Student** | Student Login | `rahul.verma@student.edu` | `StudentDemo@123` | B.Tech ME (2026 Batch), CGPA: Unrecorded / Missing (triggers profile warning) |

---

## 🗄 Database Schema & Data Model Reference

The relational schema is defined in `prisma/schema.prisma` across 10 interconnected models:

```
┌──────────────┐       ┌────────────────────┐
│     User     │◄──────┤   StudentProfile   │
└──────┬───────┘ 1:1   └────────────────────┘
       │
       │ 1:N
       ├─────────────────────────┐
       ▼                         ▼
┌──────────────┐         ┌──────────────┐
│ Application  │         │ Notification │
└──────┬───────┘         └──────────────┘
       │
       │ 1:N
       ├─────────────────────────┐
       ▼                         ▼
┌──────────────────────┐ ┌──────────────────────┐
│ApplicationRoundResult│ │ ApplicationStatusLog │
└──────────────────────┘ └──────────────────────┘
       ▲
       │ N:1
┌──────┴───────────────┐
│   RecruitmentRound   │
└──────▲───────────────┘
       │ N:1
┌──────┴───────────────┐         ┌──────────────┐
│    PlacementDrive    │◄────────┤   Company    │
└──────────────────────┘ N:1     └──────────────┘
```

### Models Summary

| Model | Purpose | Key Attributes & Relations |
| :--- | :--- | :--- |
| **`User`** | System identity and authentication | `id`, `name`, `email` (unique), `passwordHash`, `role` (`STUDENT` \| `ADMIN`), `accountStatus`. |
| **`StudentProfile`** | Academic record and qualifications | `userId` (unique), `department`, `graduationYear`, `cgpa`, `skills` (`TEXT[]`), `studentNumber`. |
| **`Company`** | Corporate recruitment partners | `name`, `description`, `website`, `industry`, `location`, `logoUrl`, `companySize`, `isArchived`. |
| **`PlacementDrive`** | Recruitment campaigns | `companyId`, `title`, `jobDescription`, `salaryMin`, `salaryMax`, `deadlineAt`, `status`, `eligibleBranches`, `eligibleGradYears`, `minimumCgpa`, `requiredSkills`. |
| **`RecruitmentRound`**| Stages within a placement drive | `placementDriveId`, `name`, `roundType` (`ONLINE_ASSESSMENT`, `TECHNICAL_INTERVIEW`, `HR_INTERVIEW`, etc.), `sequence`. |
| **`Application`** | Candidate drive submissions | `studentId`, `placementDriveId`, `status` (`APPLIED`, `SHORTLISTED`, `INTERVIEW_SCHEDULED`, `SELECTED`, `OFFER_RECORDED`, etc.). Enforces composite unique constraint `[studentId, placementDriveId]`. |
| **`ApplicationRoundResult`** | Per-round candidate evaluations | `applicationId`, `recruitmentRoundId`, `status` (`PENDING`, `CLEARED`, `REJECTED`, `ABSENT`), `notes`. |
| **`ApplicationStatusLog`** | Immutable state transition audit trail | `applicationId`, `fromStatus`, `toStatus`, `changedByUserId`, `reason`, `createdAt`. |
| **`Notification`** | In-app user notifications | `userId`, `title`, `message`, `type` (`INFO`, `SUCCESS`, `WARNING`, `ALERT`), `linkUrl`, `readAt`. |
| **`AuditLog`** | Security and administrative audit trail | `actorUserId`, `action`, `entityType`, `entityId`, `details`, `createdAt`. |

---

## 📁 Project Directory Structure

```
campus-placement-management-system/
├── prisma/
│   ├── pgdata/                    # Persistent embedded PostgreSQL data directory
│   ├── schema.prisma              # Relational Prisma schema definition
│   └── seed.ts                    # Automated database seed runner
├── scripts/
│   ├── seed_demo_data.ts          # High-performance batch seed generator (3,000+ records)
│   ├── clean_demo_data.ts         # Safe demo data cleaner (reverse topological order)
│   ├── migrate_to_postgres.ts     # PGlite to PostgreSQL Server migration utility
│   └── inspect_pglite.mjs         # Embedded database diagnostics tool
├── src/
│   ├── app/
│   │   ├── (auth)/                # Authentication route group
│   │   │   ├── register/          # Student self-registration page
│   │   │   └── sign-in/           # Tabbed dual-role sign-in with 1-click autofill
│   │   ├── admin/                 # Placement Administrator portal
│   │   │   ├── analytics/         # Interactive analytics and conversion funnels
│   │   │   ├── applicants/        # Candidate tracking and stage transition hub
│   │   │   ├── companies/         # Company partner directory and CRUD
│   │   │   ├── dashboard/         # Administrative KPI overview
│   │   │   ├── drives/            # Drive pipeline manager and creation forms
│   │   │   ├── notifications/     # Admin notification center
│   │   │   ├── reports/           # Institutional reporting and CSV exporter
│   │   │   └── students/          # Searchable student directory
│   │   ├── api/                   # REST API route handlers
│   │   │   ├── admin/             # Guarded admin actions (applicants, drives, companies, reports)
│   │   │   ├── auth/              # Sign-in, sign-out, session, registration
│   │   │   ├── notifications/     # Notification read state handlers
│   │   │   └── student/           # Student application submissions and profile updates
│   │   ├── student/               # Student Portal
│   │   │   ├── applications/      # My Applications timeline tracker
│   │   │   ├── dashboard/         # Student overview and approaching deadlines
│   │   │   ├── drives/            # Drive catalog and detailed eligibility views
│   │   │   ├── notifications/     # In-app notifications
│   │   │   └── profile/           # Academic profile and skill tag manager
│   │   ├── globals.css            # Dark theme CSS tokens and custom scrollbars
│   │   ├── layout.tsx             # Root layout with offline-hardened typography
│   │   └── unauthorized/          # HTTP 403 / 307 access denied page
│   ├── components/
│   │   ├── admin/                 # Admin modal forms and analytics charts
│   │   ├── layout/                # AppShell, Sidebar, TopBar, PageHeader
│   │   └── ui/                    # Accessible UI primitives (Button, Card, Badge, Input, Select)
│   └── lib/
│       ├── auth/                  # Session encryption (`jose`), bcrypt, and route guards
│       ├── eligibility/           # Deterministic Explanatory Eligibility Engine
│       ├── validation/            # Zod validation schemas for all inputs
│       ├── db.ts                  # Resilient dual-mode database client
│       ├── db-schema.ts           # PostgreSQL DDL and schema verification
│       └── utils.ts               # Date-time, currency, and string formatters
├── tests/
│   └── unit/                      # Automated Vitest test suites (36 tests)
│       ├── analytics-reporting.test.ts
│       ├── auth-permissions.test.ts
│       ├── drives-management.test.ts
│       ├── eligibility-applications.test.ts
│       ├── metrics-reporting.test.ts
│       ├── profile-company.test.ts
│       └── sign-in-flow.test.ts
├── start.bat                      # One-click Windows development launcher
├── repair-and-start.bat           # Nuclear cache & database reset launcher
├── package.json                   # Dependencies and npm scripts
├── tsconfig.json                  # TypeScript configuration
└── vitest.config.mts              # Vitest test runner configuration
```

---

## 🛠 Available Scripts Reference

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Development Server** | `npm run dev` | Starts the Next.js development server at `http://localhost:3000`. |
| **Production Build** | `npm run build` | Compiles an optimized production build with Turbopack / Webpack. |
| **Production Server** | `npm start` | Launches the compiled Next.js production server. |
| **Run Tests** | `npm test` | Executes the complete Vitest automated test suite (36 unit/integration tests). |
| **Watch Tests** | `npm run test:watch` | Runs Vitest in interactive watch mode for continuous TDD development. |
| **Lint Code** | `npm run lint` | Runs Next.js ESLint rules across all TypeScript and React files. |
| **Seed Default Demo** | `npm run prisma:seed` | Populates the database with default admin, student accounts, and drives. |
| **Seed 3,000+ Demo** | `npm run seed:demo` | High-volume batch seeder: 200 students, 30 companies, 50 drives, 1,000 applications. |
| **Clean Demo Data** | `npm run clean:demo` | Purges generated demo records in safe reverse foreign-key order. |
| **Generate Prisma** | `npm run prisma:generate`| Regenerates the Prisma Client TypeScript typings. |
| **Windows Quick Start**| `start.bat` | Port clearing, lock cleanup, DB check, auto-browser launch. |
| **Windows Repair** | `repair-and-start.bat` | Clears `.next` cache, backs up & recreates DB, re-seeds, and starts. |

---

## 🧪 Testing & Quality Assurance

CPMS includes an automated Vitest test suite verifying authentication, RBAC, candidate eligibility, drive publication rules, metrics calculations, and analytics formulas:

```bash
npm test
```

### Verified Test Suites (36 Tests Passing)

```text
 ✓ tests/unit/analytics-reporting.test.ts (4 tests)
   - calculates placement rate based on unique placed students to prevent duplicate inflation
   - safely handles 0 candidates without division by zero errors
   - calculates company-specific conversion rates accurately
   - generates salary package statistics (highest, average, median) correctly

 ✓ tests/unit/metrics-reporting.test.ts (3 tests)
   - calculates live placement metrics from database state
   - generates compliance CSV export data with correct column headers
   - logs an audit trail record when CSV reports are generated

 ✓ tests/unit/eligibility-applications.test.ts (7 tests)
   - marks student ELIGIBLE when all branch, batch, CGPA, and skills match
   - rejects student with NOT_ELIGIBLE and detailed reasons when CGPA is below cutoff
   - rejects student when academic branch is not in eligibleBranches list
   - flags INCOMPLETE_PROFILE when student CGPA is unrecorded
   - prevents duplicate application submissions via composite constraint
   - rejects application submissions for drives past deadline
   - logs initial ApplicationStatusLog entry upon application creation

 ✓ tests/unit/profile-company.test.ts (4 tests)
   - calculates profile completeness percentage dynamically
   - validates phone number and skill array limits
   - allows company soft archiving without deleting historical drive records
   - prevents hard deletion of companies with associated placement drives

 ✓ tests/unit/drives-management.test.ts (6 tests)
   - hides DRAFT drives from student-facing queries
   - allows administrators to create and publish drives
   - validates deadline datepicker inputs and preserves time of day
   - supports sequential recruitment round creation

 ✓ tests/unit/auth-permissions.test.ts (8 tests)
   - creates tamper-proof cryptographic session cookies with jose
   - verifies session signatures and rejects expired or altered tokens
   - hashes passwords with bcrypt salt rounds
   - enforces horizontal isolation via assertCanAccessStudent
   - redirects unauthorized student sessions away from admin routes

 ✓ tests/unit/sign-in-flow.test.ts (4 tests)
   - authenticates seeded demo student credentials correctly
   - authenticates seeded demo admin credentials correctly
   - rejects student credentials submitted with intendedRole: ADMIN with HTTP 403
   - requireAdmin server guard strictly redirects non-admin sessions to /unauthorized
```

---

## 🧭 Comprehensive Manual Walkthrough Plan

To test the complete end-to-end user experience manually:

### Scenario 1: Student Sign-In & Explanatory Eligibility Check
1. Open `http://localhost:3000/sign-in`.
2. On the **Student Login** tab, click **"Click to Autofill Demo Credentials"** (`aarav.sharma@student.edu` / `StudentDemo@123`).
3. Click **Sign In**. You will land on the **Student Dashboard** showing active drives and upcoming deadlines.
4. Navigate to **Placement Drives** (`/student/drives`).
5. Click on **Associate Software Engineer (Acme Cloud Solutions)**.
6. **Observe:** The **Eligibility Breakdown Checklist** displays green checkmarks for all 4 criteria (Branch: CSE, Batch: 2026, CGPA: 8.75 >= 7.50, Skills: React, TypeScript).
7. Aarav has already applied to this drive; observe that the action button states **"Already Applied"** and links to his submission timeline.

### Scenario 2: Incomplete Profile & CGPA Cutoff Enforcement
1. Sign out and return to `/sign-in`.
2. Enter the credentials for the incomplete profile student: `rahul.verma@student.edu` / `StudentDemo@123`.
3. Open the same Acme Cloud Solutions drive.
4. **Observe:** The checklist highlights **"Action Needed: Complete Profile"** because Rahul's CGPA is unrecorded. The **Apply** button is disabled with an explanatory prompt guiding the student to `/student/profile`.
5. Navigate to **Profile** (`/student/profile`), update the CGPA to `8.20`, and save. Return to the drive to observe the status dynamically transition to **ELIGIBLE**.

### Scenario 3: Admin Drive Management & Pipeline Progression
1. Sign out and switch to the **Admin Login** tab.
2. Click **"Click to Autofill Demo Credentials"** (`admin@placement.edu` / `AdminDemo@123`) and sign in.
3. Navigate to **Placement Drives** (`/admin/drives`).
4. Click **Create Placement Drive**:
   - Select a partner company (e.g. *Apex Systems*).
   - Enter title: `Full Stack Engineer`, job type: `Full-time`, location: `Bengaluru / Remote`.
   - Set CTC range: `14 - 18 LPA`.
   - Set deadline: Select a future date and time.
   - Configure eligibility: Select `Computer Science & Engineering` and minimum CGPA: `7.5`.
   - Set status to `PUBLISHED` and save.
5. Navigate to **Candidate Applicants** (`/admin/applicants`).
6. Click **Update Status** on any student application:
   - Select `INTERVIEW_SCHEDULED`.
   - Enter feedback notes: *"Technical round scheduled for Thursday at 10:00 AM."*
   - Submit.
7. Sign back in as that student to verify the stage transition appears on their **My Applications** timeline and a new notification is present in their **Notification Center**.

### Scenario 4: Placement Analytics & De-duplicated Reporting
1. Sign in as Admin and navigate to **Analytics** (`/admin/analytics`).
2. Verify the **Placement Rate Metric**:
   - If Student A receives 2 offers and Student B receives 1 offer out of 5 total students, the placement rate correctly reports **40.0% (2/5 students placed)**, proving de-duplicated student calculation.
3. Review the **Department Placement Breakdown** and **Company Conversion Funnel**.
4. Click **Export Compliance CSV Report** to download the institutional placement report, and check the admin audit log confirming the download was logged.

---

## 🛡 Self-Healing Recovery & Reliability Safeguards

CPMS is engineered with self-healing mechanisms to handle ungraceful process terminations, power outages, and multi-process file locking:

1. **Stale Lock Auto-Cleanup:**
   - If an ungraceful shutdown leaves an orphaned PostgreSQL lock file (`prisma/pgdata/postmaster.pid`), `start.bat` and `src/lib/db.ts` safely unlink the stale lock file before initialization without altering database tables or WAL records.
2. **Corrupted WAL Self-Healing Recovery:**
   - If an abrupt shutdown corrupts the PGlite Write-Ahead Log checkpoint (`PANIC: could not locate a valid checkpoint record`), the database layer automatically detects the failure, archives the damaged data to `backups/`, recreates a healthy instance, and re-applies schema and seed data with zero manual intervention.
3. **Multi-Worker Build Isolation:**
   - Next.js static page generation uses multiple parallel worker threads during `npm run build`. The database client isolates build-time static page collection using in-memory instances, eliminating Windows multi-worker file lock contention.
4. **Offline Font Hardening:**
   - Web fonts are configured with fallback system stacks to ensure builds succeed even in air-gapped or restricted offline environments.

---

## 📄 License & Acknowledgments

This project is open-source under the [MIT License](LICENSE).

Built with modern web technologies:
- [Next.js](https://nextjs.org/) by Vercel
- [Prisma ORM](https://www.prisma.io/)
- [PGlite](https://pglite.dev/) by ElectricSQL
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Vitest](https://vitest.dev/)
