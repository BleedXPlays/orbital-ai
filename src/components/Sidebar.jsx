import { useState } from "react";
import ChatCard from "./ChatCard";
import ProjectCard from "./ProjectCard";
import ChatMenu from "./ChatMenu";
import ProjectMenu from "./ProjectMenu";
import MoveChatModal from "./MoveChatModal";

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
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [chatToMove, setChatToMove] = useState("");
  const [targetProject, setTargetProject] = useState("");

  const isPinned = (chat) => pinnedChats.includes(chat);

  const getChatTime = (chat) => {
    return chatActivity[chat] ? new Date(chatActivity[chat]).getTime() : 0;
  };

  const formatUpdatedTime = (chat) => {
    if (!chatActivity[chat]) return "No activity yet";
    return `Updated ${new Date(chatActivity[chat]).toLocaleString()}`;
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

        {pinnedChats.length > 0 && (
          <>
            <h2 className="text-yellow-400 font-semibold mb-3">PINNED</h2>

            <div className="space-y-3 mb-8">
              {pinnedChats.map((chat) => (
                <div
                  key={chat}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChat(chat);
                    setPage("chat");
                  }}
                  className={`p-3 rounded-lg cursor-pointer border ${
                    selectedChat === chat
                      ? "bg-[#101827] border-purple-700"
                      : "bg-[#101827] border-gray-800 hover:border-purple-700"
                  }`}
                >
                  <p>⭐ {chat}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatUpdatedTime(chat)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

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
              <div key={chat} className="relative">
                <ChatCard
                  chat={chat}
                  selectedChat={selectedChat}
                  formatUpdatedTime={formatUpdatedTime}
                  onOpen={(e) => {
                    e.stopPropagation();
                    setSelectedChat(chat);
                    setPage("chat");
                    setOpenChatMenu(null);
                    setOpenProjectMenu(null);
                  }}
                  onMenuClick={(e) => {
                    e.stopPropagation();
                    setOpenChatMenu(
                      openChatMenu === originalIndex ? null : originalIndex
                    );
                    setOpenProjectMenu(null);
                  }}
                />

                {openChatMenu === originalIndex && (
                  <ChatMenu
                    isPinned={isPinned(chat)}
                    onRename={(e) => {
                      e.stopPropagation();
                      renameChat(originalIndex);
                      setOpenChatMenu(null);
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
                    setOpenProjectMenu(
                      openProjectMenu === originalIndex ? null : originalIndex
                    );
                    setOpenChatMenu(null);
                  }}
                />

                {openProjectMenu === originalIndex && (
                  <ProjectMenu
                    onRename={(e) => {
                      e.stopPropagation();
                      renameProject(originalIndex);
                      setOpenProjectMenu(null);
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