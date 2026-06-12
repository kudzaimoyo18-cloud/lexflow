// Data access layer — async, driver-agnostic (Neon Postgres in prod,
// SQLite locally; see query.ts).
import { q, qOne, type Row } from "./query";
import type {
  Firm, Profile, Contact, Lead, IntakeMessage, ConflictCheck,
  EngagementTemplate, EngagementLetter, Matter, MatterTask, AuditEntry, Stage,
} from "./types";

const now = () => new Date().toISOString();
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;

const s = (v: unknown) => (v == null ? undefined : String(v));
const n = (v: unknown) => (v == null ? undefined : Number(v));

function rowToFirm(r: Row): Firm {
  return {
    id: String(r.id), name: String(r.name), slug: String(r.slug),
    practiceAreas: JSON.parse(String(r.practice_areas)) as string[],
    feeMinimumCents: r.fee_minimum_cents == null ? null : Number(r.fee_minimum_cents),
    intakeGreeting: String(r.intake_greeting ?? ""),
    aiTone: String(r.ai_tone) as Firm["aiTone"],
    disclaimer: String(r.disclaimer), timezone: String(r.timezone),
    currency: String(r.currency), plan: String(r.plan) as Firm["plan"],
  };
}

function rowToLead(r: Row): Lead {
  return {
    id: String(r.id), firmId: String(r.firm_id),
    fullName: s(r.full_name), email: s(r.email), phone: s(r.phone),
    channel: String(r.channel) as Lead["channel"],
    matterType: s(r.matter_type), matterSummary: s(r.matter_summary),
    otherParties: JSON.parse(String(r.other_parties)) as string[],
    urgency: s(r.urgency) as Lead["urgency"],
    stage: String(r.stage) as Stage,
    qualification: s(r.qualification) as Lead["qualification"],
    qualificationReason: s(r.qualification_reason),
    aiSummary: s(r.ai_summary),
    estimatedValueCents: n(r.estimated_value_cents),
    declinedReason: s(r.declined_reason),
    firstResponseSeconds: n(r.first_response_seconds),
    consultAt: s(r.consult_at), assignedTo: s(r.assigned_to),
    convertedMatterId: s(r.converted_matter_id),
    createdAt: String(r.created_at), updatedAt: String(r.updated_at),
  };
}

function rowToMessage(r: Row): IntakeMessage {
  return {
    id: String(r.id), firmId: String(r.firm_id), leadId: String(r.lead_id),
    sender: String(r.sender) as IntakeMessage["sender"],
    body: String(r.body), createdAt: String(r.created_at),
  };
}

function rowToConflict(r: Row): ConflictCheck {
  return {
    id: String(r.id), firmId: String(r.firm_id), leadId: String(r.lead_id),
    partyName: String(r.party_name),
    status: String(r.status) as ConflictCheck["status"],
    matchedContactId: s(r.matched_contact_id),
    matchedContactName: s(r.matched_contact_name),
    similarity: n(r.similarity),
    resolvedBy: s(r.resolved_by), resolvedAt: s(r.resolved_at),
    createdAt: String(r.created_at),
  };
}

function rowToTemplate(r: Row): EngagementTemplate {
  return {
    id: String(r.id), firmId: String(r.firm_id), name: String(r.name),
    matterType: s(r.matter_type), bodyMd: String(r.body_md),
    defaultFeeStructure: String(r.default_fee_structure) as EngagementTemplate["defaultFeeStructure"],
  };
}

function rowToLetter(r: Row): EngagementLetter {
  return {
    id: String(r.id), firmId: String(r.firm_id), leadId: String(r.lead_id),
    templateId: s(r.template_id), bodyMd: String(r.body_md),
    feeStructure: s(r.fee_structure),
    feeAmountCents: n(r.fee_amount_cents),
    retainerAmountCents: n(r.retainer_amount_cents),
    status: String(r.status) as EngagementLetter["status"],
    approvedBy: s(r.approved_by), approvedAt: s(r.approved_at),
    sentAt: s(r.sent_at), signedAt: s(r.signed_at), signerName: s(r.signer_name),
    whopCheckoutUrl: s(r.whop_checkout_url),
    paymentStatus: String(r.payment_status) as EngagementLetter["paymentStatus"],
    paidAt: s(r.paid_at), createdAt: String(r.created_at),
  };
}

function rowToMatter(r: Row): Matter {
  return {
    id: String(r.id), firmId: String(r.firm_id),
    leadId: s(r.lead_id), clientContactId: s(r.client_contact_id),
    title: String(r.title), matterType: s(r.matter_type),
    status: String(r.status) as Matter["status"],
    openedAt: String(r.opened_at), responsible: s(r.responsible),
  };
}

