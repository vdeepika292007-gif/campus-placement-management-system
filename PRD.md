# Product Requirements Document (PRD)
## Campus Placement Management System

**Document version:** 1.0  
**Status:** Initial planning draft  
**Working name:** Campus Placement Management System  
**Primary goal:** Build a centralized web platform to organize campus placement opportunities and help students and placement administrators track recruitment activity.

---

## 1. Product vision

The Campus Placement Management System (CPMS) is a web application for managing college placement activities in one place. It aims to reduce dependence on scattered announcements, spreadsheets, messages, and manual tracking by providing students and placement administrators with role-specific dashboards.

The product should be useful as a portfolio project first, while being designed carefully enough that its workflow can later be reviewed with a college placement cell.

**Important:** The actual placement process at the target college has not yet been verified. The product must not assume that every college uses the same eligibility rules, recruitment stages, or offer policies. These should be configurable where practical.

## 2. Problem statement

Placement information can be spread across messaging groups, notices, forms, emails, and spreadsheets. Students may find it difficult to keep track of eligible drives, deadlines, application status, and interview schedules. Placement administrators may need to manually organize company details, applicants, recruitment rounds, and reports.

CPMS aims to provide one consistent source of placement information and a clear record of each student's application progress.

## 3. Goals

1. Give students a single place to view published placement drives.
2. Help students understand the stated eligibility criteria before applying.
3. Let students submit and track applications.
4. Allow authorized placement administrators to manage companies, drives, applicants, recruitment stages, and outcomes.
5. Provide basic, accurate placement analytics and downloadable reports.
6. Use secure role-based access so students can access only their own private records and administrators can perform authorized management actions.
7. Keep the design accessible, responsive, and understandable to first-time users.

## 4. Non-goals for the initial release

The first release will not attempt to:
- Replace the college's official placement policy or make policy decisions.
- Automatically guarantee eligibility or selection; eligibility results are advisory until confirmed by an authorized administrator.
- Automatically contact companies or scrape third-party job websites.
- Include an advanced AI resume scorer or automated hiring recommendation.
- Include a full external company recruiter portal.
- Process salary payments or manage employment contracts.
- Integrate with college ERP, WhatsApp, email delivery providers, or single sign-on until the relevant requirements and permissions are confirmed.
- Store real student information during early development and testing.

These can be evaluated after the core workflow has been tested.

## 5. User roles

### 5.1 Student
A student can:
- Register or sign in, subject to the chosen account-approval policy.
- Maintain a profile containing academic details, branch, graduation year, skills, and optional resume reference.
- View published placement drives.
- See the drive's role, company, location, package information if provided, deadline, recruitment stages, and eligibility requirements.
- View an eligibility explanation based on available profile data.
- Apply to an open drive if the application rules allow it.
- View their own applications and status history.
- View announcements and relevant notifications.
- Update permitted profile fields and manage their account.

A student must not be able to view another student's private profile, resume, application details, or results.

### 5.2 Placement administrator
An authorized administrator can:
- View a summary dashboard.
- Create and maintain company records.
- Create, edit, draft, publish, close, or archive placement drives.
- Configure eligibility criteria and application deadlines.
- View applicants for drives they are authorized to manage.
- Update application statuses and recruitment-round outcomes.
- Record schedules and announcements.
- Manage student account status and profile corrections within the defined permissions.
- View analytics and export appropriate reports.
- Review an audit history of important administrative changes.

Administrative access must be protected on the server, not only by hiding UI controls.

### 5.3 Recruiter (future phase)
A future recruiter role may allow approved company representatives to manage their company profile, review authorized applicants, schedule rounds, and update candidate progress. This role is not required for the first release; the placement administrator manages recruiter-related data initially.

## 6. Core user journeys

### Journey A: Student discovers and applies to a drive
1. Student signs in.
2. Student completes the required profile fields.
3. Student opens the Placement Drives page.
4. Student selects a drive and reads its criteria, deadline, and stages.
5. System compares known profile values against configured criteria and shows eligible, not eligible, or unable to determine, with an explanation.
6. If the drive is open and the application rules permit it, the student submits an application.
7. The system stores the application and displays confirmation.
8. Student sees the application in My Applications and receives an in-app notification when its status changes.

### Journey B: Administrator publishes a drive
1. Administrator signs in.
2. Administrator creates or selects a company record.
3. Administrator creates a placement drive with job details, eligibility rules, deadline, and recruitment stages.
4. Administrator saves it as a draft and reviews the information.
5. Administrator publishes it.
6. The drive becomes visible to students according to its publication and eligibility settings.
7. Administrator can view applicants and update progress.

### Journey C: Administrator tracks recruitment
1. Administrator opens a drive.
2. Administrator views applicants and their current statuses.
3. Administrator records round schedules or results.
4. The system records the change and its timestamp.
5. The affected student can see the permitted update.
6. Dashboard statistics update from the underlying records.

## 7. Functional requirements

