function FilePreviewModal({ file, onClose, onDelete }) {
  if (!file) return null;

  const isImage = file.type && file.type.startsWith("image");
  const isPdf = file.type === "application/pdf";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center px-6">
      <div className="w-[900px] max-h-[90vh] bg-[#08111F] border border-[#1B2540] rounded-3xl p-6 text-white overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{file.name}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {file.size} • {file.type}
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#101827] hover:bg-[#141f33]"
          >
            Close
          </button>
        </div>

        <div className="bg-black rounded-2xl min-h-[420px] flex items-center justify-center overflow-hidden mb-6">
          {isImage && (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[520px] max-w-full object-contain"
            />
          )}

          {isPdf && (
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-[520px] rounded-xl"
            />
          )}

          {!isImage && !isPdf && (
            <div className="text-center text-gray-400">
              <p className="text-5xl mb-4">📄</p>
              <p>Preview is not available for this file type.</p>
              <p className="text-sm mt-2">You can download it instead.</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            {file.url && (
              <a
                href={file.url}
                download={file.name}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700"
              >
                Download
              </a>
            )}
          </div>

          <button
            onClick={onDelete}
            className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilePreviewModal;