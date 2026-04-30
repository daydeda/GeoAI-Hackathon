# GeoAI Hackathon Portal

GeoAI Hackathon Portal is a professional, full-stack competition management platform for team registration, proposal submission, moderator screening, judge evaluation, and official finalist operations.

## Version Matrix

| Scope | Current Version | Status |
|---|---:|---|
| **Project (Monorepo)** | **3.14.0** | **Stable (Latest)** |
| Frontend (Next.js) | 3.14.0 | Production |
| Backend (Fastify + Prisma) | 3.14.0 | Production |

---

## v3.14.0 Highlights (Current Stable)

This version represents the finalized competition logic and security hardening for the AGRI-DISASTER AI HACKATHON.

### ⚖️ Evaluation & Decision Engine
- **Point-Based Rubric**: Fully implemented the 50-point scoring system (5/5/30/10).
- **Judge Decision Workflow**: Enabled explicit "Mark as Finalist" and "Mark as Disqualified" actions within the Judge portal.
- **Decision Safeguard**: Critical integrity logic implemented to lock final team status during subsequent score modifications.
- **Internal Consensus**: Enabled inter-judge visibility for scores and comments to support informed final decisions.

### 🔒 Privacy & Data Protection
- **Competitor Privacy**: Strict API filtering to ensure internal Moderator Status, Internal Notes, and Judge Feedback remain hidden from competitors until official announcement.
- **Audit Logging**: Comprehensive tracking for all status transitions and scoring activities.

### 📋 Official Documentation
- **TOR/SRS v3.14.0**: Fully aligned with the codebase, detailing all functional requirements and business rules (Ref: `TOR_SRS_Thai.md`).

---

## Deployment (Production)

To deploy the production environment using the latest stable build:

```bash
sudo docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

*Note: Persistent data is stored in the `postgres_data_prod` named volume. Configuration for deadlines and phases is managed via the Admin Dashboard.*

---
© 2026 GeoAI Hackathon Team. All rights reserved.
