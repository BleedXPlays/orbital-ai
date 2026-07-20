import { useEffect, useRef } from "react";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-[430px] rounded-2xl bg-[#08111F] border border-[#1B2540] p-5 shadow-2xl sm:rounded-3xl sm:p-7">

        <h2 className="text-2xl font-semibold text-white mb-6">
          {title}
        </h2>

        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-xl bg-[#101827] border border-[#24304B] px-4 py-3 text-white outline-none focus:border-purple-500"
        />

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl bg-[#101827] border border-[#24304B] text-white hover:bg-[#161f32]"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
          >
            Rename
          </button>

        </div>

      </div>
    </div>
  );
}

export default RenameModal;
