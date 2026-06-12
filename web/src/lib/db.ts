// SQLite connection + schema + first-run seed.
// Local file database: lexflow/web/data/lexflow.db (gitignored).
// Swap to hosted Postgres (Supabase/Neon) at deploy time — the schema
// mirrors supabase/migrations/0001_init.sql minus auth/RLS.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { seed } from "./demo-seed";

const SCHEMA = `
create table if not exists firms (
  id text primary key,
  name text not null,
  slug text not null unique,
  practice_areas text not null default '[]',
  fee_minimum_cents integer,
  intake_greeting text,
  ai_tone text not null default 'professional',
  disclaimer text not null default '',
  timezone text not null default 'America/New_York',
  currency text not null default 'USD',
  plan text not null default 'trial'
);
create table if not exists profiles (
  id text primary key,
  firm_id text not null,
  full_name text not null,
  email text not null,
  role text not null default 'lawyer'
);
create table if not exists contacts (
  id text primary key,
  firm_id text not null,
  kind text not null default 'person',
  full_name text not null,
  email text,
  phone text,
  notes text
);
create table if not exists leads (
  id text primary key,
  firm_id text not null,
  full_name text,
  email text,
  phone text,
  channel text not null default 'web',
  matter_type text,
  matter_summary text,
  other_parties text not null default '[]',
  urgency text,
  stage text not null default 'new',
  qualification text,
  qualification_reason text,
  ai_summary text,
  estimated_value_cents integer,
  declined_reason text,
  first_response_seconds integer,
  consult_at text,
  assigned_to text,
  converted_matter_id text,
  created_at text not null,
  updated_at text not null
);
create index if not exists leads_firm_stage on leads(firm_id, stage);
create table if not exists intake_messages (
  id text primary key,
  firm_id text not null,
  lead_id text not null,
  sender text not null,
  body text not null,
  created_at text not null
);
create index if not exists intake_messages_lead on intake_messages(lead_id, created_at);
create table if not exists conflict_checks (
  id text primary key,
  firm_id text not null,
  lead_id text not null,
  party_name text not null,
  status text not null default 'pending',
  matched_contact_id text,
  matched_contact_name text,
  similarity real,
  resolved_by text,
  resolved_at text,
  created_at text not null
);
create table if not exists engagement_templates (
  id text primary key,
  firm_id text not null,
  name text not null,
  matter_type text,
  body_md text not null,
  default_fee_structure text
);
create table if not exists engagement_letters (
  id text primary key,
  firm_id text not null,
  lead_id text not null,
  template_id text,
  body_md text not null,
  fee_structure text,
  fee_amount_cents integer,
  retainer_amount_cents integer,
  status text not null default 'draft',
  approved_by text,
  approved_at text,
  sent_at text,
  signed_at text,
  signer_name text,
  whop_checkout_url text,
  payment_status text not null default 'unpaid',
  paid_at text,
  created_at text not null
);
create table if not exists matters (
  id text primary key,
  firm_id text not null,
  lead_id text,
  client_contact_id text,
  title text not null,
  matter_type text,
  status text not null default 'open',
  opened_at text not null,
  responsible text
);
create table if not exists matter_tasks (
  id text primary key,
  firm_id text not null,
  matter_id text not null,
  title text not null,
  due_at text,
  status text not null default 'todo',
  assigned_to text,
  source text not null default 'manual'
);
create table if not exists audit_log (
  id integer primary key autoincrement,
  firm_id text not null,
  actor text not null,
  action text not null,
  entity text not null,
  entity_id text,
  detail text,
  created_at text not null
);
`;

function open(): Database.Database {
  // Vercel serverless: project dir is read-only; /tmp is writable but
  // ephemeral (resets on cold start — demo reseeds itself). For durable
  // production data, point DATABASE_DIR at a mounted volume or move to
  // hosted Postgres using supabase/migrations/0001_init.sql.
  const dataDir =
    process.env.DATABASE_DIR ??
    (process.env.VERCEL ? "/tmp/lexflow-data" : path.join(process.cwd(), "data"));
  fs.mkdirSync(dataDir, { recursive: true });
  const conn = new Database(path.join(dataDir, "lexflow.db"));
  conn.pragma("journal_mode = WAL");
  conn.exec(SCHEMA);
  seedIfEmpty(conn);
  return conn;
}

