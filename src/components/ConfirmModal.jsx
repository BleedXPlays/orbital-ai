import { useEffect } from "react";
import { createPortal } from "react-dom";

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
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#1B2540] bg-[#07101F] p-5 text-white shadow-2xl shadow-purple-950/30 sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-xl sm:h-14 sm:w-14 sm:text-2xl">
          {danger ? "!" : "?"}
        </div>

        <h2 id="confirm-modal-title" className="mb-3 text-xl font-bold sm:text-2xl">
          {title}
        </h2>

        <p className="mb-6 break-words text-sm leading-relaxed text-gray-400 sm:text-base">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="whitespace-nowrap rounded-xl border border-[#1B2540] bg-[#101827] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-[#141f33] sm:px-5 sm:py-3 sm:text-base"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm transition sm:px-5 sm:py-3 sm:text-base ${
              danger
                ? "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                : "bg-purple-600 border-purple-500 text-white hover:bg-purple-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmModal;
