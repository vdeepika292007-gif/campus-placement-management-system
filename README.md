# Campus Placement Management System (CPMS)

A production-grade, centralized web platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **PostgreSQL** to organize campus recruitment drives, verify student eligibility, track multi-stage interview progress, and streamline placement administration.

---

## 🎯 Architecture Overview & Tech Stack

| Layer | Technology | Rationale & Responsibility |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Unified Server Components, Route Handlers, and responsive layouts. |
| **Language** | TypeScript | Strict compile-time typing across database schemas, APIs, and UI props. |
| **Styling** | Tailwind CSS & Design Tokens | Curated slate-navy design system following `DESIGN_SPEC.md` with accessible high-contrast states. |
| **ORM** | Prisma ORM 7.x | Relational mapping, type-safe queries, foreign key constraints, and migrations. |
| **Database** | PostgreSQL | Relational persistence for users, profiles, companies, drives, rounds, applications, notifications, and audit logs. |
| **Authentication** | Cryptographic Signed Cookies (`jose` + `bcryptjs`) | Tamper-proof HttpOnly session cookies, salted password hashing, and server-side RBAC guards. |
| **Validation** | Zod | Runtime schema validation at all trust boundaries. |
| **Testing** | Vitest | High-speed unit and integration test runner (26 automated test cases). |

---

## 🚀 Step-by-Step Setup Guide

### 1. Prerequisites
- **Node.js**: v18.x, v20.x, or v24.x (current workspace running `v24.22.1`)
- **npm**: v9.x or v11.x
- **PostgreSQL Database**: Free cloud database (Neon.tech / Supabase) or local PostgreSQL instance.

### 2. Environment Configuration
Create a `.env` file in the root project folder:

```bash
cp .env.example .env
```

Open `.env` and fill in your PostgreSQL connection string and a secret key:

```env
# 1. PostgreSQL Connection URL (e.g. Free Cloud PostgreSQL from Neon.tech)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 2. Authentication Secret (At least 32 characters long)
AUTH_SECRET="cpms-super-secret-key-change-this-in-production-min-32-chars-long"

# 3. Application Public Base URL
APP_URL="http://localhost:3000"
```

