function Archived({
  chats,
  setChats,
  projects,
  setProjects,
  archivedChats,
  setArchivedChats,
  archivedProjects,
  setArchivedProjects,
}) {
  const restoreChat = (index) => {
    const chat = archivedChats[index];
    setChats([...chats, chat]);
    setArchivedChats(archivedChats.filter((_, i) => i !== index));
  };

  const deleteArchivedChat = (index) => {
    setArchivedChats(archivedChats.filter((_, i) => i !== index));
  };

  const restoreProject = (index) => {
    const project = archivedProjects[index];
    setProjects([...projects, project]);
    setArchivedProjects(archivedProjects.filter((_, i) => i !== index));
  };

  const deleteArchivedProject = (index) => {
    setArchivedProjects(archivedProjects.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-4">Archived Items</h1>
      <p className="text-gray-400 mb-8">
        Restore or permanently delete archived chats and projects.
      </p>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5 text-purple-400">
            Archived Chats
          </h2>

          {archivedChats.length === 0 ? (
            <p className="text-gray-500">No archived chats yet.</p>
          ) : (
            <div className="space-y-3">
              {archivedChats.map((chat, index) => (
                <div
                  key={index}
                  className="bg-[#101827] border border-gray-800 rounded-xl p-4 flex justify-between items-center"
                >
                  <span>💬 {chat}</span>

                  <div className="flex gap-3">
                    <button
                      onClick={() => restoreChat(index)}
                      className="text-green-400 hover:text-green-300"
                    >
                      Restore
                    </button>

                    <button
                      onClick={() => deleteArchivedChat(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-5 text-purple-400">
            Archived Projects
          </h2>

          {archivedProjects.length === 0 ? (
            <p className="text-gray-500">No archived projects yet.</p>
          ) : (
            <div className="space-y-3">
              {archivedProjects.map((project, index) => (
                <div
                  key={index}
                  className="bg-[#101827] border border-gray-800 rounded-xl p-4 flex justify-between items-center"
                >
                  <span>📂 {project}</span>

                  <div className="flex gap-3">
                    <button
                      onClick={() => restoreProject(index)}
                      className="text-green-400 hover:text-green-300"
                    >
                      Restore
                    </button>

                    <button
                      onClick={() => deleteArchivedProject(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Archived;