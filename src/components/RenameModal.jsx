import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

function RenameModal({
  isOpen,
  title = "Rename",
  value,
  setValue,
  onCancel,
  onSave,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onCancel();
      }

      if (e.key === "Enter") {
        onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, onSave]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-modal-title"
    >
      <div className="w-full max-w-[430px] rounded-2xl border border-[#1B2540] bg-[#08111F] p-5 shadow-2xl sm:rounded-3xl sm:p-7">

        <h2 id="rename-modal-title" className="mb-5 text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
          {title}
        </h2>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl border border-[#24304B] bg-[#101827] px-4 py-3 text-base text-white outline-none focus:border-blue-300/40"
        />

        <div className="mt-6 flex justify-end gap-3 sm:mt-8">

          <button
            type="button"
            onClick={onCancel}
            className="whitespace-nowrap rounded-xl border border-[#24304B] bg-[#101827] px-4 py-2.5 text-sm text-white transition hover:bg-[#161f32] sm:px-5 sm:text-base"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="whitespace-nowrap rounded-xl bg-purple-600 px-4 py-2.5 text-sm text-white transition hover:bg-purple-700 sm:px-5 sm:text-base"
          >
            Rename
          </button>

        </div>

      </div>
    </div>,
    document.body
  );
}

export default RenameModal;
