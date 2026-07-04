function Archived({
  chats,
  setChats,
  projects,
  setProjects,
  projectChats,
  setProjectChats,
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

    if (sourceProject) {
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

    setArchivedChats(archivedChats.filter((_, i) => i !== index));
    addActivity("archive", "Archived chat permanently deleted", chatName);
  };

  const restoreProject = (index) => {
    const project = archivedProjects[index];

    if (!projects.includes(project)) {
      setProjects([...projects, project]);
    }

    if (!projectChats[project]) {
      setProjectChats({
        ...projectChats,
        [project]: [],
      });
    }

    setArchivedProjects(archivedProjects.filter((_, i) => i !== index));
    addActivity("archive", "Project restored", project);
  };

  const deleteArchivedProject = (index) => {
    const project = archivedProjects[index];

    setArchivedProjects(archivedProjects.filter((_, i) => i !== index));
    addActivity("archive", "Archived project permanently deleted", project);
  };

  const totalArchived = archivedChats.length + archivedProjects.length;

  return (
    <div className="relative min-h-screen bg-[#020817] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      <div className="relative px-10 py-8 pb-16">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>🗄️</span>
            <span>Archive</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Archived Items
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Restore chats and projects back into your workspace, or permanently
            delete items you no longer need.
          </p>
        </header>

        <section className="grid grid-cols-3 gap-4 mb-8">
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

        <div className="grid grid-cols-2 gap-6">
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
                        className="bg-[#101827] border border-[#1B2540] rounded-2xl p-5 flex justify-between items-center gap-5 hover:border-purple-500/50 transition"
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

                        <div className="flex gap-3 shrink-0">
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
                  {archivedProjects.map((project, index) => (
                    <div
                      key={`${project}-${index}`}
                      className="bg-[#101827] border border-[#1B2540] rounded-2xl p-5 flex justify-between items-center gap-5 hover:border-purple-500/50 transition"
                    >
                      <p className="font-semibold truncate">📂 {project}</p>

                      <div className="flex gap-3 shrink-0">
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
                  ))}
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