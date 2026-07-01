function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`relative px-3 py-2 rounded-lg cursor-pointer ${
        selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium truncate">💬 {chat}</p>

        <button
          onClick={onMenuClick}
          className="text-gray-500 hover:text-white px-1"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}

export default ChatCard;