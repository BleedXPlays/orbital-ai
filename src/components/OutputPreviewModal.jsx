import { useState } from "react";
import GeneratedImageContent from "./GeneratedImageContent";
import MarkdownContent from "./MarkdownContent";

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

    if (
      typeof content === "object" &&
      content.kind === "generated-image"
    ) {
      return <GeneratedImageContent image={content} />;
    }

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
        <MarkdownContent>{content}</MarkdownContent>
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
        <div className="flex items-start justify-between gap-3 border-b border-blue-200/[0.12] bg-[linear-gradient(110deg,rgba(35,72,160,0.14),rgba(112,72,232,0.08),transparent_72%)] px-4 py-4 sm:gap-5 sm:px-7 sm:py-6">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.9)]" />
              Generated output
            </p>
            <h2 className="break-words bg-gradient-to-r from-white via-blue-100 to-violet-200 bg-clip-text text-xl font-semibold tracking-[-0.025em] text-transparent sm:text-2xl">
              {title}
            </h2>
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
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold tracking-[-0.015em] text-slate-50">
                  {output[0]} {output[1]}
                </h3>

                <p className="text-sm text-gray-400 mb-5">{output[2]}</p>

                {getPreviewContent(output, index)}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-blue-200/[0.12] bg-[linear-gradient(90deg,rgba(6,15,32,0.82),rgba(11,20,43,0.92))] px-4 py-4 sm:px-7 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-300/30 bg-gradient-to-r from-blue-600/90 to-violet-600/90 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(53,86,255,0.22)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300/70"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
              <path d="m5 12.5 4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default OutputPreviewModal;
