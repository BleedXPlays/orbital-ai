function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  return (
    <div
      onClick={onOpen}
      className={`grid w-full max-w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
        selectedChat === chat
          ? "border-violet-400/15 bg-violet-500/10 text-white"
          : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-100"
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
        <span className="mr-2 text-slate-600">◌</span>
        {chat}
      </p>

      <button
        type="button"
        onClick={onMenuClick}
        aria-label={`Open menu for ${chat}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
      >
        ⋮
      </button>
    </div>
  );
}

export default ChatCard;
