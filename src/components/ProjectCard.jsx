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
      className={`relative p-3 rounded-lg cursor-pointer ${
        selectedProject === project ? "bg-[#101827]" : "hover:bg-[#101827]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>📂 {project}</span>

        <button
          onClick={onMenuClick}
          className="text-gray-500 hover:text-white px-2"
        >
          ⋮
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1">{count} chats</p>
    </div>
  );
}

export default ProjectCard;