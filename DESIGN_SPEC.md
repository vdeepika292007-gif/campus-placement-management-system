# UI/UX Design Specification
## Campus Placement Management System

**Document version:** 1.0  
**Design direction:** Modern, professional, clear, student-friendly  
**Initial roles:** Student and Placement Administrator  
**Implementation target:** Next.js + TypeScript

---

## 1. Design goal

Create a polished campus recruitment product that feels trustworthy and easy to understand. The interface should help students answer three questions quickly:

1. Which opportunities can I apply for?
2. What do I need to do next?
3. What is the current status of my applications?

For administrators, the interface should make it easy to publish drives, manage applicants, update recruitment stages, and understand placement activity.

Avoid designing a generic admin template with charts that do not support a real workflow. Each dashboard element should link to an action or meaningful detail.

## 2. Visual direction

### Suggested theme
- Professional light theme as the primary theme, with deep navy/ink text and a restrained blue or indigo accent.
- White or very light neutral surfaces.
- Soft borders and subtle shadows, used sparingly.
- Clear typography and generous spacing.
- Optional dark theme can be added after the core experience is stable.

### Suggested design tokens
Treat these as starting values and refine them consistently:
- Page background: very light cool neutral.
- Surface: white.
- Primary text: dark navy/charcoal.
- Secondary text: muted slate.
- Primary accent: indigo/blue.
- Success: green.
- Warning: amber.
- Error: red.
- Borders: light neutral gray.
- Radius: consistent medium rounding for cards and controls.
- Spacing: use a consistent scale rather than arbitrary values.

Do not use color alone for status; pair colors with text and/or icons.

## 3. Global layout

### Desktop
- Left sidebar for primary navigation.
- Top bar containing page title/breadcrumb, search where relevant, notifications, and profile menu.
- Main content area with a clear page heading, concise helper text, and one primary action.
- Use a consistent content width and responsive grid.

### Mobile
- Sidebar becomes a drawer or compact navigation.
- Tables may become stacked cards or horizontally scrollable with clear affordances.
- Forms use a single-column layout.
- Primary actions remain easy to reach.
- Avoid charts and tables that overflow the viewport.

## 4. Navigation

### Student navigation
- Dashboard
- Placement Drives
- My Applications
- My Profile
- Notifications
- Settings

### Administrator navigation
- Overview
- Students
- Companies
- Placement Drives
- Applicants / Recruitment
- Reports & Analytics
- Notifications
- Settings

Show navigation items according to the authenticated role, but enforce permissions on the server too.

## 5. Student screens

### 5.1 Student dashboard
Recommended sections:
- Welcome header with student's first name if available.
- Summary cards: active eligible drives, applications submitted, upcoming deadlines, upcoming scheduled rounds.
- “Recommended / Eligible Drives” list with company, role, deadline, location, and eligibility indicator.
- “My Application Progress” list showing recent applications and current status.
- Upcoming events or deadlines.
- Recent notifications.

Do not invent counts. Empty states should guide the user to complete their profile or browse drives.

### 5.2 Placement drives listing
- Search by company or role.
- Filters: status/open drive, department/branch, graduation year, location, and deadline where applicable.
- Drive cards or a compact list with company, role, location, deadline, package only if known, and application state.
- Clearly label published, closed, and already-applied states.
- Use pagination or sensible loading if there are many records.

### 5.3 Drive details
Display:
- Company name and short profile.
- Role title and job description.
- Location and compensation details only when provided.
- Application deadline and drive status.
- Eligibility requirements in a readable checklist.
- Recruitment stages and schedules if configured.
- A clear eligibility result with reasons.
- Apply button only when permitted; server must re-check the rules at submission.
- A helpful explanation when the student is not eligible, missing profile data, already applied, or the drive is closed.

### 5.4 My applications
- Search/filter by company, role, status, and date.
- Each row/card shows role, company, application date, status, and next known step.
- Application details include a chronological status timeline with timestamps.
- Do not show internal admin-only notes.

### 5.5 Student profile
Group fields into sections:
- Basic information.
- Academic details.
- Skills.
- Resume reference/upload, if enabled.
- Profile completeness indicator.

Explain why required information is needed. Do not imply a profile score guarantees placement.

