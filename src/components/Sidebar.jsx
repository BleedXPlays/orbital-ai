import { useState, useEffect } from "react";
import ChatCard from "./ChatCard";
import ProjectCard from "./ProjectCard";
import ChatMenu from "./ChatMenu";
import ProjectMenu from "./ProjectMenu";
import MoveChatModal from "./MoveChatModal";
import RenameModal from "./RenameModal";
import logo from "../assets/orbital-logo.png";

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
  pinnedChats,
  setPinnedChats,
  chatActivity,
  setChatActivity,
  addActivity,
}) {
  const [chatSearch, setChatSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [openChatMenu, setOpenChatMenu] = useState(null);
  const [openProjectMenu, setOpenProjectMenu] = useState(null);

  const [chatMenuPosition, setChatMenuPosition] = useState({ top: 0, left: 0 });
  const [projectMenuPosition, setProjectMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const [showMoveModal, setShowMoveModal] = useState(false);
  const [chatToMove, setChatToMove] = useState("");
  const [targetProject, setTargetProject] = useState("");

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameType, setRenameType] = useState("");
  const [renameIndex, setRenameIndex] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (openChatMenu === null && openProjectMenu === null) return;

    const closeMenus = () => {
      setOpenChatMenu(null);
      setOpenProjectMenu(null);
    };

    document.addEventListener("click", closeMenus);
    window.addEventListener("scroll", closeMenus, true);

    return () => {
      document.removeEventListener("click", closeMenus);
      window.removeEventListener("scroll", closeMenus, true);
    };
  }, [openChatMenu, openProjectMenu]);

  const isPinned = (chat) => pinnedChats.includes(chat);

  const getChatTime = (chat) => {
    return chatActivity[chat] ? new Date(chatActivity[chat]).getTime() : 0;
  };

  const getMenuPosition = (event, menuWidth, menuHeight) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const gap = 6;

    let top = rect.bottom + gap;
    let left = rect.right - menuWidth;

    if (top + menuHeight > window.innerHeight) {
      top = rect.top - menuHeight - gap;
    }

    if (left < 8) {
      left = 8;
    }

    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    return { top, left };
  };

  const openRenameModal = (type, index, currentName) => {
    setRenameType(type);
    setRenameIndex(index);
    setRenameValue(currentName);
    setRenameModalOpen(true);
    setOpenChatMenu(null);
    setOpenProjectMenu(null);
  };

  const closeRenameModal = () => {
    setRenameModalOpen(false);
    setRenameType("");
    setRenameIndex(null);
    setRenameValue("");
  };

  const saveRename = () => {
    if (!renameValue.trim() || renameIndex === null) return;

    if (renameType === "chat") renameChat(renameIndex, renameValue.trim());
    if (renameType === "project") renameProject(renameIndex, renameValue.trim());

    closeRenameModal();
  };

  const togglePinChat = (chat) => {
    if (isPinned(chat)) {
      setPinnedChats(pinnedChats.filter((item) => item !== chat));
      addActivity("pin", "Chat unpinned", chat);
    } else {
      setPinnedChats([...pinnedChats, chat]);
      addActivity("pin", "Chat pinned", chat);
    }
  };

  const createChat = () => {
    const newChatName = `New Chat ${chats.length + 1}`;
    const now = new Date().toISOString();

    setChats([...chats, newChatName]);
    setChatActivity({ ...chatActivity, [newChatName]: now });
    setSelectedChat(newChatName);
    setPage("chat");

    addActivity("chat", "Global chat created", newChatName);
  };

  const createProject = () => {
    const newProjectName = `New Project ${projects.length + 1}`;

    setProjects([...projects, newProjectName]);
    setProjectChats({ ...projectChats, [newProjectName]: [] });
    setSelectedProject(newProjectName);
    setPage("project");

    addActivity("project", "Project created", newProjectName);
  };

  const renameChat = (index, newName) => {
    const oldName = chats[index];
    const trimmedName = newName.trim();

    if (!oldName || !trimmedName) return;

    const updatedChats = [...chats];
    updatedChats[index] = trimmedName;
    setChats(updatedChats);

    const updatedProjectChats = {};
    Object.keys(projectChats).forEach((project) => {
      updatedProjectChats[project] = projectChats[project].map((chat) =>
        chat === oldName ? trimmedName : chat
      );
    });

    const updatedChatActivity = { ...chatActivity };
    if (updatedChatActivity[oldName]) {
      updatedChatActivity[trimmedName] = updatedChatActivity[oldName];
      delete updatedChatActivity[oldName];
    }

    setProjectChats(updatedProjectChats);
    setChatActivity(updatedChatActivity);

    setPinnedChats(
      pinnedChats.map((chat) => (chat === oldName ? trimmedName : chat))
    );

    if (selectedChat === oldName) {
      setSelectedChat(trimmedName);
    }

    addActivity("chat", "Chat renamed", `${oldName} → ${trimmedName}`);
  };

  const renameProject = (index, newName) => {
    const oldName = projects[index];
    const trimmedName = newName.trim();

    if (!oldName || !trimmedName) return;

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

    addActivity("project", "Project renamed", `${oldName} → ${trimmedName}`);
  };

  const deleteChat = (index) => {
    const confirmDelete = confirm("Delete this chat?");
    if (!confirmDelete) return;

    const chatToDelete = chats[index];
    const updatedChats = chats.filter((_, i) => i !== index);

    const updatedChatActivity = { ...chatActivity };
    delete updatedChatActivity[chatToDelete];

    setChats(updatedChats);
    setChatActivity(updatedChatActivity);
    setPinnedChats(pinnedChats.filter((chat) => chat !== chatToDelete));

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

    addActivity("chat", "Chat deleted", chatToDelete);
  };

  const deleteProject = (index) => {
    const confirmDelete = confirm("Delete this project?");
    if (!confirmDelete) return;

    const projectToDelete = projects[index];
    const updatedProjects = projects.filter((_, i) => i !== index);
    const projectChatList = projectChats[projectToDelete] || [];

    const updatedChatActivity = { ...chatActivity };
    projectChatList.forEach((chat) => delete updatedChatActivity[chat]);

    setProjects(updatedProjects);
    setChatActivity(updatedChatActivity);
    setPinnedChats(pinnedChats.filter((chat) => !projectChatList.includes(chat)));

    const updatedProjectChats = { ...projectChats };
    delete updatedProjectChats[projectToDelete];
    setProjectChats(updatedProjectChats);

    if (selectedProject === projectToDelete) {
      setSelectedProject(updatedProjects[0] || "");
      setPage(updatedProjects.length > 0 ? "project" : "home");
    }

    addActivity("project", "Project deleted", projectToDelete);
  };

  const archiveChat = (index) => {
    const chatToArchive = chats[index];
    const updatedChats = chats.filter((_, i) => i !== index);

    setArchivedChats([
      ...archivedChats,
      { name: chatToArchive, sourceProject: null },
    ]);

    const updatedChatActivity = { ...chatActivity };
    delete updatedChatActivity[chatToArchive];

    setChats(updatedChats);
    setChatActivity(updatedChatActivity);
    setPinnedChats(pinnedChats.filter((chat) => chat !== chatToArchive));

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

    addActivity("archive", "Chat archived", chatToArchive);
  };

  const archiveProject = (index) => {
    const projectToArchive = projects[index];
    const updatedProjects = projects.filter((_, i) => i !== index);
    const projectChatList = projectChats[projectToArchive] || [];

    setArchivedProjects([...archivedProjects, projectToArchive]);
    setProjects(updatedProjects);

    const updatedChatActivity = { ...chatActivity };
    projectChatList.forEach((chat) => delete updatedChatActivity[chat]);

    setChatActivity(updatedChatActivity);
    setPinnedChats(pinnedChats.filter((chat) => !projectChatList.includes(chat)));

    const updatedProjectChats = { ...projectChats };
    delete updatedProjectChats[projectToArchive];
    setProjectChats(updatedProjectChats);

    if (selectedProject === projectToArchive) {
      setSelectedProject(updatedProjects[0] || "");
      setPage(updatedProjects.length > 0 ? "project" : "home");
    }

    addActivity("archive", "Project archived", projectToArchive);
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

    addActivity(
      "project",
      "Chat moved to project",
      `${chatToMove} → ${targetProject}`
    );

    setShowMoveModal(false);
    setChatToMove("");
    setTargetProject("");
  };

  const filteredChats = chats
    .filter((chat) => chat.toLowerCase().includes(chatSearch.toLowerCase()))
    .sort((a, b) => getChatTime(b) - getChatTime(a));

  const filteredProjects = projects.filter((project) =>
    project.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <>
      <aside
        onClick={() => {
          setOpenChatMenu(null);
          setOpenProjectMenu(null);
        }}
        className="w-64 h-screen shrink-0 bg-[#050B1A] border-r border-[#1B2540] text-white flex flex-col px-4 py-4 overflow-visible"
      >
        <div className="shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setPage("home");
            }}
            className="cursor-pointer mb-3 flex items-center h-16 overflow-visible"
          >
            <img
              src={logo}
              alt="OrbitalAI"
              className="h-24 w-auto object-contain scale-[2] origin-left"
            />
          </div>

          <input
            onClick={(e) => {
              e.stopPropagation();
              setPage("search");
            }}
            type="text"
            placeholder="🔍 Global Search"
            className="w-full py-2.5 px-3 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-3 cursor-pointer text-sm"
          />
        </div>

        {pinnedChats.length > 0 && (
          <div className="shrink-0 mb-3">
            <h2 className="text-yellow-400 font-semibold mb-2 text-xs tracking-wide">
              PINNED
            </h2>

            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {pinnedChats.map((chat) => (
                <div
                  key={chat}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChat(chat);
                    setPage("chat");
                  }}
                  className={`px-3 py-2 rounded-lg cursor-pointer border ${
                    selectedChat === chat
                      ? "bg-[#101827] border-purple-700"
                      : "bg-[#101827] border-gray-800 hover:border-purple-700"
                  }`}
                >
                  <p className="truncate text-sm">⭐ {chat}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-rows-[1fr_1fr] gap-3 min-h-0 flex-1">
          <section className="min-h-0 flex flex-col">
            <h2 className="text-purple-400 font-semibold mb-2 shrink-0 text-xs tracking-wide">
              CHATS
            </h2>

            <button
              onClick={(e) => {
                e.stopPropagation();
                createChat();
              }}
              className="w-full bg-[#101827] py-2.5 px-3 rounded-xl mb-2 text-left hover:bg-[#141f33] shrink-0 text-sm"
            >
              + New Chat
            </button>

            <input
              onClick={(e) => e.stopPropagation()}
              type="text"
              placeholder="Search chats..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-2 shrink-0 text-sm"
            />

            <div className="space-y-1.5 overflow-y-auto overflow-x-visible pr-1 min-h-0">
              {filteredChats.map((chat) => {
                const originalIndex = chats.indexOf(chat);

                return (
                  <div key={chat} className="relative">
                    <ChatCard
                      chat={chat}
                      selectedChat={selectedChat}
                      onOpen={(e) => {
                        e.stopPropagation();
                        setSelectedChat(chat);
                        setPage("chat");
                        setOpenChatMenu(null);
                        setOpenProjectMenu(null);
                      }}
                      onMenuClick={(e) => {
                        e.stopPropagation();

                        setChatMenuPosition(getMenuPosition(e, 176, 224));

                        setOpenChatMenu(
                          openChatMenu === originalIndex ? null : originalIndex
                        );
                        setOpenProjectMenu(null);
                      }}
                    />

                    {openChatMenu === originalIndex && (
                      <ChatMenu
                        position={chatMenuPosition}
                        isPinned={isPinned(chat)}
                        onRename={(e) => {
                          e.stopPropagation();
                          openRenameModal("chat", originalIndex, chat);
                        }}
                        onMove={(e) => {
                          e.stopPropagation();
                          openMoveModal(chat);
                          setOpenChatMenu(null);
                        }}
                        onTogglePin={(e) => {
                          e.stopPropagation();
                          togglePinChat(chat);
                          setOpenChatMenu(null);
                        }}
                        onArchive={(e) => {
                          e.stopPropagation();
                          archiveChat(originalIndex);
                          setOpenChatMenu(null);
                        }}
                        onDelete={(e) => {
                          e.stopPropagation();
                          deleteChat(originalIndex);
                          setOpenChatMenu(null);
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {filteredChats.length === 0 && (
                <p className="text-gray-500 text-xs">No chats found.</p>
              )}
            </div>
          </section>

          <section className="min-h-0 flex flex-col">
            <h2 className="text-purple-400 font-semibold mb-2 shrink-0 text-xs tracking-wide">
              PROJECTS
            </h2>

            <button
              onClick={(e) => {
                e.stopPropagation();
                createProject();
              }}
              className="w-full bg-[#101827] py-2.5 px-3 rounded-xl mb-2 text-left hover:bg-[#141f33] shrink-0 text-sm"
            >
              + New Project
            </button>

            <input
              onClick={(e) => e.stopPropagation()}
              type="text"
              placeholder="Search projects..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#101827] border border-[#1B2540] outline-none mb-2 shrink-0 text-sm"
            />

            <div className="space-y-1.5 overflow-y-auto pr-1 min-h-0">
              {filteredProjects.map((project) => {
                const originalIndex = projects.indexOf(project);
                const count = (projectChats[project] || []).length;

                return (
                  <div key={project} className="relative">
                    <ProjectCard
                      project={project}
                      count={count}
                      selectedProject={selectedProject}
                      onOpen={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project);
                        setPage("project");
                        setOpenChatMenu(null);
                        setOpenProjectMenu(null);
                      }}
                      onMenuClick={(e) => {
                        e.stopPropagation();

                        setProjectMenuPosition(getMenuPosition(e, 144, 144));

                        setOpenProjectMenu(
                          openProjectMenu === originalIndex
                            ? null
                            : originalIndex
                        );
                        setOpenChatMenu(null);
                      }}
                    />

                    {openProjectMenu === originalIndex && (
                      <ProjectMenu
                        position={projectMenuPosition}
                        onRename={(e) => {
                          e.stopPropagation();
                          openRenameModal("project", originalIndex, project);
                        }}
                        onArchive={(e) => {
                          e.stopPropagation();
                          archiveProject(originalIndex);
                          setOpenProjectMenu(null);
                        }}
                        onDelete={(e) => {
                          e.stopPropagation();
                          deleteProject(originalIndex);
                          setOpenProjectMenu(null);
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {filteredProjects.length === 0 && (
                <p className="text-gray-500 text-xs">No projects found.</p>
              )}
            </div>
          </section>
        </div>

        <div className="shrink-0 border-t border-[#1B2540] pt-2 mt-3 space-y-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("bulk");
            }}
            className="w-full bg-[#101827] py-2.5 px-3 rounded-xl text-left hover:bg-[#141f33] text-sm"
          >
            ✏️ Edit Items
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("archived");
            }}
            className="w-full bg-[#101827] py-2.5 px-3 rounded-xl text-left hover:bg-[#141f33] text-sm"
          >
            🗄️ Archived Items
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("settings");
            }}
            className="w-full bg-[#101827] py-2.5 px-3 rounded-xl text-left hover:bg-[#141f33] text-sm"
          >
            ⚙️ Settings
          </button>
        </div>
      </aside>

      <RenameModal
        isOpen={renameModalOpen}
        title={renameType === "project" ? "Rename Project" : "Rename Chat"}
        value={renameValue}
        setValue={setRenameValue}
        onCancel={closeRenameModal}
        onSave={saveRename}
      />

      {showMoveModal && (
        <MoveChatModal
          projects={projects}
          chatToMove={chatToMove}
          targetProject={targetProject}
          setTargetProject={setTargetProject}
          onCancel={() => {
            setShowMoveModal(false);
            setChatToMove("");
            setTargetProject("");
          }}
          onMove={moveChatToProject}
        />
      )}
    </>
  );
}

export default Sidebar;