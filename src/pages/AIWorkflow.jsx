const providers = [
  {
    provider: "OpenAI",
    short: "O",
    status: "Active",
    role: "General intelligence",
    description:
      "General chat, clarifying questions, conversation memory, and voice transcription.",
    color: "from-emerald-400/25 to-cyan-400/10 text-emerald-200 border-emerald-300/25",
  },
  {
    provider: "Claude",
    short: "C",
    status: "Active",
    role: "Deep work",
    description:
      "Long-document analysis, detailed writing, decision support, and coding.",
    color: "from-violet-400/25 to-fuchsia-400/10 text-violet-200 border-violet-300/25",
  },
  {
    provider: "Gemini",
    short: "G",
    status: "Active",
    role: "Multimodal",
    description:
      "Image understanding, visual-data analysis, and multimodal research.",
    color: "from-blue-400/25 to-indigo-400/10 text-blue-200 border-blue-300/25",
  },
];

function AIWorkflow() {
  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto overflow-x-hidden text-white">
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-20 sm:px-6 sm:py-9 lg:px-10 lg:py-10">
        <header className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3.5 py-2 text-xs font-medium text-violet-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            Intelligent routing online
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">AI workflow</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            OrbitalAI chooses the best provider for each request while keeping the experience inside one workspace.
          </p>
        </header>

        <section className="orbital-glass mb-6 overflow-hidden rounded-3xl p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Example request</p>
              <p className="mt-3 max-w-3xl text-lg leading-7 text-slate-100">Analyze this renewable-energy chart and explain the most important trend.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-300/15 bg-blue-400/[0.06] px-3 py-2 text-xs text-blue-200">
              Gemini selected <span aria-hidden="true">→</span>
            </div>
          </div>
        </section>

        <section className="orbital-glass rounded-3xl p-5 sm:p-7">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">Provider roles</h2>
              <p className="mt-1 text-sm text-slate-500">Three focused models, one consistent workspace.</p>
            </div>
            <span className="text-xs text-slate-600">3 providers connected</span>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {providers.map(({ provider, short, status, role, description, color }) => (
              <article key={provider} className="rounded-2xl border border-blue-200/[0.12] bg-[#071326]/75 p-5 transition hover:-translate-y-0.5 hover:border-violet-300/25">
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-gradient-to-br text-sm font-bold ${color}`}>{short}</div>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{status}</span>
                </div>
                <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">{role}</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-100">{provider}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AIWorkflow;
