import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0d0f2b]">
      <div className="max-w-xl w-full px-6 py-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl text-center space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-white">ConceptPulse</h1>
        <p className="text-slate-300 text-sm">
          A precision learning engine to scan notes, diagnose weak topics, learn with multi-format explanations,
          revise with spaced repetition, and track mastery.
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-full bg-[#7aa2ff] text-sm font-medium text-slate-950 hover:bg-[#8fb0ff] transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full border border-white/20 text-sm font-medium text-slate-100 hover:bg-white/5 transition-colors"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
