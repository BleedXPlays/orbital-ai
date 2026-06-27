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

      addActivity("archive", "Chat restored to project", `${chatName} • ${sourceProject}`);
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

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-4">Archived Items</h1>

      <p className="text-gray-400 mb-8">
        Restore chats back to their original place, or permanently delete them.
      </p>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5 text-purple-400">
            Archived Chats
          </h2>

          {archivedChats.length === 0 ? (
            <p className="text-gray-500">No archived chats yet.</p>
          ) : (
            <div className="space-y-3">
              {archivedChats.map((chat, index) => {
                const chatName = getChatName(chat);
                const sourceProject = getSourceProject(chat);

                return (
                  <div
                    key={`${chatName}-${index}`}
                    className="bg-[#101827] border border-gray-800 rounded-xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-semibold">💬 {chatName}</p>

                      <p className="text-gray-500 text-sm mt-1">
                        {sourceProject
                          ? `From project: ${sourceProject}`
                          : "From global chats"}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => restoreChat(index)}
                        className="text-green-400 hover:text-green-300"
                      >
                        Restore
                      </button>

                      <button
                        onClick={() => deleteArchivedChat(index)}
                        className="text-red-400 hover:text-red-300"
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

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5 text-purple-400">
            Archived Projects
          </h2>

          {archivedProjects.length === 0 ? (
            <p className="text-gray-500">No archived projects yet.</p>
          ) : (
            <div className="space-y-3">
              {archivedProjects.map((project, index) => (
                <div
                  key={`${project}-${index}`}
                  className="bg-[#101827] border border-gray-800 rounded-xl p-4 flex justify-between items-center"
                >
                  <span>📂 {project}</span>

                  <div className="flex gap-3">
                    <button
                      onClick={() => restoreProject(index)}
                      className="text-green-400 hover:text-green-300"
                    >
                      Restore
                    </button>

                    <button
                      onClick={() => deleteArchivedProject(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Archived;