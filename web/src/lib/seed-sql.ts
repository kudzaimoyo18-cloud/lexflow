// Driver-agnostic demo seed: replays the demo dataset as INSERT statements.
import { seed } from "./demo-seed";

type Exec = (sql: string, params: unknown[]) => Promise<void>;

export async function seedSql(exec: Exec): Promise<void> {
  const d = seed();
  const f = d.firm;
  await exec(
    "insert into firms (id, name, slug, practice_areas, fee_minimum_cents, intake_greeting, ai_tone, disclaimer, timezone, currency, plan) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [f.id, f.name, f.slug, JSON.stringify(f.practiceAreas), f.feeMinimumCents, f.intakeGreeting, f.aiTone, f.disclaimer, f.timezone, f.currency, f.plan]
  );
  for (const p of d.profiles) {
    await exec("insert into profiles (id, firm_id, full_name, email, role) values (?, ?, ?, ?, ?)", [p.id, p.firmId, p.fullName, p.email, p.role]);
  }
  for (const c of d.contacts) {
    await exec("insert into contacts (id, firm_id, kind, full_name, email, phone, notes) values (?, ?, ?, ?, ?, ?, ?)", [c.id, c.firmId, c.kind, c.fullName, c.email ?? null, c.phone ?? null, c.notes ?? null]);
  }
  for (const l of d.leads) {
    await exec(
      "insert into leads (id, firm_id, full_name, email, phone, channel, matter_type, matter_summary, other_parties, urgency, stage, qualification, qualification_reason, ai_summary, estimated_value_cents, declined_reason, first_response_seconds, consult_at, assigned_to, converted_matter_id, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [l.id, l.firmId, l.fullName ?? null, l.email ?? null, l.phone ?? null, l.channel, l.matterType ?? null, l.matterSummary ?? null, JSON.stringify(l.otherParties), l.urgency ?? null, l.stage, l.qualification ?? null, l.qualificationReason ?? null, l.aiSummary ?? null, l.estimatedValueCents ?? null, l.declinedReason ?? null, l.firstResponseSeconds ?? null, l.consultAt ?? null, l.assignedTo ?? null, l.convertedMatterId ?? null, l.createdAt, l.updatedAt]
    );
  }
  for (const m of d.messages) {
    await exec("insert into intake_messages (id, firm_id, lead_id, sender, body, created_at) values (?, ?, ?, ?, ?, ?)", [m.id, m.firmId, m.leadId, m.sender, m.body, m.createdAt]);
  }
  for (const c of d.conflicts) {
    await exec(
      "insert into conflict_checks (id, firm_id, lead_id, party_name, status, matched_contact_id, matched_contact_name, similarity, resolved_by, resolved_at, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [c.id, c.firmId, c.leadId, c.partyName, c.status, c.matchedContactId ?? null, c.matchedContactName ?? null, c.similarity ?? null, c.resolvedBy ?? null, c.resolvedAt ?? null, c.createdAt]
    );
  }
  for (const t of d.templates) {
    await exec("insert into engagement_templates (id, firm_id, name, matter_type, body_md, default_fee_structure) values (?, ?, ?, ?, ?, ?)", [t.id, t.firmId, t.name, t.matterType ?? null, t.bodyMd, t.defaultFeeStructure]);
  }
  for (const l of d.letters) {
    await exec(
      "insert into engagement_letters (id, firm_id, lead_id, template_id, body_md, fee_structure, fee_amount_cents, retainer_amount_cents, status, approved_by, approved_at, sent_at, signed_at, signer_name, whop_checkout_url, payment_status, paid_at, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [l.id, l.firmId, l.leadId, l.templateId ?? null, l.bodyMd, l.feeStructure ?? null, l.feeAmountCents ?? null, l.retainerAmountCents ?? null, l.status, l.approvedBy ?? null, l.approvedAt ?? null, l.sentAt ?? null, l.signedAt ?? null, l.signerName ?? null, l.whopCheckoutUrl ?? null, l.paymentStatus, l.paidAt ?? null, l.createdAt]
    );
  }
  for (const m of d.matters) {
    await exec(
      "insert into matters (id, firm_id, lead_id, client_contact_id, title, matter_type, status, opened_at, responsible) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [m.id, m.firmId, m.leadId ?? null, m.clientContactId ?? null, m.title, m.matterType ?? null, m.status, m.openedAt, m.responsible ?? null]
    );
  }
  for (const t of d.tasks) {
    await exec(
      "insert into matter_tasks (id, firm_id, matter_id, title, due_at, status, assigned_to, source) values (?, ?, ?, ?, ?, ?, ?, ?)",
      [t.id, t.firmId, t.matterId, t.title, t.dueAt ?? null, t.status, t.assignedTo ?? null, t.source]
    );
  }
  for (const a of d.audit) {
    await exec(
      "insert into audit_log (firm_id, actor, action, entity, entity_id, detail, created_at) values (?, ?, ?, ?, ?, ?, ?)",
      [a.firmId, a.actor, a.action, a.entity, a.entityId ?? null, a.detail ? JSON.stringify(a.detail) : null, a.createdAt]
    );
  }
}