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
    setProjects(
      projects.filter((project) => !selectedProjects.includes(project))
    );

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
    setProjects(
      projects.filter((project) => !selectedProjects.includes(project))
    );

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
    const duplicatedProjects = selectedProjects.map(
      (project) => `${project} Copy`
    );

    setChats([...chats, ...duplicatedChats]);
    setProjects([...projects, ...duplicatedProjects]);

    const updatedProjectChats = { ...projectChats };

    selectedProjects.forEach((project) => {
      updatedProjectChats[`${project} Copy`] = [
        ...(projectChats[project] || []),
      ];
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

  const totalSelected = selectedChats.length + selectedProjects.length;

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-4">Bulk Edit Mode</h1>
      <p className="text-gray-400 mb-8">
        Select multiple chats or projects and manage them together.
      </p>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5 text-purple-400">Chats</h2>

          <div className="space-y-3">
            {chats.map((chat) => (
              <label
                key={chat}
                className="flex items-center gap-4 bg-[#101827] border border-gray-800 rounded-xl p-4 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedChats.includes(chat)}
                  onChange={() => toggleChat(chat)}
                />
                <span>💬 {chat}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5 text-purple-400">Projects</h2>

          <div className="space-y-3">
            {projects.map((project) => (
              <label
                key={project}
                className="flex items-center gap-4 bg-[#101827] border border-gray-800 rounded-xl p-4 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(project)}
                  onChange={() => toggleProject(project)}
                />
                <span>📂 {project}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-5">
          {totalSelected} items selected
        </h2>

        <div className="grid grid-cols-5 gap-5">
          <button
            onClick={duplicateSelected}
            disabled={totalSelected === 0}
            className="bg-[#101827] border border-gray-800 rounded-xl p-5 disabled:opacity-40"
          >
            📑 Duplicate
          </button>

          <button
            onClick={moveSelectedChatsToProject}
            disabled={selectedChats.length === 0}
            className="bg-[#101827] border border-gray-800 rounded-xl p-5 disabled:opacity-40"
          >
            📁 Move Chats
          </button>

          <button
            onClick={archiveSelected}
            disabled={totalSelected === 0}
            className="bg-[#101827] border border-gray-800 rounded-xl p-5 disabled:opacity-40"
          >
            🗄️ Archive
          </button>

          <button
            onClick={deleteSelected}
            disabled={totalSelected === 0}
            className="bg-[#101827] border border-red-900 rounded-xl p-5 text-red-400 disabled:opacity-40"
          >
            🗑️ Delete
          </button>

          <button
            onClick={() => {
              setSelectedChats([]);
              setSelectedProjects([]);
            }}
            disabled={totalSelected === 0}
            className="bg-[#101827] border border-gray-800 rounded-xl p-5 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkEdit;