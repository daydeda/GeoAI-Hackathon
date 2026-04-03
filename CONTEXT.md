# Software Requirements Specification (SRS)

## GEOAI Hackathon Platform

Version: 1.1  
Date: 2026-04-02  
Status: Build-Ready Baseline

## 1. Purpose and Scope
The GEOAI Hackathon Platform is a web system to manage the full competition lifecycle:
1. Google-only identity authentication.
2. Team registration and invite flow.
3. Proposal submission and revision.
4. Moderator pre-screening.
5. Judge scoring with rubric and weighted aggregation.
6. Admin operations, exports, and final status control.
7. Automatic finalist document generation in PDF.

The project-specific event scope is AGRI-DISASTER AI HACKATHON with mandatory GISTDA Sphere usage declaration and track-based submission.

## 2. Stakeholders
1. Organizers (Admin team)
2. Moderators
3. Judges
4. Competitors (team leaders and members)
5. External reviewers (read-only exports)

## 3. User Roles and Permissions

### 3.1 Roles
1. Competitor
2. Moderator
3. Judge
4. Admin

### 3.2 RBAC Matrix

| Capability | Competitor | Moderator | Judge | Admin |
|---|---:|---:|---:|---:|
| Google login | Yes | Yes | Yes | Yes |
| Create team | Leader only | No | No | Yes |
| Join team via invite | Yes | No | No | No |
| Upload/re-upload proposal | Leader only | No | No | No |
| View all submissions | No | Yes | Passed only | Yes |
| Pre-screen pass/fail | No | Yes | No | Yes |
| Score passed proposals | No | No | Yes | Optional override |
| Manage roles | No | No | No | Yes |
| Promote finalist | No | No | No | Yes |
| Export CSV/XLSX | No | Optional | Optional | Yes |
| Download permission letter | Finalist team only | No | No | Yes |

## 4. Functional Requirements

### 4.1 Authentication and Identity
1. FR-001: System shall support sign in using Google OAuth 2.0 only.
2. FR-002: System shall reject email/password native signup.
3. FR-003: System shall store verified Google profile fields: email, name, avatar, provider id.
4. FR-004: System shall support role assignment by Admin.

Acceptance:
1. User can access protected pages only after OAuth callback and valid session/JWT.
2. Local credential endpoints are absent or disabled.

### 4.2 Team Management
1. FR-010: Team leader can create a team with name, institution, and track preference.
2. FR-011: Team size max is 5 members.
3. FR-012: Team leader can generate invite code/link.
4. FR-013: Invite join is blocked when team is full or registration closed.
5. FR-014: Team leader can remove a member before submission lock.

Acceptance:
1. API rejects join when team has 5 members.
2. Invite code is single team scoped and revocable.

### 4.3 Proposal Submission
1. FR-020: Team leader can upload one active proposal in PDF format.
2. FR-021: File size limit is 20 MB.
3. FR-022: Proposal can be replaced until submission deadline.
4. FR-023: Submission form requires track selection:
  1. Smart Agriculture
  2. Disaster and Flood Response
5. FR-024: Submission form requires GISTDA Sphere usage declaration checkbox.
6. FR-025: System records submission version history and timestamps.

Acceptance:
1. Non-PDF files are rejected with validation error.
2. Submission after deadline returns locked state.

### 4.4 Moderator Pre-screening
1. FR-030: Moderator dashboard lists all submitted proposals with filters.
2. FR-031: Moderator can set status to Pass or Fail with optional note.
3. FR-032: Pass transitions proposal into judge queue.
4. FR-033: Every decision is audit logged.

Acceptance:
1. Judge cannot see non-passed proposals.
2. Audit trail contains actor, time, old status, new status.

### 4.5 Judge Scoring
1. FR-040: Judge dashboard lists only proposals with pre-screen status Passed.
2. FR-041: Rubric includes:
  1. National Impact (highest weight)
  2. Technology and Methodology
  3. Requirement Compliance (GISTDA Sphere)
  4. Feasibility
3. FR-042: Each criterion stores numeric score and judge comment.
4. FR-043: System aggregates multi-judge scores using weighted average.
5. FR-044: System shows per-criterion and total aggregated score.

Suggested default weights:
1. National Impact: 0.40
2. Technology and Methodology: 0.30
3. Requirement Compliance: 0.15
4. Feasibility: 0.15

### 4.6 Admin Operations
1. FR-050: Admin can assign/revoke Moderator and Judge roles.
2. FR-051: Admin can override team and proposal statuses.
3. FR-052: Admin can mark team as Onsite Finalist.
4. FR-053: Admin can export users, teams, submissions, and scores to CSV/XLSX.
5. FR-054: Admin can view full audit logs.

### 4.7 Finalist Document Generation
1. FR-060: When team status changes to Onsite Finalist, permission letter download is unlocked.
2. FR-061: Letter PDF is generated from an official template.
3. FR-062: PDF includes all team member names and generated official signature/stamp layer.
4. FR-063: Generated documents are versioned and downloadable by eligible users.

Acceptance:
1. Non-finalist teams cannot access download endpoint.
2. Generated PDF contains complete member list and event metadata.

### 4.8 Public Pages and Resources
1. FR-070: Landing page includes sponsor section: KMITL, ESRI, GISTDA, KMUTNB, ETDA.
2. FR-071: Landing page includes two competition tracks.
3. FR-072: Landing page includes full timeline and final pitching round of 15 minutes.
4. FR-073: Logged-in resources portal includes GISTDA Sphere base map guide/API links.
5. FR-074: Resources portal includes curated open datasets and GIS layer links.

## 5. Data Model (Relational)

