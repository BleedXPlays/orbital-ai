import { useState } from "react";

function Project({
  selectedProject,
  projectChats,
  setProjectChats,
  chats,
  setChats,
  projectFiles,
  setProjectFiles,
  setSelectedChat,
  setPage,
}) {
  const createProjectChat = () => {
  const chatName = `New Chat ${chats.length + 1}`;

  setChats([...chats, chatName]);

  setProjectChats({
    ...projectChats,
    [selectedProject]: [
      ...(projectChats[selectedProject] || []),
      chatName,
    ],
  });

  setSelectedChat(chatName);
  setPage("chat");
};
  const [activeTab, setActiveTab] = useState("chats");

  const chats = projectChats[selectedProject] || [];
  const files = projectFiles[selectedProject] || [];

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

  const images = files.filter((file) => file.type.startsWith("image"));

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          📂 {selectedProject || "Untitled Project"}
        </h1>

        <p className="text-gray-400 mt-2">
          {chats.length} chats • {files.length} files • {images.length} images
        </p>
      </div>

      <div className="flex gap-10 border-b border-gray-800 mb-8 pb-4">
        <button
          onClick={() => setActiveTab("chats")}
          className={
            activeTab === "chats"
              ? "text-purple-400 border-b-2 border-purple-500 pb-3"
              : "text-gray-400 pb-3"
          }
        >
          Chats
        </button>

        <button
          onClick={() => setActiveTab("files")}
          className={
            activeTab === "files"
              ? "text-purple-400 border-b-2 border-purple-500 pb-3"
              : "text-gray-400 pb-3"
          }
        >
          Files
        </button>

        <button
          onClick={() => setActiveTab("images")}
          className={
            activeTab === "images"
              ? "text-purple-400 border-b-2 border-purple-500 pb-3"
              : "text-gray-400 pb-3"
          }
        >
          Images
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={
            activeTab === "notes"
              ? "text-purple-400 border-b-2 border-purple-500 pb-3"
              : "text-gray-400 pb-3"
          }
        >
          Notes
        </button>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          {activeTab === "chats" && (
            <>
              <div className="flex justify-between items-center mb-6">
  <h2 className="text-2xl font-bold">
    Chats in this project
  </h2>

  <button
    onClick={createProjectChat}
    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700"
  >
    + New Chat
  </button>
</div>

              {chats.length === 0 ? (
                <div className="bg-[#101827] border border-gray-800 rounded-xl p-6 text-gray-400">
                  No chats inside this project yet. Use the chat three-dot menu
                  and choose “Move to Project”.
                </div>
              ) : (
                <div className="space-y-3">
                  {chats.map((chat) => (
                    <div
                      key={chat}
                      onClick={() => {
                        setSelectedChat(chat);
                        setPage("chat");
                      }}
                      className="flex justify-between items-center bg-[#101827] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700"
                    >
                      <div>
                        <h3 className="font-semibold">💬 {chat}</h3>
                        <p className="text-gray-400 text-sm">
                          Updated recently
                        </p>
                      </div>

                      <span className="text-gray-500">Open →</span>
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

              <div className="bg-[#101827] border border-gray-800 rounded-xl p-6 text-gray-400">
                Notes section will be added next.
              </div>
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
          <p className="font-semibold mb-6">{chats.length}</p>

          <p className="text-gray-400 mb-2">Files</p>
          <p className="font-semibold mb-6">{files.length}</p>

          <p className="text-gray-400 mb-2">Images</p>
          <p className="font-semibold mb-6">{images.length}</p>

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