function ProjectNoteCard({ note, onDelete }) {
  return (
    <div className="bg-[#101827] border border-gray-800 rounded-xl p-5">
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">{note.title}</h3>

          <p className="text-gray-500 text-sm mt-1">
            {note.createdAt}
          </p>
        </div>

        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300"
        >
          Delete
        </button>
      </div>

      <p className="text-gray-300 mt-4 whitespace-pre-wrap">
        {note.body}
      </p>
    </div>
  );
}

export default ProjectNoteCard;