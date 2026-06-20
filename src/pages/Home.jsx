function Home({
  chats,
  projects,
  projectChats,
  projectFiles,
  projectNotes,
  archivedChats,
  archivedProjects,
}) {
  const projectChatCount = Object.values(projectChats || {}).flat().length;

  const fileCount = Object.values(projectFiles || {}).flat().length;

  const imageCount = Object.values(projectFiles || {})
    .flat()
    .filter(
      (file) =>
        file.type &&
        file.type.startsWith("image")
    ).length;

  const noteCount = Object.values(projectNotes || {}).flat().length;

  const archivedCount =
    archivedChats.length +
    archivedProjects.length;

  const totalChats =
    chats.length +
    projectChatCount;

  return (
    <div className="flex-1 min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20"></div>

      <div className="relative px-10 py-10">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              OrbitalAI
            </span>
          </h1>

          <p className="text-xl text-gray-400">
            One Request. Multiple AI Experts.
          </p>
        </div>

        {/* Dashboard Cards */}

        <div className="grid grid-cols-4 gap-6 mb-10">
          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Total Chats
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {totalChats}
            </h2>
          </div>

          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Projects
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {projects.length}
            </h2>
          </div>

          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Files
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {fileCount}
            </h2>
          </div>

          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Notes
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {noteCount}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-12">
          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Images
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {imageCount}
            </h2>
          </div>

          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Archived
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {archivedCount}
            </h2>
          </div>

          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Project Chats
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {projectChatCount}
            </h2>
          </div>

          <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
            <p className="text-gray-400">
              Workspace Health
            </p>

            <h2 className="text-2xl font-bold mt-4 text-green-400">
              Excellent
            </h2>
          </div>
        </div>

        {/* Quick Actions */}

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-5">
            Quick Actions
          </h2>

          <div className="flex gap-6">
            <div className="w-80 p-6 rounded-2xl bg-[#101827] border border-gray-800 hover:border-purple-500 cursor-pointer">
              <h3 className="font-semibold mb-2">
                Create a project
              </h3>

              <p className="text-gray-400 text-sm">
                Create a project with chats,
                files, notes and images.
              </p>
            </div>

            <div className="w-80 p-6 rounded-2xl bg-[#101827] border border-gray-800 hover:border-purple-500 cursor-pointer">
              <h3 className="font-semibold mb-2">
                Ask OrbitalAI
              </h3>

              <p className="text-gray-400 text-sm">
                Research, code, write and
                generate outputs instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Input */}

        <div className="max-w-4xl bg-[#101827] border border-purple-900/60 rounded-2xl p-4 flex items-center gap-4">
          <button className="w-12 h-12 rounded-xl bg-[#151E33] text-3xl">
            +
          </button>

          <button className="w-12 h-12 rounded-xl bg-[#151E33] text-xl">
            🎤
          </button>

          <input
            type="text"
            placeholder="Ask OrbitalAI anything..."
            className="flex-1 bg-transparent outline-none text-gray-300"
          />

          <button className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;