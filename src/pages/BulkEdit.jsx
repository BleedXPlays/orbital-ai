import { useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetProject, setTargetProject] = useState("");
  const [notice, setNotice] = useState("");
  const [activeCollection, setActiveCollection] = useState("chats");

  const showNotice = (message) => {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 3000);
  };

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
    if (totalSelected === 0) return;
    setConfirmModalOpen(true);
  };

  const confirmDeleteSelected = () => {
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
    setConfirmModalOpen(false);
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

  const openMoveSelectedChatsModal = () => {
    if (selectedChats.length === 0) {
      showNotice("Select at least one chat to move.");
      return;
    }

    if (projects.length === 0) {
      showNotice("Create a project first.");
      return;
    }

    setTargetProject(projects[0] || "");
    setMoveModalOpen(true);
  };

  const moveSelectedChatsToProject = () => {
    if (!targetProject) {
      showNotice("Please select a project.");
      return;
    }

    const currentChats = projectChats[targetProject] || [];

    const newChatsToAdd = selectedChats.filter(
      (chat) => !currentChats.includes(chat)
    );

    setProjectChats({
      ...projectChats,
      [targetProject]: [...currentChats, ...newChatsToAdd],
    });

    setSelectedChats([]);
    setTargetProject("");
    setMoveModalOpen(false);
  };

  const clearSelection = () => {
    setSelectedChats([]);
    setSelectedProjects([]);
  };

  const totalSelected = selectedChats.length + selectedProjects.length;

  return (
    <div className="orbital-page relative h-full min-h-0 overflow-y-auto overflow-x-hidden text-white">
      <div className="orbital-earth-horizon pointer-events-none absolute inset-0 opacity-55" />

      {notice && (
        <div className="fixed left-3 right-3 top-16 z-[10000] rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm shadow-2xl shadow-red-950/20 sm:left-1/2 sm:right-auto sm:top-5 sm:max-w-md sm:-translate-x-1/2">
          {notice}
        </div>
      )}

      <div className="relative px-4 pb-28 pt-20 sm:px-6 sm:py-8 sm:pb-24 lg:px-8">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Edit Items
          </h1>
        </header>

        <div className="mb-4 grid grid-cols-2 rounded-lg border border-white/[0.12] bg-[#091323]/75 p-1 lg:hidden">
          <button type="button" onClick={() => setActiveCollection("chats")} className={`rounded-md py-2 text-sm ${activeCollection === "chats" ? "bg-violet-500/25 text-white" : "text-slate-500"}`}>Chats</button>
          <button type="button" onClick={() => setActiveCollection("projects")} className={`rounded-md py-2 text-sm ${activeCollection === "projects" ? "bg-violet-500/25 text-white" : "text-slate-500"}`}>Projects</button>
        </div>

        <section className="mb-6 hidden grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid">
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
          <main className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            <section className={`${activeCollection === "chats" ? "block" : "hidden"} overflow-hidden rounded-2xl border border-[#1B2540] bg-[#07101F]/80 shadow-2xl shadow-purple-950/10 lg:block`}>
              <div className="border-b border-[#1B2540] bg-[#020817]/50 p-4 sm:p-6">
                <h2 className="text-lg font-semibold sm:text-xl">Chats</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Select global chats for bulk actions.
                </p>
              </div>

              <div className="p-3 sm:p-5">
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
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
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

                          <span className="text-slate-500">▢</span><span className="truncate text-sm">{chat}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className={`${activeCollection === "projects" ? "block" : "hidden"} overflow-hidden rounded-2xl border border-[#1B2540] bg-[#07101F]/80 shadow-2xl shadow-purple-950/10 lg:block`}>
              <div className="border-b border-[#1B2540] bg-[#020817]/50 p-4 sm:p-6">
                <h2 className="text-lg font-semibold sm:text-xl">Projects</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Select project workspaces for bulk actions.
                </p>
              </div>

              <div className="p-3 sm:p-5">
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
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
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

                          <span className="text-blue-400">◇</span><span className="truncate text-sm">{project}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </main>

          <aside className="fixed inset-x-3 bottom-3 z-[120] rounded-2xl border border-white/[0.12] bg-[#07101F]/95 p-2 shadow-2xl backdrop-blur-xl sm:inset-x-6 lg:static lg:h-fit lg:p-6">
            <h2 className="hidden text-xl font-bold mb-2 lg:block">
              {totalSelected} items selected
            </h2>

            <p className="hidden text-gray-400 text-sm mb-6 lg:block">
              Choose an action to apply to the selected chats and projects.
            </p>

            <div className="grid grid-cols-3 gap-1 lg:block lg:space-y-3">
              <button
                onClick={duplicateSelected}
                disabled={totalSelected === 0}
                className="hidden w-full rounded-xl border border-[#1B2540] bg-[#101827] p-4 text-left disabled:opacity-40 hover:border-purple-500/50 lg:block"
              >
                📑 Duplicate
              </button>

              <button
                onClick={openMoveSelectedChatsModal}
                disabled={selectedChats.length === 0}
                className="hidden w-full rounded-xl border border-[#1B2540] bg-[#101827] p-4 text-left disabled:opacity-40 hover:border-purple-500/50 lg:block"
              >
                📁 Move selected chats
              </button>

              <button
                onClick={archiveSelected}
                disabled={totalSelected === 0}
                className="w-full rounded-xl border border-[#1B2540] bg-[#101827] p-3 text-center text-xs disabled:opacity-40 hover:border-purple-500/50 lg:p-4 lg:text-left lg:text-base"
              >
                🗄️ Archive
              </button>

              <button
                onClick={deleteSelected}
                disabled={totalSelected === 0}
                className="w-full rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-300 disabled:opacity-40 hover:bg-red-500/20 lg:p-4 lg:text-left lg:text-base"
              >
                🗑️ Delete
              </button>

              <button
                onClick={clearSelection}
                disabled={totalSelected === 0}
                className="w-full rounded-xl border border-[#1B2540] bg-[#101827] p-3 text-center text-xs disabled:opacity-40 hover:border-purple-500/50 lg:p-4 lg:text-left lg:text-base"
              >
                Clear selection
              </button>
            </div>
          </aside>
        </div>
      </div>

      {moveModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl bg-[#07101F] border border-[#1B2540] shadow-2xl shadow-purple-950/30 p-6 text-white">
            <h2 className="text-2xl font-bold mb-3">Move selected chats</h2>

            <p className="text-gray-400 leading-relaxed mb-6">
              Choose the project where you want to move {selectedChats.length} selected chat
              {selectedChats.length === 1 ? "" : "s"}.
            </p>

            <select
              value={targetProject}
              onChange={(e) => setTargetProject(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none text-white mb-6"
            >
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setMoveModalOpen(false);
                  setTargetProject("");
                }}
                className="px-5 py-3 rounded-xl bg-[#101827] border border-[#1B2540] text-gray-300 hover:bg-[#141f33]"
              >
                Cancel
              </button>

              <button
                onClick={moveSelectedChatsToProject}
                className="px-5 py-3 rounded-xl bg-purple-600 border border-purple-500 text-white hover:bg-purple-700"
              >
                Move chats
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Delete selected items?"
        message={`This will permanently delete ${totalSelected} selected item${
          totalSelected === 1 ? "" : "s"
        }. This action cannot be undone.`}
        confirmText="Delete selected"
        danger={true}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={confirmDeleteSelected}
      />
    </div>
  );
}

export default BulkEdit;
