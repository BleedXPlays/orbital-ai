import { useState } from "react";

function BulkEdit({
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
}) {
  const [selectedChats, setSelectedChats] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);

  const toggleChat = (chat) => {
    if (selectedChats.includes(chat)) {
      setSelectedChats(selectedChats.filter((item) => item !== chat));
    } else {
      setSelectedChats([...selectedChats, chat]);
    }
  };

  const toggleProject = (project) => {
    if (selectedProjects.includes(project)) {
      setSelectedProjects(selectedProjects.filter((item) => item !== project));
    } else {
      setSelectedProjects([...selectedProjects, project]);
    }
  };

  const archiveSelected = () => {
    setArchivedChats([...archivedChats, ...selectedChats]);
    setArchivedProjects([...archivedProjects, ...selectedProjects]);

    setChats(chats.filter((chat) => !selectedChats.includes(chat)));
    setProjects(projects.filter((project) => !selectedProjects.includes(project)));

    const updatedProjectChats = {};

    Object.keys(projectChats).forEach((project) => {
      if (!selectedProjects.includes(project)) {
        updatedProjectChats[project] = projectChats[project].filter(
          (chat) => !selectedChats.includes(chat)
        );
      }
    });

    setProjectChats(updatedProjectChats);
    setSelectedChats([]);
    setSelectedProjects([]);
  };

  const deleteSelected = () => {
    const confirmDelete = confirm("Delete selected items?");
    if (!confirmDelete) return;

    setChats(chats.filter((chat) => !selectedChats.includes(chat)));
    setProjects(projects.filter((project) => !selectedProjects.includes(project)));

    const updatedProjectChats = {};

    Object.keys(projectChats).forEach((project) => {
      if (!selectedProjects.includes(project)) {
        updatedProjectChats[project] = projectChats[project].filter(
          (chat) => !selectedChats.includes(chat)
        );
      }
    });

    setProjectChats(updatedProjectChats);
    setSelectedChats([]);
    setSelectedProjects([]);
  };

  const duplicateSelected = () => {
    const duplicatedChats = selectedChats.map((chat) => `${chat} Copy`);
    const duplicatedProjects = selectedProjects.map((project) => `${project} Copy`);

    setChats([...chats, ...duplicatedChats]);
    setProjects([...projects, ...duplicatedProjects]);

    const updatedProjectChats = { ...projectChats };

    selectedProjects.forEach((project) => {
      updatedProjectChats[`${project} Copy`] = [...(projectChats[project] || [])];
    });

    setProjectChats(updatedProjectChats);
    setSelectedChats([]);
    setSelectedProjects([]);
  };

  const moveSelectedChatsToProject = () => {
    if (selectedChats.length === 0) {
      alert("Select at least one chat to move.");
      return;
    }

    const projectName = prompt(
      `Move selected chats to which project?\n\nAvailable projects:\n${projects.join(
        "\n"
      )}`
    );

    if (!projectName || !projectName.trim()) return;

    const trimmedProjectName = projectName.trim();

    if (!projects.includes(trimmedProjectName)) {
      alert("Project not found. Please type the exact project name.");
      return;
    }

    const currentChats = projectChats[trimmedProjectName] || [];

    const newChatsToAdd = selectedChats.filter(
      (chat) => !currentChats.includes(chat)
    );

    setProjectChats({
      ...projectChats,
      [trimmedProjectName]: [...currentChats, ...newChatsToAdd],
    });

    setSelectedChats([]);
  };

  const clearSelection = () => {
    setSelectedChats([]);
    setSelectedProjects([]);
  };

  const totalSelected = selectedChats.length + selectedProjects.length;

  return (
    <div className="relative min-h-screen bg-[#020817] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      <div className="relative px-10 py-8 pb-16">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>✏️</span>
            <span>Bulk Edit</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Bulk Edit Mode
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Select multiple chats or projects and manage them together.
          </p>
        </header>

        <section className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Selected items</p>
            <h2 className="text-3xl font-bold mt-2">{totalSelected}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Selected chats</p>
            <h2 className="text-3xl font-bold mt-2">{selectedChats.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Selected projects</p>
            <h2 className="text-3xl font-bold mt-2">
              {selectedProjects.length}
            </h2>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_340px] gap-6">
          <main className="grid grid-cols-2 gap-6">
            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Chats</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Select global chats for bulk actions.
                </p>
              </div>

              <div className="p-6">
                {chats.length === 0 ? (
                  <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400 text-center">
                    No global chats available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chats.map((chat) => {
                      const selected = selectedChats.includes(chat);

                      return (
                        <label
                          key={chat}
                          className={`flex items-center gap-4 rounded-2xl p-4 cursor-pointer border transition ${
                            selected
                              ? "bg-purple-600/15 border-purple-500/50"
                              : "bg-[#101827] border-[#1B2540] hover:border-purple-500/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleChat(chat)}
                            className="accent-purple-600"
                          />

                          <span className="truncate">💬 {chat}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Projects</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Select project workspaces for bulk actions.
                </p>
              </div>

              <div className="p-6">
                {projects.length === 0 ? (
                  <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400 text-center">
                    No projects available.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => {
                      const selected = selectedProjects.includes(project);

                      return (
                        <label
                          key={project}
                          className={`flex items-center gap-4 rounded-2xl p-4 cursor-pointer border transition ${
                            selected
                              ? "bg-purple-600/15 border-purple-500/50"
                              : "bg-[#101827] border-[#1B2540] hover:border-purple-500/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleProject(project)}
                            className="accent-purple-600"
                          />

                          <span className="truncate">📂 {project}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-6 h-fit shadow-2xl shadow-purple-950/10">
            <h2 className="text-xl font-bold mb-2">
              {totalSelected} items selected
            </h2>

            <p className="text-gray-400 text-sm mb-6">
              Choose an action to apply to the selected chats and projects.
            </p>

            <div className="space-y-3">
              <button
                onClick={duplicateSelected}
                disabled={totalSelected === 0}
                className="w-full bg-[#101827] border border-[#1B2540] rounded-2xl p-4 text-left disabled:opacity-40 hover:border-purple-500/50"
              >
                📑 Duplicate
              </button>

              <button
                onClick={moveSelectedChatsToProject}
                disabled={selectedChats.length === 0}
                className="w-full bg-[#101827] border border-[#1B2540] rounded-2xl p-4 text-left disabled:opacity-40 hover:border-purple-500/50"
              >
                📁 Move selected chats
              </button>

              <button
                onClick={archiveSelected}
                disabled={totalSelected === 0}
                className="w-full bg-[#101827] border border-[#1B2540] rounded-2xl p-4 text-left disabled:opacity-40 hover:border-purple-500/50"
              >
                🗄️ Archive
              </button>

              <button
                onClick={deleteSelected}
                disabled={totalSelected === 0}
                className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-left text-red-300 disabled:opacity-40 hover:bg-red-500/20"
              >
                🗑️ Delete
              </button>

              <button
                onClick={clearSelection}
                disabled={totalSelected === 0}
                className="w-full bg-[#101827] border border-[#1B2540] rounded-2xl p-4 text-left disabled:opacity-40 hover:border-purple-500/50"
              >
                Clear selection
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default BulkEdit;