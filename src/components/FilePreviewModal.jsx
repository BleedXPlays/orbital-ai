function FilePreviewModal({ file, onClose, onDelete }) {
  if (!file) return null;

  const isImage = file.type && file.type.startsWith("image");
  const isPdf = file.type === "application/pdf";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-3 sm:px-6">
      <div className="max-h-[90vh] w-full max-w-[900px] overflow-y-auto rounded-2xl border border-[#1B2540] bg-[#08111F] p-4 text-white sm:rounded-3xl sm:p-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-all text-xl font-bold sm:text-2xl">{file.name}</h2>
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

        <div className="mb-6 flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl bg-black sm:min-h-[420px]">
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
              className="h-[60vh] w-full rounded-xl sm:h-[520px]"
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
