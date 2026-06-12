import { NextResponse } from "next/server";
import { createLead, addMessage, getFirm } from "@/lib/store";

export async function POST() {
  const firm = getFirm();
  const lead = createLead("web");
  addMessage(lead.id, "ai", firm.intakeGreeting);
  return NextResponse.json({
    leadId: lead.id,
    greeting: firm.intakeGreeting,
    disclaimer: firm.disclaimer,
    firmName: firm.name,
  });
}