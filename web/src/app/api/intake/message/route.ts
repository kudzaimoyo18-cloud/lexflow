import { NextRequest, NextResponse } from "next/server";
import {
  getFirm, getLead, listMessages, addMessage, updateLead,
  runConflictCheck, moveStage, audit,
} from "@/lib/store";
import { intakeTurn, buildPreBrief } from "@/lib/ai/intake";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { leadId?: string; message?: string };
  const leadId = body.leadId ?? "";
  const message = (body.message ?? "").slice(0, 2000).trim();
  if (!leadId || !message) {
    return NextResponse.json({ error: "leadId and message are required" }, { status: 400 });
  }
  const lead = getLead(leadId);
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  const firm = getFirm();
  const history = listMessages(leadId);
  addMessage(leadId, "prospect", message);

  const turn = await intakeTurn(firm, lead, history, message);
  if (Object.keys(turn.fields).length) updateLead(leadId, turn.fields);
  addMessage(leadId, "ai", turn.reply);

  if (turn.done) {
    const updated = getLead(leadId)!;
    // qualification: inside practice areas?
    const inArea = updated.matterType
      ? firm.practiceAreas.some((a) => a.toLowerCase() === updated.matterType!.toLowerCase())
      : false;

    // conflict checks on every named party
    const parties = [...updated.otherParties];
    const hits = parties
      .map((p) => runConflictCheck(leadId, p))
      .filter((c) => c.status === "hit_review");

    if (hits.length) {
      updateLead(leadId, {
        qualification: "conflict",
        qualificationReason: `Potential conflict: ${hits.map((h) => h.partyName).join(", ")} matches existing firm contacts.`,
        aiSummary: buildPreBrief(updated),
      });
      moveStage(leadId, "conflict", "ai");
    } else if (inArea) {
      updateLead(leadId, {
        qualification: "qualified",
        qualificationReason: `${updated.matterType} is a core practice area.`,
        aiSummary: buildPreBrief(updated),
      });
      moveStage(leadId, "qualified", "ai");
    } else {
      updateLead(leadId, {
        qualification: "refer_out",
        qualificationReason: `${updated.matterType ?? "Matter"} is outside firm practice areas.`,
        aiSummary: buildPreBrief(updated),
      });
      moveStage(leadId, "referred_out", "ai");
    }
    audit("ai", "lead.intake_completed", "lead", leadId);
    addMessage(leadId, "system", `Intake complete. Qualification: ${getLead(leadId)!.qualification}. Conflict checks: ${parties.length ? parties.join(", ") : "none required"}.`);
  }

  return NextResponse.json({ reply: turn.reply, done: turn.done });
}