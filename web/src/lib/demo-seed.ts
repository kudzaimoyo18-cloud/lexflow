import type {
  Firm, Profile, Contact, Lead, IntakeMessage, ConflictCheck,
  EngagementTemplate, EngagementLetter, Matter, MatterTask, AuditEntry,
} from "./types";

export interface DB {
  firm: Firm;
  profiles: Profile[];
  contacts: Contact[];
  leads: Lead[];
  messages: IntakeMessage[];
  conflicts: ConflictCheck[];
  templates: EngagementTemplate[];
  letters: EngagementLetter[];
  matters: Matter[];
  tasks: MatterTask[];
  audit: AuditEntry[];
  auditSeq: number;
}

const FIRM_ID = "firm-demo";
const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

export function seed(): DB {
  const firm: Firm = {
    id: FIRM_ID,
    name: "Hartley & Vance LLP",
    slug: "hartley-vance",
    practiceAreas: ["Family Law", "Personal Injury", "Immigration", "Estate Planning"],
    feeMinimumCents: 150000,
    intakeGreeting:
      "Hi, I am the intake assistant for Hartley & Vance. I can take down the details of your situation so one of our attorneys can review it quickly. What brings you here today?",
    aiTone: "warm",
    disclaimer:
      "This conversation does not create an attorney-client relationship and is not legal advice.",
    timezone: "America/New_York",
    currency: "USD",
    plan: "trial",
  };

  const profiles: Profile[] = [
    { id: "u-dana", firmId: FIRM_ID, fullName: "Dana Hartley", email: "dana@hartleyvance.com", role: "owner" },
    { id: "u-marcus", firmId: FIRM_ID, fullName: "Marcus Vance", email: "marcus@hartleyvance.com", role: "lawyer" },
  ];

  const contacts: Contact[] = [
    { id: "c-1", firmId: FIRM_ID, kind: "person", fullName: "Robert Keller", email: "rkeller@mail.com", notes: "Opposing party in Diaz v. Keller (2024)" },
    { id: "c-2", firmId: FIRM_ID, kind: "person", fullName: "Maria Diaz", email: "mdiaz@mail.com", notes: "Former client — custody matter, closed 2024" },
    { id: "c-3", firmId: FIRM_ID, kind: "organization", fullName: "Northway Insurance Group", notes: "Frequent adverse insurer" },
    { id: "c-4", firmId: FIRM_ID, kind: "person", fullName: "James Okafor", email: "j.okafor@mail.com", notes: "Current client — green card application" },
  ];

  const leads: Lead[] = [
    {
      id: "l-1", firmId: FIRM_ID, fullName: "Sarah Mitchell", email: "sarah.m@gmail.com", phone: "+1 555 0182",
      channel: "web", matterType: "Family Law",
      matterSummary: "Seeking divorce; two children (7 and 10); main concerns are custody schedule and the family home. Spouse: David Mitchell.",
      otherParties: ["David Mitchell"], urgency: "this_week", stage: "qualified",
      qualification: "qualified", qualificationReason: "Family Law is a core practice area; contested custody suggests substantial engagement.",
      aiSummary: "Divorce with contested custody, 2 kids, owns home jointly. Emotionally ready to proceed, asked about timeline and cost twice — price-sensitive but motivated.",
      estimatedValueCents: 750000, firstResponseSeconds: 8,
      createdAt: hoursAgo(5), updatedAt: hoursAgo(4),
    },
    {
      id: "l-2", firmId: FIRM_ID, fullName: "Tom Brennan", email: "tbrennan@outlook.com",
      channel: "web", matterType: "Personal Injury",
      matterSummary: "Rear-ended at a stoplight 3 weeks ago; whiplash + ongoing physio; insurer (Northway Insurance Group) offered $4,200 settlement.",
      otherParties: ["Northway Insurance Group"], urgency: "immediate", stage: "conflict",
      qualification: "conflict", qualificationReason: "Adverse party Northway Insurance Group matches existing firm contact.",
      aiSummary: "Clear liability rear-end collision. Lowball insurer offer. Strong contingency candidate IF conflict clears — Northway appears as adverse insurer in prior matters, likely not disqualifying.",
      firstResponseSeconds: 11,
      createdAt: hoursAgo(26), updatedAt: hoursAgo(25),
    },
    {
      id: "l-3", firmId: FIRM_ID, fullName: "Amelia Ross", email: "amelia.ross@mail.com", phone: "+1 555 0177",
      channel: "whatsapp", matterType: "Estate Planning",
      matterSummary: "Wants a will + healthcare directive after recent diagnosis; assets: home, 401(k), small brokerage account.",
      otherParties: [], urgency: "this_week", stage: "engagement_sent",
      qualification: "qualified", qualificationReason: "Estate planning core area; straightforward flat-fee will package.",
      aiSummary: "Time-sensitive for personal reasons. Straightforward estate package. High urgency, low complexity — fast flat-fee win.",
      estimatedValueCents: 250000, firstResponseSeconds: 6,
      createdAt: daysAgo(2), updatedAt: hoursAgo(3),
    },
    {
      id: "l-4", firmId: FIRM_ID, fullName: "Diego Fuentes", email: "d.fuentes@mail.com",
      channel: "web", matterType: "Immigration",
      matterSummary: "H-1B holder, employer acquired; needs advice on visa transfer + green card timing. Employer: Cortex Systems.",
      otherParties: ["Cortex Systems"], urgency: "exploring", stage: "consult_scheduled",
      qualification: "qualified", qualificationReason: "Immigration core area.",
      aiSummary: "Sophisticated client, knows the process. Comparing 2-3 firms. Responds fast on email. Consult booked Thursday 2pm.",
      estimatedValueCents: 450000, firstResponseSeconds: 9,
      consultAt: new Date(Date.now() + 2 * 24 * 3600_000).toISOString(),
      createdAt: daysAgo(3), updatedAt: hoursAgo(20),
    },
    {
      id: "l-5", firmId: FIRM_ID, fullName: "Linda Park", email: "lpark@mail.com",
      channel: "phone", matterType: "Tax Law",
      matterSummary: "IRS audit notice for her bakery LLC; needs tax controversy representation.",
      otherParties: ["IRS"], urgency: "immediate", stage: "referred_out",
      qualification: "refer_out", qualificationReason: "Tax controversy is outside firm practice areas.",
      aiSummary: "Referred to tax counsel with warm handoff note.",
      firstResponseSeconds: 4,
      createdAt: daysAgo(1), updatedAt: hoursAgo(22),
    },
    {
      id: "l-6", firmId: FIRM_ID, fullName: "Kevin Osei", email: "kevin.osei@mail.com",
      channel: "web", matterType: "Personal Injury",
      matterSummary: "Slip and fall at a grocery store, fractured wrist, store has cameras.",
      otherParties: ["FreshMart Stores"], urgency: "this_week", stage: "signed",
      qualification: "qualified", qualificationReason: "PI core area, documented injury, premises liability.",
      aiSummary: "Strong premises liability case. Signed contingency agreement same day.",
      estimatedValueCents: 1200000, firstResponseSeconds: 7,
      convertedMatterId: "m-2",
      createdAt: daysAgo(6), updatedAt: daysAgo(4),
    },
  ];

  const messages: IntakeMessage[] = [
    { id: "im-1", firmId: FIRM_ID, leadId: "l-1", sender: "ai", body: firm.intakeGreeting, createdAt: hoursAgo(5) },
    { id: "im-2", firmId: FIRM_ID, leadId: "l-1", sender: "prospect", body: "I need to file for divorce. We have two kids and I want to make sure I keep the house.", createdAt: hoursAgo(5) },
    { id: "im-3", firmId: FIRM_ID, leadId: "l-1", sender: "ai", body: "I am sorry you are going through this — let us get the details down so an attorney can help quickly. Could you share your name and the best way to reach you?", createdAt: hoursAgo(5) },
    { id: "im-4", firmId: FIRM_ID, leadId: "l-1", sender: "prospect", body: "Sarah Mitchell, sarah.m@gmail.com, 555-0182. My husband is David Mitchell.", createdAt: hoursAgo(5) },
    { id: "im-5", firmId: FIRM_ID, leadId: "l-1", sender: "ai", body: "Thank you, Sarah. How old are your children, and are you and David currently living together?", createdAt: hoursAgo(5) },
    { id: "im-6", firmId: FIRM_ID, leadId: "l-1", sender: "prospect", body: "They are 7 and 10. We still live together but it is not working. How fast can this move and what does it cost?", createdAt: hoursAgo(5) },
    { id: "im-7", firmId: FIRM_ID, leadId: "l-1", sender: "ai", body: "Those are exactly the right questions for the attorney — I have flagged both. Last thing: how soon are you hoping to speak with someone?", createdAt: hoursAgo(5) },
    { id: "im-8", firmId: FIRM_ID, leadId: "l-1", sender: "prospect", body: "This week if possible.", createdAt: hoursAgo(5) },
    { id: "im-9", firmId: FIRM_ID, leadId: "l-1", sender: "system", body: "Lead qualified — Family Law. Conflict check run on: David Mitchell (clear). Attorney pre-brief generated.", createdAt: hoursAgo(4) },
  ];

  const conflicts: ConflictCheck[] = [
    { id: "cc-1", firmId: FIRM_ID, leadId: "l-1", partyName: "David Mitchell", status: "clear", createdAt: hoursAgo(4) },
    { id: "cc-2", firmId: FIRM_ID, leadId: "l-2", partyName: "Northway Insurance Group", status: "hit_review", matchedContactId: "c-3", matchedContactName: "Northway Insurance Group", similarity: 1.0, createdAt: hoursAgo(25) },
  ];

  const templates: EngagementTemplate[] = [
    {
      id: "t-1", firmId: FIRM_ID, name: "Family Law — Hourly", matterType: "Family Law", defaultFeeStructure: "hourly",
      bodyMd: "## Engagement Letter\n\nDear {{client_name}},\n\nThank you for choosing {{firm_name}} to represent you in your {{matter_type}} matter: {{matter_summary}}\n\n**Scope.** We will represent you in connection with the above matter, including negotiation, filings, and court appearances as required.\n\n**Fees.** Our services are billed at our standard hourly rates. An initial retainer of {{retainer_amount}} is required before work begins.\n\n**No guarantee.** We cannot and do not guarantee any particular outcome.\n\nPlease sign below and pay the retainer to begin.\n\n{{firm_name}}",
    },
    {
      id: "t-2", firmId: FIRM_ID, name: "Personal Injury — Contingency", matterType: "Personal Injury", defaultFeeStructure: "contingency",
      bodyMd: "## Contingency Fee Agreement\n\nDear {{client_name}},\n\n{{firm_name}} agrees to represent you in your {{matter_type}} matter: {{matter_summary}}\n\n**Fee.** Our fee is 33% of any recovery obtained before filing suit, and 40% thereafter. You owe nothing if there is no recovery.\n\n**Costs.** Case costs are advanced by the firm and reimbursed from any recovery.\n\nPlease sign below to begin.\n\n{{firm_name}}",
    },
    {
      id: "t-3", firmId: FIRM_ID, name: "Estate Planning — Flat Fee", matterType: "Estate Planning", defaultFeeStructure: "flat",
      bodyMd: "## Engagement Letter — Estate Package\n\nDear {{client_name}},\n\nThank you for choosing {{firm_name}}.\n\n**Scope.** Preparation of will, healthcare directive, and durable power of attorney: {{matter_summary}}\n\n**Fee.** Flat fee of {{fee_amount}}, payable 50% on signing and 50% on delivery of final documents.\n\nPlease sign below to begin.\n\n{{firm_name}}",
    },
  ];

  const letters: EngagementLetter[] = [
    {
      id: "el-1", firmId: FIRM_ID, leadId: "l-3", templateId: "t-3",
      bodyMd: templates[2].bodyMd
        .replace("{{client_name}}", "Amelia Ross")
        .replace("{{firm_name}}", "Hartley & Vance LLP")
        .replace("{{matter_type}}", "Estate Planning")
        .replace("{{matter_summary}}", "Will + healthcare directive + POA.")
        .replace("{{fee_amount}}", "$2,500"),
      feeStructure: "flat", feeAmountCents: 250000, retainerAmountCents: 125000,
      status: "sent", approvedBy: "u-dana", approvedAt: hoursAgo(3), sentAt: hoursAgo(3),
      paymentStatus: "unpaid", createdAt: hoursAgo(4),
    },
  ];

  const matters: Matter[] = [
    { id: "m-1", firmId: FIRM_ID, clientContactId: "c-4", title: "Okafor — Green Card (I-485)", matterType: "Immigration", status: "open", openedAt: daysAgo(40), responsible: "u-marcus" },
    { id: "m-2", firmId: FIRM_ID, leadId: "l-6", title: "Osei v. FreshMart — Premises Liability", matterType: "Personal Injury", status: "open", openedAt: daysAgo(4), responsible: "u-dana" },
  ];

  const tasks: MatterTask[] = [
    { id: "task-1", firmId: FIRM_ID, matterId: "m-2", title: "Send preservation-of-evidence letter (CCTV)", status: "done", source: "playbook" },
    { id: "task-2", firmId: FIRM_ID, matterId: "m-2", title: "Request medical records — wrist fracture", status: "doing", source: "playbook", dueAt: new Date(Date.now() + 3 * 24 * 3600_000).toISOString() },
    { id: "task-3", firmId: FIRM_ID, matterId: "m-2", title: "Open claim with FreshMart insurer", status: "todo", source: "playbook", dueAt: new Date(Date.now() + 7 * 24 * 3600_000).toISOString() },
    { id: "task-4", firmId: FIRM_ID, matterId: "m-1", title: "Prepare for biometrics appointment", status: "todo", source: "manual", dueAt: new Date(Date.now() + 10 * 24 * 3600_000).toISOString() },
  ];

  const audit: AuditEntry[] = [
    { id: 1, firmId: FIRM_ID, actor: "ai", action: "lead.qualified", entity: "lead", entityId: "l-1", createdAt: hoursAgo(4) },
    { id: 2, firmId: FIRM_ID, actor: "ai", action: "conflict.flagged", entity: "lead", entityId: "l-2", createdAt: hoursAgo(25) },
    { id: 3, firmId: FIRM_ID, actor: "u-dana", action: "engagement.approved", entity: "engagement_letter", entityId: "el-1", createdAt: hoursAgo(3) },
  ];

  return { firm, profiles, contacts, leads, messages, conflicts, templates, letters, matters, tasks, audit, auditSeq: 4 };
}