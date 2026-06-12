import Link from "next/link";
import { IntakeChat } from "@/components/IntakeChat";
import { getFirm } from "@/lib/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function IntakePage({ params }: Props) {
  await params; // single-firm demo: slug reserved for multi-tenant routing
  const firm = await getFirm();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-10">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-bronze">You are the client</p>
        <h1 className="mt-2 font-display text-3xl text-navy">Talk to {firm.name}</h1>
        <p className="mt-2 max-w-md text-sm text-ink-soft">
          This is the widget a firm embeds on its website. Describe a legal problem —
          watch it get qualified, conflict-checked, and routed in the{" "}
          <Link href="/leads" className="text-bronze underline">pipeline</Link>.
        </p>
      </div>
      <IntakeChat firmName={firm.name} />
      <Link href="/dashboard" className="text-xs text-ink-faint hover:text-bronze">
        ← back to the firm side
      </Link>
    </div>
  );
}