const helpItems = [
  ["Getting started", "Learn how to create chats, projects, and your first AI workflow."],
  ["Files and documents", "Upload supported documents and ask questions about their content."],
  ["Voice notes", "Record a prompt, transcribe it, and send it to the best-fit provider."],
  ["AI providers", "Understand when OrbitalAI chooses OpenAI, Claude, or Gemini."],
  ["Projects", "Keep related conversations, notes, and attachments together."],
  ["Account and privacy", "Review account settings and workspace storage information."],
];

function Help() {
  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto overflow-x-hidden text-white">
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-20 sm:px-6 sm:py-9 lg:px-10 lg:py-10">
        <header className="mb-8">
          <div className="mb-4 inline-flex rounded-full border border-blue-400/20 bg-blue-400/[0.06] px-3.5 py-2 text-xs font-medium text-blue-200">OrbitalAI support</div>
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">How can we help?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">Find quick answers about your workspace, attachments, voice notes, and AI providers.</p>
        </header>

        <label className="orbital-glass mb-7 flex max-w-3xl items-center gap-3 rounded-2xl px-4 py-3.5 focus-within:border-violet-300/40">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-slate-500" strokeWidth="1.8"><circle cx="10.7" cy="10.7" r="6.7" /><path d="m16 16 4 4" strokeLinecap="round" /></svg>
          <input type="search" placeholder="Search help articles" className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {helpItems.map(([title, description], index) => (
            <button key={title} type="button" className="orbital-glass group rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-300/30">
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-400/[0.07] text-sm font-semibold text-blue-200">{String(index + 1).padStart(2, "0")}</div>
              <h2 className="font-semibold text-slate-100 group-hover:text-violet-200">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              <span className="mt-4 inline-block text-sm text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-300">View guide →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Help;
