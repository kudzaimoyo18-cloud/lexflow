import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-bronze">For solo & small law firms</p>
      <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight text-navy">
        Your firm loses clients in the first five minutes.
        <span className="text-bronze"> LexFlow answers in five seconds.</span>
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
        AI-native intake that responds to every lead instantly, qualifies it, runs the
        conflict check, books the consult, and gets the engagement letter signed and the
        retainer paid — while you practice law.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-navy px-6 py-3 text-sm text-white hover:bg-ink transition-colors"
        >
          Open the firm dashboard
        </Link>
        <Link
          href="/intake/hartley-vance"
          className="rounded-md border border-line bg-paper-raised px-6 py-3 text-sm text-ink hover:border-bronze/50 transition-colors"
        >
          Talk to the intake AI as a client
        </Link>
      </div>
      <p className="mt-10 text-[11px] text-ink-faint">
        35% of inquiries to law firms never get a response. 79% of clients sign with the first firm that replies.
      </p>
    </div>
  );
}