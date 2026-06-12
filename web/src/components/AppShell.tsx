import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Pipeline" },
  { href: "/matters", label: "Matters" },
  { href: "/settings", label: "Settings" },
];

type Props = {
  children: ReactNode;
  active: string;
  firmName: string;
};

export function AppShell({ children, active, firmName }: Props) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-line bg-paper-raised flex flex-col">
        <div className="px-6 pt-7 pb-6 border-b border-line">
          <Link href="/" className="font-display text-2xl tracking-tight text-navy">
            Lex<span className="text-bronze">Flow</span>
          </Link>
          <p className="mt-1 text-xs text-ink-faint">{firmName}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-bronze-soft text-navy font-medium"
                    : "text-ink-soft hover:bg-paper hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-5 border-t border-line">
          <Link
            href="/intake/hartley-vance"
            className="block text-center rounded-md bg-navy px-3 py-2 text-sm text-white hover:bg-ink transition-colors"
          >
            Try the intake widget →
          </Link>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            Local SQLite database. Data persists across restarts.
          </p>
        </div>
      </aside>
      <main className="flex-1 min-w-0 px-10 py-8">{children}</main>
    </div>
  );
}