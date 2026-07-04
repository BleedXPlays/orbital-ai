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
      className={`relative w-full max-w-full p-3 rounded-lg cursor-pointer overflow-hidden ${
        selectedProject === project ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">📂 {project}</p>
        </div>

        <button
          onClick={onMenuClick}
          className="shrink-0 text-gray-500 hover:text-white px-2"
        >
          ⋮
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1 truncate">{count} chats</p>
    </div>
  );
}

export default ProjectCard;