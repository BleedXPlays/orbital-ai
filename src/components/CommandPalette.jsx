import { useEffect, useMemo, useState } from "react";

function CommandPalette({
  chats,
  projects,
  projectChats,
  setSelectedChat,
  setSelectedProject,
  setPage,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = useMemo(() => {
    const globalChatCommands = chats.map((chat) => ({
      id: `global-chat-${chat}`,
      type: "Chat",
      icon: "chat",
      title: chat,
      subtitle: "Global chat",
      action: () => {
        setSelectedChat(chat);
        setPage("chat");
      },
    }));

    const projectChatCommands = Object.keys(projectChats || {}).flatMap(
      (project) =>
        (projectChats[project] || []).map((chat) => ({
          id: `project-chat-${project}-${chat}`,
          type: "Project Chat",
          icon: "chat",
          title: chat,
          subtitle: `Project: ${project}`,
          action: () => {
            setSelectedProject(project);
            setSelectedChat(chat);
            setPage("chat");
          },
        }))
    );

    const projectCommands = projects.map((project) => ({
      id: `project-${project}`,
      type: "Project",
      icon: "project",
      title: project,
      subtitle: `${(projectChats[project] || []).length} chats`,
      action: () => {
        setSelectedProject(project);
        setPage("project");
      },
    }));

    const pageCommands = [
      {
        id: "page-home",
        type: "Page",
        icon: "home",
        title: "Home",
        subtitle: "Open dashboard",
        action: () => setPage("home"),
      },
      {
        id: "page-search",
        type: "Page",
        icon: "search",
        title: "Search",
        subtitle: "Open global search",
        action: () => setPage("search"),
      },
      {
        id: "page-archived",
        type: "Page",
        icon: "archive",
        title: "Archived Items",
        subtitle: "Open archived chats and projects",
        action: () => setPage("archived"),
      },
      {
        id: "page-settings",
        type: "Page",
        icon: "settings",
        title: "Settings",
        subtitle: "Open account settings",
        action: () => setPage("settings"),
      },
      {
        id: "page-help",
        type: "Page",
        icon: "help",
        title: "Help & Support",
        subtitle: "Open help page",
        action: () => setPage("help"),
      },
    ];

    return [
      ...pageCommands,
      ...projectCommands,
      ...globalChatCommands,
      ...projectChatCommands,
    ];
  }, [
    chats,
    projects,
    projectChats,
    setSelectedChat,
    setSelectedProject,
    setPage,
  ]);

  const filteredCommands = commands.filter((command) => {
    const searchText = `${command.title} ${command.subtitle} ${command.type}`
      .toLowerCase()
      .trim();

    return searchText.includes(query.toLowerCase().trim());
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const commandPressed = isMac ? e.metaKey : e.ctrlKey;

      if (commandPressed && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length === 0
            ? 0
            : prev === filteredCommands.length - 1
            ? 0
            : prev + 1
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredCommands.length === 0
            ? 0
            : prev === 0
            ? filteredCommands.length - 1
            : prev - 1
        );
      }

      if (e.key === "Enter") {
        e.preventDefault();

        const selectedCommand = filteredCommands[selectedIndex];

        if (selectedCommand) {
          selectedCommand.action();
          setIsOpen(false);
          setQuery("");
          setSelectedIndex(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, filteredCommands, selectedIndex]);

  if (!isOpen) return null;

  const iconSymbols = {
    chat: "○",
    project: "◇",
    home: "⌂",
    search: "⌕",
    archive: "▣",
    settings: "⚙",
    help: "?",
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Search OrbitalAI" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIsOpen(false); setQuery(""); setSelectedIndex(0); } }} className="fixed inset-0 z-[9999] flex items-start justify-center bg-[#01040c]/80 px-3 pt-[10vh] backdrop-blur-md sm:px-6">
      <div className="relative w-full max-w-[640px] overflow-hidden rounded-[26px] border border-blue-200/[0.18] bg-[linear-gradient(150deg,rgba(8,20,40,0.97),rgba(4,10,25,0.98))] shadow-[0_30px_100px_rgba(0,0,0,0.65),0_0_45px_rgba(76,112,255,0.10)]">
        <div aria-hidden="true" className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/70 to-transparent" />
        <div className="border-b border-white/[0.08] p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/15 px-4 py-3 focus-within:border-violet-300/30 focus-within:ring-2 focus-within:ring-violet-400/10">
            <span className="text-xl text-violet-300">⌕</span>

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search chats, projects, or pages…"
              className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-600 sm:text-lg"
            />

            <button
              onClick={() => {
                setIsOpen(false);
                setQuery("");
                setSelectedIndex(0);
              }}
              aria-label="Close command palette"
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
            >
              ESC
            </button>
          </div>
        </div>

        <div className="border-b border-white/[0.06] px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Quick navigation</div>

        <div className="max-h-[min(52vh,430px)] overflow-y-auto p-2.5 sm:p-3">
          {filteredCommands.length === 0 ? (
            <div className="px-6 py-12 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-slate-600">⌕</div><p className="mt-3 text-sm font-medium text-slate-400">No results found</p><p className="mt-1 text-xs text-slate-600">Try a different chat, project, or page name.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => {
                    command.action();
                    setIsOpen(false);
                    setQuery("");
                    setSelectedIndex(0);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:px-4 ${
                    selectedIndex === index
                      ? "border-violet-300/25 bg-gradient-to-r from-blue-500/10 to-violet-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]"
                      : "border-transparent bg-white/[0.018] hover:border-white/[0.08] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${selectedIndex === index ? "border-violet-300/20 bg-violet-400/10 text-violet-200" : "border-white/[0.07] bg-[#111d33] text-slate-400"}`}>
                    {iconSymbols[command.icon] || "•"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-slate-100 sm:text-base">{command.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      <span className="text-slate-400">{command.type}</span> · {command.subtitle}
                    </p>
                  </div>

                  <span className={`hidden rounded-lg border px-2 py-1 text-[10px] sm:inline ${selectedIndex === index ? "border-violet-300/15 text-violet-300" : "border-white/[0.06] text-slate-600"}`}>↵</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-5 border-t border-white/[0.08] bg-black/10 px-5 py-3 text-[10px] text-slate-600 sm:justify-between sm:text-xs">
          <span><kbd className="mr-1 text-slate-400">↑ ↓</kbd> Navigate</span>
          <span><kbd className="mr-1 text-slate-400">↵</kbd> Open</span>
          <span><kbd className="mr-1 text-slate-400">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
