import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Money, timeAgo } from "@/components/ui";
import { getFirm, listLeads } from "@/lib/store";
import { PIPELINE_STAGES, STAGE_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const firm = await getFirm();
  const leads = await listLeads();
  const parked = leads.filter((l) => ["declined", "referred_out", "conflict"].includes(l.stage));

  return (
    <AppShell active="/leads" firmName={firm.name}>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl text-navy">Pipeline</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Every inquiry, answered in seconds and moved toward a signed engagement.
          </p>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-7 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage);
          return (
            <div key={stage} className="min-w-0">
              <p className="flex items-center justify-between px-1 text-[11px] uppercase tracking-wide text-ink-faint">
                {STAGE_LABELS[stage]}
                <span>{items.length}</span>
              </p>
              <div className="mt-2 space-y-2">
                {items.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="block rounded-lg border border-line bg-paper-raised p-3 hover:border-bronze/50 hover:shadow-sm transition-all"
                  >
                    <p className="truncate text-sm font-medium text-ink">{lead.fullName ?? "Anonymous"}</p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-soft">{lead.matterType ?? "Qualifying…"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Money cents={lead.estimatedValueCents} className="text-[11px] text-bronze" />
                      <span className="text-[10px] text-ink-faint">{timeAgo(lead.updatedAt)}</span>
                    </div>
                  </Link>
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line p-3 text-center text-[11px] text-ink-faint">
                    empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {parked.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm uppercase tracking-wide text-ink-faint">
            Needs review / closed out
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {parked.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className={`rounded-lg border p-4 transition-colors ${
                  lead.stage === "conflict"
                    ? "border-red/30 bg-red-soft hover:border-red/60"
                    : "border-line bg-paper-raised hover:border-bronze/40"
                }`}
              >
                <p className="text-sm font-medium text-ink">{lead.fullName}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {lead.stage === "conflict" ? "⚠ Conflict check needs a lawyer" : STAGE_LABELS[lead.stage]}
                  {" · "}{lead.matterType}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}