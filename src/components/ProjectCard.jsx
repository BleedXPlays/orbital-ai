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
      className={`relative w-full min-w-0 max-w-full cursor-pointer overflow-hidden rounded-lg p-3 ${
        selectedProject === project ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">
          📂 {project}
        </p>

        <button
          type="button"
          onClick={onMenuClick}
          aria-label={`Open menu for ${project}`}
          className="shrink-0 px-2 text-gray-500 hover:text-white"
        >
          ⋮
        </button>
      </div>

      <p className="mt-1 truncate text-xs text-gray-500">{count} chats</p>
    </div>
  );
}

export default ProjectCard;
