function Settings({
  user,
  chats,
  projects,
  projectChats,
  projectNotes,
  pinnedChats,
  archivedChats,
  archivedProjects,
  handleLogout,
}) {
  const totalProjectChats = Object.values(projectChats || {}).flat().length;

  const totalNotes = Object.values(projectNotes || {}).flat().length;

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-2">
        Account Settings
      </h1>

      <p className="text-gray-400 mb-10">
        Manage your OrbitalAI workspace.
      </p>

      <div className="grid grid-cols-2 gap-8">

        {/* Profile */}

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">
            Profile
          </h2>

          <div className="space-y-5">

            <div>
              <p className="text-gray-400 mb-1">
                Full Name
              </p>

              <p className="text-lg font-semibold">
                {user?.displayName || "Not Set"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 mb-1">
                Email
              </p>

              <p className="text-lg font-semibold">
                {user?.email}
              </p>
            </div>

            <div>
              <p className="text-gray-400 mb-1">
                User ID
              </p>

              <p className="text-sm break-all text-gray-300">
                {user?.uid}
              </p>
            </div>

          </div>
        </div>

        {/* Workspace */}

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">
            Workspace Statistics
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Total Global Chats</span>
              <span>{chats.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Total Project Chats</span>
              <span>{totalProjectChats}</span>
            </div>

            <div className="flex justify-between">
              <span>Projects</span>
              <span>{projects.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Notes</span>
              <span>{totalNotes}</span>
            </div>

            <div className="flex justify-between">
              <span>Pinned Chats</span>
              <span>{pinnedChats.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Archived Items</span>
              <span>
                {archivedChats.length + archivedProjects.length}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Account Actions */}

      <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6 mt-8">

        <h2 className="text-2xl font-bold mb-6">
          Account Actions
        </h2>

        <button
          onClick={handleLogout}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700"
        >
          Logout
        </button>

      </div>
    </div>
  );
}

export default Settings;