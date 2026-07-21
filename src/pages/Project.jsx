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
  const [activeTab, setActiveTab] = useState("chats");
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
    { id: "chats", label: "Chats", count: rawProjectChatList.length },
    { id: "files", label: "Files", count: files.length },
    { id: "images", label: "Images", count: images.length },
    { id: "notes", label: "Notes", count: notes.length },
  ];

  return (
    <div
      onClick={() => setOpenChatMenu(null)}
      className="relative h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#020817] text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      {notice && (
        <div className="fixed left-3 right-3 top-16 z-[10000] rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm shadow-2xl shadow-red-950/20 sm:left-1/2 sm:right-auto sm:top-5 sm:max-w-md sm:-translate-x-1/2">
          {notice}
        </div>
      )}

      <div className="relative px-4 pb-12 pt-16 sm:px-6 sm:py-8 sm:pb-16 lg:px-10">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
                <span>✦</span>
                <span>Project Workspace</span>
              </div>

              <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
                {selectedProject || "Untitled Project"}
              </h1>

              <p className="text-gray-400 mt-3">
                {rawProjectChatList.length} chats • {files.length} files •{" "}
                {images.length} images • {notes.length} notes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <button
                onClick={createProjectChat}
                className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 px-4 py-3 text-center text-sm text-white shadow-lg shadow-purple-700/20 transition hover:scale-[1.02] sm:rounded-2xl sm:px-5 sm:text-base"
              >
                + New Chat
              </button>

              <label
                htmlFor="headerFileUpload"
                className="cursor-pointer rounded-xl border border-[#1B2540] bg-[#07101F] px-4 py-3 text-center text-sm text-gray-200 hover:bg-[#101827] sm:rounded-2xl sm:px-5 sm:text-base"
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

        <section className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 xl:grid-cols-4">
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

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
          <main className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
            <div className="flex gap-2 overflow-x-auto border-b border-[#1B2540] bg-[#020817]/50 p-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`shrink-0 px-4 py-3 rounded-2xl capitalize transition sm:px-5 ${
                    activeTab === tab.id
                      ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                      : "text-gray-400 hover:bg-[#101827] border border-transparent"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 text-xs text-gray-500">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6">
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

          <aside className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-6 h-fit shadow-2xl shadow-purple-950/10">
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
