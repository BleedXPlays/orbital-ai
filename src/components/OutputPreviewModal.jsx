function OutputPreviewModal({ isOpen, title, outputs, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl bg-[#07101F] border border-[#1B2540] shadow-2xl shadow-purple-950/30 text-white">
        <div className="flex items-start justify-between gap-5 px-7 py-6 border-b border-[#1B2540]">
          <div>
            <p className="text-sm text-purple-300 mb-2">Generated Output</p>
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl bg-[#101827] border border-[#1B2540] text-xl text-gray-300 hover:text-white hover:bg-[#141f33]"
          >
            ×
          </button>
        </div>

        <div className="p-7 overflow-y-auto max-h-[65vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outputs.map((output, index) => (
              <div
                key={index}
                className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5"
              >
                <h3 className="text-lg font-bold mb-2">
                  {output[0]} {output[1]}
                </h3>

                <p className="text-sm text-gray-400 mb-4">{output[2]}</p>

                <div className="rounded-2xl bg-[#07101F] border border-[#1B2540] p-4">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    This is a preview area for the generated {output[1].toLowerCase()}.
                    Real generated content will appear here when the AI API is connected.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-7 py-5 border-t border-[#1B2540] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default OutputPreviewModal;