// Query layer: one async interface, two drivers.
// - DATABASE_URL set  -> Neon serverless Postgres (production)
// - otherwise         -> local SQLite file (development)
// SQL is written with `?` placeholders; converted to $1..$n for Postgres.
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export type Row = Record<string, unknown>;

const PG_SCHEMA = `
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
  id bigint generated always as identity primary key,
  firm_id text not null,
  actor text not null,
  action text not null,
  entity text not null,
  entity_id text,
  detail text,
  created_at text not null
);
`;

export const usingPostgres = Boolean(process.env.DATABASE_URL);

function toPgPlaceholders(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// ---------- Postgres (Neon) ----------
type PgState = { sql: NeonQueryFunction<false, false>; ready: Promise<void> };
const g = globalThis as unknown as { __lexflowPg?: PgState };

function pg(): PgState {
  if (!g.__lexflowPg) {
    const sql = neon(process.env.DATABASE_URL!);
    const ready = (async () => {
      const statements = PG_SCHEMA.split(";").map((st) => st.trim()).filter(Boolean);
      for (const st of statements) await sql.query(st);
      const rows = (await sql.query("select count(*) as n from firms")) as Row[];
      if (Number(rows[0].n) === 0) {
        const { seedSql } = await import("./seed-sql");
        await seedSql(async (q, params) => {
          await sql.query(toPgPlaceholders(q), params);
        });
      }
    })();
    g.__lexflowPg = { sql, ready };
  }
  return g.__lexflowPg;
}

// ---------- shared interface ----------
export async function q(sqlText: string, params: unknown[] = []): Promise<Row[]> {
  if (usingPostgres) {
    const state = pg();
    await state.ready;
    return (await state.sql.query(toPgPlaceholders(sqlText), params)) as Row[];
  }
  const { sqliteQuery } = await import("./db");
  return sqliteQuery(sqlText, params);
}

export async function qOne(sqlText: string, params: unknown[] = []): Promise<Row | undefined> {
  const rows = await q(sqlText, params);
  return rows[0];
}