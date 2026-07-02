import { createPortal } from "react-dom";

function ChatMenu({
  isPinned,
  position,
  onRename,
  onMove,
  onTogglePin,
  onArchive,
  onDelete,
}) {
  return createPortal(
    <div
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
      }}
      className="z-[9999] w-44 bg-[#101827] border border-[#1B2540] rounded-xl shadow-xl p-2"
    >
      <button
        onClick={onRename}
        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
      >
        Rename
      </button>

      <button
        onClick={onMove}
        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
      >
        Move to Project
      </button>

      <button
        onClick={onTogglePin}
        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
      >
        {isPinned ? "Unpin" : "Pin"}
      </button>

      <button
        onClick={onArchive}
        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
      >
        Archive
      </button>

      <button
        onClick={onDelete}
        className="block w-full text-left px-3 py-2 rounded-lg text-red-400 hover:bg-[#141f33]"
      >
        Delete
      </button>
    </div>,
    document.body
  );
}

export default ChatMenu;