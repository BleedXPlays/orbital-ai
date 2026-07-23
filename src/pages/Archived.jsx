function Archived({
  chats,
  setChats,
  projects,
  setProjects,
  projectChats,
  setProjectChats,
  projectFiles,
  setProjectFiles,
  projectNotes,
  setProjectNotes,
  chatMessages,
  setChatMessages,
  archivedChats,
  setArchivedChats,
  archivedProjects,
  setArchivedProjects,
  addActivity,
}) {
  const getChatName = (chat) => {
    return typeof chat === "string" ? chat : chat.name;
  };

  const getSourceProject = (chat) => {
    return typeof chat === "string" ? null : chat.sourceProject;
  };

  const restoreChat = (index) => {
    const archivedChat = archivedChats[index];
    const chatName = getChatName(archivedChat);
    const sourceProject = getSourceProject(archivedChat);

    if (sourceProject && projects.includes(sourceProject)) {
      const currentProjectChats = projectChats[sourceProject] || [];

      setProjectChats({
        ...projectChats,
        [sourceProject]: currentProjectChats.includes(chatName)
          ? currentProjectChats
          : [...currentProjectChats, chatName],
      });

      addActivity(
        "archive",
        "Chat restored to project",
        `${chatName} • ${sourceProject}`
      );
    } else {
      if (!chats.includes(chatName)) {
        setChats([...chats, chatName]);
      }

      addActivity("archive", "Global chat restored", chatName);
    }

    setArchivedChats(archivedChats.filter((_, i) => i !== index));
  };

  const deleteArchivedChat = (index) => {
    const archivedChat = archivedChats[index];
    const chatName = getChatName(archivedChat);

    if (!window.confirm(`Permanently delete "${chatName}" and all of its messages?`)) return;
    setArchivedChats(archivedChats.filter((_, i) => i !== index));
    const updatedChatMessages = { ...chatMessages };
    delete updatedChatMessages[chatName];
    setChatMessages(updatedChatMessages);
    addActivity("archive", "Archived chat permanently deleted", chatName);
  };

  const restoreProject = (index) => {
    const archivedProject = archivedProjects[index];
    const project = typeof archivedProject === "string" ? archivedProject : archivedProject.name;
    const savedChats = typeof archivedProject === "string" ? [] : archivedProject.chats || [];
    const savedFiles = typeof archivedProject === "string" ? [] : archivedProject.files || [];
    const savedNotes = typeof archivedProject === "string" ? [] : archivedProject.notes || [];

    if (projects.includes(project)) {
      window.alert(`A project named "${project}" already exists. Rename the active project before restoring this one.`);
      return;
    }

    setProjects([...projects, project]);

    setProjectChats({ ...projectChats, [project]: savedChats });
    setProjectFiles({ ...projectFiles, [project]: savedFiles });
    setProjectNotes({ ...projectNotes, [project]: savedNotes });

    setArchivedProjects(archivedProjects.filter((_, i) => i !== index));
    addActivity("archive", "Project restored", project);
  };

  const deleteArchivedProject = (index) => {
    const archivedProject = archivedProjects[index];
    const project = typeof archivedProject === "string" ? archivedProject : archivedProject.name;
    const savedChats = typeof archivedProject === "string" ? [] : archivedProject.chats || [];

    if (!window.confirm(`Permanently delete "${project}", its files, notes, chats, and chat history?`)) return;
    setArchivedProjects(archivedProjects.filter((_, i) => i !== index));
    const updatedProjectChats = { ...projectChats };
    const updatedProjectFiles = { ...projectFiles };
    const updatedProjectNotes = { ...projectNotes };
    delete updatedProjectChats[project];
    delete updatedProjectFiles[project];
    delete updatedProjectNotes[project];
    setProjectChats(updatedProjectChats);
    setProjectFiles(updatedProjectFiles);
    setProjectNotes(updatedProjectNotes);
    const updatedChatMessages = { ...chatMessages };
    savedChats.forEach((chat) => delete updatedChatMessages[chat]);
    setChatMessages(updatedChatMessages);
    addActivity("archive", "Archived project permanently deleted", project);
  };

  const totalArchived = archivedChats.length + archivedProjects.length;

  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto overflow-x-hidden text-white">
      <div className="orbital-earth-horizon pointer-events-none absolute inset-0 opacity-55" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(91,110,255,0.12),transparent_35%),radial-gradient(circle_at_90%_75%,rgba(147,51,234,0.07),transparent_30%)]" />

      <div className="relative px-4 pb-12 pt-16 sm:px-6 sm:py-8 sm:pb-16 lg:px-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>🗄️</span>
            <span>Archive</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Archived Items
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Restore chats and projects back into your workspace, or permanently
            delete items you no longer need.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 sm:mb-8">
          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Total archived</p>
            <h2 className="text-3xl font-bold mt-2">{totalArchived}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Archived chats</p>
            <h2 className="text-3xl font-bold mt-2">
              {archivedChats.length}
            </h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Archived projects</p>
            <h2 className="text-3xl font-bold mt-2">
              {archivedProjects.length}
            </h2>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
            <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
              <h2 className="text-2xl font-bold">Archived chats</h2>
              <p className="text-gray-400 text-sm mt-1">
                Chats removed from global chat or project spaces.
              </p>
            </div>

            <div className="p-6">
              {archivedChats.length === 0 ? (
                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400 text-center">
                  No archived chats yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedChats.map((chat, index) => {
                    const chatName = getChatName(chat);
                    const sourceProject = getSourceProject(chat);

                    return (
                      <div
                        key={`${chatName}-${index}`}
                        className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-[#1B2540] bg-[#101827] p-5 transition hover:border-purple-500/50 sm:flex-row sm:items-center sm:gap-5"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            💬 {chatName}
                          </p>

                          <p className="text-gray-500 text-sm mt-1">
                            {sourceProject
                              ? `From project: ${sourceProject}`
                              : "From global chats"}
                          </p>
                        </div>

                        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:gap-3">
                          <button
                            onClick={() => restoreChat(index)}
                            className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20"
                          >
                            Restore
                          </button>

                          <button
                            onClick={() => deleteArchivedChat(index)}
                            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
            <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
              <h2 className="text-2xl font-bold">Archived projects</h2>
              <p className="text-gray-400 text-sm mt-1">
                Project workspaces removed from your active sidebar.
              </p>
            </div>

            <div className="p-6">
              {archivedProjects.length === 0 ? (
                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400 text-center">
                  No archived projects yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {archivedProjects.map((archivedProject, index) => {
                    const project = typeof archivedProject === "string" ? archivedProject : archivedProject.name;
                    const chatCount = typeof archivedProject === "string" ? 0 : (archivedProject.chats || []).length;
                    return (
                    <div
                      key={`${project}-${index}`}
                      className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-[#1B2540] bg-[#101827] p-5 transition hover:border-purple-500/50 sm:flex-row sm:items-center sm:gap-5"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">📂 {project}</p>
                        <p className="mt-1 text-sm text-gray-500">{chatCount} saved chat{chatCount === 1 ? "" : "s"}</p>
                      </div>

                      <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:gap-3">
                        <button
                          onClick={() => restoreProject(index)}
                          className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-300 hover:bg-green-500/20"
                        >
                          Restore
                        </button>

                        <button
                          onClick={() => deleteArchivedProject(index)}
                          className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Archived;
