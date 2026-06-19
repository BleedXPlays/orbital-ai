import { useState } from "react";

function Sidebar({
  setPage,
  chats,
  setChats,
  projects,
  setProjects,
  projectChats,
  setProjectChats,
  selectedChat,
  setSelectedChat,
  selectedProject,
  setSelectedProject,
  archivedChats,
  setArchivedChats,
  archivedProjects,
  setArchivedProjects,
}) {
  const [chatSearch, setChatSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");

  const [openChatMenu, setOpenChatMenu] = useState(null);
  const [openProjectMenu, setOpenProjectMenu] = useState(null);

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [chatToMove, setChatToMove] = useState("");
  const [targetProject, setTargetProject] = useState("");

  const createChat = () => {
    const newChatName = `New Chat ${chats.length + 1}`;
    setChats([...chats, newChatName]);
    setSelectedChat(newChatName);
    setPage("chat");
  };

  const createProject = () => {
    const newProjectName = `New Project ${projects.length + 1}`;

    setProjects([...projects, newProjectName]);

    setProjectChats({
      ...projectChats,
      [newProjectName]: [],
    });

    setSelectedProject(newProjectName);
    setPage("project");
  };

  const renameChat = (index) => {
    const newName = prompt("Enter new chat name:", chats[index]);
    if (!newName || !newName.trim()) return;

    const oldName = chats[index];
    const trimmedName = newName.trim();

    const updatedChats = [...chats];
    updatedChats[index] = trimmedName;
    setChats(updatedChats);

    const updatedProjectChats = {};

    Object.keys(projectChats).forEach((project) => {
      updatedProjectChats[project] = projectChats[project].map((chat) =>
        chat === oldName ? trimmedName : chat
      );
    });

    setProjectChats(updatedProjectChats);

    if (selectedChat === oldName) {
      setSelectedChat(trimmedName);
    }
  };

  const renameProject = (index) => {
    const newName = prompt("Enter new project name:", projects[index]);
    if (!newName || !newName.trim()) return;

    const oldName = projects[index];
    const trimmedName = newName.trim();

    const updatedProjects = [...projects];
    updatedProjects[index] = trimmedName;
    setProjects(updatedProjects);

    const updatedProjectChats = { ...projectChats };
    updatedProjectChats[trimmedName] = updatedProjectChats[oldName] || [];
    delete updatedProjectChats[oldName];

    setProjectChats(updatedProjectChats);

    if (selectedProject === oldName) {
      setSelectedProject(trimmedName);
    }
  };

  const deleteChat = (index) => {
    const confirmDelete = confirm("Delete this chat?");
    if (!confirmDelete) return;

    const chatToDelete = chats[index];
    const updatedChats = chats.filter((_, i) => i !== index);

    setChats(updatedChats);

    const updatedProjectChats = {};

    Object.keys(projectChats).forEach((project) => {
      updatedProjectChats[project] = projectChats[project].filter(
        (chat) => chat !== chatToDelete
      );
    });

    setProjectChats(updatedProjectChats);

    if (selectedChat === chatToDelete) {
      setSelectedChat(updatedChats[0] || "");
      setPage(updatedChats.length > 0 ? "chat" : "home");
    }
  };

  const deleteProject = (index) => {
    const confirmDelete = confirm("Delete this project?");
    if (!confirmDelete) return;

    const projectToDelete = projects[index];
    const updatedProjects = projects.filter((_, i) => i !== index);

    setProjects(updatedProjects);

    const updatedProjectChats = { ...projectChats };
    delete updatedProjectChats[projectToDelete];
    setProjectChats(updatedProjectChats);

    if (selectedProject === projectToDelete) {
      setSelectedProject(updatedProjects[0] || "");
      setPage(updatedProjects.length > 0 ? "project" : "home");
    }
  };

  const archiveChat = (index) => {
    const chatToArchive = chats[index];
    const updatedChats = chats.filter((_, i) => i !== index);

    setArchivedChats([...archivedChats, chatToArchive]);
    setChats(updatedChats);

    const updatedProjectChats = {};

    Object.keys(projectChats).forEach((project) => {
      updatedProjectChats[project] = projectChats[project].filter(
        (chat) => chat !== chatToArchive
      );
    });

    setProjectChats(updatedProjectChats);

    if (selectedChat === chatToArchive) {
      setSelectedChat(updatedChats[0] || "");
      setPage(updatedChats.length > 0 ? "chat" : "home");
    }
  };

  const archiveProject = (index) => {
    const projectToArchive = projects[index];
    const updatedProjects = projects.filter((_, i) => i !== index);

    setArchivedProjects([...archivedProjects, projectToArchive]);
    setProjects(updatedProjects);

    const updatedProjectChats = { ...projectChats };
    delete updatedProjectChats[projectToArchive];
    setProjectChats(updatedProjectChats);

    if (selectedProject === projectToArchive) {
      setSelectedProject(updatedProjects[0] || "");
      setPage(updatedProjects.length > 0 ? "project" : "home");
    }
  };

  const openMoveModal = (chatName) => {
    if (projects.length === 0) {
      alert("Create a project first.");
      return;
    }

    setChatToMove(chatName);
    setTargetProject("");
    setShowMoveModal(true);
  };

  const moveChatToProject = () => {
    if (!targetProject) {
      alert("Please select a project.");
      return;
    }

    const currentProjectChats = projectChats[targetProject] || [];

    if (currentProjectChats.includes(chatToMove)) {
      alert("This chat is already inside that project.");
      return;
    }

    setProjectChats({
      ...projectChats,
      [targetProject]: [...currentProjectChats, chatToMove],
    });

    setChats(chats.filter((chat) => chat !== chatToMove));

    setSelectedProject(targetProject);
    setSelectedChat(chatToMove);
    setPage("project");

    setShowMoveModal(false);
    setChatToMove("");
    setTargetProject("");
  };

  const filteredChats = chats.filter((chat) =>
    chat.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const filteredProjects = projects.filter((project) =>
    project.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <>
      <div
        onClick={() => {
          setOpenChatMenu(null);
          setOpenProjectMenu(null);
        }}
        className="w-80 min-h-screen bg-[#050B1A] border-r border-[#1B2540] text-white flex flex-col px-5 py-6"
      >
        <div className="mb-8">
          <h1
            onClick={() => setPage("home")}
            className="text-4xl font-bold cursor-pointer"
          >
            Orbital<span className="text-purple-500">AI</span>
          </h1>
        </div>

        <input
          onClick={(e) => {
            e.stopPropagation();
            setPage("search");
          }}
          type="text"
          placeholder="🔍 Global Search"
          className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-8 cursor-pointer"
        />

        <h2 className="text-purple-400 font-semibold mb-3">CHATS</h2>

        <button
          onClick={(e) => {
            e.stopPropagation();
            createChat();
          }}
          className="w-full bg-[#101827] p-4 rounded-xl mb-3 text-left hover:bg-[#141f33]"
        >
          + New Chat
        </button>

        <input
          onClick={(e) => e.stopPropagation()}
          type="text"
          placeholder="Search chats..."
          value={chatSearch}
          onChange={(e) => setChatSearch(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-5"
        />

        <div className="space-y-3 mb-8">
          {filteredChats.map((chat) => {
            const originalIndex = chats.indexOf(chat);

            return (
              <div
                key={chat}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedChat(chat);
                  setPage("chat");
                  setOpenChatMenu(null);
                  setOpenProjectMenu(null);
                }}
                className={`relative p-3 rounded-lg cursor-pointer ${
                  selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>💬 {chat}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenChatMenu(
                        openChatMenu === originalIndex ? null : originalIndex
                      );
                      setOpenProjectMenu(null);
                    }}
                    className="text-gray-500 hover:text-white px-2"
                  >
                    ⋮
                  </button>
                </div>

                {openChatMenu === originalIndex && (
                  <div className="absolute right-3 top-10 z-50 w-44 bg-[#101827] border border-[#1B2540] rounded-xl shadow-xl p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        renameChat(originalIndex);
                        setOpenChatMenu(null);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                    >
                      Rename
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMoveModal(chat);
                        setOpenChatMenu(null);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                    >
                      Move to Project
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveChat(originalIndex);
                        setOpenChatMenu(null);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                    >
                      Archive
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(originalIndex);
                        setOpenChatMenu(null);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-[#141f33]"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredChats.length === 0 && (
            <p className="text-gray-500 text-sm">No chats found.</p>
          )}
        </div>

        <h2 className="text-purple-400 font-semibold mb-3">PROJECTS</h2>

        <button
          onClick={(e) => {
            e.stopPropagation();
            createProject();
          }}
          className="w-full bg-[#101827] p-4 rounded-xl mb-4 text-left hover:bg-[#141f33]"
        >
          + New Project
        </button>

        <input
          onClick={(e) => e.stopPropagation()}
          type="text"
          placeholder="Search projects..."
          value={projectSearch}
          onChange={(e) => setProjectSearch(e.target.value)}
          className="w-full p-3 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-5"
        />

        <div className="space-y-3 mb-8">
          {filteredProjects.map((project) => {
            const originalIndex = projects.indexOf(project);
            const count = (projectChats[project] || []).length;

            return (
              <div
                key={project}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProject(project);
                  setPage("project");
                  setOpenChatMenu(null);
                  setOpenProjectMenu(null);
                }}
                className={`relative p-3 rounded-lg cursor-pointer ${
                  selectedProject === project
                    ? "bg-[#101827]"
                    : "hover:bg-[#101827]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>📂 {project}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenProjectMenu(
                        openProjectMenu === originalIndex
                          ? null
                          : originalIndex
                      );
                      setOpenChatMenu(null);
                    }}
                    className="text-gray-500 hover:text-white px-2"
                  >
                    ⋮
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-1">{count} chats</p>

                {openProjectMenu === originalIndex && (
                  <div className="absolute right-3 top-10 z-50 w-36 bg-[#101827] border border-[#1B2540] rounded-xl shadow-xl p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        renameProject(originalIndex);
                        setOpenProjectMenu(null);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                    >
                      Rename
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveProject(originalIndex);
                        setOpenProjectMenu(null);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                    >
                      Archive
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(originalIndex);
                        setOpenProjectMenu(null);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-[#141f33]"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <p className="text-gray-500 text-sm">No projects found.</p>
          )}
        </div>

        <div className="space-y-3 pb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("bulk");
            }}
            className="w-full bg-[#101827] p-4 rounded-xl text-left hover:bg-[#141f33]"
          >
            ✏️ Edit Items
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("archived");
            }}
            className="w-full bg-[#101827] p-4 rounded-xl text-left hover:bg-[#141f33]"
          >
            🗄️ Archived Items
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("settings");
            }}
            className="w-full bg-[#101827] p-4 rounded-xl text-left hover:bg-[#141f33]"
          >
            ⚙️ Settings
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("help");
            }}
            className="w-full bg-[#101827] p-4 rounded-xl text-left hover:bg-[#141f33]"
          >
            ❓ Help & Support
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("workflow");
            }}
            className="w-full bg-[#101827] p-4 rounded-xl text-left hover:bg-[#141f33]"
          >
            🤖 AI Workflow
          </button>
        </div>
      </div>

      {showMoveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6 w-[460px] text-white shadow-2xl">
            <h2 className="text-2xl font-bold mb-3">Move Chat</h2>

            <p className="text-gray-400 mb-2">Chat</p>
            <p className="font-semibold mb-6">💬 {chatToMove}</p>

            <label className="text-gray-400 mb-2 block">Select Project</label>

            <select
              value={targetProject}
              onChange={(e) => setTargetProject(e.target.value)}
              className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] mb-6 outline-none"
            >
              <option value="">Choose a project</option>

              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setChatToMove("");
                  setTargetProject("");
                }}
                className="px-5 py-3 rounded-xl bg-[#101827] hover:bg-[#141f33]"
              >
                Cancel
              </button>

              <button
                onClick={moveChatToProject}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                Move Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;