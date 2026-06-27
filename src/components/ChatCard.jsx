function ChatCard({
  chat,
  selectedChat,
  formatUpdatedTime,
  onOpen,
  onMenuClick,
}) {
  return (
    <div
      onClick={onOpen}
      className={`relative p-3 rounded-lg cursor-pointer ${
        selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p>💬 {chat}</p>
          <p className="text-xs text-gray-500 mt-1">
            {formatUpdatedTime(chat)}
          </p>
        </div>

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

export default ChatCard;