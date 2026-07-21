import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatCard from "./ChatCard";
import ProjectCard from "./ProjectCard";
import ChatMenu from "./ChatMenu";
import ProjectMenu from "./ProjectMenu";
import MoveChatModal from "./MoveChatModal";
import RenameModal from "./RenameModal";
import ConfirmModal from "./ConfirmModal";
import logo from "../assets/orbital-logo.png";

const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

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
  const navigate = useNavigate();
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

  const [notice, setNotice] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    onConfirm: null,
  });

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      title: "",
      message: "",
      confirmText: "Delete",
      onConfirm: null,
    });
  };

  const showNotice = (message) => {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 3000);
  };

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
    navigate(`/chat/${slugify(newChatName)}`);

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
      navigate(`/chat/${slugify(trimmedName)}`, { replace: true });
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
    const chatToDelete = chats[index];

    setConfirmModal({
      isOpen: true,
      title: "Delete chat?",
      message: `This will permanently delete "${chatToDelete}". This action cannot be undone.`,
      confirmText: "Delete chat",
      onConfirm: () => {
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
        closeConfirmModal();
      },
    });
  };

  const deleteProject = (index) => {
    const projectToDelete = projects[index];

    setConfirmModal({
      isOpen: true,
      title: "Delete project?",
      message: `This will permanently delete "${projectToDelete}" and remove its project chats from this workspace. This action cannot be undone.`,
      confirmText: "Delete project",
      onConfirm: () => {
        const updatedProjects = projects.filter((_, i) => i !== index);
        const projectChatList = projectChats[projectToDelete] || [];

        const updatedChatActivity = { ...chatActivity };
        projectChatList.forEach((chat) => delete updatedChatActivity[chat]);

        setProjects(updatedProjects);
        setChatActivity(updatedChatActivity);
        setPinnedChats(
          pinnedChats.filter((chat) => !projectChatList.includes(chat))
        );

        const updatedProjectChats = { ...projectChats };
        delete updatedProjectChats[projectToDelete];
        setProjectChats(updatedProjectChats);

        if (selectedProject === projectToDelete) {
          setSelectedProject(updatedProjects[0] || "");
          setPage(updatedProjects.length > 0 ? "project" : "home");
        }

        addActivity("project", "Project deleted", projectToDelete);
        closeConfirmModal();
      },
    });
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
      showNotice("Create a project first.");
      return;
    }

    setChatToMove(chatName);
    setTargetProject("");
    setShowMoveModal(true);
  };

  const moveChatToProject = () => {
    if (!targetProject) {
      showNotice("Please select a project.");
      return;
    }

    const currentProjectChats = projectChats[targetProject] || [];

    if (currentProjectChats.includes(chatToMove)) {
      showNotice("This chat is already inside that project.");
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
        className="flex h-dvh min-h-0 w-[min(92vw,22rem)] shrink-0 flex-col overflow-hidden overscroll-contain border-r border-white/[0.07] bg-[#060b16]/95 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-white shadow-[20px_0_60px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:h-full lg:w-64 lg:py-4"
      >
        {notice && (
          <div className="fixed left-3 right-3 top-16 z-[10000] rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm shadow-2xl shadow-red-950/20 lg:left-72 lg:right-auto lg:top-5 lg:max-w-sm">
            {notice}
          </div>
        )}

        <div className="shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setPage("home");
            }}
            className="mb-3 flex h-16 cursor-pointer items-center overflow-visible rounded-2xl pr-12 transition hover:bg-white/[0.025] lg:h-20 lg:pr-0"
          >
            <img
              src={logo}
              alt="OrbitalAI"
              className="h-auto w-[158px] max-w-full translate-y-1 object-contain lg:w-[190px] lg:translate-y-2"
            />
          </div>

          <div className="relative mb-4 min-w-0">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-3 top-1/2 z-20 h-4 w-4 -translate-y-1/2 text-slate-600"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              onClick={(e) => {
                e.stopPropagation();
                setPage("search");
              }}
              type="text"
              placeholder="Search workspace"
              className="relative z-10 w-full min-w-0 cursor-pointer rounded-lg border border-white/[0.08] bg-white/[0.035] py-2.5 pl-9 pr-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 hover:border-white/[0.14]"
            />
          </div>
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

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain lg:grid lg:grid-rows-[1fr_1fr] lg:gap-4 lg:overflow-hidden">
          <section className="mb-6 flex min-h-0 min-w-0 max-w-full flex-col lg:mb-0">
            <h2 className="mb-2 shrink-0 text-[11px] font-semibold tracking-[0.16em] text-slate-500">
              CHATS
            </h2>

            <button
              onClick={(e) => {
                e.stopPropagation();
                createChat();
              }}
              className="mb-2 flex w-full min-w-0 max-w-full shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.045] px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition hover:border-white/[0.15] hover:bg-white/[0.07]"
            >
              <span className="text-base leading-none text-slate-500">+</span>
              New chat
            </button>

            <input
              onClick={(e) => e.stopPropagation()}
              type="text"
              placeholder="Search chats..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className="mb-2 w-full min-w-0 max-w-full shrink-0 rounded-lg border border-white/[0.07] bg-transparent px-3 py-2 text-sm text-slate-300 outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-white/[0.025]"
            />

            <div className="min-h-0 min-w-0 max-w-full space-y-1 overflow-x-hidden lg:overflow-y-auto lg:pr-1">
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

          <section className="flex min-h-0 min-w-0 max-w-full flex-col">
            <h2 className="mb-2 shrink-0 text-[11px] font-semibold tracking-[0.16em] text-slate-500">
              PROJECTS
            </h2>

            <button
              onClick={(e) => {
                e.stopPropagation();
                createProject();
              }}
              className="mb-2 flex w-full min-w-0 max-w-full shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.045] px-3 py-2.5 text-left text-sm font-medium text-slate-200 transition hover:border-white/[0.15] hover:bg-white/[0.07]"
            >
              <span className="text-base leading-none text-slate-500">+</span>
              New project
            </button>

            <input
              onClick={(e) => e.stopPropagation()}
              type="text"
              placeholder="Search projects..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="mb-2 w-full min-w-0 max-w-full shrink-0 rounded-lg border border-white/[0.07] bg-transparent px-3 py-2 text-sm text-slate-300 outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-white/[0.025]"
            />

            <div className="min-h-0 min-w-0 max-w-full space-y-1 overflow-x-hidden lg:overflow-y-auto lg:pr-1">
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

        <div className="mt-3 shrink-0 space-y-1 border-t border-white/[0.07] pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("bulk");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-4 w-4 text-slate-600"
            >
              <path d="m14 5 5 5L9 20H4v-5L14 5Z" />
              <path d="m12 7 5 5" />
            </svg>
            Edit items
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("archived");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-4 w-4 text-slate-600"
            >
              <path d="M4 7h16v12H4z" />
              <path d="M3 4h18v3H3zM9 11h6" />
            </svg>
            Archived items
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPage("settings");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-4 w-4 text-slate-600"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
            </svg>
            Settings
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        danger={true}
        onCancel={closeConfirmModal}
        onConfirm={() => {
          if (confirmModal.onConfirm) confirmModal.onConfirm();
        }}
      />
    </>
  );
}

export default Sidebar;
