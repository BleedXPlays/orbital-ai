function ProjectChatCard({
  chat,
  isPinned,
  formatUpdatedTime,
  onOpen,
  onMenuClick,
}) {
  return (
    <div
      onClick={onOpen}
      className="relative flex justify-between items-center bg-[#101827] border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-purple-700"
    >
      <div>
        <h3 className="font-semibold">
          {isPinned ? "⭐" : "💬"} {chat}
        </h3>

        <p className="text-gray-400 text-sm">
          {formatUpdatedTime(chat)}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-500">Open →</span>

        <button
          onClick={onMenuClick}
          className="text-gray-500 hover:text-white px-2"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}

export default ProjectChatCard;