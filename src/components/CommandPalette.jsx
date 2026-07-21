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
      icon: "💬",
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
          icon: "💬",
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
      icon: "📂",
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
        icon: "🏠",
        title: "Home",
        subtitle: "Open dashboard",
        action: () => setPage("home"),
      },
      {
        id: "page-search",
        type: "Page",
        icon: "🔍",
        title: "Search",
        subtitle: "Open global search",
        action: () => setPage("search"),
      },
      {
        id: "page-archived",
        type: "Page",
        icon: "🗄️",
        title: "Archived Items",
        subtitle: "Open archived chats and projects",
        action: () => setPage("archived"),
      },
      {
        id: "page-settings",
        type: "Page",
        icon: "⚙️",
        title: "Settings",
        subtitle: "Open account settings",
        action: () => setPage("settings"),
      },
      {
        id: "page-workflow",
        type: "Page",
        icon: "🤖",
        title: "AI Workflow",
        subtitle: "Open AI workflow page",
        action: () => setPage("workflow"),
      },
      {
        id: "page-help",
        type: "Page",
        icon: "❓",
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 px-3 pt-16 sm:px-6 sm:pt-28">
      <div className="w-full max-w-[720px] overflow-hidden rounded-2xl border border-[#1B2540] bg-[#08111F] shadow-2xl">
        <div className="p-5 border-b border-[#1B2540]">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-xl">⌘K</span>

            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search chats, projects, pages..."
              className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-lg"
            />

            <button
              onClick={() => {
                setIsOpen(false);
                setQuery("");
                setSelectedIndex(0);
              }}
              className="text-gray-500 hover:text-white"
            >
              ESC
            </button>
          </div>
        </div>

        <div className="max-h-[460px] overflow-y-auto p-3">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-gray-500 text-center">
              No matching commands found.
            </div>
          ) : (
            <div className="space-y-2">
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
                  className={`w-full text-left p-4 rounded-xl flex items-center gap-4 ${
                    selectedIndex === index
                      ? "bg-purple-700/30 border border-purple-600"
                      : "bg-[#101827] border border-transparent hover:border-[#1B2540]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#151E33] flex items-center justify-center text-xl">
                    {command.icon}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">{command.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {command.type} • {command.subtitle}
                    </p>
                  </div>

                  <span className="text-gray-500">Enter ↵</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#1B2540] text-xs text-gray-500 flex justify-between">
          <span>↑ ↓ to navigate</span>
          <span>Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
