function MoveChatModal({
  projects,
  chatToMove,
  targetProject,
  setTargetProject,
  onCancel,
  onMove,
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6 w-[460px] text-white shadow-2xl">
        <h2 className="text-2xl font-bold mb-3">Move Chat</h2>

        <p className="text-gray-400 mb-2">Chat</p>
        <p className="font-semibold mb-6">💬 {chatToMove}</p>

        <label className="text-gray-400 mb-2 block">
          Select Project
        </label>

        <select
          value={targetProject}
          onChange={(e) => setTargetProject(e.target.value)}
          className="w-full p-4 rounded-xl bg-[#101827] border border-[#1B2540] mb-6 outline-none"
        >
          <option value="">Choose a project</option>

          {projects.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-[#101827] hover:bg-[#141f33]"
          >
            Cancel
          </button>

          <button
            onClick={onMove}
            className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700"
          >
            Move Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default MoveChatModal;