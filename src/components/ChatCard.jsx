function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`relative w-full max-w-full px-3 py-2 rounded-lg cursor-pointer overflow-hidden ${
        selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <div className="flex w-full min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="block truncate text-sm font-medium" title={chat}>
            💬 {chat}
          </p>
        </div>

        <button
          onClick={onMenuClick}
          aria-label={`Open menu for ${chat}`}
          className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#101827] text-gray-400 hover:bg-[#18233A] hover:text-white"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}

export default ChatCard;
