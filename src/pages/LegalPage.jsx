import { Link } from "react-router-dom";
import logo from "../assets/orbital-logo.png";

function LegalPage({ eyebrow, title, summary, sections }) {
  return (
    <main className="orbital-page min-h-screen overflow-y-auto text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="inline-flex w-fit items-center" aria-label="Open OrbitalAI">
            <img src={logo} alt="OrbitalAI" className="h-10 w-auto sm:h-12" />
          </Link>

          <nav className="flex flex-wrap gap-2" aria-label="Legal pages">
            <Link
              to="/privacy"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-blue-400/40 hover:text-white"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-blue-400/40 hover:text-white"
            >
              Terms
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-violet-400/35 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/20"
            >
              Open OrbitalAI
            </Link>
          </nav>
        </header>

        <section className="mx-auto max-w-4xl py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-violet-300">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            {summary}
          </p>
          <p className="mt-4 text-sm text-slate-500">Effective August 9, 2026</p>

          <div className="mt-10 space-y-5">
            {sections.map(({ title: sectionTitle, paragraphs = [], items = [] }, index) => (
              <article key={sectionTitle} className="orbital-glass rounded-3xl p-6 sm:p-8">
                <div className="flex gap-4 sm:gap-6">
                  <span className="mt-1 text-xs font-semibold tracking-[0.18em] text-violet-300/80">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-white sm:text-2xl">{sectionTitle}</h2>
                    {paragraphs.map((paragraph) => (
                      <p key={paragraph} className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                        {paragraph}
                      </p>
                    ))}
                    {items.length > 0 && (
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300 sm:text-base">
                        {items.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <footer className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>OrbitalAI · One workspace. Three intelligences.</p>
            <Link to="/" className="font-medium text-blue-300 transition hover:text-blue-200">
              Return to OrbitalAI
            </Link>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default LegalPage;
