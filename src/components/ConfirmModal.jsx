function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-[#07101F] border border-[#1B2540] shadow-2xl shadow-purple-950/30 p-6 text-white">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-2xl mb-5">
          {danger ? "!" : "?"}
        </div>

        <h2 className="text-2xl font-bold mb-3">{title}</h2>

        <p className="text-gray-400 leading-relaxed mb-6">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl bg-[#101827] border border-[#1B2540] text-gray-300 hover:bg-[#141f33]"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`px-5 py-3 rounded-xl border ${
              danger
                ? "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                : "bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;