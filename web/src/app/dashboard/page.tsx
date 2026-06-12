import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StageBadge, Money, timeAgo } from "@/components/ui";
import { getFirm, listLeads, listMatters, listAudit, listAllConflicts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const firm = getFirm();
  const leads = listLeads();
  const matters = listMatters();
  const audit = listAudit(8);

  const signed = leads.filter((l) => l.stage === "signed");
  const open = leads.filter(
    (l) => !["signed", "declined", "referred_out"].includes(l.stage)
  );
  const conflicts = listAllConflicts().filter((c) => c.status === "hit_review");
  const responseTimes = leads
    .map((l) => l.firstResponseSeconds)
    .filter((s): s is number => s != null);
  const medianResponse = responseTimes.length
    ? [...responseTimes].sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)]
    : null;
  const pipelineValue = open.reduce((sum, l) => sum + (l.estimatedValueCents ?? 0), 0);
  const signedValue = signed.reduce((sum, l) => sum + (l.estimatedValueCents ?? 0), 0);

  return (
    <AppShell active="/dashboard" firmName={firm.name}>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl text-navy">Good morning, Dana.</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Here is what the front door did while you practiced law.
          </p>
        </div>
        <span className="text-xs text-ink-faint">Demo data · {firm.plan} plan</span>
      </header>

      <section className="mt-8 grid grid-cols-4 gap-4">
        <div className="rounded-lg border border-line bg-paper-raised p-5">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Median first response</p>
          <p className="mt-2 font-display text-3xl text-green">
            {medianResponse != null ? `${medianResponse}s` : "—"}
          </p>
          <p className="mt-1 text-xs text-ink-faint">Industry average: 17–42 hours</p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-5">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Open pipeline</p>
          <p className="mt-2 font-display text-3xl text-navy">{open.length}</p>
          <p className="mt-1 text-xs text-ink-faint">
            est. <Money cents={pipelineValue} /> in potential fees
          </p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-5">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Signed via LexFlow</p>
          <p className="mt-2 font-display text-3xl text-bronze">{signed.length}</p>
          <p className="mt-1 text-xs text-ink-faint">
            <Money cents={signedValue} /> in engaged work
          </p>
        </div>
        <div className="rounded-lg border border-line bg-paper-raised p-5">
          <p className="text-xs uppercase tracking-wide text-ink-faint">Needs your review</p>
          <p className={`mt-2 font-display text-3xl ${conflicts.length ? "text-red" : "text-ink-faint"}`}>
            {conflicts.length}
          </p>
          <p className="mt-1 text-xs text-ink-faint">conflict {conflicts.length === 1 ? "check" : "checks"} awaiting a lawyer</p>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-5 gap-8">
        <div className="col-span-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg text-navy">Recent leads</h2>
            <Link href="/leads" className="text-xs text-bronze hover:underline">
              Open pipeline →
            </Link>
          </div>
          <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-paper-raised">
            {leads.slice(0, 6).map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {lead.fullName ?? "Anonymous lead"}
                    <span className="ml-2 text-xs text-ink-faint">{lead.matterType ?? ""}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{lead.matterSummary ?? "Intake in progress…"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[11px] text-ink-faint">{timeAgo(lead.createdAt)}</span>
                  <StageBadge stage={lead.stage} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <h2 className="text-lg text-navy">What the system did</h2>
          <ol className="mt-3 space-y-0 rounded-lg border border-line bg-paper-raised px-5 py-2">
            {audit.map((entry) => (
              <li key={entry.id} className="flex gap-3 border-b border-line py-3 last:border-0">
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    entry.actor === "ai" ? "bg-bronze" : entry.actor === "system" ? "bg-navy" : "bg-green"
                  }`}
                />
                <div>
                  <p className="text-xs text-ink">
                    <span className="font-medium">{entry.actor === "ai" ? "AI" : entry.actor === "system" ? "System" : "Dana"}</span>{" "}
                    {entry.action.replace(/[._]/g, " ")}
                  </p>
                  <p className="text-[11px] text-ink-faint">{timeAgo(entry.createdAt)}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            Every AI action is logged. Engagement letters always wait for a lawyer&apos;s
            one-click approval — AI drafts, you approve, the system executes.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg text-navy">Open matters ({matters.filter((m) => m.status === "open").length})</h2>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {matters.slice(0, 3).map((m) => (
            <Link
              key={m.id}
              href={`/matters/${m.id}`}
              className="rounded-lg border border-line bg-paper-raised p-5 hover:border-bronze/40 transition-colors"
            >
              <p className="text-sm font-medium text-ink">{m.title}</p>
              <p className="mt-1 text-xs text-ink-faint">{m.matterType} · opened {timeAgo(m.openedAt)}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}