// AI intake agent. Uses Claude when ANTHROPIC_API_KEY is set,
// otherwise falls back to a deterministic scripted flow so the
// product is demoable with zero config.
import Anthropic from "@anthropic-ai/sdk";
import type { Firm, Lead, IntakeMessage, Urgency } from "../types";

export interface IntakeTurn {
  reply: string;
  fields: Partial<{
    fullName: string;
    email: string;
    phone: string;
    matterType: string;
    matterSummary: string;
    otherParties: string[];
    urgency: Urgency;
  }>;
  done: boolean;
}

const MODEL = "claude-haiku-4-5-20251001";

function systemPrompt(firm: Firm, lead: Lead): string {
  return `You are the client-intake assistant for the law firm "${firm.name}".
Tone: ${firm.aiTone}. You are NOT a lawyer and you NEVER give legal advice,
predictions about case outcomes, or fee quotes. If asked, say the attorney
will cover that and flag it for the attorney.

Firm practice areas: ${firm.practiceAreas.join(", ")}.

Your job in this conversation:
1. Empathetically gather: full name, email or phone, what happened (matter
   summary), the type of matter (map to one of the practice areas if possible,
   otherwise name it plainly e.g. "Tax Law"), names of any OTHER parties
   involved (opposing party, employer, insurer), and urgency
   (immediate | this_week | exploring).
2. Ask ONE question at a time. Keep replies under 60 words.
3. When you have all fields, thank them, say an attorney will be in touch
   shortly, and stop asking questions.

Already known about this lead (do not re-ask): ${JSON.stringify({
    fullName: lead.fullName, email: lead.email, phone: lead.phone,
    matterType: lead.matterType, matterSummary: lead.matterSummary,
    otherParties: lead.otherParties, urgency: lead.urgency,
  })}

ALWAYS respond with valid JSON only, no markdown fence:
{"reply": string, "fields": {partial fields object with anything newly learned}, "done": boolean}`;
}

export async function intakeTurn(
  firm: Firm,
  lead: Lead,
  history: IntakeMessage[],
  userMessage: string
): Promise<IntakeTurn> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await claudeTurn(firm, lead, history, userMessage);
    } catch (err) {
      console.error("Claude intake failed, falling back to scripted flow:", err);
    }
  }
  return scriptedTurn(firm, lead, userMessage);
}

async function claudeTurn(
  firm: Firm,
  lead: Lead,
  history: IntakeMessage[],
  userMessage: string
): Promise<IntakeTurn> {
  const client = new Anthropic();
  const messages: Anthropic.MessageParam[] = history
    .filter((m) => m.sender === "ai" || m.sender === "prospect")
    .map((m) => ({
      role: m.sender === "ai" ? ("assistant" as const) : ("user" as const),
      content: m.body,
    }));
  messages.push({ role: "user", content: userMessage });

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: systemPrompt(firm, lead),
    messages,
  });
  const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
  const parsed = JSON.parse(text) as IntakeTurn;
  return {
    reply: parsed.reply ?? "Thanks — could you tell me a bit more?",
    fields: parsed.fields ?? {},
    done: Boolean(parsed.done),
  };
}

// ---------- deterministic fallback ----------
function extractEmail(s: string): string | undefined {
  return s.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
}
function extractPhone(s: string): string | undefined {
  const m = s.match(/(\+?\d[\d\s().-]{6,}\d)/);
  return m ? m[1].trim() : undefined;
}

function guessMatterType(s: string, areas: string[]): string | undefined {
  const t = s.toLowerCase();
  const map: Array<[RegExp, string]> = [
    [/divorce|custody|child support|separat|alimony|prenup/, "Family Law"],
    [/accident|injur|crash|slip|fall|whiplash/, "Personal Injury"],
    [/visa|green card|immigration|deport|citizenship|h-?1b/, "Immigration"],
    [/will|estate|trust|inheritance|probate/, "Estate Planning"],
    [/arrest|criminal|dui|charge/, "Criminal Defense"],
    [/irs|tax/, "Tax Law"],
    [/contract|business|llc|partnership/, "Business Law"],
  ];
  for (const [re, label] of map) if (re.test(t)) return label;
  return areas.find((a) => t.includes(a.toLowerCase()));
}

