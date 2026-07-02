import { useState } from "react";
import ProjectChatCard from "../components/ProjectChatCard";
import ProjectChatMenu from "../components/ProjectChatMenu";
import ProjectNoteCard from "../components/ProjectNoteCard";
import FilePreviewModal from "../components/FilePreviewModal";
import { uploadProjectFile } from "../utils/uploadFile";

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

  const renameProjectChat = (index) => {
    const oldName = projectChatList[index];
    const newName = prompt("Enter new chat name:", oldName);

    if (!newName || !newName.trim()) return;

    const trimmedName = newName.trim();

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
    setOpenChatMenu(null);
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
    const confirmDelete = confirm("Delete this project chat?");
    if (!confirmDelete) return;

    const chatToDelete = projectChatList[index];

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
  };

  const uploadFiles = async (uploadedFiles) => {
    if (uploadedFiles.length === 0) return;

    if (!user) {
      alert("You must be logged in to upload files.");
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
      alert(error.message);
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

  const deleteFile = (index) => {
    const fileToDelete = files[index];
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
      className="relative min-h-screen bg-[#020817] text-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      <div className="relative px-10 py-8 pb-16">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
                <span>✦</span>
                <span>Project Workspace</span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight">
                {selectedProject || "Untitled Project"}
              </h1>

              <p className="text-gray-400 mt-3">
                {rawProjectChatList.length} chats • {files.length} files •{" "}
                {images.length} images • {notes.length} notes
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={createProjectChat}
                className="px-5 py-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-700/20 hover:scale-[1.02] transition"
              >
                + New Chat
              </button>

              <label
                htmlFor="headerFileUpload"
                className="px-5 py-3 rounded-2xl bg-[#07101F] border border-[#1B2540] text-gray-200 cursor-pointer hover:bg-[#101827]"
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

        <section className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Chats</p>
            <h2 className="text-3xl font-bold mt-2">{rawProjectChatList.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Files</p>
            <h2 className="text-3xl font-bold mt-2">{files.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Images</p>
            <h2 className="text-3xl font-bold mt-2">{images.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Notes</p>
            <h2 className="text-3xl font-bold mt-2">{notes.length}</h2>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_300px] gap-6">
          <main className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
            <div className="flex gap-2 p-3 border-b border-[#1B2540] bg-[#020817]/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
                  className={`px-5 py-3 rounded-2xl capitalize transition ${
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

            <div className="p-6">
              {activeTab === "chats" && (
                <>
                  <div className="flex justify-between items-center mb-6">
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
                                renameProjectChat(index);
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
                  <div className="flex justify-between items-center mb-6">
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-3xl p-10 mb-6 text-center transition ${
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
                          onClick={() => setSelectedFilePreview({ file, index })}
                          className="flex justify-between items-center bg-[#101827] border border-[#1B2540] rounded-2xl p-4 cursor-pointer hover:border-purple-500/60 transition"
                        >
                          <div>
                            <h3 className="font-semibold">📄 {file.name}</h3>

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
                  <div className="flex justify-between items-center mb-6">
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
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-3xl p-10 mb-6 text-center transition ${
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
                    <div className="grid grid-cols-2 gap-4">
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
                              setSelectedFilePreview({
                                file,
                                index:
                                  originalIndex === -1
                                    ? imageIndex
                                    : originalIndex,
                              })
                            }
                            className="bg-[#101827] border border-[#1B2540] rounded-2xl p-4 cursor-pointer hover:border-purple-500/60 transition"
                          >
                            {file.url ? (
                              <img
                                src={file.url}
                                alt={file.name}
                                className="h-40 w-full object-cover rounded-2xl mb-4"
                              />
                            ) : (
                              <div className="h-40 rounded-2xl bg-[#151E33] flex items-center justify-center text-4xl mb-4">
                                🖼️
                              </div>
                            )}

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
    </div>
  );
}

export default Project;