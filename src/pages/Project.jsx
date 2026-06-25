import { useState } from "react";

function Project({
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
}) {
  const [activeTab, setActiveTab] = useState("chats");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [openChatMenu, setOpenChatMenu] = useState(null);

  const rawProjectChatList = projectChats[selectedProject] || [];
  const files = projectFiles[selectedProject] || [];
  const notes = projectNotes[selectedProject] || [];
  const images = files.filter((file) => file.type.startsWith("image"));

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
    } else {
      setPinnedChats([...pinnedChats, chat]);
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

    setOpenChatMenu(null);
  };

  const archiveProjectChat = (index) => {
    const chatToArchive = projectChatList[index];

    const updatedProjectChats = {
      ...projectChats,
      [selectedProject]: rawProjectChatList.filter(
        (chat) => chat !== chatToArchive
      ),
    };

    const updatedChatActivity = { ...chatActivity };
    delete updatedChatActivity[chatToArchive];

    setProjectChats(updatedProjectChats);
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

    setOpenChatMenu(null);
  };

  const deleteProjectChat = (index) => {
    const confirmDelete = confirm("Delete this project chat?");
    if (!confirmDelete) return;

    const chatToDelete = projectChatList[index];

    const updatedProjectChats = {
      ...projectChats,
      [selectedProject]: rawProjectChatList.filter(
        (chat) => chat !== chatToDelete
      ),
    };

    const updatedChatMessages = { ...chatMessages };
    delete updatedChatMessages[chatToDelete];

    const updatedChatActivity = { ...chatActivity };
    delete updatedChatActivity[chatToDelete];

    setProjectChats(updatedProjectChats);
    setChatMessages(updatedChatMessages);
    setChatActivity(updatedChatActivity);
    setPinnedChats(pinnedChats.filter((chat) => chat !== chatToDelete));

    if (selectedChat === chatToDelete) {
      setSelectedChat("");
    }

    setOpenChatMenu(null);
  };

  const handleUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);

    if (uploadedFiles.length === 0) return;

    const newFiles = uploadedFiles.map((file) => ({
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      type: file.type || "Unknown file",
    }));

    setProjectFiles({
      ...projectFiles,
      [selectedProject]: [...files, ...newFiles],
    });

    e.target.value = "";
  };

  const deleteFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);

    setProjectFiles({
      ...projectFiles,
      [selectedProject]: updatedFiles,
    });
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

    setNoteTitle("");
    setNoteBody("");
  };

  const deleteNote = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);

    setProjectNotes({
      ...projectNotes,
      [selectedProject]: updatedNotes,
    });
  };

  return (
    <div
      onClick={() => setOpenChatMenu(null)}
      className="flex-1 min-h-screen bg-black text-white px-10 py-8"
    >
      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          📂 {selectedProject || "Untitled Project"}
        </h1>

        <p className="text-gray-400 mt-2">
          {rawProjectChatList.length} chats • {files.length} files •{" "}
          {images.length} images • {notes.length} notes
        </p>
      </div>

      <div className="flex gap-10 border-b border-gray-800 mb-8 pb-4">
        {["chats", "files", "images", "notes"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? "text-purple-400 border-b-2 border-purple-500 pb-3 capitalize"
                : "text-gray-400 pb-3 capitalize"
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          {activeTab === "chats" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Chats in this project</h2>

                <button
                  onClick={createProjectChat}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700"
                >
                  + New Chat
                </button>
              </div>

              {projectChatList.length === 0 ? (
                <div className="bg-[#101827] border border-gray-800 rounded-xl p-6 text-gray-400">
                  No chats inside this project yet. Click + New Chat or move a
                  chat into this project.
                </div>
              ) : (
                <div className="space-y-3">
                  {projectChatList.map((chat, index) => (
                    <div
                      key={chat}
                      onClick={() => {
                        setSelectedChat(chat);
                        setPage("chat");
                      }}
                      className="relative flex justify-between items-center bg-[#101827] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {isPinned(chat) ? "⭐" : "💬"} {chat}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {formatUpdatedTime(chat)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">Open →</span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenChatMenu(
                              openChatMenu === index ? null : index
                            );
                          }}
                          className="text-gray-500 hover:text-white px-2"
                        >
                          ⋮
                        </button>
                      </div>

                      {openChatMenu === index && (
                        <div className="absolute right-4 top-14 z-50 w-36 bg-[#08111F] border border-[#1B2540] rounded-xl shadow-xl p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              renameProjectChat(index);
                            }}
                            className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                          >
                            Rename
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinChat(chat);
                              setOpenChatMenu(null);
                            }}
                            className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                          >
                            {isPinned(chat) ? "Unpin" : "Pin"}
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveProjectChat(index);
                            }}
                            className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
                          >
                            Archive
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProjectChat(index);
                            }}
                            className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-[#141f33]"
                          >
                            Delete
                          </button>
                        </div>
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
                <h2 className="text-2xl font-bold">Project Files</h2>

                <label
                  htmlFor="fileUpload"
                  className="px-4 py-2 rounded-xl bg-purple-600 cursor-pointer hover:bg-purple-700"
                >
                  Upload File
                </label>

                <input
                  id="fileUpload"
                  type="file"
                  multiple
                  hidden
                  onChange={handleUpload}
                />
              </div>

              {files.length === 0 ? (
                <div className="bg-[#101827] border border-gray-800 rounded-xl p-6 text-gray-400">
                  No files uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex justify-between items-center bg-[#101827] border border-gray-800 rounded-xl p-4"
                    >
                      <div>
                        <h3 className="font-semibold">📄 {file.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {file.size} • {file.type}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteFile(index)}
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
                <h2 className="text-2xl font-bold">Images</h2>

                <label
                  htmlFor="imageUpload"
                  className="px-4 py-2 rounded-xl bg-purple-600 cursor-pointer hover:bg-purple-700"
                >
                  Upload Image
                </label>

                <input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleUpload}
                />
              </div>

              {images.length === 0 ? (
                <div className="bg-[#101827] border border-gray-800 rounded-xl p-6 text-gray-400">
                  No images uploaded yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {images.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="bg-[#101827] border border-gray-800 rounded-xl p-4"
                    >
                      <div className="h-32 rounded-xl bg-[#151E33] flex items-center justify-center text-4xl mb-4">
                        🖼️
                      </div>

                      <h3 className="font-semibold">{file.name}</h3>
                      <p className="text-gray-400 text-sm">{file.size}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "notes" && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Notes</h2>

              <div className="bg-[#101827] border border-gray-800 rounded-xl p-5 mb-6">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="w-full mb-4 p-3 rounded-xl bg-[#08111F] border border-[#1B2540] outline-none"
                />

                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Write your note..."
                  rows="5"
                  className="w-full mb-4 p-3 rounded-xl bg-[#08111F] border border-[#1B2540] outline-none resize-none"
                />

                <button
                  onClick={addNote}
                  className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700"
                >
                  Add Note
                </button>
              </div>

              {notes.length === 0 ? (
                <div className="bg-[#101827] border border-gray-800 rounded-xl p-6 text-gray-400">
                  No notes added yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note, index) => (
                    <div
                      key={`${note.title}-${index}`}
                      className="bg-[#101827] border border-gray-800 rounded-xl p-5"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">{note.title}</h3>
                          <p className="text-gray-500 text-sm mt-1">
                            {note.createdAt}
                          </p>
                        </div>

                        <button
                          onClick={() => deleteNote(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>

                      <p className="text-gray-300 mt-4 whitespace-pre-wrap">
                        {note.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">Project Details</h2>

          <p className="text-gray-400 mb-2">Name</p>
          <p className="font-semibold mb-6">
            {selectedProject || "Untitled Project"}
          </p>

          <p className="text-gray-400 mb-2">Total Chats</p>
          <p className="font-semibold mb-6">{rawProjectChatList.length}</p>

          <p className="text-gray-400 mb-2">Files</p>
          <p className="font-semibold mb-6">{files.length}</p>

          <p className="text-gray-400 mb-2">Images</p>
          <p className="font-semibold mb-6">{images.length}</p>

          <p className="text-gray-400 mb-2">Notes</p>
          <p className="font-semibold mb-6">{notes.length}</p>

          <label
            htmlFor="sidebarFileUpload"
            className="block text-center w-full mt-6 p-3 rounded-xl border border-purple-600 cursor-pointer hover:bg-[#101827]"
          >
            Upload File
          </label>

          <input
            id="sidebarFileUpload"
            type="file"
            multiple
            hidden
            onChange={handleUpload}
          />
        </div>
      </div>
    </div>
  );
}

export default Project;