function rowToTask(r: Row): MatterTask {
  return {
    id: String(r.id), firmId: String(r.firm_id), matterId: String(r.matter_id),
    title: String(r.title), dueAt: s(r.due_at),
    status: String(r.status) as MatterTask["status"],
    assignedTo: s(r.assigned_to),
    source: String(r.source) as MatterTask["source"],
  };
}

function rowToContact(r: Row): Contact {
  return {
    id: String(r.id), firmId: String(r.firm_id),
    kind: String(r.kind) as Contact["kind"],
    fullName: String(r.full_name),
    email: s(r.email), phone: s(r.phone), notes: s(r.notes),
  };
}

export async function audit(actor: string, action: string, entity: string, entityId?: string, detail?: Record<string, unknown>) {
  const firm = await getFirm();
  await q(
    "insert into audit_log (firm_id, actor, action, entity, entity_id, detail, created_at) values (?, ?, ?, ?, ?, ?, ?)",
    [firm.id, actor, action, entity, entityId ?? null, detail ? JSON.stringify(detail) : null, now()]
  );
}

// ---------- reads ----------
export async function getFirm(): Promise<Firm> {
  return rowToFirm((await qOne("select * from firms limit 1"))!);
}

export async function getProfiles(): Promise<Profile[]> {
  return (await q("select * from profiles")).map((r) => ({
    id: String(r.id), firmId: String(r.firm_id), fullName: String(r.full_name),
    email: String(r.email), role: String(r.role) as Profile["role"],
  }));
}

export async function listLeads(): Promise<Lead[]> {
  return (await q("select * from leads order by created_at desc")).map(rowToLead);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const r = await qOne("select * from leads where id = ?", [id]);
  return r ? rowToLead(r) : undefined;
}

export async function listMessages(leadId: string): Promise<IntakeMessage[]> {
  return (await q("select * from intake_messages where lead_id = ? order by created_at, id", [leadId])).map(rowToMessage);
}

export async function listConflicts(leadId: string): Promise<ConflictCheck[]> {
  return (await q("select * from conflict_checks where lead_id = ?", [leadId])).map(rowToConflict);
}

export async function listAllConflicts(): Promise<ConflictCheck[]> {
  return (await q("select * from conflict_checks")).map(rowToConflict);
}

export async function listTemplates(): Promise<EngagementTemplate[]> {
  return (await q("select * from engagement_templates")).map(rowToTemplate);
}

export async function getTemplate(id: string): Promise<EngagementTemplate | undefined> {
  const r = await qOne("select * from engagement_templates where id = ?", [id]);
  return r ? rowToTemplate(r) : undefined;
}

export async function getLetterForLead(leadId: string): Promise<EngagementLetter | undefined> {
  const r = await qOne("select * from engagement_letters where lead_id = ? order by created_at desc limit 1", [leadId]);
  return r ? rowToLetter(r) : undefined;
}

export async function getLetter(id: string): Promise<EngagementLetter | undefined> {
  const r = await qOne("select * from engagement_letters where id = ?", [id]);
  return r ? rowToLetter(r) : undefined;
}

export async function listMatters(): Promise<Matter[]> {
  return (await q("select * from matters order by opened_at desc")).map(rowToMatter);
}

export async function getMatter(id: string): Promise<Matter | undefined> {
  const r = await qOne("select * from matters where id = ?", [id]);
  return r ? rowToMatter(r) : undefined;
}

export async function listTasks(matterId: string): Promise<MatterTask[]> {
  return (await q("select * from matter_tasks where matter_id = ?", [matterId])).map(rowToTask);
}

export async function listContacts(): Promise<Contact[]> {
  return (await q("select * from contacts")).map(rowToContact);
}

export async function listAudit(limit = 50): Promise<AuditEntry[]> {
  return (await q("select * from audit_log order by id desc limit ?", [limit])).map((r) => ({
    id: Number(r.id), firmId: String(r.firm_id), actor: String(r.actor),
    action: String(r.action), entity: String(r.entity), entityId: s(r.entity_id),
    detail: r.detail ? (JSON.parse(String(r.detail)) as Record<string, unknown>) : undefined,
    createdAt: String(r.created_at),
  }));
}

// ---------- intake ----------
export async function createLead(channel: Lead["channel"]): Promise<Lead> {
  const firm = await getFirm();
  const id = uid("l");
  const ts = now();
  await q(
    "insert into leads (id, firm_id, channel, other_parties, stage, first_response_seconds, created_at, updated_at) values (?, ?, ?, '[]', 'qualifying', ?, ?, ?)",
    [id, firm.id, channel, Math.floor(Math.random() * 20) + 4, ts, ts]
  );
  await audit("ai", "lead.created", "lead", id, { channel });
  return (await getLead(id))!;
}

