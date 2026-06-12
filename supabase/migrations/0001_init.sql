-- LexFlow initial schema
-- Multi-tenant: every row belongs to a firm; RLS isolates firms.

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm; -- fuzzy matching for conflict checks

-- ============ FIRMS & USERS ============

create table firms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  practice_areas text[] not null default '{}',
  fee_minimum_cents integer,
  intake_greeting text,
  ai_tone text not null default 'professional', -- professional | warm | direct
  disclaimer text not null default 'This conversation does not create an attorney-client relationship and is not legal advice.',
  timezone text not null default 'America/New_York',
  currency text not null default 'USD',
  whop_membership_id text,
  plan text not null default 'trial', -- trial | core | growth
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_id uuid not null references firms(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'lawyer', -- owner | lawyer | staff
  created_at timestamptz not null default now()
);

-- ============ CONTACTS ============

create table contacts (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  kind text not null default 'person', -- person | organization
  full_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);
create index contacts_firm_name_trgm on contacts using gin (full_name gin_trgm_ops);

-- ============ LEADS / INTAKE ============

create table leads (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  channel text not null default 'web', -- web | email | phone | whatsapp | referral | manual
  matter_type text,
  matter_summary text,
  other_parties text[],
  urgency text, -- immediate | this_week | exploring
  stage text not null default 'new', -- new | qualifying | qualified | consult_scheduled | consult_done | engagement_sent | signed | declined | referred_out | conflict
  qualification text, -- qualified | unsure | refer_out | conflict
  qualification_reason text,
  ai_summary text,
  estimated_value_cents integer,
  declined_reason text,
  first_response_seconds integer,
  consult_at timestamptz,
  assigned_to uuid references profiles(id),
  converted_matter_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_firm_stage on leads(firm_id, stage);

create table intake_messages (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  sender text not null, -- ai | prospect | lawyer | system
  body text not null,
  created_at timestamptz not null default now()
);
create index intake_messages_lead on intake_messages(lead_id, created_at);

-- ============ CONFLICT CHECKS ============

create table conflict_checks (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  party_name text not null,
  status text not null default 'pending', -- pending | clear | hit_review | cleared_by_lawyer | conflict_confirmed
  matched_contact_id uuid references contacts(id),
  similarity real,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ ENGAGEMENT ============

create table engagement_templates (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  name text not null,
  matter_type text,
  body_md text not null, -- markdown with {{placeholders}}
  default_fee_structure text, -- hourly | flat | contingency | retainer
  created_at timestamptz not null default now()
);

create table engagement_letters (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  template_id uuid references engagement_templates(id),
  body_md text not null,
  fee_structure text,
  fee_amount_cents integer,
  retainer_amount_cents integer,
  status text not null default 'draft', -- draft | approved | sent | viewed | signed | declined
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  sent_at timestamptz,
  signed_at timestamptz,
  signer_name text,
  signer_ip text,
  whop_checkout_url text,
  payment_status text not null default 'unpaid', -- unpaid | pending | paid
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ MATTERS ============

create table matters (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  lead_id uuid references leads(id),
  client_contact_id uuid references contacts(id),
  title text not null,
  matter_type text,
  status text not null default 'open', -- open | on_hold | closed
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  responsible uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table matter_tasks (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_id uuid not null references matters(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'todo', -- todo | doing | done
  assigned_to uuid references profiles(id),
  source text not null default 'manual', -- manual | playbook | ai
  created_at timestamptz not null default now()
);

create table playbooks (
  id uuid primary key default uuid_generate_v4(),
  firm_id uuid not null references firms(id) on delete cascade,
  matter_type text not null,
  tasks jsonb not null default '[]' -- [{title, offset_days}]
);

-- ============ AUDIT LOG ============

create table audit_log (
  id bigint generated always as identity primary key,
  firm_id uuid not null references firms(id) on delete cascade,
  actor text not null, -- 'ai' | 'system' | profile uuid
  action text not null,
  entity text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index audit_firm_time on audit_log(firm_id, created_at desc);

-- ============ RLS ============

alter table firms enable row level security;
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table leads enable row level security;
alter table intake_messages enable row level security;
alter table conflict_checks enable row level security;
alter table engagement_templates enable row level security;
alter table engagement_letters enable row level security;
alter table matters enable row level security;
alter table matter_tasks enable row level security;
alter table playbooks enable row level security;
alter table audit_log enable row level security;

create or replace function current_firm_id() returns uuid
language sql stable security definer set search_path = public as $$
  select firm_id from profiles where id = auth.uid()
$$;

create policy firm_select on firms for select using (id = current_firm_id());
create policy firm_update on firms for update using (id = current_firm_id());

create policy profiles_all on profiles for all using (firm_id = current_firm_id());
create policy contacts_all on contacts for all using (firm_id = current_firm_id());
create policy leads_all on leads for all using (firm_id = current_firm_id());
create policy intake_messages_all on intake_messages for all using (firm_id = current_firm_id());
create policy conflict_checks_all on conflict_checks for all using (firm_id = current_firm_id());
create policy engagement_templates_all on engagement_templates for all using (firm_id = current_firm_id());
create policy engagement_letters_all on engagement_letters for all using (firm_id = current_firm_id());
create policy matters_all on matters for all using (firm_id = current_firm_id());
create policy matter_tasks_all on matter_tasks for all using (firm_id = current_firm_id());
create policy playbooks_all on playbooks for all using (firm_id = current_firm_id());
create policy audit_select on audit_log for select using (firm_id = current_firm_id());

-- Public intake (anon) goes through service-role API routes only; no anon policies on purpose.
