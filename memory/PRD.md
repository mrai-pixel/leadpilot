# LeadPilot AI — PRD

## Original Problem Statement
Build LeadPilot AI, a premium B2B SaaS "AI Sales Employee" for lead-driven businesses. Core promise: every lead gets contacted, qualified, scored and followed up automatically. Centerpiece workflow: **Lead → AI Call → Conversation → Qualification → Lead Score → CRM Update → Appointment → Follow-up.** Demo business: UrbanNest Realty (real estate, Gurgaon, premium 3BHK apartments ₹1.5–2.5 Cr).

## User Choices
- AI call: hybrid — scripted conversation flow + AI-generated lead summary (Emergent Universal Key / Claude Sonnet 4.6)
- Auth: simple email/password + one-click "Try Demo Account" (JWT, token in localStorage)
- CSV import: functional
- Theme: dark premium SaaS (Outfit + Manrope + JetBrains Mono; obsidian + amber + electric blue)

## Architecture
- Backend: FastAPI (`/app/backend/server.py`), MongoDB (uuid string ids, ISO datetimes). JWT auth (bcrypt). Emergent LLM key for lead summaries with a deterministic fallback.
- Frontend: React (CRA + craco, `@/` alias), react-router, shadcn/ui, lucide-react, sonner, framer-motion. Dark theme via CSS vars in index.css.
- Routes: `/` landing, `/login`, `/app` (protected shell) → dashboard, leads, leads/:id, pipeline, agent, appointments, calls, settings.

## Data Models
User, Organization (with demo_metrics), Agent, Lead (score, temperature, extracted fields, star_demo), Call (transcript/summary/outcome/score), Appointment, FollowUp, Activity.

## Implemented (2026-08-29)
- Auth: register/login/demo one-click + /auth/me; demo account demo@urbannest.ai / demo1234.
- Seed: UrbanNest org, 22 leads across all stages, 15+ calls, 8 appointments, follow-ups, 25+ activities. Rahul Sharma = star demo lead (starts CONTACTED/42, empty extracted info).
- Landing page (hero call card, problem, how-it-works, features, impact, CTA).
- Dashboard: 6 KPI cards, AI Sales Employee ACTIVE card, activity feed, lead funnel, hot leads, business impact panel (Demo/Estimated labels).
- Leads CRM table with 11 filters + search + Add Lead + functional CSV import.
- Lead profile: AI score meter + breakdown, AI summary, extracted info, conversation history + transcript modal.
- **Killer feature — Start AI Call**: progressive scripted conversation with typing indicators → persists real state changes. Rahul → 91/100 HOT, status APPOINTMENT, appointment Saturday 11:30 AM Site Visit, follow-up, activities, LLM summary. All persist across refresh.
- Pipeline Kanban (7 columns, drag-and-drop), Appointments (grouped by day), Calls (history + summary/transcript modal), AI Sales Agent (editable config, Demo Call Mode), Settings.
- Testing: backend 25/25 pytest; frontend 100% of tested flows incl. killer flow + persistence.

## Backlog
- P1: scope list endpoints (appointments/calls/activities/lead-by-id) to organization_id (multi-tenancy/IDOR).
- P2: brute-force lockout on login; status enum validation + 404 on stage update; split server.py into modules.
- P2 (later, explicitly deferred): real telephony/WhatsApp/SMS/email, billing, advanced analytics, native mobile.
