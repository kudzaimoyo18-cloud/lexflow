"use server";

import { revalidatePath } from "next/cache";
import {
  resolveConflict, createLetter, approveAndSendLetter, markSignedAndPaid,
  moveStage, setTaskStatus, getLetterForLead, getLead,
} from "@/lib/store";
import { createRetainerCheckout } from "@/lib/whop";
import type { Stage } from "@/lib/types";

// Demo session acts as the firm owner. Replaced by real auth later.
const CURRENT_USER = "u-dana";

export async function actionResolveConflict(checkId: string, outcome: "cleared_by_lawyer" | "conflict_confirmed", leadId: string) {
  await resolveConflict(checkId, outcome, CURRENT_USER);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function actionDraftLetter(leadId: string, templateId: string, feeAmountCents?: number, retainerAmountCents?: number) {
  const existing = await getLetterForLead(leadId);
  if (!existing) await createLetter(leadId, templateId, feeAmountCents, retainerAmountCents);
  revalidatePath(`/leads/${leadId}`);
}

export async function actionApproveAndSend(letterId: string, leadId: string) {
  const lead = await getLead(leadId);
  const letter = await getLetterForLead(leadId);
  const checkout = await createRetainerCheckout({
    leadId,
    letterId,
    amountCents: letter?.retainerAmountCents ?? letter?.feeAmountCents ?? 0,
    currency: "USD",
    description: `Retainer — ${lead?.fullName ?? "client"} (${lead?.matterType ?? "matter"})`,
  });
  await approveAndSendLetter(letterId, CURRENT_USER, checkout.url);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function actionSimulateSignAndPay(letterId: string, leadId: string) {
  const lead = await getLead(leadId);
  await markSignedAndPaid(letterId, lead?.fullName ?? "Client");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/matters");
  revalidatePath("/dashboard");
}

export async function actionMoveStage(leadId: string, stage: Stage) {
  await moveStage(leadId, stage, CURRENT_USER);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function actionSetTaskStatus(taskId: string, status: "todo" | "doing" | "done", matterId: string) {
  await setTaskStatus(taskId, status);
  revalidatePath(`/matters/${matterId}`);
}