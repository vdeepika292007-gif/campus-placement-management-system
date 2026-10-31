# Technical Requirements Document (TRD)
## Campus Placement Management System

**Document version:** 1.0  
**Chosen stack:** Next.js + TypeScript + Prisma + PostgreSQL  
**Architecture:** Full-stack Next.js application with server-side business logic  
**Initial roles:** Student and Placement Administrator

---

## 1. Purpose

This document describes the proposed technical architecture, data model, security expectations, coding conventions, development environment, and test strategy.

It is a build plan, not proof that the application has already been implemented. The implementation agent must inspect the current workspace before creating or modifying files.

## 2. Technology stack

- **Next.js (App Router):** UI routing, layouts, server-rendered pages, Server Components, and Route Handlers for server endpoints.
- **React:** UI component model used by Next.js.
- **TypeScript:** Static typing across application code.
- **PostgreSQL:** Relational database for users, companies, drives, applications, rounds, and notifications.
- **Prisma ORM:** Schema definition, type-safe database access, and migrations.
- **Authentication:** Use a maintained authentication approach compatible with the selected Next.js version. Choose and document a supported library or implement secure server-managed sessions only if the implementation plan is reviewed carefully. Do not invent an insecure custom token scheme.
- **Validation:** A schema validation library such as Zod for request/form validation at trust boundaries.
- **Styling:** Tailwind CSS with a consistent design token system; use accessible UI primitives where useful.
- **Charts:** A maintained React chart library may be added for analytics after core workflows work.
- **Testing:** Unit/integration tests plus end-to-end browser tests for critical flows.
- **Package manager:** Use the package manager already present in the workspace; otherwise choose npm and commit the lockfile.

Do not add Express.js by default. Next.js Route Handlers and server-side modules are sufficient for the initial application. A separate backend can be considered later only if there is a clear deployment or integration need.

## 3. High-level architecture

Browser
→ Next.js pages and components
→ Server Actions and/or Route Handlers
→ server-side authorization and validation
→ Prisma
→ PostgreSQL

The browser must never connect directly to PostgreSQL or receive database credentials. Database operations must run in server-only code.

### Responsibility boundaries
- UI components display data and collect input.
- Server-side functions authenticate users, authorize actions, validate input, apply business rules, and call Prisma.
- Prisma maps application operations to database queries.
- PostgreSQL persists the records and enforces relational constraints.
- Tests verify behavior at the boundaries, particularly authorization and state transitions.

Use Server Components for data that can be rendered on the server. Use Client Components only where interaction or browser APIs require them. Keep database access out of client bundles.

## 4. Suggested folder structure

Adapt to the Next.js conventions and installed versions. Do not create duplicate structures.

```text
campus-placement-system/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── register/
│   │   ├── student/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── drives/
│   │   │   └── applications/
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   ├── companies/
│   │   │   ├── drives/
│   │   │   └── reports/
│   │   ├── api/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboards/
│   │   ├── drives/
│   │   └── applications/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db.ts
│   │   ├── validation/
│   │   ├── permissions/
│   │   └── utils/
│   ├── server/
│   │   ├── companies/
│   │   ├── drives/
│   │   ├── applications/
│   │   └── reports/
│   └── types/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Keep reusable UI components separate from domain logic. Avoid placing all application logic in one giant page or component.

## 5. Data model

Use PostgreSQL relational constraints and Prisma models. Exact field names may be refined during implementation, but relationships and access rules must be preserved.

### User
- `id`
- `name`
- `email` (unique, normalized)
- `passwordHash` only if password-based authentication is selected
- `role` (STUDENT or ADMIN for MVP)
- `accountStatus`
- `createdAt`, `updatedAt`

Do not store plaintext passwords. If an authentication provider manages credentials, follow its documented model instead.

### StudentProfile
- `id`
- `userId` (unique relation to User)
- `studentNumber` (optional; unique only if the institution provides it)
- `department`
- `graduationYear`
- `cgpa` or percentage fields as configured; validate realistic bounds
- `skills` (simple string array or normalized related table, chosen deliberately)
- `resumeReference` (optional private storage reference, not a public URL by default)
- `createdAt`, `updatedAt`

### Company
- `id`
- `name`
- `description`
- `website` (optional, validated URL)
- `industry` (optional)
- `location` (optional)
- `createdAt`, `updatedAt`

### PlacementDrive
- `id`
- `companyId`
- `title` / role name
- `jobDescription`
- `jobType` (optional)
- `location` (optional)
- `salaryMin` / `salaryMax` or a carefully defined package representation; do not assume every company shares the same compensation format
- `currency`
- `deadlineAt`
- `status` (DRAFT, PUBLISHED, CLOSED, ARCHIVED)
- `graduationYears` and/or eligibility criteria
- `minimumCgpa` or other configured criterion
- `recruitmentStages` (normalized model or ordered child records; prefer normalized records if stages need their own schedules/status)
- `createdById`
- `createdAt`, `updatedAt`

### Application
- `id`
- `studentId` (relation to User or StudentProfile; choose one consistent pattern)
- `placementDriveId`
- `status`
- `appliedAt`
- `updatedAt`
- unique constraint on `(studentId, placementDriveId)` to prevent duplicate applications

### RecruitmentRound
- `id`
- `placementDriveId`
- `name`
- `roundType`
- `sequence`
- `scheduledAt` (optional)
- `description` (optional)
- `createdAt`, `updatedAt`

### ApplicationRoundResult (or equivalent)
- `id`
- `applicationId`
- `recruitmentRoundId`
- `status` or outcome
- `notes` (restricted access; avoid unnecessary sensitive comments)
- `updatedById`
- `updatedAt`
- unique constraint on `(applicationId, recruitmentRoundId)` where appropriate

### Notification
- `id`
- `userId`
- `title`
- `message`
- `type`
- `readAt` (nullable)
- `createdAt`
- optional relation to a drive/application

### AuditLog
- `id`
- `actorUserId`
- `action`
- `entityType`
- `entityId`
- minimal metadata needed for accountability
- `createdAt`

Do not put passwords, session tokens, secret keys, or unnecessary personal data in audit metadata.

### Relationships
- A company can have many placement drives.
- A student can have many applications.
- A placement drive can have many applications.
- A placement drive can have many recruitment rounds.
- An application can have round-specific outcomes.
- A user can have many notifications.
- Important administrator changes should be auditable.

## 6. Business rules

1. Only authenticated users may access protected pages or protected server operations.
2. Students may read published drives and may submit applications only while the drive is open and before its deadline, according to configured rules.
3. A student may not submit a duplicate application for the same drive.
4. Students may read and update only permitted fields in their own profiles.
5. Students may view only their own applications, status history, and private notifications.
6. Administrators may manage placement data only through server-side authorization checks.
7. A student cannot elevate their role by changing client-side data or sending a forged request.
8. Drive publication and closure must be enforced on the server, not only by disabling buttons.
9. Eligibility evaluation must handle missing data explicitly and provide an explanation.
10. Status changes must be validated and recorded with timestamps and actor identity.
11. Analytics must be derived from persisted data using documented definitions.
12. CSV exports must enforce permissions and exclude fields the requesting user is not authorized to access.

## 7. Authentication and security

- Use a maintained authentication library or a carefully reviewed server-side session approach compatible with Next.js.
- Use secure, HttpOnly cookies for session identifiers where applicable; set Secure in HTTPS production and an appropriate SameSite policy.
- Store password hashes using a current, vetted password-hashing algorithm if local passwords are used.
- Protect state-changing operations against CSRF according to the selected authentication design.
- Validate and normalize all input on the server.
- Apply authorization checks in every protected Server Action and Route Handler. Middleware alone is not sufficient.
- Avoid leaking whether private accounts or emails exist through overly specific errors.
- Rate-limit login and sensitive endpoints where appropriate.
- Never expose `DATABASE_URL`, auth secrets, or private storage credentials to client code.
- Keep secrets in environment variables and never commit `.env`.
- Use least-privilege database credentials.
- Use safe error responses without stack traces or secrets.
- Do not log passwords, session cookies, resume contents, or sensitive student data.
- Use fictional seed data for local development.
- Before a real pilot, configure HTTPS, backups, monitoring, retention rules, and a process for correcting or deleting personal data.

## 8. Environment variables

Provide `.env.example` with placeholders only, such as:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/campus_placement?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
APP_URL="http://localhost:3000"
```

