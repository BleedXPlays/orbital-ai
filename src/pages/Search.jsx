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
    <div className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#020817] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      <div className="relative px-4 pb-12 pt-16 sm:px-6 sm:py-8 sm:pb-16 lg:px-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>🔍</span>
            <span>Global Search</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Search OrbitalAI
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Find chats, projects, messages, files, images and notes across your
            entire workspace.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
          <main className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
            <div className="border-b border-[#1B2540] bg-[#020817]/50 p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-[#1B2540] bg-[#101827] px-4 py-3 focus-within:border-purple-500/70 sm:rounded-3xl sm:px-5 sm:py-4">
                  <span className="text-2xl text-gray-500">⌕</span>

                  <input
                    type="text"
                    value={query}
                    placeholder="Search your workspace..."
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-base text-gray-200 outline-none placeholder:text-gray-500 sm:text-lg"
                    autoFocus
                  />
                </div>

                <button
                  onClick={() => setQuery("")}
                  className="rounded-2xl bg-[#101827] border border-[#1B2540] px-6 py-3 text-gray-300 hover:bg-[#141f33]"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-5">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3 rounded-2xl transition ${
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

            <div className="p-4 sm:p-6">
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
                <div className="space-y-3">
                  {visibleResults.map((result, index) => (
                    <button
                      key={result.key || `${result.title}-${index}`}
                      onClick={result.action}
                      className="w-full text-left bg-[#101827] border border-[#1B2540] rounded-2xl p-5 flex items-center gap-5 hover:border-purple-500/60 transition"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-2xl shrink-0">
                        {result.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold truncate">
                          {result.title}
                        </h3>

                        <p className="text-gray-400 text-sm mt-1">
                          {result.desc}
                        </p>

                        {result.subDesc && (
                          <p className="text-purple-300 text-sm mt-2 line-clamp-2">
                            {result.subDesc}
                          </p>
                        )}
                      </div>

                      <span className="text-2xl text-purple-400">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </main>

          <aside className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-6 h-fit shadow-2xl shadow-purple-950/10">
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
