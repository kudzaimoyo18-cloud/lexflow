import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StageBadge, Money, timeAgo } from "@/components/ui";
import {
  getFirm, getLead, listMessages, listConflicts, listTemplates, getLetterForLead,
} from "@/lib/store";
import {
  actionResolveConflict, actionDraftLetter, actionApproveAndSend, actionSimulateSignAndPay,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const firm = getFirm();
  const lead = getLead(id);
  if (!lead) notFound();

  const messages = listMessages(id);
  const conflicts = listConflicts(id);
  const letter = getLetterForLead(id);
  const templates = listTemplates().filter(
    (t) => !t.matterType || t.matterType === lead.matterType
  );
  const openConflicts = conflicts.filter((c) => c.status === "hit_review");
  const canEngage =
    lead.qualification === "qualified" && !openConflicts.length;

  return (
    <AppShell active="/leads" firmName={firm.name}>
      <Link href="/leads" className="text-xs text-bronze hover:underline">← Pipeline</Link>

      <header className="mt-3 flex items-start justify-between">
        <div>
          <h1 className="text-3xl text-navy">{lead.fullName ?? "Anonymous lead"}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {lead.matterType ?? "Unclassified"} · via {lead.channel} · arrived {timeAgo(lead.createdAt)}
            {lead.firstResponseSeconds != null && (
              <span className="text-green"> · answered in {lead.firstResponseSeconds}s</span>
            )}
          </p>
        </div>
        <StageBadge stage={lead.stage} />
      </header>

      {lead.aiSummary && (
        <section className="mt-6 rounded-lg border border-bronze/30 bg-bronze-soft p-5">
          <p className="text-xs uppercase tracking-wide text-bronze">Attorney pre-brief (AI)</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">{lead.aiSummary}</p>
          {lead.qualificationReason && (
            <p className="mt-2 text-xs text-ink-soft">Qualification: {lead.qualificationReason}</p>
          )}
        </section>
      )}

      <div className="mt-8 grid grid-cols-5 gap-8">
        <section className="col-span-3">
          <h2 className="text-lg text-navy">Intake conversation</h2>
          <div className="mt-3 space-y-3 rounded-lg border border-line bg-paper-raised p-5">
            {messages.length === 0 && (
              <p className="text-sm text-ink-faint">No transcript yet.</p>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.sender === "prospect" ? "flex justify-end" : "flex"}>
                {m.sender === "system" ? (
                  <p className="w-full rounded-md bg-paper px-3 py-2 text-center text-[11px] text-ink-faint">
                    {m.body}
                  </p>
                ) : (
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
                      m.sender === "prospect"
                        ? "bg-navy text-white"
                        : "bg-paper border border-line text-ink"
                    }`}
                  >
                    {m.sender !== "prospect" && (
                      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-bronze">AI assistant</p>
                    )}
                    {m.body}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="col-span-2 space-y-8">
          <section>
            <h2 className="text-lg text-navy">Conflict checks</h2>
            <div className="mt-3 space-y-2">
              {conflicts.length === 0 && (
                <p className="rounded-lg border border-line bg-paper-raised p-4 text-sm text-ink-faint">
                  No parties checked yet.
                </p>
              )}
              {conflicts.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg border p-4 ${
                    c.status === "hit_review"
                      ? "border-red/30 bg-red-soft"
                      : "border-line bg-paper-raised"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{c.partyName}</p>
                    <span
                      className={`text-[11px] ${
                        c.status === "clear" || c.status === "cleared_by_lawyer"
                          ? "text-green"
                          : c.status === "hit_review"
                          ? "text-red"
                          : "text-ink-faint"
                      }`}
                    >
                      {c.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {c.matchedContactName && (
                    <p className="mt-1 text-xs text-ink-soft">
                      Matches firm contact: <strong>{c.matchedContactName}</strong>
                      {c.similarity != null && ` (${Math.round(c.similarity * 100)}%)`}
                    </p>
                  )}
                  {c.status === "hit_review" && (
                    <div className="mt-3 flex gap-2">
                      <form
                        action={actionResolveConflict.bind(null, c.id, "cleared_by_lawyer", lead.id)}
                      >
                        <button className="rounded-md bg-green px-3 py-1.5 text-xs text-white hover:opacity-90">
                          Clear — no conflict
                        </button>
                      </form>
                      <form
                        action={actionResolveConflict.bind(null, c.id, "conflict_confirmed", lead.id)}
                      >
                        <button className="rounded-md border border-red/40 px-3 py-1.5 text-xs text-red hover:bg-red-soft">
                          Confirm conflict
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg text-navy">Engagement</h2>
            <div className="mt-3 rounded-lg border border-line bg-paper-raised p-5">
              {!letter && canEngage && (
                <>
                  <p className="text-sm text-ink-soft">
                    Draft an engagement letter from a firm template. AI fills in the client,
                    matter, and fees — <strong>nothing sends without your approval.</strong>
                  </p>
                  <div className="mt-4 space-y-2">
                    {templates.map((t) => (
                      <form
                        key={t.id}
                        action={actionDraftLetter.bind(
                          null, lead.id, t.id,
                          lead.estimatedValueCents ?? undefined,
                          lead.estimatedValueCents ? Math.round(lead.estimatedValueCents / 3) : undefined
                        )}
                      >
                        <button className="w-full rounded-md border border-line px-4 py-2.5 text-left text-sm text-ink hover:border-bronze/50 hover:bg-bronze-soft/40 transition-colors">
                          <span className="font-medium">{t.name}</span>
                          <span className="ml-2 text-xs text-ink-faint">{t.defaultFeeStructure}</span>
                        </button>
                      </form>
                    ))}
                  </div>
                </>
              )}
              {!letter && !canEngage && (
                <p className="text-sm text-ink-faint">
                  {openConflicts.length
                    ? "Resolve the conflict check before drafting an engagement letter."
                    : "Lead must be qualified before engagement."}
                </p>
              )}
              {letter && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">Engagement letter</p>
                    <span className="text-[11px] uppercase tracking-wide text-bronze">{letter.status}</span>
                  </div>
                  <div className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-paper p-4 text-xs leading-relaxed text-ink-soft">
                    {letter.bodyMd}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
                    <span>Fee: <Money cents={letter.feeAmountCents} /></span>
                    <span>Retainer: <Money cents={letter.retainerAmountCents} /></span>
                    <span className={letter.paymentStatus === "paid" ? "text-green" : ""}>
                      {letter.paymentStatus}
                    </span>
                  </div>
                  {letter.status === "draft" && (
                    <form action={actionApproveAndSend.bind(null, letter.id, lead.id)} className="mt-4">
                      <button className="w-full rounded-md bg-navy px-4 py-2.5 text-sm text-white hover:bg-ink transition-colors">
                        Approve & send (e-sign + Whop retainer link)
                      </button>
                    </form>
                  )}
                  {letter.status === "sent" && (
                    <>
                      {letter.whopCheckoutUrl && (
                        <p className="mt-3 truncate text-[11px] text-ink-faint">
                          Payment link: {letter.whopCheckoutUrl}
                        </p>
                      )}
                      <form action={actionSimulateSignAndPay.bind(null, letter.id, lead.id)} className="mt-3">
                        <button className="w-full rounded-md border border-green/40 bg-green-soft px-4 py-2.5 text-sm text-green hover:opacity-90 transition-opacity">
                          Simulate client signing + paying ▸ opens matter
                        </button>
                      </form>
                    </>
                  )}
                  {letter.status === "signed" && lead.convertedMatterId && (
                    <Link
                      href={`/matters/${lead.convertedMatterId}`}
                      className="mt-4 block rounded-md bg-green px-4 py-2.5 text-center text-sm text-white hover:opacity-90"
                    >
                      Signed & paid — open matter →
                    </Link>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}