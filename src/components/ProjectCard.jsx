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
      className={`relative w-full min-w-0 max-w-full cursor-pointer overflow-hidden rounded-lg border px-2.5 py-2 transition ${
        selectedProject === project
          ? "border-white/[0.08] bg-white/[0.065] text-white"
          : "border-transparent text-slate-400 hover:bg-white/[0.035] hover:text-slate-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="mr-2 inline h-3.5 w-3.5 align-[-2px] text-slate-600"
            >
              <path d="M3.5 7.5h6l1.8 2h9.2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V7.5Z" />
              <path d="M3.5 10h17" />
            </svg>
            {project}
          </p>
        </div>

        <button
          onClick={onMenuClick}
          aria-label={`Open menu for ${project}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 transition hover:bg-white/[0.06] hover:text-white"
        >
          ⋮
        </button>
      </div>

      <p className="mt-0.5 truncate pl-[22px] text-xs text-slate-600">
        {count} chats
      </p>
    </div>
  );
}

export default ProjectCard;
