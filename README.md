# GeoAI Hackathon Portal

GeoAI Hackathon Portal is a full-stack competition platform for team registration, proposal submission, moderation, judge scoring, finalist operations, and admin governance.

## Version Matrix

| Scope | Current Version | Notes |
|---|---:|---|
| Project (Monorepo) | 1.9.0 | Deadline governance + judge PDF viewer + competitor validation updates, admin/export and moderator UX updates |
| Frontend (Next.js) | 1.9.0 | Dynamic phase sync, countdown refactor, announcement feedback view, branding update, landing Quick Guide, moderator team overview |
| Backend (Fastify + Prisma) | 1.9.0 | Global phase API, Student ID optional onboarding, team upload gate on missing IDs, exporter enhancements and GISTDA parsing fix |

## Project Evolution

### v1.0.0 - Initial Competition Platform
- OAuth authentication and role-based access (Competitor, Moderator, Judge, Admin).
- Team lifecycle: create/join team, invite code, member roster.
- Proposal pipeline: PDF upload with version history.
- Core dashboards and themed hackathon UI.

### v1.1.0 - Review and Governance Baseline
- Moderator pre-screening and team status transitions.
- Judge rubric scoring with weighted aggregation.
- Admin command center for users, teams, and exports.
- Audit logging for critical actions.

### v1.2.0 - Operations Hardening
- Submission lock after judging.
- Finalist permission-letter generation workflow.
- Expanded user/team profile data and upload controls.
- Stability and UX improvements across dashboards.

### v1.3.0 - Competition Portal Enhancements (Current)
- Judge Module:
  - Embedded PDF proposal viewer in Judge dashboard.
  - Full-screen modal PDF viewer to avoid file download workflow.
- Competitor Module:
  - Announcement-phase view now emphasizes Judge Notes/Feedback.
  - Raw score/judge count hidden in announcement feedback card.
  - Student ID is now optional in onboarding/profile completion.
  - Proposal upload now validates all team members for Student ID presence.
  - Upload is blocked with explicit member names if profiles are incomplete.
- Admin Module:
  - New global Phase Deadline Management page.
  - Admin updates now sync current phase and countdown targets across UI.
  - Landing-page protocol timeline now follows the same global phase data.
- UI/UX:
  - Dashboard countdown refactored to strict format: DD : HH : MM : SS.
- Branding:
  - Legacy institution references updated to KMUTT.
  - Institutional/partner logo slots updated and wired in landing page.

### v1.9.0 - Feature & Bugfix Release (2026-04-10)

- Landing page: Added a concise "Quick Guide" to help competitors sign in and submit (starts with Sign-in with Google).
- Moderator dashboard: Added Team Information Overview above Protocol Timeline with member previews and Student ID photo preview links; added server-backed pagination to the overview.
- Admin: Added competitor export (competitors.xlsx) and displayed Registration Date + Registration Time in the users table.
- Backend exporter: Added "Modified Date + Time" to Team CSV and Proposals XLSX, export now selects latest submission per team to reflect DB state.
- Bugfix: Hardened GISTDA declaration parsing to accept common multipart/form truthy values and numeric forms to prevent false negatives in exports.


## Sub-Project Changelogs

## Frontend (Next.js) Timeline

### frontend v1.0.0
- Landing page, login flow, and primary competitor pages.
- Team and submission UX foundation.

### frontend v1.1.0
- Moderator/Judge/Admin interfaces with role-aware navigation.
- Rubric scoring forms and status cards.

### frontend v1.2.0
- Submission version history and improved dashboard structure.
- Enhanced audit log and admin data tables.

### frontend v1.3.0 (Current)
- Added phase sync hook to consume backend global deadlines.
- Judge PDF embedded iframe and full-screen modal viewer.
- Competitor announcement feedback section and raw score hiding.
- New admin deadlines page and sidebar integration.
- Countdown formatting update to DD : HH : MM : SS.
- KMUTT branding and logo asset integration.

## Backend (Fastify + Prisma) Timeline

### backend v1.0.0
- OAuth auth routes and role assignment bootstrap.
- Team and submission APIs.

### backend v1.1.0
- Moderator and judge endpoints with score aggregation.
- Admin management routes and audit logs.

### backend v1.2.0
- Submission lock checks tied to scoring state.
- Export/document workflows and permission-letter generation.

### backend v1.3.0 (Current)
- Added phase configuration service persisted in data/phase-config.json.
- Added GET /api/v1/phases for platform-wide phase reads.
- Added PUT /api/v1/admin/phases for global deadline updates.
- Submission deadline checks now use configurable proposal phase date.
- Student ID onboarding requirement removed from first-time profile completion.
- Submission upload now enforces Student ID completeness for all team members.

## API Additions in v1.3.0

- GET /api/v1/phases
  - Returns current global phase timeline and deadlines.
- PUT /api/v1/admin/phases
  - Admin/Moderator endpoint to update one or more phase deadlines.

## Phase Configuration Storage

- File: backend/data/phase-config.json
- Behavior:
  - Auto-created from defaults on first backend run.
  - Updated by admin API.
  - Used by frontend phase sync and submission deadline guard.

## Notes for Branding Assets

Landing page now uses these logo paths in frontend/public/logos:
- kmutt.svg
- kmitl.svg
- esri.svg
- gistda.svg
- etda.svg

## Recent Work (2026-04-05)

- Implemented live auto-refresh for the Submissions and Team views using polling and refetch-on-focus/visibility to keep UI state up to date.
- Made `useAlert` safe when an `AlertProvider` is not present to reduce runtime errors during server prerender.
- Added an explicit `global-error` page and split some admin pages into a server wrapper plus a client component to avoid client-hook usage during prerender.
- Adjusted `next.config.js` and the frontend build script to use Webpack while diagnosing prerender/build issues.
- Note: there remains a prerender-time crash related to Next internals for `/_global-error` observed during local builds; further environment/toolchain alignment (Node/Next/React) may be required to fully resolve that.

