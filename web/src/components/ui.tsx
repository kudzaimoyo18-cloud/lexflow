import type { Stage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/types";

const STAGE_STYLE: Record<string, string> = {
  new: "bg-paper text-ink-soft border-line",
  qualifying: "bg-amber-soft text-amber border-amber/20",
  qualified: "bg-green-soft text-green border-green/20",
  consult_scheduled: "bg-bronze-soft text-bronze border-bronze/20",
  consult_done: "bg-bronze-soft text-bronze border-bronze/20",
  engagement_sent: "bg-navy/5 text-navy border-navy/15",
  signed: "bg-green-soft text-green border-green/30 font-medium",
  declined: "bg-paper text-ink-faint border-line",
  referred_out: "bg-paper text-ink-faint border-line",
  conflict: "bg-red-soft text-red border-red/20",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] ${STAGE_STYLE[stage] ?? ""}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

export function Money({ cents, className = "" }: { cents?: number; className?: string }) {
  if (cents == null) return <span className={className}>—</span>;
  const v = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
  return <span className={className}>{v}</span>;
}

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}