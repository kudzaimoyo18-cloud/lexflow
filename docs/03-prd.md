# LexFlow — Product Requirements (v1: Revenue Front Door)

## One-liner
AI-native operating system for solo & small law firms that answers every lead in under 60 seconds and turns it into a signed, paying client — automatically.

## Problem
35% of inquiries to law firms never get a response; average response time is 17–42 hours; 79% of clients hire the first firm that responds. The average multi-attorney firm loses $200k+/year at the front door, then loses another 10–17% of worked time to unbilled/written-off hours. Existing tools are either fragmented point solutions or expensive suites with AI bolted on.

## Target user
- Buyer: managing partner / solo practitioner, 1–10 lawyer firm.
- Daily users: lawyers + 0–2 admin staff.
- Practice areas first: family, immigration, personal injury, criminal defense, general practice (consumer-facing = highest intake pain, lowest realization).

## Success metrics (per-firm, visible in-app)
1. Median lead response time < 60s (baseline: hours)
2. Lead -> consult conversion +30%
3. Consult -> signed engagement < 24h (baseline: days)
4. North star: **additional signed clients per month attributable to LexFlow** — shown on the dashboard as money.

## V1 scope (MUST)
1. **Omnichannel lead capture** — embeddable web form, email parsing, AI phone receptionist (Twilio), WhatsApp/SMS.
2. **AI intake agent** — conversational qualification using firm-configured practice areas, fee minimums, screening questions. Tone configurable. Never gives legal advice (hard guardrail + disclaimer).
3. **Conflict check** — automatic search of contacts/matters on every new party; lawyer clears hits.
4. **Scheduling** — calendar sync, booking pages, reminders, no-show recovery sequence.
5. **Engagement automation** — template-based letter generation, one-click lawyer approval, built-in e-signature, retainer payment via Stripe; signed+paid auto-opens matter.
6. **Lightweight matter hub** — matter record, notes, docs, tasks from matter-type playbooks, client portal (status visibility kills "any update?" calls).
7. **Pipeline dashboard** — leads by stage, response times, conversion, revenue captured.

## V1 explicitly OUT
Time tracking/billing (v2), AI document drafting (v3), trust accounting, court e-filing, native mobile apps (responsive web first).

## Guardrails (legal-ethics by design)
- AI never gives legal advice; intake messages carry "no attorney-client relationship" language (configurable per firm).
- Engagement letters always require explicit lawyer approval.
- Full audit log of every AI action.
- Data: per-firm isolation, encryption at rest/in transit, export-everything (no lock-in fear), data residency options later.
- Privilege-aware: intake data flagged confidential by default.

## Pricing hypothesis
- Flat **$99/firm/month (up to 3 users)**, then $29/user — undercuts a Clio+Lawmatics stack ($138+/user) and is dead simple. 14-day trial, no card. Annual = 2 months free.
- Positioning: "It pays for itself with one saved client."

## Tech stack (proposed, matches existing skill set)
- Next.js + TypeScript, Supabase (Postgres, RLS for firm isolation, auth, storage), Trigger.dev for workflow jobs/sequences, Claude API for intake agent + drafting, Twilio (voice/SMS) + WhatsApp Business, Stripe (billing + retainers).
- AI architecture: tool-using agent with per-firm config; every outbound artifact goes through approve-or-auto rules engine.

## Build phases
| Phase | Weeks | Deliverable |
|-------|-------|-------------|
| 0 | 1 | Design system, schema, firm onboarding flow |
| 1 | 2–4 | Web-form + email capture, AI qualification, pipeline board |
| 2 | 5–6 | Scheduling + reminders + conflict check |
| 3 | 7–9 | Engagement letters + e-sign + Stripe retainers + auto matter open |
| 4 | 10–12 | AI phone receptionist + WhatsApp, client portal, dashboard polish |
| Beta | 13+ | 5–10 design-partner firms, free 3 months for feedback |

## Validation before heavy build (recommended)
Interview 5–10 small-firm lawyers with research deck; confirm: (a) intake pain is top-3, (b) would pay ~$99/mo, (c) trust an AI to do first response. Adjust wedge if signal weak.

## Open questions
1. First beachhead geography for design partners (matters for payment rails + templates).
2. AI receptionist voice: build on Twilio + Claude vs partner with existing voice-agent platform.
3. Brand name — "LexFlow" placeholder; check trademark.
