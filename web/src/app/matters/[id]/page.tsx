import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { timeAgo } from "@/components/ui";
import { getFirm, getMatter, listTasks } from "@/lib/store";
import { actionSetTaskStatus } from "@/lib/actions";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const NEXT_STATUS = { todo: "doing", doing: "done", done: "todo" } as const;

export default async function MatterDetailPage({ params }: Props) {
  const { id } = await params;
  const firm = await getFirm();
  const matter = await getMatter(id);
  if (!matter) notFound();
  const tasks = await listTasks(id);

  return (
    <AppShell active="/matters" firmName={firm.name}>
      <Link href="/matters" className="text-xs text-bronze hover:underline">← Matters</Link>
      <h1 className="mt-3 text-3xl text-navy">{matter.title}</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {matter.matterType} · opened {timeAgo(matter.openedAt)} · {matter.status}
      </p>

      <section className="mt-8 max-w-2xl">
        <h2 className="text-lg text-navy">Tasks</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Seeded from the {matter.matterType} playbook when the matter opened. Click to advance status.
        </p>
        <div className="mt-3 divide-y divide-line rounded-lg border border-line bg-paper-raised">
          {tasks.map((t) => (
            <form
              key={t.id}
              action={actionSetTaskStatus.bind(null, t.id, NEXT_STATUS[t.status], matter.id)}
            >
              <button className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left hover:bg-paper transition-colors">
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                      t.status === "done"
                        ? "border-green bg-green text-white"
                        : t.status === "doing"
                        ? "border-bronze bg-bronze-soft text-bronze"
                        : "border-line text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={`text-sm ${t.status === "done" ? "text-ink-faint line-through" : "text-ink"}`}>
                    {t.title}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-ink-faint">
                  {t.source === "playbook" ? "playbook" : t.source}
                  {t.dueAt && ` · due ${new Date(t.dueAt).toLocaleDateString()}`}
                </span>
              </button>
            </form>
          ))}
          {tasks.length === 0 && (
            <p className="px-5 py-4 text-sm text-ink-faint">No tasks yet.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}