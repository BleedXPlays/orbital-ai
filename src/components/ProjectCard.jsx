function ProjectCard({
  project,
  count,
  selectedProject,
  onOpen,
  onMenuClick,
}) {
  return (
    <div
      onClick={onOpen}
      className={`relative w-full max-w-full cursor-pointer overflow-hidden rounded-xl border p-3 transition ${
        selectedProject === project
          ? "border-blue-400/15 bg-blue-500/10 text-white"
          : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <span className="mr-2 text-blue-400/70">◇</span>
            {project}
          </p>
        </div>

        <button
          onClick={onMenuClick}
          aria-label={`Open menu for ${project}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
        >
          ⋮
        </button>
      </div>

      <p className="mt-1 truncate pl-6 text-xs text-slate-600">{count} chats</p>
    </div>
  );
}

export default ProjectCard;
