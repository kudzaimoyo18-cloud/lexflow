import { AppShell } from "@/components/AppShell";
import { getFirm, listTemplates, listContacts, getProfiles } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const firm = getFirm();
  const templates = listTemplates();
  const contacts = listContacts();
  const profiles = getProfiles();

  return (
    <AppShell active="/settings" firmName={firm.name}>
      <h1 className="text-3xl text-navy">Firm settings</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Everything the AI is allowed to say and do is configured here — per firm, not hardcoded.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 max-w-5xl">
        <section className="rounded-lg border border-line bg-paper-raised p-6">
          <h2 className="text-lg text-navy">Intake AI</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Practice areas (auto-qualify)</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {firm.practiceAreas.map((a) => (
                  <span key={a} className="rounded-full bg-bronze-soft px-2.5 py-0.5 text-xs text-navy">{a}</span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Tone</dt>
              <dd className="mt-1 text-ink capitalize">{firm.aiTone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Greeting</dt>
              <dd className="mt-1 text-ink-soft leading-relaxed">{firm.intakeGreeting}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Mandatory disclaimer</dt>
              <dd className="mt-1 text-ink-soft leading-relaxed">{firm.disclaimer}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-line bg-paper-raised p-6">
          <h2 className="text-lg text-navy">Engagement templates</h2>
          <ul className="mt-4 divide-y divide-line">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-ink">{t.name}</span>
                <span className="text-xs text-ink-faint">{t.matterType} · {t.defaultFeeStructure}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-lg text-navy">Team</h2>
          <ul className="mt-3 divide-y divide-line">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-ink">{p.fullName}</span>
                <span className="text-xs text-ink-faint">{p.role}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-line bg-paper-raised p-6">
          <h2 className="text-lg text-navy">Conflict database</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Every intake party is fuzzy-matched against these contacts automatically.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {contacts.map((c) => (
              <li key={c.id} className="py-3">
                <p className="text-sm text-ink">{c.fullName}</p>
                <p className="text-xs text-ink-faint">{c.notes}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-line bg-paper-raised p-6">
          <h2 className="text-lg text-navy">Billing & integrations</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">LexFlow plan</dt>
              <dd className="mt-1 text-ink capitalize">{firm.plan} (via Whop)</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Client payments</dt>
              <dd className="mt-1 text-ink-soft">
                Whop checkout — {process.env.WHOP_API_KEY ? "live" : "stub mode (set WHOP_API_KEY + WHOP_RETAINER_PLAN_ID)"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Intake AI engine</dt>
              <dd className="mt-1 text-ink-soft">
                {process.env.ANTHROPIC_API_KEY ? "Claude (live)" : "Scripted fallback (set ANTHROPIC_API_KEY for Claude)"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-faint">Database</dt>
              <dd className="mt-1 text-ink-soft">
                Local SQLite (data/lexflow.db) — Postgres migrations ready in /supabase for cloud deploy
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </AppShell>
  );
}