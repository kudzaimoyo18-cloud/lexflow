import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { timeAgo } from "@/components/ui";
import { getFirm, listMatters, listTasks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function MattersPage() {
  const firm = getFirm();
  const matters = listMatters();

  return (
    <AppShell active="/matters" firmName={firm.name}>
      <h1 className="text-3xl text-navy">Matters</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Opened automatically the moment an engagement is signed and the retainer is paid.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-4">
        {matters.map((m) => {
          const tasks = listTasks(m.id);
          const done = tasks.filter((t) => t.status === "done").length;
          return (
            <Link
              key={m.id}
              href={`/matters/${m.id}`}
              className="rounded-lg border border-line bg-paper-raised p-5 hover:border-bronze/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{m.title}</p>
                <span className={`text-[11px] ${m.status === "open" ? "text-green" : "text-ink-faint"}`}>
                  {m.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                {m.matterType} · opened {timeAgo(m.openedAt)}
              </p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full bg-bronze transition-all"
                  style={{ width: tasks.length ? `${(done / tasks.length) * 100}%` : "0%" }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-ink-faint">
                {done}/{tasks.length} playbook tasks complete
              </p>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}