### 5.1 Core Entities
1. users
2. roles
3. user_roles
4. teams
5. team_members
6. invites
7. submissions
8. submission_files
9. moderator_reviews
10. judge_scores
11. score_aggregates
12. team_status_history
13. documents
14. exports
15. audit_logs

### 5.2 Key Fields
1. users:
  1. id (uuid pk)
  2. email (unique)
  3. full_name
  4. oauth_provider (google)
  5. oauth_subject
  6. created_at
2. teams:
  1. id
  2. name
  3. leader_user_id
  4. current_status (draft, submitted, pre_screen_passed, judged, finalist, rejected)
  5. track
3. submissions:
  1. id
  2. team_id
  3. version
  4. file_url
  5. file_size_bytes
  6. mime_type
  7. gistda_declared (bool)
  8. submitted_at
4. judge_scores:
  1. id
  2. submission_id
  3. judge_user_id
  4. national_impact_score
  5. technology_methodology_score
  6. requirement_compliance_score
  7. feasibility_score
  8. comments
5. documents:
  1. id
  2. team_id
  3. type (permission_letter)
  4. file_url
  5. generated_at

## 6. API Surface (v1)

### 6.1 Auth
1. GET /api/v1/auth/google/start
2. GET /api/v1/auth/google/callback
3. POST /api/v1/auth/logout
4. GET /api/v1/auth/me

### 6.2 Team and Invite
1. POST /api/v1/teams
2. GET /api/v1/teams/my
3. POST /api/v1/teams/{teamId}/invites
4. POST /api/v1/invites/{code}/join
5. DELETE /api/v1/teams/{teamId}/members/{userId}

### 6.3 Submission
1. POST /api/v1/teams/{teamId}/submissions
2. PUT /api/v1/submissions/{submissionId}
3. GET /api/v1/submissions/{submissionId}

### 6.4 Moderator
1. GET /api/v1/mod/submissions
2. POST /api/v1/mod/submissions/{submissionId}/review

### 6.5 Judge
1. GET /api/v1/judge/submissions
2. POST /api/v1/judge/submissions/{submissionId}/scores
3. GET /api/v1/judge/submissions/{submissionId}/aggregate

### 6.6 Admin
1. POST /api/v1/admin/users/{userId}/roles
2. DELETE /api/v1/admin/users/{userId}/roles/{role}
3. PATCH /api/v1/admin/teams/{teamId}/status
4. POST /api/v1/admin/exports

### 6.7 Document Generation
1. POST /api/v1/teams/{teamId}/documents/permission-letter/generate
2. GET /api/v1/teams/{teamId}/documents/permission-letter

## 7. Non-Functional Requirements
1. NFR-001 Performance: support 500 concurrent users and maintain acceptable response times during deadline rush.
2. NFR-002 Availability: target 99.5 percent uptime during event week.
3. NFR-003 Upload limit: max 20 MB per PDF submission.
4. NFR-004 Security: OAuth-only login, role-based authorization, signed URLs for files.
5. NFR-005 Auditability: all role changes, status updates, and scoring edits logged.
6. NFR-006 Observability: structured logs, request tracing, and dashboard metrics.

Suggested SLO targets:
1. p95 API response under 800 ms for read operations.
2. p95 upload completion under 8 seconds for 20 MB on standard broadband.

## 8. UX and UI Direction (From Reference Screens)
1. Visual language: dark command-center style with high-contrast cyan accents and compact data-heavy cards.
2. Information hierarchy: left navigation rail, top context bar, central mission panel.
3. Critical widgets:
  1. Countdown timer to submission deadline.
  2. Step/progress checklist for mission completion.
  3. Status badges for pass/fail/pending/finalist.
4. Judge workspace: split layout with queue panel, proposal viewer summary, and rubric scorer.
5. Admin workspace: management table with quick actions and export controls.
6. Accessibility:
  1. Keyboard navigation for table actions and scoring form.
  2. Contrast ratio compliant for text and status badges.

## 9. Dockerized Deployment Requirements

### 9.1 Compose Services
1. frontend: Next.js container
2. backend: API plus PDF generation service
3. db: PostgreSQL or MySQL
4. storage: optional MinIO/local object store

### 9.2 Environment and Secrets
1. All runtime config in .env files.
2. No hardcoded keys in source code.
3. Separate env sets for local/staging/production.

### 9.3 Persistence
1. Persistent volume for database data.
2. Persistent volume or S3-compatible bucket for uploaded files and generated docs.

### 9.4 Image and Security
1. Multi-stage Dockerfile for frontend and backend.
2. Non-root runtime user in containers.
3. Minimal base images and locked dependency versions.

## 10. Suggested Implementation Stack
1. Frontend: Next.js, React, TailwindCSS
2. Backend: Node.js (Express/Fastify) or FastAPI
3. Database: PostgreSQL
4. Storage: S3-compatible (MinIO for local)
5. Queue (optional): Redis for async PDF/export jobs

## 11. Milestones
1. M1 Foundation
  1. OAuth login, RBAC, team management
2. M2 Submission
  1. Upload, versioning, deadline lock, resource portal
3. M3 Review and Scoring
  1. Moderator flow, judge rubric, aggregation
4. M4 Admin and Exports
  1. Role management, status control, CSV/XLSX
5. M5 Finalist Docs and Hardening
  1. PDF generation, audit logs, load test, UAT

## 12. Definition of Done
1. All FR and NFR acceptance checks pass.
2. Docker Compose up brings all required services online.
3. End-to-end flow verified:
  1. Google login -> team creation -> proposal upload
  2. moderator pass/fail -> judge scoring -> admin finalist
  3. finalist permission letter generated and downloadable
4. Export files validated by organizers.
5. Security and load smoke tests completed.
