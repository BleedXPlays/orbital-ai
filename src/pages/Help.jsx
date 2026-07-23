import { useMemo, useState } from "react";

const helpItems = [
  {
    title: "Getting started",
    description: "Create chats, projects, and your first AI workflow.",
    steps: [
      "Choose New Chat for a standalone conversation, or New Project to group related work.",
      "Write your request in the message box and attach supporting files when useful.",
      "OrbitalAI routes the request to OpenAI, Claude, or Gemini based on the task.",
    ],
  },
  {
    title: "Files and documents",
    description: "Upload documents and ask questions about their content.",
    steps: [
      "Use Add file, drag a document into the composer, or paste a copied image.",
      "Add your question in the same message so the selected file is clearly scoped.",
      "For scanned documents, check the answer carefully because image-only text may need OCR.",
    ],
  },
  {
    title: "Voice notes",
    description: "Record a prompt, review its transcript, and then send it.",
    steps: [
      "Press Voice note and allow microphone access when your browser asks.",
      "Stop the recording to place the transcript in the message box.",
      "Review or edit the transcript, then press Send.",
    ],
  },
  {
    title: "AI providers",
    description: "Understand when OpenAI, Claude, or Gemini is selected.",
    steps: [
      "OpenAI handles general conversation, follow-up questions, and voice transcription.",
      "Claude handles detailed writing, longer documents, decision support, and coding.",
      "Gemini handles images, visual data, and multimodal research.",
    ],
  },
  {
    title: "Projects",
    description: "Keep related conversations, notes, and attachments together.",
    steps: [
      "Create a project and give it a clear topic-based name.",
      "Open the project before creating chats or uploading shared project files.",
      "Use the project overview to keep its discussions and reference material together.",
    ],
  },
  {
    title: "Account and privacy",
    description: "Review account settings and workspace storage information.",
    steps: [
      "Open Settings to update your name, password, or sign out.",
      "Your provider API keys remain on the server and are never shown in the browser.",
      "Do not upload passwords, payment details, or other information you do not want processed by an AI provider.",
    ],
  },
];

function Help() {
  const [query, setQuery] = useState("");
  const [selectedTitle, setSelectedTitle] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return helpItems;

    return helpItems.filter((item) =>
      [item.title, item.description, ...item.steps]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query]);

  const selectedItem = helpItems.find((item) => item.title === selectedTitle);

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
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search help articles"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
        </label>

        {filteredItems.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const index = helpItems.findIndex((entry) => entry.title === item.title);
              const expanded = selectedTitle === item.title;

              return (
                <button
                  key={item.title}
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setSelectedTitle(expanded ? "" : item.title)}
                  className={`orbital-glass group rounded-2xl p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-300/30 ${
                    expanded ? "border-violet-300/35 bg-violet-400/[0.07]" : ""
                  }`}
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-300/15 bg-blue-400/[0.07] text-sm font-semibold text-blue-200">{String(index + 1).padStart(2, "0")}</div>
                  <h2 className="font-semibold text-slate-100 group-hover:text-violet-200">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                  <span className="mt-4 inline-block text-sm text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-300">
                    {expanded ? "Close guide ↑" : "View guide →"}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="orbital-glass rounded-2xl p-7 text-sm text-slate-400">
            No help article matches “{query}”. Try a shorter search such as files, voice, projects, or account.
          </div>
        )}

        {selectedItem && (
          <section className="orbital-glass mt-7 max-w-3xl rounded-3xl p-6 sm:p-7" aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Quick guide</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-100">{selectedItem.title}</h2>
            <ol className="mt-5 space-y-4">
              {selectedItem.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-blue-300/20 bg-blue-400/[0.07] text-xs text-blue-200">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-10 border-t border-white/10 pt-7 text-sm leading-6 text-slate-500">
          <p><span className="font-medium text-slate-300">Privacy summary:</span> Workspace data is private to the signed-in account. Attached content may be sent to the AI provider selected for the request.</p>
          <p className="mt-2"><span className="font-medium text-slate-300">Responsible use:</span> Always verify important medical, legal, financial, academic, and safety-related answers with a qualified source.</p>
        </section>
      </div>
    </div>
  );
}

export default Help;
