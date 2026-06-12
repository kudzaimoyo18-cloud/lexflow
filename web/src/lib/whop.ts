// Whop payments integration.
// LexFlow subscription billing AND client retainer checkout links go
// through Whop. Until WHOP_API_KEY is configured this returns a stub
// checkout URL so the rest of the workflow is testable end-to-end.

const WHOP_API = "https://api.whop.com/api/v2";

export interface CheckoutLink {
  url: string;
  live: boolean; // false = stub (no WHOP_API_KEY configured)
}

export async function createRetainerCheckout(opts: {
  leadId: string;
  letterId: string;
  amountCents: number;
  currency: string;
  description: string;
}): Promise<CheckoutLink> {
  const apiKey = process.env.WHOP_API_KEY;
  const planId = process.env.WHOP_RETAINER_PLAN_ID;

  if (!apiKey || !planId) {
    return {
      url: `https://whop.com/checkout/demo?letter=${opts.letterId}&amount=${opts.amountCents}`,
      live: false,
    };
  }

  // Whop quick-pay: create a checkout session against the configured plan
  // with metadata so the webhook can reconcile payment -> engagement letter.
  const res = await fetch(`${WHOP_API}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planId,
      metadata: {
        lexflow_letter_id: opts.letterId,
        lexflow_lead_id: opts.leadId,
        amount_cents: opts.amountCents,
        description: opts.description,
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Whop checkout creation failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { purchase_url?: string; url?: string };
  return { url: data.purchase_url ?? data.url ?? "", live: true };
}