### P0 — Required for the initial release
- Authentication: sign-in, sign-out, safe password handling, and account status handling.
- Role-based authorization for students and administrators.
- Student profile create/read/update functionality.
- Company CRUD functionality for authorized administrators.
- Placement drive CRUD, draft/publish/close/archive states, deadlines, and recruitment-stage configuration.
- Eligibility criteria configuration and an explanatory eligibility check.
- Student application submission with duplicate-application prevention.
- Application status tracking and a status-change history.
- Administrator applicant list and status update functionality.
- Basic in-app notifications for relevant drive announcements and application-status changes.
- Student dashboard and administrator dashboard with real database-backed values.
- Search and filters for drives and applicants.
- Basic reporting and CSV export with authorization checks.
- Server-side validation, useful error messages, loading states, and empty states.
- Responsive layouts for desktop and mobile.
- Seed/demo data using fictional students and companies.
- Automated tests for critical permissions and workflows.

### P1 — Add after the core workflow is stable
- Approved recruiter accounts and a recruiter dashboard.
- Resume upload with file-type/size checks and private access controls.
- Email notifications, if a provider is configured and approved.
- More detailed analytics and report filters.
- Calendar-style interview schedule.
- Configurable college-specific offer and participation policies.
- Student skill-gap tracker based on skills stated in a job description.
- Audit-log viewer for administrators.

### P2 — Optional future enhancements
- AI-assisted resume feedback or preparation suggestions, with transparent limitations and user consent.
- More advanced placement trend analytics.
- Integration with a college ERP or approved identity provider.
- Multi-college support, if the project scope expands beyond one institution.

## 8. Main pages

### Public / authentication
- Sign in
- Student registration or invitation/approval flow
- Access denied / unauthorized
- Not found

### Student
- Dashboard
- My Profile
- Placement Drives
- Placement Drive Details
- My Applications
- Application Details / Timeline
- Notifications
- Account Settings

### Administrator
- Admin Dashboard
- Students
- Companies
- Company Details
- Placement Drives
- Create/Edit Drive
- Drive Details and Applicants
- Recruitment Rounds
- Announcements / Notifications
- Reports and Analytics
- Audit Log (P1 if needed)
- Settings

### Future recruiter
- Recruiter Dashboard
- Company Profile
- Job Drives
- Applicants
- Recruitment Rounds

## 9. Dashboard metrics

The first release may show:
- Number of published and open drives.
- Number of applications submitted by the signed-in student.
- Upcoming deadlines and scheduled rounds.
- For administrators: active drives, total applications, applicants by status, and offers recorded.

Every displayed number must be derived from database records and use clearly defined counting rules. Do not display invented or hardcoded statistics in the real dashboard. Seeded fictional data is acceptable in development and must be clearly identified as demo data.

## 10. Eligibility rules

The administrator may configure criteria such as:
- Graduation year.
- Department/branch.
- Minimum CGPA or percentage, if applicable.
- Required skills or other college-approved fields.

Rules must be configurable per drive. Missing profile data should produce “Unable to determine” or a clear request to complete the profile, rather than silently treating the student as eligible or ineligible. The interface should show which criterion passed or failed. The administrator's approved decision remains authoritative if college policy requires manual verification.

## 11. Application status model

Use a documented, controlled set of statuses, for example:
- Applied
- Under Review
- Shortlisted
- Assessment Scheduled
- Interview Scheduled
- Selected
- Rejected
- Withdrawn
- Offer Recorded

Not every status is a linear stage. The application workflow must define permitted transitions, record changes with timestamps and actor IDs, and avoid contradictory states. A rejected or withdrawn application should not accidentally be shown as active. Final statuses and offer status should be distinguishable.

## 12. Success criteria

The first release is successful when:
- A student can register/sign in and maintain a profile.
- An administrator can create and publish a drive.
- A student can view the published drive and receive a clear eligibility explanation.
- A permitted student can apply once and see the saved application after signing out and back in.
- An administrator can view applicants and update their statuses.
- Students can see only their own private application information.
- Students cannot invoke administrator-only actions by manually calling endpoints.
- Dashboard metrics match database records.
- Critical workflows and authorization rules have automated tests.
- The application can be run locally using documented setup steps.

## 13. Risks and assumptions

- **Unverified college workflow:** Validate with a placement officer or senior before real deployment.
- **Data privacy:** Use fictional data in development; restrict access to academic records, resumes, and results.
- **Changing placement policies:** Keep criteria and stages configurable rather than hardcoding one institution's rules.
- **Feature creep:** Finish P0 before starting P1/P2.
- **Misleading analytics:** Define each metric and calculate it from persisted records.
- **Deployment/security configuration:** Never commit secrets; configure production environment variables, HTTPS, database backups, and secure session handling before a real pilot.

## 14. Open questions to validate later

1. Who is allowed to create student accounts: students themselves, an administrator, or an imported college roster?
2. Does the college use CGPA, percentage, branch restrictions, or other eligibility criteria?
3. Who is allowed to update interview results and offers?
4. What are the actual application statuses and placement rules?
5. Does the college need a recruiter login in the first deployment?
6. Are email notifications required, or are in-app notifications enough for the pilot?
7. What reports does the placement cell actually need?

Do not block the local prototype on these answers. Use documented demo assumptions and keep uncertain rules configurable.
