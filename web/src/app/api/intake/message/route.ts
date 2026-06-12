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
  const lead = await getLead(leadId);
  if (!lead) return NextResponse.json({ error: "lead not found" }, { status: 404 });

  const firm = await getFirm();
  const history = await listMessages(leadId);
  await addMessage(leadId, "prospect", message);

  const turn = await intakeTurn(firm, lead, history, message);
  if (Object.keys(turn.fields).length) await updateLead(leadId, turn.fields);
  await addMessage(leadId, "ai", turn.reply);

  if (turn.done) {
    const updated = (await getLead(leadId))!;
    // qualification: inside practice areas?
    const inArea = updated.matterType
      ? firm.practiceAreas.some((a) => a.toLowerCase() === updated.matterType!.toLowerCase())
      : false;

    // conflict checks on every named party
    const parties = [...updated.otherParties];
    const checks = [];
    for (const p of parties) checks.push(await runConflictCheck(leadId, p));
    const hits = checks.filter((c) => c.status === "hit_review");

    if (hits.length) {
      await updateLead(leadId, {
        qualification: "conflict",
        qualificationReason: `Potential conflict: ${hits.map((h) => h.partyName).join(", ")} matches existing firm contacts.`,
        aiSummary: buildPreBrief(updated),
      });
      await moveStage(leadId, "conflict", "ai");
    } else if (inArea) {
      await updateLead(leadId, {
        qualification: "qualified",
        qualificationReason: `${updated.matterType} is a core practice area.`,
        aiSummary: buildPreBrief(updated),
      });
      await moveStage(leadId, "qualified", "ai");
    } else {
      await updateLead(leadId, {
        qualification: "refer_out",
        qualificationReason: `${updated.matterType ?? "Matter"} is outside firm practice areas.`,
        aiSummary: buildPreBrief(updated),
      });
      await moveStage(leadId, "referred_out", "ai");
    }
    await audit("ai", "lead.intake_completed", "lead", leadId);
    const final = (await getLead(leadId))!;
    await addMessage(leadId, "system", `Intake complete. Qualification: ${final.qualification}. Conflict checks: ${parties.length ? parties.join(", ") : "none required"}.`);
  }

  return NextResponse.json({ reply: turn.reply, done: turn.done });
}