import { useState } from "react";

function OutputPreviewModal({ isOpen, title, outputs, onClose }) {
  const [copyStatus, setCopyStatus] = useState({
    outputIndex: null,
    message: "",
  });

  if (!isOpen) return null;

  const copyCode = async (code, outputIndex) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus({ outputIndex, message: "Copied!" });
    } catch {
      setCopyStatus({ outputIndex, message: "Copy failed" });
    }

    setTimeout(() => {
      setCopyStatus((current) =>
        current.outputIndex === outputIndex
          ? { outputIndex: null, message: "" }
          : current
      );
    }, 2000);
  };

  const formatGeneratedContent = (content, outputTitle, outputIndex) => {
    if (!content) return null;

    if (String(outputTitle || "").toLowerCase().includes("code")) {
      const code = String(content)
        .replace(/^```[\w-]*\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      return (
        <div className="overflow-hidden rounded-2xl bg-[#050B1A] border border-[#1B2540]">
          <div className="flex items-center justify-between gap-4 border-b border-[#1B2540] px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Code
            </span>

            <button
              type="button"
              onClick={() => copyCode(code, outputIndex)}
              className="rounded-lg border border-[#2A3653] bg-[#101827] px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:border-purple-500/60 hover:text-white"
            >
              {copyStatus.outputIndex === outputIndex
                ? copyStatus.message
                : "Copy code"}
            </button>
          </div>

          <pre className="p-5 overflow-x-auto text-sm text-gray-200 leading-7 whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

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

  const getPreviewContent = (output, outputIndex) => {
    const generatedContent = output[3];

    if (generatedContent) {
      return formatGeneratedContent(generatedContent, output[1], outputIndex);
    }

    return getFallbackContent(output);
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-[#1B2540] bg-[#07101F] text-white shadow-2xl shadow-purple-950/30 sm:max-h-[85vh] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#1B2540] px-4 py-4 sm:gap-5 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <p className="text-sm text-purple-300 mb-2">Generated Output</p>
            <h2 className="break-words text-xl font-bold sm:text-2xl">{title}</h2>
          </div>

          <button
            onClick={onClose}
            className="h-10 w-10 shrink-0 rounded-xl bg-[#101827] border border-[#1B2540] text-xl text-gray-300 hover:text-white hover:bg-[#141f33] sm:h-11 sm:w-11 sm:rounded-2xl"
          >
            ×
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto p-4 sm:max-h-[65vh] sm:p-7">
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
                className="min-w-0 rounded-2xl bg-[#101827] border border-[#1B2540] p-4 sm:p-5"
              >
                <h3 className="text-lg font-bold mb-2">
                  {output[0]} {output[1]}
                </h3>

                <p className="text-sm text-gray-400 mb-5">{output[2]}</p>

                {getPreviewContent(output, index)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-[#1B2540] px-4 py-4 sm:px-7 sm:py-5">
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
