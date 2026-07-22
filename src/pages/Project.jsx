import { useEffect, useState } from "react";
import ProjectChatCard from "../components/ProjectChatCard";
import ProjectChatMenu from "../components/ProjectChatMenu";
import ProjectNoteCard from "../components/ProjectNoteCard";
import FilePreviewModal from "../components/FilePreviewModal";
import ConfirmModal from "../components/ConfirmModal";
import RenameModal from "../components/RenameModal";
import {
  deleteProjectFile,
  getProjectFileUrl,
  uploadProjectFile,
} from "../utils/uploadFile";

function ProjectImageThumbnail({ file }) {
  const [imageUrl, setImageUrl] = useState(file.url || "");

  useEffect(() => {
    if (!file.path) return;

    let isActive = true;

    getProjectFileUrl(file.path)
      .then((freshUrl) => {
        if (isActive) setImageUrl(freshUrl);
      })
      .catch(() => {
        if (isActive) setImageUrl("");
      });

    return () => {
      isActive = false;
    };
  }, [file.path]);

  if (!imageUrl) {
    return (
      <div className="mb-4 flex h-40 items-center justify-center rounded-2xl bg-[#151E33] text-4xl">
        🖼️
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={file.name}
      className="mb-4 h-40 w-full rounded-2xl object-cover"
    />
  );
}

function Project({
  user,
  selectedProject,
  projectChats,
  setProjectChats,
  projectFiles,
  setProjectFiles,
  projectNotes,
  setProjectNotes,
  selectedChat,
  setSelectedChat,
  chatMessages,
  setChatMessages,
  archivedChats,
  setArchivedChats,
  pinnedChats,
  setPinnedChats,
  chatActivity,
  setChatActivity,
  setPage,
  addActivity,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [openChatMenu, setOpenChatMenu] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFilePreview, setSelectedFilePreview] = useState(null);
  const [notice, setNotice] = useState("");

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameIndex, setRenameIndex] = useState(null);
  const [renameValue, setRenameValue] = useState("");

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

  const rawProjectChatList = projectChats[selectedProject] || [];
  const files = projectFiles[selectedProject] || [];
  const notes = projectNotes[selectedProject] || [];
  const images = files.filter(
    (file) => file.type && file.type.startsWith("image")
  );

  const getChatTime = (chat) => {
    return chatActivity[chat] ? new Date(chatActivity[chat]).getTime() : 0;
  };

  const formatUpdatedTime = (chat) => {
    if (!chatActivity[chat]) return "No activity yet";
    return `Updated ${new Date(chatActivity[chat]).toLocaleString()}`;
  };

  const projectChatList = [...rawProjectChatList].sort((a, b) => {
    const aPinned = pinnedChats.includes(a);
    const bPinned = pinnedChats.includes(b);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    return getChatTime(b) - getChatTime(a);
  });

  const isPinned = (chat) => pinnedChats.includes(chat);

  const togglePinChat = (chat) => {
    if (isPinned(chat)) {
      setPinnedChats(pinnedChats.filter((item) => item !== chat));
      addActivity("pin", "Project chat unpinned", `${chat} • ${selectedProject}`);
    } else {
      setPinnedChats([...pinnedChats, chat]);
      addActivity("pin", "Project chat pinned", `${chat} • ${selectedProject}`);
    }
  };

  const createProjectChat = () => {
    const chatName = `New Chat ${rawProjectChatList.length + 1}`;
    const now = new Date().toISOString();

    setProjectChats({
      ...projectChats,
      [selectedProject]: [...rawProjectChatList, chatName],
    });

    setChatActivity({
      ...chatActivity,
      [chatName]: now,
    });

    setSelectedChat(chatName);
    setPage("chat");

    addActivity("chat", "Project chat created", `${chatName} • ${selectedProject}`);
  };

  const openRenameProjectChat = (index) => {
    const oldName = projectChatList[index];

    setRenameIndex(index);
    setRenameValue(oldName);
    setRenameModalOpen(true);
    setOpenChatMenu(null);
  };

  const closeRenameModal = () => {
    setRenameModalOpen(false);
    setRenameIndex(null);
    setRenameValue("");
  };

  const saveRenameProjectChat = () => {
    if (renameIndex === null || !renameValue.trim()) return;

    const oldName = projectChatList[renameIndex];
    const trimmedName = renameValue.trim();

    if (oldName === trimmedName) {
      closeRenameModal();
      return;
    }

    const updatedProjectChats = {
      ...projectChats,
      [selectedProject]: rawProjectChatList.map((chat) =>
        chat === oldName ? trimmedName : chat
      ),
    };

    const updatedChatMessages = { ...chatMessages };

    if (updatedChatMessages[oldName]) {
      updatedChatMessages[trimmedName] = updatedChatMessages[oldName];
      delete updatedChatMessages[oldName];
    }

    const updatedChatActivity = { ...chatActivity };

    if (updatedChatActivity[oldName]) {
      updatedChatActivity[trimmedName] = updatedChatActivity[oldName];
      delete updatedChatActivity[oldName];
    }

    setProjectChats(updatedProjectChats);
    setChatMessages(updatedChatMessages);
    setChatActivity(updatedChatActivity);

    setPinnedChats(
      pinnedChats.map((chat) => (chat === oldName ? trimmedName : chat))
    );

    if (selectedChat === oldName) {
      setSelectedChat(trimmedName);
    }

    addActivity("chat", "Project chat renamed", `${oldName} → ${trimmedName}`);
    closeRenameModal();
  };

  const archiveProjectChat = (index) => {
    const chatToArchive = projectChatList[index];

    setProjectChats({
      ...projectChats,
      [selectedProject]: rawProjectChatList.filter(
        (chat) => chat !== chatToArchive
      ),
    });

    const updatedChatActivity = { ...chatActivity };
    delete updatedChatActivity[chatToArchive];

    setChatActivity(updatedChatActivity);

    setArchivedChats([
      ...archivedChats,
      {
        name: chatToArchive,
        sourceProject: selectedProject,
      },
    ]);

    setPinnedChats(pinnedChats.filter((chat) => chat !== chatToArchive));

    if (selectedChat === chatToArchive) {
      setSelectedChat("");
    }

    addActivity(
      "archive",
      "Project chat archived",
      `${chatToArchive} • ${selectedProject}`
    );

    setOpenChatMenu(null);
  };

  const deleteProjectChat = (index) => {
    const chatToDelete = projectChatList[index];

    setConfirmModal({
      isOpen: true,
      title: "Delete project chat?",
      message: `This will permanently delete "${chatToDelete}" from "${selectedProject}". This action cannot be undone.`,
      confirmText: "Delete chat",
      onConfirm: () => {
        setProjectChats({
          ...projectChats,
          [selectedProject]: rawProjectChatList.filter(
            (chat) => chat !== chatToDelete
          ),
        });

        const updatedChatMessages = { ...chatMessages };
        delete updatedChatMessages[chatToDelete];

        const updatedChatActivity = { ...chatActivity };
        delete updatedChatActivity[chatToDelete];

        setChatMessages(updatedChatMessages);
        setChatActivity(updatedChatActivity);
        setPinnedChats(pinnedChats.filter((chat) => chat !== chatToDelete));

        if (selectedChat === chatToDelete) {
          setSelectedChat("");
        }

        addActivity(
          "chat",
          "Project chat deleted",
          `${chatToDelete} • ${selectedProject}`
        );

        setOpenChatMenu(null);
        closeConfirmModal();
      },
    });
  };

  const uploadFiles = async (uploadedFiles) => {
    if (uploadedFiles.length === 0) return;

    if (!user) {
      showNotice("You must be logged in to upload files.");
      return;
    }

    setIsUploading(true);

    try {
      const uploadedFileData = await Promise.all(
        uploadedFiles.map((file) =>
          uploadProjectFile(user.uid, selectedProject, file)
        )
      );

      setProjectFiles({
        ...projectFiles,
        [selectedProject]: [...files, ...uploadedFileData],
      });

      uploadedFileData.forEach((file) => {
        addActivity("file", "File uploaded", `${file.name} • ${selectedProject}`);
      });
    } catch (error) {
      showNotice(error.message || "File upload failed.");
    } finally {
      setIsUploading(false);
      setIsDragging(false);
    }
  };

  const handleUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    await uploadFiles(uploadedFiles);
    e.target.value = "";
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    if (droppedFiles.length === 0) return;

    await uploadFiles(droppedFiles);
  };

  const openFilePreview = async (file, index) => {
    if (!file) return;

    try {
      const freshUrl = file.path
        ? await getProjectFileUrl(file.path)
        : file.url || "";

      setSelectedFilePreview({
        file: {
          ...file,
          url: freshUrl,
        },
        index,
      });
    } catch (error) {
      showNotice(error.message || "This file could not be opened.");
    }
  };

  const deleteFile = async (index) => {
    const fileToDelete = files[index];
    if (!fileToDelete) return;

    try {
      if (fileToDelete.path) {
        await deleteProjectFile(fileToDelete.path);
      }
    } catch (error) {
      showNotice(error.message || "The stored file could not be deleted.");
      return;
    }

    const updatedFiles = files.filter((_, i) => i !== index);

    setProjectFiles({
      ...projectFiles,
      [selectedProject]: updatedFiles,
    });

    addActivity("file", "File deleted", `${fileToDelete.name} • ${selectedProject}`);
  };

  const addNote = () => {
    if (!noteTitle.trim() && !noteBody.trim()) return;

    const newNote = {
      title: noteTitle.trim() || "Untitled Note",
      body: noteBody.trim(),
      createdAt: new Date().toLocaleString(),
    };

    setProjectNotes({
      ...projectNotes,
      [selectedProject]: [...notes, newNote],
    });

    addActivity("note", "Note added", `${newNote.title} • ${selectedProject}`);

    setNoteTitle("");
    setNoteBody("");
  };

  const deleteNote = (index) => {
    const noteToDelete = notes[index];
    const updatedNotes = notes.filter((_, i) => i !== index);

    setProjectNotes({
      ...projectNotes,
      [selectedProject]: updatedNotes,
    });

    addActivity("note", "Note deleted", `${noteToDelete.title} • ${selectedProject}`);
  };

  const tabs = [
    { id: "overview", label: "Overview", count: null },
    { id: "chats", label: "Chats", count: rawProjectChatList.length },
    { id: "files", label: "Files", count: files.length },
    { id: "images", label: "Images", count: images.length },
    { id: "notes", label: "Notes", count: notes.length },
  ];

  return (
    <div
      onClick={() => setOpenChatMenu(null)}
      className="orbital-page relative h-full min-h-0 overflow-y-auto overflow-x-hidden text-white"
    >
      <div className="orbital-earth-horizon pointer-events-none absolute inset-0 opacity-45" />

      {notice && (
        <div className="fixed left-3 right-3 top-16 z-[10000] rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm shadow-2xl shadow-red-950/20 sm:left-1/2 sm:right-auto sm:top-5 sm:max-w-md sm:-translate-x-1/2">
          {notice}
        </div>
      )}

      <div className="relative px-4 pb-28 pt-20 sm:px-6 sm:py-8 sm:pb-28 lg:px-7">
        <header className="mb-5 border-b border-white/[0.1] pb-5">
          <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h1 className="flex items-center gap-3 break-words text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                <span className="text-blue-400">◇</span>
                {selectedProject || "Untitled Project"}
              </h1>

              <p className="ml-9 mt-1 text-sm text-slate-500">
                Research, materials, and planning for this project.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <button
                onClick={createProjectChat}
                className="rounded-lg border border-violet-400/35 bg-violet-500/15 px-4 py-2.5 text-center text-sm text-white transition hover:bg-violet-500/25 sm:px-5"
              >
                + New Chat
              </button>

              <label
                htmlFor="headerFileUpload"
                className="cursor-pointer rounded-lg border border-white/[0.12] bg-[#07101F]/80 px-4 py-2.5 text-center text-sm text-slate-300 hover:bg-[#101827] sm:px-5"
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </label>

              <input
                id="headerFileUpload"
                type="file"
                multiple
                hidden
                disabled={isUploading}
                onChange={handleUpload}
              />
            </div>
          </div>
        </header>

        <section className="mb-5 hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">
          <div className="rounded-2xl bg-[#07101F]/90 border border-[#1B2540] p-4 sm:rounded-3xl sm:p-5">
            <p className="text-gray-400 text-sm">Chats</p>
            <h2 className="text-3xl font-bold mt-2">{rawProjectChatList.length}</h2>
          </div>

          <div className="rounded-2xl bg-[#07101F]/90 border border-[#1B2540] p-4 sm:rounded-3xl sm:p-5">
            <p className="text-gray-400 text-sm">Files</p>
            <h2 className="text-3xl font-bold mt-2">{files.length}</h2>
          </div>

          <div className="rounded-2xl bg-[#07101F]/90 border border-[#1B2540] p-4 sm:rounded-3xl sm:p-5">
            <p className="text-gray-400 text-sm">Images</p>
            <h2 className="text-3xl font-bold mt-2">{images.length}</h2>
          </div>

          <div className="rounded-2xl bg-[#07101F]/90 border border-[#1B2540] p-4 sm:rounded-3xl sm:p-5">
            <p className="text-gray-400 text-sm">Notes</p>
            <h2 className="text-3xl font-bold mt-2">{notes.length}</h2>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5">
          <main className="overflow-hidden bg-transparent">
            <div className="flex gap-5 overflow-x-auto border-b border-white/[0.12] px-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`shrink-0 border-b-2 px-1 py-3 text-sm capitalize transition ${
                    activeTab === tab.id
                      ? "border-blue-400 text-slate-100"
                      : "border-transparent text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && <span className="ml-2 text-xs text-gray-600">{tab.count}</span>}
                </button>
              ))}
            </div>

            <div className="py-5">
              {activeTab === "overview" && (
                <div className="space-y-5">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <section className="orbital-content-panel rounded-2xl p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between border-b border-white/[0.09] pb-3">
                        <h2 className="text-sm font-medium text-slate-200">Recent conversations</h2>
                        <button type="button" onClick={() => setActiveTab("chats")} className="text-xs text-violet-300">View all</button>
                      </div>
                      <div className="divide-y divide-white/[0.08]">
                        {projectChatList.slice(0, 5).map((chat) => (
                          <button key={chat} type="button" onClick={() => { setSelectedChat(chat); setPage("chat"); }} className="flex w-full items-center gap-3 py-3 text-left text-sm text-slate-300 hover:text-white">
                            <span className="text-slate-500">▣</span><span className="min-w-0 flex-1 truncate">{chat}</span><span className="text-xs text-slate-600">{formatUpdatedTime(chat)}</span>
                          </button>
                        ))}
                        {projectChatList.length === 0 && <p className="py-8 text-center text-sm text-slate-600">No project conversations yet.</p>}
                      </div>
                    </section>

                    <section className="orbital-content-panel rounded-2xl p-4 sm:p-5">
                      <div className="mb-3 flex items-center justify-between border-b border-white/[0.09] pb-3">
                        <h2 className="text-sm font-medium text-slate-200">Project files</h2>
                        <button type="button" onClick={() => setActiveTab("files")} className="text-xs text-violet-300">View all</button>
                      </div>
                      {files.length === 0 ? (
                        <label htmlFor="overviewFileUpload" className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-slate-500/40 px-4 py-8 text-sm text-slate-500 hover:border-violet-400/50 hover:text-violet-300">⇧<span className="mt-2">Upload files</span><span className="mt-1 text-[10px] text-slate-600">PDF, DOCX, PPTX and more</span><input id="overviewFileUpload" type="file" multiple hidden onChange={handleUpload} /></label>
                      ) : (
                        <div className="divide-y divide-white/[0.08]">
                          {files.slice(0, 5).map((file, index) => <button key={`${file.name}-${index}`} type="button" onClick={() => openFilePreview(file, index)} className="flex w-full items-center gap-3 py-3 text-left text-sm text-slate-300 hover:text-white"><span className="text-blue-400">▤</span><span className="min-w-0 flex-1 truncate">{file.name}</span><span className="text-xs text-slate-600">{file.size}</span></button>)}
                        </div>
                      )}
                    </section>
                  </div>

                  <section className="orbital-content-panel rounded-2xl border-violet-400/15 p-5 sm:p-6">
                    <p className="text-sm font-medium text-violet-300">✦ Project insight</p>
                    <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">Keep related conversations, files, images and notes together here. OrbitalAI can use this project context to produce more focused answers.</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500"><span>{rawProjectChatList.length} chats</span><span>•</span><span>{files.length} files</span><span>•</span><span>{notes.length} notes</span></div>
                  </section>
                </div>
              )}
              {activeTab === "chats" && (
                <>
                  <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Project chats</h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Conversations attached to this workspace.
                      </p>
                    </div>

                    <button
                      onClick={createProjectChat}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700"
                    >
                      + New Chat
                    </button>
                  </div>

                  {projectChatList.length === 0 ? (
                    <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400">
                      No chats inside this project yet. Click + New Chat or move
                      a chat into this project.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projectChatList.map((chat, index) => (
                        <div key={chat} className="relative">
                          <ProjectChatCard
                            chat={chat}
                            isPinned={isPinned(chat)}
                            formatUpdatedTime={formatUpdatedTime}
                            onOpen={(e) => {
                              e.stopPropagation();
                              setSelectedChat(chat);
                              setPage("chat");
                            }}
                            onMenuClick={(e) => {
                              e.stopPropagation();
                              setOpenChatMenu(
                                openChatMenu === index ? null : index
                              );
                            }}
                          />

                          {openChatMenu === index && (
                            <ProjectChatMenu
                              isPinned={isPinned(chat)}
                              onRename={(e) => {
                                e.stopPropagation();
                                openRenameProjectChat(index);
                              }}
                              onTogglePin={(e) => {
                                e.stopPropagation();
                                togglePinChat(chat);
                                setOpenChatMenu(null);
                              }}
                              onArchive={(e) => {
                                e.stopPropagation();
                                archiveProjectChat(index);
                              }}
                              onDelete={(e) => {
                                e.stopPropagation();
                                deleteProjectChat(index);
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "files" && (
                <>
                  <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Project files</h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Upload documents, PDFs, images and other assets.
                      </p>
                    </div>

                    <label
                      htmlFor="fileUpload"
                      className="px-4 py-2 rounded-xl bg-purple-600 cursor-pointer hover:bg-purple-700"
                    >
                      {isUploading ? "Uploading..." : "Upload File"}
                    </label>

                    <input
                      id="fileUpload"
                      type="file"
                      multiple
                      hidden
                      disabled={isUploading}
                      onChange={handleUpload}
                    />
                  </div>

                  <div
                    data-project-drop-zone="true"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`mb-6 rounded-3xl border border-dashed p-6 text-center transition sm:p-10 ${
                      isDragging
                        ? "border-purple-500 bg-purple-950/20 text-purple-300"
                        : "border-[#1B2540] bg-[#101827]/60 text-gray-400"
                    }`}
                  >
                    <div className="text-4xl mb-3">⬆</div>
                    <p className="font-medium">
                      Drop files here or use the upload button
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Files will be saved inside this project.
                    </p>
                  </div>

                  {files.length === 0 ? (
                    <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400">
                      No files uploaded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          onClick={() => openFilePreview(file, index)}
                          className="flex min-w-0 cursor-pointer flex-col items-stretch gap-3 rounded-2xl border border-[#1B2540] bg-[#101827] p-4 transition hover:border-purple-500/60 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <h3 className="break-all font-semibold">📄 {file.name}</h3>

                            <p className="text-gray-400 text-sm mt-1">
                              {file.size} • {file.type}
                            </p>

                            {file.url && (
                              <button className="inline-block mt-2 text-purple-400 hover:text-purple-300 text-sm">
                                Preview File →
                              </button>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFile(index);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "images" && (
                <>
                  <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Images</h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Visual assets uploaded to this project.
                      </p>
                    </div>

                    <label
                      htmlFor="imageUpload"
                      className="px-4 py-2 rounded-xl bg-purple-600 cursor-pointer hover:bg-purple-700"
                    >
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </label>

                    <input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      disabled={isUploading}
                      onChange={handleUpload}
                    />
                  </div>

                  <div
                    data-project-drop-zone="true"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`mb-6 rounded-3xl border border-dashed p-6 text-center transition sm:p-10 ${
                      isDragging
                        ? "border-purple-500 bg-purple-950/20 text-purple-300"
                        : "border-[#1B2540] bg-[#101827]/60 text-gray-400"
                    }`}
                  >
                    <div className="text-4xl mb-3">🖼️</div>
                    <p className="font-medium">Drop images here to upload</p>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, WEBP and other image files.
                    </p>
                  </div>

                  {images.length === 0 ? (
                    <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400">
                      No images uploaded yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {images.map((file, imageIndex) => {
                        const originalIndex = files.findIndex(
                          (item) =>
                            item.name === file.name &&
                            item.uploadedAt === file.uploadedAt
                        );

                        return (
                          <div
                            key={`${file.name}-${imageIndex}`}
                            onClick={() =>
                              openFilePreview(
                                file,
                                originalIndex === -1
                                  ? imageIndex
                                  : originalIndex
                              )
                            }
                            className="bg-[#101827] border border-[#1B2540] rounded-2xl p-4 cursor-pointer hover:border-purple-500/60 transition"
                          >
                            <ProjectImageThumbnail file={file} />

                            <h3 className="font-semibold truncate">
                              {file.name}
                            </h3>

                            <p className="text-gray-400 text-sm mt-1">
                              {file.size}
                            </p>

                            <button className="inline-block mt-2 text-purple-400 hover:text-purple-300 text-sm">
                              Preview Image →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === "notes" && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">Notes</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Save ideas, references and working notes for this project.
                    </p>
                  </div>

                  <div className="bg-[#101827] border border-[#1B2540] rounded-3xl p-5 mb-6">
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      placeholder="Note title..."
                      className="w-full mb-4 p-4 rounded-2xl bg-[#07101F] border border-[#1B2540] outline-none text-white placeholder:text-gray-500"
                    />

                    <textarea
                      value={noteBody}
                      onChange={(e) => setNoteBody(e.target.value)}
                      placeholder="Write your note..."
                      rows="5"
                      className="w-full mb-4 p-4 rounded-2xl bg-[#07101F] border border-[#1B2540] outline-none resize-none text-white placeholder:text-gray-500"
                    />

                    <button
                      onClick={addNote}
                      className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700"
                    >
                      Add Note
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-8 text-gray-400">
                      No notes added yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notes.map((note, index) => (
                        <ProjectNoteCard
                          key={`${note.title}-${index}`}
                          note={note}
                          onDelete={() => deleteNote(index)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          <aside className="hidden">
            <h2 className="text-xl font-bold mb-6">Project details</h2>

            <div className="space-y-5">
              <div>
                <p className="text-gray-400 text-sm mb-1">Name</p>
                <p className="font-semibold">
                  {selectedProject || "Untitled Project"}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Total chats</p>
                <p className="font-semibold">{rawProjectChatList.length}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Files</p>
                <p className="font-semibold">{files.length}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Images</p>
                <p className="font-semibold">{images.length}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Notes</p>
                <p className="font-semibold">{notes.length}</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
              <p className="font-semibold mb-2">Quick upload</p>
              <p className="text-gray-400 text-sm mb-4">
                Add files directly to this project.
              </p>

              <label
                htmlFor="sidebarFileUpload"
                className="block text-center w-full p-3 rounded-xl border border-purple-600 cursor-pointer hover:bg-[#151E33]"
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </label>

              <input
                id="sidebarFileUpload"
                type="file"
                multiple
                hidden
                disabled={isUploading}
                onChange={handleUpload}
              />
            </div>
          </aside>
        </div>
      </div>

      <FilePreviewModal
        file={selectedFilePreview?.file}
        onClose={() => setSelectedFilePreview(null)}
        onDelete={() => {
          if (selectedFilePreview) {
            deleteFile(selectedFilePreview.index);
            setSelectedFilePreview(null);
          }
        }}
      />

      <RenameModal
        isOpen={renameModalOpen}
        title="Rename Project Chat"
        value={renameValue}
        setValue={setRenameValue}
        onCancel={closeRenameModal}
        onSave={saveRenameProjectChat}
      />

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
    </div>
  );
}

export default Project;