function scriptedTurn(firm: Firm, lead: Lead, userMessage: string): IntakeTurn {
  const fields: IntakeTurn["fields"] = {};

  const email = extractEmail(userMessage);
  if (email && !lead.email) fields.email = email;
  const phone = extractPhone(userMessage);
  if (phone && !lead.phone) fields.phone = phone;

  // skip messages that are mostly contact info — not a matter description
  const withoutContactInfo = userMessage
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "")
    .trim();
  if (!lead.matterSummary && withoutContactInfo.length > 12 && lead.fullName) {
    fields.matterSummary = userMessage.trim();
    const mt = guessMatterType(userMessage, firm.practiceAreas);
    if (mt) fields.matterType = mt;
  }
  if (!lead.fullName) {
    const cleaned = userMessage.replace(/my name is|i am|i'm|this is/gi, "").trim();
    const words = cleaned.split(/\s+/).filter((w) => /^[a-z'.-]+$/i.test(w));
    if (words.length >= 1 && words.length <= 4 && !extractEmail(userMessage)) {
      fields.fullName = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
    }
  }
  if (!lead.matterType && !fields.matterType) {
    const mt = guessMatterType(userMessage, firm.practiceAreas);
    if (mt) fields.matterType = mt;
  }
  if (!lead.otherParties.length) {
    const m = userMessage.match(/(?:against|versus|vs\.?|with|by)\s+([A-Z][\w'&. -]{2,40})/);
    if (m) fields.otherParties = [m[1].trim().replace(/[.,;:]+$/, "")];
  }
  if (!lead.urgency) {
    const t = userMessage.toLowerCase();
    if (/asap|urgent|immediately|today|right away|now/.test(t)) fields.urgency = "immediate";
    else if (/this week|soon|few days/.test(t)) fields.urgency = "this_week";
    else if (/just looking|exploring|curious|no rush/.test(t)) fields.urgency = "exploring";
  }

  const merged = { ...lead, ...fields };
  let reply: string;
  let done = false;

  if (!merged.fullName) {
    reply = "Thanks for reaching out. Could I get your full name?";
  } else if (!merged.email && !merged.phone) {
    reply = `Thanks, ${merged.fullName.split(" ")[0]}. What is the best email or phone number to reach you?`;
  } else if (!merged.matterSummary) {
    reply = "Got it. In a few sentences, what happened — what do you need help with?";
  } else if (!merged.otherParties?.length) {
    reply = "Understood — I am sorry you are dealing with this. Is there another party involved (a person, company, or insurer)? If not, just say none.";
    if (/^(none|no|n\/a|nobody)/i.test(userMessage.trim())) {
      fields.otherParties = [];
      reply = "How soon are you hoping to speak with an attorney — immediately, this week, or are you still exploring options?";
    }
  } else if (!merged.urgency) {
    reply = "How soon are you hoping to speak with an attorney — immediately, this week, or are you still exploring options?";
  } else {
    reply = `Thank you, ${merged.fullName.split(" ")[0]} — I have everything I need. One of our attorneys will review this and be in touch very shortly. ${firm.disclaimer}`;
    done = true;
  }

  return { reply, fields, done };
}

export function buildPreBrief(lead: Lead): string {
  const parts = [
    `${lead.fullName ?? "Unknown"} — ${lead.matterType ?? "unclassified"}.`,
    lead.matterSummary ?? "",
    lead.otherParties.length ? `Other parties: ${lead.otherParties.join(", ")}.` : "",
    lead.urgency ? `Urgency: ${lead.urgency.replace("_", " ")}.` : "",
  ];
  return parts.filter(Boolean).join(" ");
}