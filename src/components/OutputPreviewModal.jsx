function OutputPreviewModal({ isOpen, title, outputs, onClose }) {
  if (!isOpen) return null;

  const formatGeneratedContent = (content) => {
    if (!content) return null;

    return (
      <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-5">
        <p className="text-sm text-gray-200 leading-7 whitespace-pre-wrap">
          {content}
        </p>
      </div>
    );
  };

  const getFallbackContent = (output) => {
    const outputTitle = output[1];

    if (outputTitle === "Research Notes") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Research notes will appear here after this output is generated.
          </p>
        </div>
      );
    }

    if (outputTitle === "Written Content") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Written content will appear here after this output is generated.
          </p>
        </div>
      );
    }

    if (outputTitle === "Visual Analysis") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Gemini image and visual-data findings will appear here.
          </p>
        </div>
      );
    }

    if (outputTitle === "Code") {
      return (
        <pre className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4 overflow-x-auto text-sm text-gray-300 leading-relaxed">
{`Generated code will appear here after this output is generated.`}
        </pre>
      );
    }

    if (outputTitle === "Document Analysis") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Claude document findings will appear here.
          </p>
        </div>
      );
    }

    if (outputTitle === "Decision Support") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Claude will compare the options and provide a recommendation.
          </p>
        </div>
      );
    }

    if (outputTitle === "Content Plan") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            A structured text plan will appear here.
          </p>
        </div>
      );
    }

    if (outputTitle === "Translation") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            Translation output will appear here.
          </p>
        </div>
      );
    }

    if (outputTitle === "Transcript") {
      return (
        <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
          <p className="text-sm text-gray-400 leading-relaxed">
            OpenAI voice transcription will appear here.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
        <p className="text-sm text-gray-400 leading-relaxed">
          Generated content will appear here.
        </p>
      </div>
    );
  };

  const getPreviewContent = (output) => {
    const generatedContent = output[3];

    if (generatedContent) {
      return formatGeneratedContent(generatedContent);
    }

    return getFallbackContent(output);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl bg-[#07101F] border border-[#1B2540] shadow-2xl shadow-purple-950/30 text-white">
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
          <div
            className={`grid gap-4 ${
              outputs.length === 1
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2"
            }`}
          >
            {outputs.map((output, index) => (
              <div
                key={index}
                className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5"
              >
                <h3 className="text-lg font-bold mb-2">
                  {output[0]} {output[1]}
                </h3>

                <p className="text-sm text-gray-400 mb-5">{output[2]}</p>

                {getPreviewContent(output)}
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