function seedIfEmpty(conn: Database.Database) {
  const row = conn.prepare("select count(*) as n from firms").get() as { n: number };
  if (row.n > 0) return;
  const d = seed();
  const tx = conn.transaction(() => {
    conn.prepare(
      `insert into firms (id, name, slug, practice_areas, fee_minimum_cents, intake_greeting, ai_tone, disclaimer, timezone, currency, plan)
       values (@id, @name, @slug, @practiceAreas, @feeMinimumCents, @intakeGreeting, @aiTone, @disclaimer, @timezone, @currency, @plan)`
    ).run({ ...d.firm, practiceAreas: JSON.stringify(d.firm.practiceAreas) });
    for (const p of d.profiles) {
      conn.prepare(
        "insert into profiles (id, firm_id, full_name, email, role) values (@id, @firmId, @fullName, @email, @role)"
      ).run(p);
    }
    for (const c of d.contacts) {
      conn.prepare(
        "insert into contacts (id, firm_id, kind, full_name, email, phone, notes) values (@id, @firmId, @kind, @fullName, @email, @phone, @notes)"
      ).run({ email: null, phone: null, notes: null, ...c });
    }
    const leadStmt = conn.prepare(
      `insert into leads (id, firm_id, full_name, email, phone, channel, matter_type, matter_summary, other_parties, urgency, stage, qualification, qualification_reason, ai_summary, estimated_value_cents, declined_reason, first_response_seconds, consult_at, assigned_to, converted_matter_id, created_at, updated_at)
       values (@id, @firmId, @fullName, @email, @phone, @channel, @matterType, @matterSummary, @otherParties, @urgency, @stage, @qualification, @qualificationReason, @aiSummary, @estimatedValueCents, @declinedReason, @firstResponseSeconds, @consultAt, @assignedTo, @convertedMatterId, @createdAt, @updatedAt)`
    );
    for (const l of d.leads) {
      leadStmt.run({
        fullName: null, email: null, phone: null, matterType: null, matterSummary: null,
        urgency: null, qualification: null, qualificationReason: null, aiSummary: null,
        estimatedValueCents: null, declinedReason: null, firstResponseSeconds: null,
        consultAt: null, assignedTo: null, convertedMatterId: null,
        ...l, otherParties: JSON.stringify(l.otherParties),
      });
    }
    for (const m of d.messages) {
      conn.prepare(
        "insert into intake_messages (id, firm_id, lead_id, sender, body, created_at) values (@id, @firmId, @leadId, @sender, @body, @createdAt)"
      ).run(m);
    }
    for (const c of d.conflicts) {
      conn.prepare(
        `insert into conflict_checks (id, firm_id, lead_id, party_name, status, matched_contact_id, matched_contact_name, similarity, resolved_by, resolved_at, created_at)
         values (@id, @firmId, @leadId, @partyName, @status, @matchedContactId, @matchedContactName, @similarity, @resolvedBy, @resolvedAt, @createdAt)`
      ).run({
        matchedContactId: null, matchedContactName: null, similarity: null,
        resolvedBy: null, resolvedAt: null, ...c,
      });
    }
    for (const t of d.templates) {
      conn.prepare(
        "insert into engagement_templates (id, firm_id, name, matter_type, body_md, default_fee_structure) values (@id, @firmId, @name, @matterType, @bodyMd, @defaultFeeStructure)"
      ).run({ matterType: null, ...t });
    }
    for (const l of d.letters) {
      conn.prepare(
        `insert into engagement_letters (id, firm_id, lead_id, template_id, body_md, fee_structure, fee_amount_cents, retainer_amount_cents, status, approved_by, approved_at, sent_at, signed_at, signer_name, whop_checkout_url, payment_status, paid_at, created_at)
         values (@id, @firmId, @leadId, @templateId, @bodyMd, @feeStructure, @feeAmountCents, @retainerAmountCents, @status, @approvedBy, @approvedAt, @sentAt, @signedAt, @signerName, @whopCheckoutUrl, @paymentStatus, @paidAt, @createdAt)`
      ).run({
        templateId: null, feeStructure: null, feeAmountCents: null, retainerAmountCents: null,
        approvedBy: null, approvedAt: null, sentAt: null, signedAt: null, signerName: null,
        whopCheckoutUrl: null, paidAt: null, ...l,
      });
    }
    for (const m of d.matters) {
      conn.prepare(
        `insert into matters (id, firm_id, lead_id, client_contact_id, title, matter_type, status, opened_at, responsible)
         values (@id, @firmId, @leadId, @clientContactId, @title, @matterType, @status, @openedAt, @responsible)`
      ).run({ leadId: null, clientContactId: null, matterType: null, responsible: null, ...m });
    }
    for (const t of d.tasks) {
      conn.prepare(
        `insert into matter_tasks (id, firm_id, matter_id, title, due_at, status, assigned_to, source)
         values (@id, @firmId, @matterId, @title, @dueAt, @status, @assignedTo, @source)`
      ).run({ dueAt: null, assignedTo: null, ...t });
    }
    for (const a of d.audit) {
      conn.prepare(
        "insert into audit_log (firm_id, actor, action, entity, entity_id, detail, created_at) values (@firmId, @actor, @action, @entity, @entityId, @detail, @createdAt)"
      ).run({ entityId: null, ...a, detail: a.detail ? JSON.stringify(a.detail) : null });
    }
  });
  tx();
}

// single connection across dev HMR reloads
const g = globalThis as unknown as { __lexflowSqlite?: Database.Database };
export function getDb(): Database.Database {
  if (!g.__lexflowSqlite) g.__lexflowSqlite = open();
  return g.__lexflowSqlite;
}