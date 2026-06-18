function Project({ selectedProject, projectChats, setSelectedChat, setPage }) {
  const chats = projectChats[selectedProject] || [];

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold">
          📂 {selectedProject || "Untitled Project"}
        </h1>
        <p className="text-gray-400 mt-2">
          {chats.length} chats • Project folder
        </p>
      </div>

      <div className="flex gap-10 border-b border-gray-800 mb-8 pb-4">
        <button className="text-purple-400 border-b-2 border-purple-500 pb-3">
          Chats
        </button>
        <button className="text-gray-400">Files</button>
        <button className="text-gray-400">Images</button>
        <button className="text-gray-400">Notes</button>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-2xl font-bold">Chats in this project</h2>
          </div>

          {chats.length === 0 ? (
            <div className="bg-[#101827] border border-gray-800 rounded-xl p-6 text-gray-400">
              No chats inside this project yet. Use the chat three-dot menu and
              choose “Move to Project”.
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
                    <p className="text-gray-400 text-sm">Updated recently</p>
                  </div>
                  <span className="text-gray-500">Open →</span>
                </div>
              ))}
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
          <p className="font-semibold mb-6">12</p>

          <p className="text-gray-400 mb-2">Images</p>
          <p className="font-semibold mb-6">8</p>

          <button className="w-full mt-6 p-3 rounded-xl border border-purple-600">
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
}

export default Project;