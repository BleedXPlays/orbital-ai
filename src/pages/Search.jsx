import { useState } from "react";

function Search({
  chats,
  projects,
  projectChats,
  chatMessages,
  projectFiles,
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
        desc: "Chat",
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

  Object.keys(projectChats).forEach((project) => {
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

 Object.keys(chatMessages).forEach((chatName) => {
  const messages = chatMessages[chatName] || [];

  const matchedMessages = messages.filter(
    (message) =>
      message.text &&
      message.text.toLowerCase().includes(lowerQuery)
  );

  if (matchedMessages.length > 0) {
    let projectName = "";

    Object.keys(projectChats).forEach((project) => {
      if (projectChats[project].includes(chatName)) {
        projectName = project;
      }
    });

    allResults.push({
      icon: "💬",
      title: chatName,
      desc: projectName
        ? `Project Chat • ${projectName}`
        : "Chat",
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

  Object.keys(projectFiles).forEach((project) => {
    projectFiles[project].forEach((file, index) => {
      if (file.name.toLowerCase().includes(lowerQuery)) {
        const isImage = file.type.startsWith("image");

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

  const visibleResults =
    query.trim() === ""
      ? []
      : activeTab === "All"
      ? allResults
      : allResults.filter((result) => result.type === activeTab);

  const tabs = ["All", "Chats", "Projects", "Messages", "Files", "Images"];

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-2">Global Search</h1>

      <p className="text-gray-400 mb-8">
        Search across chats, projects, messages, files and images.
      </p>

      <div className="grid grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value={query}
              placeholder="Search OrbitalAI..."
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 p-4 rounded-xl bg-[#101827] border border-purple-700 outline-none"
            />

            <button
              onClick={() => setQuery("")}
              className="px-6 rounded-xl bg-[#101827] border border-gray-700"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-xl ${
                  activeTab === tab ? "bg-purple-700" : "bg-[#101827]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {query.trim() === "" ? (
            <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-8 text-gray-400">
              Start typing to search your workspace.
            </div>
          ) : visibleResults.length === 0 ? (
            <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-8 text-gray-400">
              No results found for{" "}
              <span className="text-purple-400">“{query}”</span>.
            </div>
          ) : (
            <div className="space-y-4">
              {visibleResults.map((result, index) => (
                <button
                  key={result.key || `${result.title}-${index}`}
                  onClick={result.action}
                  className="w-full text-left bg-[#08111F] border border-[#1B2540] rounded-2xl p-5 flex items-center gap-5 hover:border-purple-700"
                >
                  <div className="text-3xl">{result.icon}</div>

                  <div>
                    <h3 className="text-xl font-bold">{result.title}</h3>
                    <p className="text-gray-400">{result.desc}</p>

{result.subDesc && (
  <p className="text-purple-400 text-sm mt-1">
    {result.subDesc}
  </p>
)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6 h-fit">
          <h2 className="text-2xl font-bold mb-6">Search Summary</h2>

          <p className="text-gray-400 mb-2">Query</p>
          <p className="font-semibold mb-6">
            {query.trim() || "No search yet"}
          </p>

          <p className="text-gray-400 mb-2">Active Filter</p>
          <p className="font-semibold mb-6">{activeTab}</p>

          <p className="text-gray-400 mb-2">Results Found</p>
          <p className="font-semibold mb-6">{visibleResults.length}</p>

          <div className="border-t border-gray-800 pt-5 mt-5">
            <p className="text-purple-400 mb-3">Searches</p>
            <p className="text-gray-400 text-sm">
              Chats, projects, project chats, messages, files and images are now
              searchable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;