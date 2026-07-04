function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`relative w-full max-w-full px-3 py-2 rounded-lg cursor-pointer overflow-hidden ${
        selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">💬 {chat}</p>
        </div>

        <button
          onClick={onMenuClick}
          className="shrink-0 text-gray-500 hover:text-white px-1"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}

export default ChatCard;