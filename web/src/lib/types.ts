// Domain types — mirror supabase/migrations/0001_init.sql (camelCase)

export type Stage =
  | "new" | "qualifying" | "qualified" | "consult_scheduled" | "consult_done"
  | "engagement_sent" | "signed" | "declined" | "referred_out" | "conflict";

export type Qualification = "qualified" | "unsure" | "refer_out" | "conflict";
export type Channel = "web" | "email" | "phone" | "whatsapp" | "referral" | "manual";
export type Urgency = "immediate" | "this_week" | "exploring";

export interface Firm {
  id: string;
  name: string;
  slug: string;
  practiceAreas: string[];
  feeMinimumCents: number | null;
  intakeGreeting: string;
  aiTone: "professional" | "warm" | "direct";
  disclaimer: string;
  timezone: string;
  currency: string;
  plan: "trial" | "core" | "growth";
}

export interface Profile {
  id: string;
  firmId: string;
  fullName: string;
  email: string;
  role: "owner" | "lawyer" | "staff";
}

export interface Contact {
  id: string;
  firmId: string;
  kind: "person" | "organization";
  fullName: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface Lead {
  id: string;
  firmId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  channel: Channel;
  matterType?: string;
  matterSummary?: string;
  otherParties: string[];
  urgency?: Urgency;
  stage: Stage;
  qualification?: Qualification;
  qualificationReason?: string;
  aiSummary?: string;
  estimatedValueCents?: number;
  declinedReason?: string;
  firstResponseSeconds?: number;
  consultAt?: string;
  assignedTo?: string;
  convertedMatterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeMessage {
  id: string;
  firmId: string;
  leadId: string;
  sender: "ai" | "prospect" | "lawyer" | "system";
  body: string;
  createdAt: string;
}

export interface ConflictCheck {
  id: string;
  firmId: string;
  leadId: string;
  partyName: string;
  status: "pending" | "clear" | "hit_review" | "cleared_by_lawyer" | "conflict_confirmed";
  matchedContactId?: string;
  matchedContactName?: string;
  similarity?: number;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface EngagementTemplate {
  id: string;
  firmId: string;
  name: string;
  matterType?: string;
  bodyMd: string;
  defaultFeeStructure: "hourly" | "flat" | "contingency" | "retainer";
}

export interface EngagementLetter {
  id: string;
  firmId: string;
  leadId: string;
  templateId?: string;
  bodyMd: string;
  feeStructure?: string;
  feeAmountCents?: number;
  retainerAmountCents?: number;
  status: "draft" | "approved" | "sent" | "viewed" | "signed" | "declined";
  approvedBy?: string;
  approvedAt?: string;
  sentAt?: string;
  signedAt?: string;
  signerName?: string;
  whopCheckoutUrl?: string;
  paymentStatus: "unpaid" | "pending" | "paid";
  paidAt?: string;
  createdAt: string;
}

export interface Matter {
  id: string;
  firmId: string;
  leadId?: string;
  clientContactId?: string;
  title: string;
  matterType?: string;
  status: "open" | "on_hold" | "closed";
  openedAt: string;
  responsible?: string;
}

export interface MatterTask {
  id: string;
  firmId: string;
  matterId: string;
  title: string;
  dueAt?: string;
  status: "todo" | "doing" | "done";
  assignedTo?: string;
  source: "manual" | "playbook" | "ai";
}

export interface AuditEntry {
  id: number;
  firmId: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

export const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  qualifying: "Qualifying",
  qualified: "Qualified",
  consult_scheduled: "Consult scheduled",
  consult_done: "Consult done",
  engagement_sent: "Engagement sent",
  signed: "Signed",
  declined: "Declined",
  referred_out: "Referred out",
  conflict: "Conflict",
};

export const PIPELINE_STAGES: Stage[] = [
  "new", "qualifying", "qualified", "consult_scheduled", "consult_done", "engagement_sent", "signed",
];