export async function addMessage(leadId: string, sender: IntakeMessage["sender"], body: string): Promise<IntakeMessage> {
  const firm = await getFirm();
  const id = uid("im");
  const ts = now();
  await q(
    "insert into intake_messages (id, firm_id, lead_id, sender, body, created_at) values (?, ?, ?, ?, ?, ?)",
    [id, firm.id, leadId, sender, body, ts]
  );
  return { id, firmId: firm.id, leadId, sender, body, createdAt: ts };
}

const LEAD_COLS: Record<string, string> = {
  fullName: "full_name", email: "email", phone: "phone", channel: "channel",
  matterType: "matter_type", matterSummary: "matter_summary",
  otherParties: "other_parties", urgency: "urgency", stage: "stage",
  qualification: "qualification", qualificationReason: "qualification_reason",
  aiSummary: "ai_summary", estimatedValueCents: "estimated_value_cents",
  declinedReason: "declined_reason", firstResponseSeconds: "first_response_seconds",
  consultAt: "consult_at", assignedTo: "assigned_to", convertedMatterId: "converted_matter_id",
};

export async function updateLead(id: string, patch: Partial<Lead>): Promise<Lead | undefined> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const [key, col] of Object.entries(LEAD_COLS)) {
    if (key in patch) {
      sets.push(`${col} = ?`);
      const v = (patch as Record<string, unknown>)[key];
      vals.push(key === "otherParties" ? JSON.stringify(v ?? []) : v ?? null);
    }
  }
  if (sets.length === 0) return getLead(id);
  sets.push("updated_at = ?");
  vals.push(now(), id);
  await q(`update leads set ${sets.join(", ")} where id = ?`, vals);
  return getLead(id);
}

export async function moveStage(id: string, stage: Stage, actor = "system") {
  const lead = await updateLead(id, { stage });
  if (lead) await audit(actor, "lead.stage_changed", "lead", id, { stage });
  return lead;
}

// ---------- conflict checks ----------
function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;
  const t1 = new Set(s1.split(/\s+/));
  const t2 = new Set(s2.split(/\s+/));
  const inter = [...t1].filter((t) => t2.has(t)).length;
  const union = new Set([...t1, ...t2]).size;
  return union === 0 ? 0 : inter / union;
}

export async function runConflictCheck(leadId: string, partyName: string): Promise<ConflictCheck> {
  const firm = await getFirm();
  let best: { id: string; name: string; score: number } | undefined;
  for (const c of await listContacts()) {
    const score = similarity(partyName, c.fullName);
    if (score >= 0.5 && (!best || score > best.score)) best = { id: c.id, name: c.fullName, score };
  }
  const id = uid("cc");
  await q(
    "insert into conflict_checks (id, firm_id, lead_id, party_name, status, matched_contact_id, matched_contact_name, similarity, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [id, firm.id, leadId, partyName, best ? "hit_review" : "clear", best?.id ?? null, best?.name ?? null, best?.score ?? null, now()]
  );
  await audit("ai", best ? "conflict.flagged" : "conflict.clear", "conflict_check", id, { partyName });
  return rowToConflict((await qOne("select * from conflict_checks where id = ?", [id]))!);
}

export async function resolveConflict(checkId: string, outcome: "cleared_by_lawyer" | "conflict_confirmed", userId: string) {
  const r = await qOne("select * from conflict_checks where id = ?", [checkId]);
  if (!r) return undefined;
  await q("update conflict_checks set status = ?, resolved_by = ?, resolved_at = ? where id = ?", [outcome, userId, now(), checkId]);
  await audit(userId, `conflict.${outcome}`, "conflict_check", checkId);
  const check = rowToConflict((await qOne("select * from conflict_checks where id = ?", [checkId]))!);
  const lead = await getLead(check.leadId);
  if (lead) {
    if (outcome === "conflict_confirmed") {
      await moveStage(lead.id, "conflict", userId);
      await updateLead(lead.id, { qualification: "conflict" });
    } else if (lead.stage === "conflict") {
      const stillOpen = (await listConflicts(lead.id)).some((c) => c.status === "hit_review" || c.status === "pending");
      if (!stillOpen) {
        await moveStage(lead.id, "qualified", userId);
        await updateLead(lead.id, { qualification: "qualified" });
      }
    }
  }
  return check;
}

