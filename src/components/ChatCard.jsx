function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`relative w-full max-w-full px-3 py-2 rounded-lg cursor-pointer overflow-hidden ${
        selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <p
        className="block w-full truncate pr-10 text-sm font-medium"
        title={chat}
      >
        💬 {chat}
      </p>

      <button
        type="button"
        onClick={onMenuClick}
        aria-label={`Open menu for ${chat}`}
        className="absolute right-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-[#101827] text-lg leading-none text-gray-300 shadow-[-8px_0_10px_#101827] hover:bg-[#18233A] hover:text-white"
      >
        ⋮
      </button>
    </div>
  );
}

export default ChatCard;
