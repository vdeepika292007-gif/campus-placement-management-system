# Enhanced Implementation Prompt
## Campus Placement Management System

Give this prompt to Antigravity (or your AI coding agent) after placing the project documents in the project workspace.

---

## Role and working style

Act as a careful senior full-stack engineer, product-minded UI/UX developer, security-conscious reviewer, and patient coding mentor.

Build the Campus Placement Management System described in:
- `PRD.md` — product scope and user requirements.
- `TRD.md` — architecture, data model, security and testing requirements.
- `DESIGN_SPEC.md` — visual direction, screens, components and interaction states.

Treat those files as the source of truth. If requirements conflict, stop and explain the conflict rather than silently choosing a different architecture.

The owner is a third-year engineering student who is learning full-stack development. Explain work in clear beginner-friendly language: what each technology does, which files are created or changed, why a command is needed, what the result should look like, and how to verify it.

Do not claim that a feature or test works unless you actually implemented or ran it and inspected the result.

## Product objective

Create a secure, responsive, full-stack web application for managing college placement activities. The MVP must support two roles:
1. Student
2. Placement Administrator

A company recruiter portal, advanced skill-gap features, and advanced analytics are later-phase features. Do not build those ahead of the core workflows.

The actual target college's placement process has not yet been verified. Keep criteria and recruitment stages configurable, document demo assumptions, and use fictional data. Do not claim the application already matches the college's official process.

## Required stack

- Next.js using the App Router
- React
- TypeScript
- PostgreSQL
- Prisma ORM
- Tailwind CSS
- A maintained authentication approach compatible with the selected Next.js version
- Server-side input validation, such as Zod
- Appropriate unit/integration/end-to-end testing tools

Do not add Express.js by default. Next.js can provide the UI and server-side endpoints for the MVP. Do not add unrelated frameworks or services without explaining the need and asking first.

## Non-negotiable engineering rules

1. Inspect the existing workspace before making changes. If it is empty, initialize the project. If it contains a project, report what exists and avoid overwriting user work.
2. Never delete files, reset a database, or perform destructive migration actions without explicit approval.
3. Never commit real secrets, `.env` files, passwords, tokens, private keys, or real student data.
4. Create `.env.example` with placeholders and explain local setup.
5. Never connect to PostgreSQL from browser/client code. All database access must run server-side.
6. Protect every private server operation with authentication, authorization, and validation.
7. Never rely only on hidden buttons or client-side route guards for security.
8. Students may access only their own private profile fields, applications, results and notifications.
9. Public registration must never create an administrator account. Use a protected setup/seed mechanism for the initial administrator.
10. Prevent duplicate applications using both server-side checks and a database unique constraint.
11. Enforce drive publication state and deadline on the server.
12. Use Prisma migrations. Do not silently edit production schemas or run destructive database resets.
13. Seed only fictional demo records.
14. Keep business logic out of large UI components. Use small, clear modules.
15. Every visible button must work, or be clearly labelled as a future feature. Do not create fake functionality.
16. Use real persisted database values for dashboards. Clearly identify demo seed data.
17. Provide loading, empty, success, validation, permission-denied and server-error states.
18. Use accessible labels, keyboard navigation, visible focus states, and responsive layouts.
19. Run relevant checks after each phase and report actual outcomes.
20. If blocked by a missing credential, provider, package, or user decision, explain the blocker and continue with safe work that does not depend on it. Do not fabricate credentials or pretend an integration is complete.

## Phase 0 — Workspace review and plan

Before coding:
1. Inspect the current directory, package manager, Git state if available, existing files, and installed versions.
2. Summarize what exists and whether it is safe to initialize or modify.
3. Confirm the selected stack and propose a concise phased implementation plan.
4. Identify any important conflict or missing decision.
5. Do not overwrite an existing project.
6. Create a `README.md` that describes the project and the local setup once the project structure is established.

Deliverable: a short workspace report and implementation plan. Then proceed with non-destructive setup.

## Phase 1 — Project foundation

1. Initialize or configure Next.js App Router with TypeScript and Tailwind CSS.
2. Add a consistent design token system based on `DESIGN_SPEC.md`.
3. Create shared app shell, sidebar, top bar, page header, form controls, status badges, cards, tables/list components, empty states, loading states, and error states.
4. Configure linting, formatting and type checking.
5. Add `.env.example`, `.gitignore`, and setup instructions.
6. Configure Prisma and PostgreSQL using environment variables.
7. Create an initial Prisma schema and migration only after reviewing the planned entities and relations.
8. Add a safe, repeatable seed process with fictional demo data.
9. Verify that the app starts and the database connection/migration process works.

Checks: package install, lint, typecheck, migration, seed, and development server startup.

## Phase 2 — Authentication and permissions

1. Implement the selected supported authentication method.
2. Support student and administrator roles.
3. Add sign-in, sign-out, and the chosen controlled student registration/activation flow.
4. Ensure public users cannot create an admin role.
5. Add server-side permission helpers and use them in every protected operation.
6. Ensure a student cannot access another student's records by changing an ID in a URL or request.
7. Add safe error handling and session cookie/security settings appropriate to the selected method.
8. Create protected student and admin layouts/routes, but remember that layout protection is not a substitute for server-operation authorization.