Use only the variables required by the selected authentication library. Do not commit actual secrets. Explain how to create a local `.env` file without sharing credentials in screenshots or chats.

## 9. Validation and error handling

- Validate forms both for user experience and on the server for security.
- Use clear inline errors and a summary where appropriate.
- Handle expired sessions, permission failures, not-found records, duplicate applications, closed drives, and database failures.
- Provide loading, success, empty, and error states.
- Do not report success until the server operation succeeds.
- Avoid optimistic UI updates for critical application status changes unless rollback behavior is implemented and tested.

## 10. Accessibility and responsive behavior

- Use semantic HTML and accessible labels.
- Ensure keyboard navigation and visible focus.
- Do not rely on color alone to communicate application status.
- Support sensible layouts at mobile, tablet, and desktop widths.
- Maintain readable contrast, consistent spacing, and usable form controls.
- Charts must have labels or text summaries so information is not available only visually.

## 11. Testing strategy

### Unit tests
- Eligibility evaluation with matching, failing, and missing criteria.
- Application status-transition rules.
- Metric calculations and filtering.

### Integration tests
- Student can apply once to an open drive.
- Duplicate application is rejected.
- Application is rejected after the deadline.
- Student cannot access another student's application.
- Student cannot call administrator-only operations.
- Administrator can create/publish a drive and update an application status.
- Invalid form data is rejected server-side.
- Dashboard totals match database fixtures.

### End-to-end tests
- Student signs in, completes profile, views drive, applies, and sees the saved status.
- Administrator signs in, creates a company and drive, publishes it, and manages applicants.
- Refreshing or signing out/in does not lose persisted records.
- Unauthorized routes and actions are blocked.

Use a test database or isolated test fixtures. Never run destructive tests against production data.

## 12. Development and migration practices

- Commit the lockfile.
- Use Prisma migrations for schema changes; do not rely on ad hoc production schema edits.
- Seed only fictional demo records.
- Make seed operations repeatable where practical.
- Do not reset or delete an existing database without explicit approval and a verified backup.
- Inspect the current workspace before modifying files.
- Keep changes small and explain each phase.
- Run formatting, linting, type checking, tests, and production build before declaring a phase complete.

## 13. Deployment notes

For a first local prototype, run Next.js locally and use a local PostgreSQL instance or an approved development database. For deployment, choose a hosting provider that supports the selected Next.js features and a managed PostgreSQL service. Configure environment variables and database migrations carefully.

Do not deploy real student data until the college has approved the workflow, access rules, data handling, hosting, and backup plan.

## 14. Acceptance criteria

The technical implementation is acceptable when:
- It starts using documented commands on a clean setup.
- Prisma migrations create the required schema.
- The seed process creates clearly fictional demo data.
- Type checking, linting, tests, and production build pass.
- Server-side authorization protects all private operations.
- Critical workflows persist data in PostgreSQL.
- No secret is committed or exposed to the browser.
- The README explains setup, environment variables, migrations, seeding, tests, and known limitations.
