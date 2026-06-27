function ProjectChatMenu({
  isPinned,
  onRename,
  onTogglePin,
  onArchive,
  onDelete,
}) {
  return (
    <div className="absolute right-4 top-14 z-50 w-36 bg-[#08111F] border border-[#1B2540] rounded-xl shadow-xl p-2">
      <button
        onClick={onRename}
        className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[#141f33]"
      >
        Rename
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
    </div>
  );
}

export default ProjectChatMenu;