// ---------- engagement ----------
function money(cents: number | undefined, currency: string): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export async function renderTemplate(templateId: string, leadId: string, feeAmountCents?: number, retainerAmountCents?: number): Promise<string> {
  const firm = await getFirm();
  const t = await getTemplate(templateId);
  const lead = await getLead(leadId);
  if (!t || !lead) return "";
  return t.bodyMd
    .replaceAll("{{client_name}}", lead.fullName ?? "Client")
    .replaceAll("{{firm_name}}", firm.name)
    .replaceAll("{{matter_type}}", lead.matterType ?? "legal")
    .replaceAll("{{matter_summary}}", lead.matterSummary ?? "")
    .replaceAll("{{fee_amount}}", money(feeAmountCents, firm.currency))
    .replaceAll("{{retainer_amount}}", money(retainerAmountCents, firm.currency));
}

export async function createLetter(leadId: string, templateId: string, feeAmountCents?: number, retainerAmountCents?: number): Promise<EngagementLetter> {
  const firm = await getFirm();
  const t = await getTemplate(templateId);
  const id = uid("el");
  await q(
    "insert into engagement_letters (id, firm_id, lead_id, template_id, body_md, fee_structure, fee_amount_cents, retainer_amount_cents, status, payment_status, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, 'draft', 'unpaid', ?)",
    [id, firm.id, leadId, templateId, await renderTemplate(templateId, leadId, feeAmountCents, retainerAmountCents), t?.defaultFeeStructure ?? null, feeAmountCents ?? null, retainerAmountCents ?? null, now()]
  );
  await audit("ai", "engagement.drafted", "engagement_letter", id, { leadId });
  return (await getLetter(id))!;
}

export async function approveAndSendLetter(letterId: string, userId: string, whopCheckoutUrl?: string) {
  const letter = await getLetter(letterId);
  if (!letter) return undefined;
  const ts = now();
  await q(
    "update engagement_letters set status = 'sent', approved_by = ?, approved_at = ?, sent_at = ?, whop_checkout_url = ? where id = ?",
    [userId, ts, ts, whopCheckoutUrl ?? null, letterId]
  );
  await audit(userId, "engagement.approved_and_sent", "engagement_letter", letterId);
  await moveStage(letter.leadId, "engagement_sent", userId);
  return getLetter(letterId);
}

const DEFAULT_PLAYBOOK: Record<string, string[]> = {
  "Family Law": ["Open court file / check filing requirements", "Collect financial disclosures", "Draft petition", "Calendar response deadlines"],
  "Personal Injury": ["Send preservation-of-evidence letter", "Request medical records", "Open claim with adverse insurer", "Calendar statute of limitations"],
  "Immigration": ["Collect identity + status documents", "Confirm priority dates", "Prepare forms package", "Calendar filing deadlines"],
  "Estate Planning": ["Send estate questionnaire", "Draft will + directives", "Schedule signing ceremony", "Deliver executed originals"],
};

export async function markSignedAndPaid(letterId: string, signerName: string): Promise<{ letter: EngagementLetter; matter: Matter } | undefined> {
  const firm = await getFirm();
  const letter = await getLetter(letterId);
  if (!letter) return undefined;
  const ts = now();
  await q(
    "update engagement_letters set status = 'signed', signed_at = ?, signer_name = ?, payment_status = 'paid', paid_at = ? where id = ?",
    [ts, signerName, ts, letterId]
  );
  await audit("system", "engagement.signed_and_paid", "engagement_letter", letterId);

  const lead = await getLead(letter.leadId);
  const matterId = uid("m");
  await q(
    "insert into matters (id, firm_id, lead_id, title, matter_type, status, opened_at) values (?, ?, ?, ?, ?, 'open', ?)",
    [matterId, firm.id, letter.leadId, `${lead?.fullName ?? "Client"} — ${lead?.matterType ?? "New Matter"}`, lead?.matterType ?? null, ts]
  );
  const playbook = DEFAULT_PLAYBOOK[lead?.matterType ?? ""] ?? ["Kickoff call with client", "Collect documents"];
  for (let i = 0; i < playbook.length; i++) {
    await q(
      "insert into matter_tasks (id, firm_id, matter_id, title, due_at, status, source) values (?, ?, ?, ?, ?, 'todo', 'playbook')",
      [uid("task"), firm.id, matterId, playbook[i], new Date(Date.now() + (i + 2) * 24 * 3600_000).toISOString()]
    );
  }
  if (lead) {
    await moveStage(lead.id, "signed", "system");
    await updateLead(lead.id, { convertedMatterId: matterId });
  }
  await audit("system", "matter.opened", "matter", matterId, { fromLead: letter.leadId });
  return { letter: (await getLetter(letterId))!, matter: (await getMatter(matterId))! };
}

export async function setTaskStatus(taskId: string, status: MatterTask["status"]) {
  await q("update matter_tasks set status = ? where id = ?", [status, taskId]);
  const r = await qOne("select * from matter_tasks where id = ?", [taskId]);
  return r ? rowToTask(r) : undefined;
}