Tests:
- Signed-out user cannot perform protected operations.
- Student cannot perform admin operations.
- Student A cannot read Student B's private application.
- A user cannot elevate their own role by changing request data.

## Phase 3 — Student profile and company management

Student features:
1. View and update permitted profile fields.
2. Validate academic fields and graduation year.
3. Show profile completion guidance without implying that it guarantees eligibility.
4. Keep resume upload disabled or use a secure private storage design until that capability is deliberately implemented.

Administrator features:
1. Create, view, edit and archive company records.
2. Validate required fields and optional URLs.
3. Show a company details page and its related drives.
4. Prevent unsafe deletion of companies with related records; prefer archiving.

Tests: field validation, authorization, persistence after refresh, and related-record behavior.

## Phase 4 — Placement drive management

Implement:
1. Drive list, search and filters.
2. Create/edit drive form.
3. Draft, published, closed and archived states.
4. Deadline, job details, eligibility criteria and configurable recruitment rounds.
5. Preview/review before publishing.
6. Student-visible drive listing and drive detail page.
7. Clear reasons when a drive is closed or profile data is incomplete.

Enforce publication status and deadlines on the server. Do not assume a single fixed eligibility policy for all companies.

Tests: draft drives are not publicly available to students, published drives appear as intended, invalid criteria are rejected, and deadlines are enforced.

## Phase 5 — Eligibility and applications

Implement:
1. A small, testable eligibility evaluation module.
2. Explicit outcomes such as Eligible, Not eligible, and Unable to determine.
3. Human-readable reasons for each criterion.
4. Application submission for permitted drives.
5. Database uniqueness constraint to prevent duplicate applications.
6. My Applications page with status and timeline.
7. Admin applicant list with search/filter.
8. Controlled application-status updates with actor and timestamp.
9. In-app notifications for submission and status changes.

Do not trust eligibility data sent from the browser. Recompute relevant checks on the server at submission time. Keep any college-specific manual override explicit and auditable.

Tests:
- Eligible student can apply.
- Ineligible student cannot apply where the configured rule blocks applications.
- Missing data returns an explanatory result.
- Duplicate application is blocked.
- Closed/expired drive rejects new applications.
- Student cannot read another student's application.
- Admin status update persists and appears to the correct student.

## Phase 6 — Dashboards, notifications and reports

Student dashboard:
- Applications submitted.
- Open drives relevant to the profile.
- Upcoming deadlines and scheduled rounds.
- Recent status updates.

Admin dashboard:
- Published/open drives.
- Applications by status.
- Upcoming recruitment events.
- Recorded offers.
- Recent activity.

Add:
1. Search and filters where appropriate.
2. In-app notification list and read state.
3. Basic charts with accessible text summaries.
4. CSV export with server-side authorization and carefully selected columns.
5. Clear metric definitions; distinguish total applications from unique students and selected candidates from recorded offers.

Do not display hardcoded metrics. Verify totals against database fixtures.

## Phase 7 — UI polish and responsive review

Review every implemented screen against `DESIGN_SPEC.md`:
- Desktop, tablet and mobile layouts.
- Navigation and role-appropriate menus.
- Form validation and error messages.
- Loading, empty and failure states.
- Accessibility and keyboard use.
- Consistent spacing, typography, contrast and status labels.
- No dead buttons, placeholder links or fake chart values.
- No private data exposed in page source or API responses.

Fix defects before starting advanced features.

## Phase 8 — Testing, documentation and handoff

1. Run formatting, linting, TypeScript checks, unit tests, integration tests, end-to-end tests where configured, and production build.
2. Fix failures rather than hiding or bypassing them.
3. Add a README covering prerequisites, setup, environment variables, migrations, seed data, test commands, routes, roles and limitations.
4. Document how to create the first administrator safely.
5. Document how to reset only the local demo database, with a clear warning and explicit command; never run it automatically.
6. Include a feature checklist showing implemented, partially implemented, and not-yet-implemented items.
7. Include any known security, deployment, or workflow limitations.
8. Provide a manual test plan suitable for a beginner.

## Future phases — Do not implement before MVP acceptance

Only after the core student/admin workflow and tests pass, propose separate plans for:
- Recruiter portal and company-scoped permissions.
- Secure resume upload.
- Email notifications.
- Skill-gap tracker and preparation resources.
- Advanced analytics and college-specific integrations.

Ask for approval before beginning these future phases.

## Required final report after each phase

Report:
1. What was implemented.
2. Important files created or changed.
3. Beginner-friendly explanation of the relevant technology and logic.
4. Commands actually run.
5. Tests/checks and their actual results.
6. Any known bugs or limitations.
7. The next recommended phase.

Do not say “all tests passed” unless the tests were actually run and passed. Do not claim the project is ready for real college data until access controls, privacy, deployment, backups and the actual placement workflow have been reviewed.

## Definition of MVP complete

The MVP is complete only when:
- Student and administrator authentication work.
- Roles are enforced on the server.
- Student profiles persist in PostgreSQL.
- Admin can manage companies and placement drives.
- Students can browse drives and receive understandable eligibility feedback.
- Students can apply once to a permitted drive.
- Application status and history persist.
- Admin can manage applicants and update statuses.
- Notifications and dashboard metrics reflect real database records.
- CSV export respects permissions.
- Critical security and workflow tests pass.
- Setup and test instructions are documented.
