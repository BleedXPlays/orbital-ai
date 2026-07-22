import { useState } from "react";

function Search({
  chats,
  projects,
  projectChats,
  chatMessages,
  projectFiles,
  projectNotes,
  setSelectedChat,
  setSelectedProject,
  setPage,
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const lowerQuery = query.toLowerCase();
  const allResults = [];

  chats.forEach((chat) => {
    if (chat.toLowerCase().includes(lowerQuery)) {
      allResults.push({
        icon: "💬",
        title: chat,
        desc: "Global Chat",
        type: "Chats",
        action: () => {
          setSelectedChat(chat);
          setPage("chat");
        },
      });
    }
  });

  projects.forEach((project) => {
    if (project.toLowerCase().includes(lowerQuery)) {
      allResults.push({
        icon: "📂",
        title: project,
        desc: `Project • ${(projectChats[project] || []).length} chats`,
        type: "Projects",
        action: () => {
          setSelectedProject(project);
          setPage("project");
        },
      });
    }
  });

  Object.keys(projectChats || {}).forEach((project) => {
    projectChats[project].forEach((chat) => {
      if (chat.toLowerCase().includes(lowerQuery)) {
        allResults.push({
          icon: "💬",
          title: chat,
          desc: `Project Chat • ${project}`,
          type: "Chats",
          action: () => {
            setSelectedChat(chat);
            setSelectedProject(project);
            setPage("chat");
          },
        });
      }
    });
  });

  Object.keys(chatMessages || {}).forEach((chatName) => {
    const messages = chatMessages[chatName] || [];

    const matchedMessages = messages.filter(
      (message) =>
        message.text && message.text.toLowerCase().includes(lowerQuery)
    );

    if (matchedMessages.length > 0) {
      let projectName = "";

      Object.keys(projectChats || {}).forEach((project) => {
        if (projectChats[project].includes(chatName)) {
          projectName = project;
        }
      });

      allResults.push({
        icon: "✉️",
        title: chatName,
        desc: projectName ? `Project Chat • ${projectName}` : "Chat",
        subDesc: `${matchedMessages.length} matching message${
          matchedMessages.length > 1 ? "s" : ""
        }`,
        type: "Messages",
        action: () => {
          setSelectedChat(chatName);

          if (projectName) {
            setSelectedProject(projectName);
          }

          setPage("chat");
        },
        key: `messages-${chatName}`,
      });
    }
  });

  Object.keys(projectFiles || {}).forEach((project) => {
    projectFiles[project].forEach((file, index) => {
      if (file.name.toLowerCase().includes(lowerQuery)) {
        const isImage = file.type && file.type.startsWith("image");

        allResults.push({
          icon: isImage ? "🖼️" : "📄",
          title: file.name,
          desc: `${isImage ? "Image" : "File"} • ${project} • ${file.size}`,
          type: isImage ? "Images" : "Files",
          action: () => {
            setSelectedProject(project);
            setPage("project");
          },
          key: `${project}-${file.name}-${index}`,
        });
      }
    });
  });

  Object.keys(projectNotes || {}).forEach((project) => {
    projectNotes[project].forEach((note, index) => {
      const noteText = `${note.title} ${note.body}`.toLowerCase();

      if (noteText.includes(lowerQuery)) {
        allResults.push({
          icon: "📝",
          title: note.title,
          desc: `Note • ${project}`,
          subDesc: note.body.slice(0, 90),
          type: "Notes",
          action: () => {
            setSelectedProject(project);
            setPage("project");
          },
          key: `${project}-note-${index}`,
        });
      }
    });
  });

  const visibleResults =
    query.trim() === ""
      ? []
      : activeTab === "All"
      ? allResults
      : allResults.filter((result) => result.type === activeTab);

  const tabs = [
    "All",
    "Chats",
    "Projects",
    "Messages",
    "Files",
    "Images",
    "Notes",
  ];

  const countByType = {
    All: allResults.length,
    Chats: allResults.filter((item) => item.type === "Chats").length,
    Projects: allResults.filter((item) => item.type === "Projects").length,
    Messages: allResults.filter((item) => item.type === "Messages").length,
    Files: allResults.filter((item) => item.type === "Files").length,
    Images: allResults.filter((item) => item.type === "Images").length,
    Notes: allResults.filter((item) => item.type === "Notes").length,
  };

  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto overflow-x-hidden text-white">
      <div className="orbital-earth-horizon pointer-events-none absolute inset-0 opacity-35" />

      <div className="relative px-4 pb-12 pt-20 sm:px-6 sm:py-8 sm:pb-16 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
            Search workspace
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-5">
          <main className="overflow-hidden bg-transparent">
            <div className="pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="orbital-content-panel flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-3 focus-within:border-purple-500/70 sm:px-5 sm:py-3.5">
                  <span className="text-xl text-gray-500">⌕</span>

                  <input
                    type="text"
                    value={query}
                    placeholder="Search your workspace..."
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base text-gray-200 outline-none placeholder:text-gray-500"
                    autoFocus
                  />
                </div>

                <button
                  onClick={() => setQuery("")}
                  className="rounded-xl border border-[#1B2540] bg-[#101827]/70 px-5 py-3 text-gray-400 hover:text-white"
                >
                  Clear
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-lg border px-4 py-2 text-sm transition ${
                      activeTab === tab
                        ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                        : "text-gray-400 bg-[#101827]/70 border border-transparent hover:border-[#1B2540]"
                    }`}
                  >
                    {tab}
                    <span className="ml-2 text-xs text-gray-500">
                      {query.trim() ? countByType[tab] : 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              {query.trim() === "" ? (
                <div className="min-h-[420px] rounded-3xl bg-[#101827]/70 border border-[#1B2540] flex flex-col items-center justify-center text-center p-10">
                  <div className="w-20 h-20 rounded-3xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-4xl mb-6">
                    🔍
                  </div>

                  <h2 className="text-2xl font-bold mb-2">
                    Start typing to search
                  </h2>

                  <p className="text-gray-400 max-w-md">
                    Search across global chats, project chats, messages, files,
                    uploaded images and notes.
                  </p>
                </div>
              ) : visibleResults.length === 0 ? (
                <div className="min-h-[420px] rounded-3xl bg-[#101827]/70 border border-[#1B2540] flex flex-col items-center justify-center text-center p-10">
                  <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-4xl mb-6">
                    ✕
                  </div>

                  <h2 className="text-2xl font-bold mb-2">No results found</h2>

                  <p className="text-gray-400">
                    No results found for{" "}
                    <span className="text-purple-300">“{query}”</span>.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-white/[0.12] bg-[#06101e]/62">
                  {visibleResults.map((result, index) => (
                    <button
                      key={result.key || `${result.title}-${index}`}
                      onClick={result.action}
                      className="flex w-full items-center gap-4 border-b border-white/[0.08] bg-transparent px-4 py-4 text-left transition last:border-b-0 hover:bg-white/[0.035]"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/15 bg-purple-600/[0.08] text-base">
                        {result.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-medium">
                          {result.title}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {result.desc}
                        </p>

                        {result.subDesc && (
                          <p className="text-purple-300 text-sm mt-2 line-clamp-2">
                            {result.subDesc}
                          </p>
                        )}
                      </div>

                      <span className="text-sm text-purple-400">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="hidden">
            <h2 className="text-xl font-bold mb-6">Search summary</h2>

            <div className="space-y-5">
              <div>
                <p className="text-gray-400 text-sm mb-1">Query</p>
                <p className="font-semibold break-words">
                  {query.trim() || "No search yet"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Active filter</p>
                <p className="font-semibold">{activeTab}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Results found</p>
                <p className="font-semibold">{visibleResults.length}</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
              <p className="font-semibold mb-2">Search coverage</p>

              <p className="text-gray-400 text-sm leading-relaxed">
                OrbitalAI currently searches chats, projects, messages, files,
                images and project notes.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
              <p className="font-semibold mb-3">Result types</p>

              <div className="space-y-3 text-sm">
                {tabs.slice(1).map((tab) => (
                  <div key={tab} className="flex justify-between">
                    <span className="text-gray-400">{tab}</span>
                    <span className="text-gray-200">
                      {query.trim() ? countByType[tab] : 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Search;