> **Setting up Free Cloud PostgreSQL in 2 minutes:**
> 1. Sign up for free at [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
> 2. Create a new project called `campus-placement`.
> 3. Copy the pooled connection string and paste it as `DATABASE_URL` in `.env`.

---

### 3. Install Dependencies & Generate Database Client
```bash
npm install
npx prisma generate
```

### 4. Run Migrations & Seed Demo Records
To push the schema to your database and load the fictional students, companies, drives, and rounds:

```bash
# Push schema tables to PostgreSQL
npx prisma db push

# Seed fictional demo data
npm run prisma:seed
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Fictional Demo Accounts (Pre-Seeded)

| Role | Email | Password | Academic Profile / Attributes |
| :--- | :--- | :--- | :--- |
| **Placement Admin** | `admin@placement.edu` | `AdminDemo@123` | Placement Cell Coordinator with full management rights |
| **Eligible Student** | `aarav.sharma@student.edu` | `StudentDemo@123` | B.Tech CSE (Class of 2026), CGPA 8.75 / 10, React, TypeScript |
| **Student (ECE)** | `priya.patel@student.edu` | `StudentDemo@123` | B.Tech ECE (Class of 2026), CGPA 7.40 / 10, C++, Embedded |
| **Incomplete Student**| `rahul.verma@student.edu` | `StudentDemo@123` | B.Tech ME (Class of 2026), CGPA pending / missing |

---

## 🧪 Running Automated Tests

Run the full automated Vitest test suite:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

Run production build validation:
```bash
npm run build
```

---

## 📋 Comprehensive Feature Checklist

### ✅ Completed & Fully Implemented (MVP)
- [x] **Authentication & RBAC:** Secure HttpOnly session tokens, bcrypt password hashing, sign-in, registration, sign-out, and unauthorized access interception.
- [x] **Student Profile Management:** Department selection, graduation year, CGPA validation, dynamic technical skills tags, and profile completeness indicator.
- [x] **Company Directory:** Administrative CRUD, search, filter tabs (Active/Archived), soft archive protection (prevents deletion when related drives exist).
- [x] **Placement Drive Management:** Job details, compensation formatting, deadline datepickers, configurable criteria (branches, batches, CGPA cutoff, required skills), multi-stage recruitment pipeline builder.
- [x] **Server-Side Publication Guards:** Draft drives strictly hidden from students; closed/expired drives reject new submissions.
- [x] **Explanatory Eligibility Engine:** Deterministic evaluation returning `ELIGIBLE`, `NOT_ELIGIBLE`, or `INCOMPLETE_PROFILE` with granular human-readable reasons for each criterion.
- [x] **Application Submission & Duplicate Prevention:** Unique database constraint and server-side check preventing duplicate applications; records initial `ApplicationStatusLog`.
- [x] **Candidate Tracking & Status History:** Chronological timeline tracking recruitment stages (`Applied` -> `Under Review` -> `Shortlisted` -> `Assessment Scheduled` -> `Interview Scheduled` -> `Selected` / `Rejected` / `Offer Recorded`).
- [x] **Admin Candidate Review:** Filter applicants by drive and status, search by candidate name/email, and transition candidate status with student notifications.
- [x] **Live Database-Backed Dashboards:** Real counts for eligible drives, submissions, offers, funnels, approaching deadlines, and audit trails.
- [x] **In-App Notifications:** Real-time feedback for drive announcements, application submission receipts, and stage progression with read/unread tracking.
- [x] **Reports & Compliance:** Aggregated statistics, department breakdown, and secure CSV report export.

### ⏳ Future Release Enhancements (P1 / P2)
- External company recruiter portal with company-scoped logins.
- Secure private PDF resume file uploads with S3/Blob storage.
- External SMTP email delivery providers.
- Advanced AI interview preparation and resume skill-gap recommendations.

---

## 🔒 Security & Data Integrity Safeguards

1. **Horizontal Privilege Isolation (`assertCanAccessStudent`):** Students can only view their own private applications and profile records. Changing an ID in a request or URL is rejected on the server.
2. **Elevated Privilege Protection:** Public student registration hardcodes `role = STUDENT`. Administrator accounts can only be provisioned via protected seeds or existing admin consoles.
3. **Relational Deletion Protection:** Companies with associated placement drives cannot be hard deleted; they are archived instead to preserve relational integrity.
4. **Credential Privacy:** Password hashes, secret keys, and session cookies are never exposed to browser bundles or included in CSV exports.

---

## 🧭 Beginner Manual Test Plan

1. **Test Student Discovery & Explanatory Eligibility:**
   - Sign in as `aarav.sharma@student.edu` (`StudentDemo@123`).
   - Navigate to **Placement Drives** (`/student/drives`).
   - Click on **Associate Software Engineer (Acme Cloud Solutions)**.
   - Observe the **Eligibility Explanation Checklist**: All criteria (Branch, Batch, CGPA) show green checkmarks because Aarav is a CSE 2026 student with 8.75 CGPA.
   - Notice that Aarav already applied, so the button displays "Already Applied" and links to My Applications.

2. **Test Ineligible / Missing Data Handling:**
   - Sign out and sign in as `rahul.verma@student.edu` (`StudentDemo@123`).
   - Open the same Acme drive.
   - Observe that the checklist displays **"Action Needed: Complete Profile"** because Rahul's CGPA is unrecorded. The Apply button is disabled with an explanatory prompt to update profile.

3. **Test Administrator Drive & Candidate Progression:**
   - Sign in as `admin@placement.edu` (`AdminDemo@123`).
   - Open **Placement Drives** (`/admin/drives`).
   - Click **Create Placement Drive**, select a company, set criteria and recruitment stages, and save as Published.
   - Navigate to **Candidate Applicants** (`/admin/applicants`).
   - Click **Update Status** on any student application, select `INTERVIEW_SCHEDULED` or `SELECTED`, enter a note, and submit.
   - Sign in as the affected student and verify that the new status and notification appear on their dashboard and applications timeline.

---

## ⚠️ Safe Database Reset Instructions

If you ever need to reset your local/demo database during development:

```bash
# WARNING: This deletes existing records in the connected database and applies migrations fresh:
npx prisma migrate reset

# Or re-push and re-seed:
npx prisma db push --force-reset
npm run prisma:seed
```
*Never execute this command in a production environment.*
