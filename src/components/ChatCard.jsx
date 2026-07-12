function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`grid w-full max-w-full items-center gap-2 rounded-lg px-3 py-2 cursor-pointer ${
        selectedChat === chat ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
      style={{ gridTemplateColumns: "minmax(0, 1fr) 32px" }}
    >
      <p
        className="min-w-0 text-sm font-medium"
        title={chat}
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        💬 {chat}
      </p>

      <button
        type="button"
        onClick={onMenuClick}
        aria-label={`Open menu for ${chat}`}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-[#101827] text-gray-200 hover:bg-[#18233A] hover:text-white"
      >
        <span className="-mt-1 text-lg font-bold tracking-[1px]">•••</span>
      </button>
    </div>
  );
}

export default ChatCard;
