function ChatCard({ chat, selectedChat, onOpen, onMenuClick }) {
  const isSelected = selectedChat === chat;

  return (
    <div
      onClick={onOpen}
      className={`group relative grid w-full min-w-0 max-w-full cursor-pointer items-center gap-2 overflow-hidden rounded-xl border px-3 py-2.5 transition ${
        isSelected
          ? "border-violet-400/25 bg-gradient-to-r from-violet-500/[0.16] to-blue-500/[0.07] text-white shadow-[inset_3px_0_0_#8b6cff]"
          : "border-transparent text-slate-300 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-white"
      }`}
      style={{ gridTemplateColumns: "minmax(0, 1fr) 32px" }}
    >
      <p className="flex min-w-0 items-center gap-2.5 truncate text-sm font-medium" title={chat}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-[18px] w-[18px] shrink-0 fill-none stroke-current ${isSelected ? "text-violet-300" : "text-slate-500 group-hover:text-slate-300"}`} strokeWidth="1.7">
          <path d="M20 11.5a7.5 7.5 0 0 1-8 7.48 8.6 8.6 0 0 1-3.1-.75L4 20l1.52-4.04A7.5 7.5 0 1 1 20 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="min-w-0 truncate">{chat}</span>
      </p>

      <button
        type="button"
        onClick={onMenuClick}
        aria-label={`Open menu for ${chat}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
      >
        ⋮
      </button>
    </div>
  );
}

export default ChatCard;
