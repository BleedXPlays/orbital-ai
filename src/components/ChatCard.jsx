function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`grid w-full min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 ${
        selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
      style={{ gridTemplateColumns: "minmax(0, 1fr) 32px" }}
    >
      <p className="min-w-0 truncate text-sm font-medium" title={chat}>
        💬 {chat}
      </p>

      <button
        type="button"
        onClick={onMenuClick}
        aria-label={`Open menu for ${chat}`}
        className="w-8 shrink-0 px-2 text-gray-500 hover:text-white"
      >
        ⋮
      </button>
    </div>
  );
}

export default ChatCard;
