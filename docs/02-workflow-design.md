# LexFlow — Workflow Design

The product is built around one spine: **Inquiry -> Signed Client -> Active Matter -> Paid Invoice**, with AI doing every step a human does not legally need to do.

## The automated workflow (v1: Revenue Front Door)

```
        [Lead arrives: web form / phone / email / WhatsApp / referral]
                              |
                              v
              (1) INSTANT RESPONSE  — < 60 seconds, 24/7
       AI receptionist answers/replies, in the firm's voice.
       Captures: name, contact, matter type, urgency, other party.
                              |
                              v
              (2) QUALIFICATION + CONFLICT CHECK
       AI screens against firm's practice areas & fee minimums.
       Auto conflict check against existing contacts/matters.
       Output: QUALIFIED / REFER OUT / CONFLICT — lawyer notified.
                              |
                              v
              (3) CONSULT SCHEDULING
       Qualified lead gets booking link (synced calendar),
       reminders via email/SMS/WhatsApp. No-show follow-up automatic.
                              |
                              v
              (4) HUMAN MOMENT: the consultation
       Lawyer talks. AI pre-briefs lawyer with intake summary.
       (Optional) consult notes captured -> matter file.
                              |
                              v
              (5) ENGAGEMENT — same day, zero admin
       AI drafts engagement letter from firm template
       (matter type, scope, fee). Lawyer approves with one click.
       E-signature + retainer payment request sent together.
                              |
                              v
              (6) MATTER OPENED AUTOMATICALLY
       Signed + paid -> matter created, folder structure,
       deadlines/tasks from matter-type playbook, client portal opened.
                              |
                              v
        [v2 spine continues: time capture -> billing -> collections]
```

## Where the human stays in the loop (non-negotiable)

| Step | Human action | Why |
|------|-------------|-----|
| Qualification edge cases | Review "unsure" pile | Ethics/judgment |
| Conflict hits | Lawyer clears or declines | Professional responsibility |
| Engagement letter | One-click approve (never auto-send) | It is a legal contract |
| Legal advice | Always the lawyer | AI never advises clients |

Design rule: **AI drafts, human approves, system executes.** This keeps us out of unauthorized-practice-of-law territory in every jurisdiction and makes lawyers trust the product.

## v2 module: Money Engine

- Passive time capture: watches calendar, email, phone, documents; drafts time entries for approval (attacks the 83% realization problem).
- Invoice automation: draft -> approve -> send; payment links; trust/retainer drawdown tracking.
- Collections autopilot: polite escalating reminders; cuts the 93-day lockup.

## v3 module: Document Engine

- Firm template library -> AI drafting with matter context (it already knows the client, parties, facts from intake).
- Clause library + review/redline assist.
- This is where intake data compounds: competitors bolt AI onto empty documents; ours starts pre-filled.

## Jurisdiction strategy (global-first)

Core spine is jurisdiction-neutral: intake, scheduling, e-sign, payments, matters, time, billing. Jurisdiction-specific bits are **configuration, not code**: engagement letter templates, conflict rules, court deadline packs, payment rails (Stripe default; pluggable for regional rails). Launch English-first; architecture must not assume US (date formats, currencies, VAT, multi-currency from day one).

## Integration surface (v1 minimum)

- Calendars: Google / Outlook
- Email: Gmail / Microsoft 365
- Phone/SMS: Twilio (AI receptionist), WhatsApp Business API
- Payments: Stripe (+ pluggable rails later)
- E-signature: built-in (cheaper than DocuSign dependency)
- Migration: CSV import from Clio/MyCase exports
