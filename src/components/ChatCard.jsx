function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`grid w-full min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition ${
        selectedChat === chat
          ? "border-white/[0.08] bg-white/[0.065] text-white"
          : "border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-slate-100"
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
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="mr-2 inline h-3.5 w-3.5 align-[-2px] text-slate-600"
        >
          <path d="M7 18.5 3.5 20l1.3-3.8A8 8 0 1 1 7 18.5Z" />
        </svg>
        {chat}
      </p>

      <button
        type="button"
        onClick={onMenuClick}
        aria-label={`Open menu for ${chat}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
      >
        ⋮
      </button>
    </div>
  );
}

export default ChatCard;
