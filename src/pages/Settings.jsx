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
  const archivedTotal = archivedChats.length + archivedProjects.length;

  return (
    <div className="relative min-h-screen bg-[#020817] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(80,90,255,0.14),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.12),transparent_35%)]" />

      <div className="relative px-10 py-8 pb-16">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600/10 border border-purple-500/20 text-purple-300 text-sm mb-4">
            <span>⚙️</span>
            <span>Settings</span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">
            Account Settings
          </h1>

          <p className="text-gray-400 mt-3 max-w-2xl">
            Manage your OrbitalAI profile, workspace details and account actions.
          </p>
        </header>

        <section className="grid grid-cols-4 gap-4 mb-8">
          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Global chats</p>
            <h2 className="text-3xl font-bold mt-2">{chats.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Projects</p>
            <h2 className="text-3xl font-bold mt-2">{projects.length}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Project chats</p>
            <h2 className="text-3xl font-bold mt-2">{totalProjectChats}</h2>
          </div>

          <div className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-5">
            <p className="text-gray-400 text-sm">Notes</p>
            <h2 className="text-3xl font-bold mt-2">{totalNotes}</h2>
          </div>
        </section>

        <div className="grid grid-cols-[1fr_340px] gap-6">
          <main className="space-y-6">
            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Profile</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Your signed-in Firebase account details.
                </p>
              </div>

              <div className="p-6 grid grid-cols-2 gap-5">
                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
                  <p className="text-gray-400 text-sm mb-2">Full name</p>
                  <p className="text-lg font-semibold">
                    {user?.displayName || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
                  <p className="text-gray-400 text-sm mb-2">Email</p>
                  <p className="text-lg font-semibold break-words">
                    {user?.email || "Not available"}
                  </p>
                </div>

                <div className="col-span-2 rounded-2xl bg-[#101827] border border-[#1B2540] p-5">
                  <p className="text-gray-400 text-sm mb-2">User ID</p>
                  <p className="text-sm break-all text-gray-300">
                    {user?.uid || "Not available"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] shadow-2xl shadow-purple-950/10 overflow-hidden">
              <div className="p-6 border-b border-[#1B2540] bg-[#020817]/50">
                <h2 className="text-2xl font-bold">Workspace statistics</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Current saved structure inside your OrbitalAI workspace.
                </p>
              </div>

              <div className="p-6 space-y-4">
                {[
                  ["Total global chats", chats.length],
                  ["Total project chats", totalProjectChats],
                  ["Projects", projects.length],
                  ["Notes", totalNotes],
                  ["Pinned chats", pinnedChats.length],
                  ["Archived items", archivedTotal],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between items-center rounded-2xl bg-[#101827] border border-[#1B2540] p-4"
                  >
                    <span className="text-gray-300">{label}</span>
                    <span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="rounded-3xl bg-[#07101F]/90 border border-[#1B2540] p-6 h-fit shadow-2xl shadow-purple-950/10">
            <h2 className="text-xl font-bold mb-5">Account actions</h2>

            <div className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5 mb-5">
              <p className="font-semibold mb-2">Logout</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sign out from this device. Your workspace data remains saved.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
            >
              Logout
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Settings;