## 6. Administrator screens

### 6.1 Admin overview
- Summary metrics based on real database queries: open drives, total applications, applications by status, recorded offers.
- Recent activity.
- Upcoming recruitment events.
- Drives needing attention, such as approaching deadlines.
- Charts should have clear labels, time ranges, and definitions.

### 6.2 Company management
- Searchable company table.
- Add/edit company form.
- Company detail page listing its drives.
- Validate websites and optional fields.
- Use confirmation for destructive actions; prefer archive/deactivate over hard deletion when records depend on the company.

### 6.3 Placement drive management
- Table/list with company, role, deadline, status, and application count.
- Create/edit flow broken into logical sections: role details, eligibility, dates, recruitment stages, publication.
- Save as draft before publishing.
- Show a review summary before publishing.
- Clearly communicate whether changes affect students who have already applied.

### 6.4 Drive applicants
- Applicant table with authorized student fields, application date, current status, and available actions.
- Search and filters.
- Bulk updates should be avoided in the first version unless carefully validated.
- Status updates require a clear confirmation or controlled selection.
- Record who changed a status and when.
- Restrict resume access and sensitive data.

### 6.5 Reports & analytics
- Metrics: drives, applications, applicants by stage, recorded offers, and optionally branch-level aggregates.
- Define what each metric counts. Distinguish unique students from total applications and offers from selected candidates.
- Filters by time period, drive, department, or graduation year where data supports them.
- CSV export button with permission checks.
- Do not infer a college-wide placement rate from incomplete data; label data coverage and date range.

## 7. Authentication screens

### Sign-in
- Email and password or the selected authentication provider.
- Show/hide password if appropriate.
- Clear validation and authentication errors.
- Link to registration only if self-registration is enabled.
- Do not reveal whether a private account exists through overly specific errors.

### Registration / account activation
The exact flow is an open product decision. For the prototype, use a documented demo account strategy or controlled student registration. Do not let public registration create administrator accounts. Admin accounts must be created through a protected seed/setup process or an authorized administrator.

## 8. Component inventory

Build reusable components for:
- Application shell / sidebar / top bar.
- Page header.
- Summary metric card.
- Status badge.
- Search and filter controls.
- Data table and responsive list.
- Company identity block.
- Placement drive card.
- Eligibility checklist and explanation.
- Application timeline.
- Form field with label, help text, and error.
- Confirmation dialog.
- Toast or inline feedback.
- Empty state.
- Loading skeleton.
- Error state.
- Pagination.
- Chart container with title, legend, and text summary.

## 9. Interaction states

Every data-driven page should have:
- Loading state.
- Successful state.
- Empty state.
- Validation error state.
- Permission-denied state.
- Not-found state.
- Recoverable server-error state.

Disable repeated submission while a request is in progress, but still enforce duplicate protection on the server.

## 10. Accessibility

- Use semantic headings and landmarks.
- Associate form labels with controls.
- Make all actions keyboard accessible.
- Show visible focus indicators.
- Ensure sufficient text contrast.
- Announce form errors and relevant status updates accessibly.
- Avoid using only red/green color to communicate eligibility or application status.
- Respect reduced-motion preferences if animations are included.

## 11. Content and tone

Use concise, plain language:
- “Application submitted”
- “Deadline: 12 November”
- “Eligibility could not be confirmed — add your graduation year”
- “Drive closed”
- “No applications yet”

Avoid misleading labels such as “Guaranteed eligible,” “Guaranteed placement,” or “Best candidate.” The system supports administration and tracking; it does not guarantee employment outcomes.

## 12. Demo data and visual integrity

Use fictional names and companies in screenshots and local seed data. Clearly mark seeded data as demo data. Do not present fabricated statistics as actual college results.

## 13. UI acceptance checklist

- Student and admin layouts are visually consistent but role-appropriate.
- Desktop and mobile layouts are usable.
- Navigation highlights the current section.
- Tables have loading, empty, error, and populated states.
- Forms provide accessible labels and understandable validation.
- Drive eligibility and application status are clear.
- Dashboard metrics come from actual persisted records.
- No button is decorative or inert; every visible action works or is explicitly marked as coming later.
- The UI never relies on client-side hiding alone for security.
