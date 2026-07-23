import { createPortal } from "react-dom";

function MoveChatModal({
  projects,
  chatToMove,
  targetProject,
  setTargetProject,
  onCancel,
  onMove,
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-chat-modal-title"
    >
      <div className="w-full max-w-[460px] rounded-2xl border border-[#1B2540] bg-[#08111F] p-5 text-white shadow-2xl sm:p-6">
        <h2 id="move-chat-modal-title" className="mb-3 text-xl font-bold sm:text-2xl">
          Move Chat
        </h2>

        <p className="text-gray-400 mb-2">Chat</p>
        <p className="font-semibold mb-6">💬 {chatToMove}</p>

        <label className="text-gray-400 mb-2 block">
          Select Project
        </label>

        <select
          value={targetProject}
          onChange={(e) => setTargetProject(e.target.value)}
          className="mb-6 w-full rounded-xl border border-[#1B2540] bg-[#101827] p-3.5 text-base outline-none sm:p-4"
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
            type="button"
            onClick={onCancel}
            className="whitespace-nowrap rounded-xl bg-[#101827] px-4 py-2.5 text-sm transition hover:bg-[#141f33] sm:px-5 sm:py-3 sm:text-base"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onMove}
            className="whitespace-nowrap rounded-xl bg-purple-600 px-4 py-2.5 text-sm transition hover:bg-purple-700 sm:px-5 sm:py-3 sm:text-base"
          >
            Move Chat
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default MoveChatModal;
