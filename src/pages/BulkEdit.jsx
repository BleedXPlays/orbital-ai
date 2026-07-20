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
    <div className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#020817] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      {notice && (
        <div className="fixed left-3 right-3 top-16 z-[10000] rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm shadow-2xl shadow-red-950/20 sm:left-1/2 sm:right-auto sm:top-5 sm:max-w-md sm:-translate-x-1/2">
          {notice}
        </div>
      )}

      <div className="relative px-4 pb-12 pt-16 sm:px-6 sm:py-8 sm:pb-16 lg:px-10">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>✏️</span>
            <span>Bulk Edit</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Bulk Edit Mode
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Select multiple chats or projects and manage them together.
          </p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 sm:mb-8">
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
                onClick={openMoveSelectedChatsModal}
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
