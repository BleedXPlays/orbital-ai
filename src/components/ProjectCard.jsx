function ProjectCard({
  project,
  count,
  selectedProject,
  onOpen,
  onMenuClick,
}) {
  const isSelected = selectedProject === project;

  return (
    <div
      onClick={onOpen}
      className={`relative w-full min-w-0 max-w-full cursor-pointer overflow-hidden rounded-xl border px-3 py-2.5 transition ${
        isSelected
          ? "border-blue-400/25 bg-gradient-to-r from-blue-500/[0.14] to-violet-500/[0.06] text-white shadow-[inset_3px_0_0_#568cff]"
          : "border-transparent text-slate-300 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-white"
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-2.5 truncate text-sm font-medium">
          <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 fill-none stroke-current ${isSelected ? "text-blue-300" : "text-slate-500"}`} strokeWidth="1.7">
            <path d="M3.5 6.75A1.75 1.75 0 0 1 5.25 5h4l2 2h7.5a1.75 1.75 0 0 1 1.75 1.75v8.5A1.75 1.75 0 0 1 18.75 19H5.25a1.75 1.75 0 0 1-1.75-1.75V6.75Z" strokeLinejoin="round" />
          </svg>
          <span className="min-w-0 truncate">{project}</span>
        </p>

        <button
          type="button"
          onClick={onMenuClick}
          aria-label={`Open menu for ${project}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
        >
          ⋮
        </button>
      </div>

      <p className="ml-[30px] mt-0.5 truncate text-[11px] text-slate-600">{count} {count === 1 ? "chat" : "chats"}</p>
    </div>
  );
}

export default ProjectCard;
