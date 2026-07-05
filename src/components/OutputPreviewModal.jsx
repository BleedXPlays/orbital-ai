function OutputPreviewModal({ isOpen, title, outputs, onClose }) {
  if (!isOpen) return null;

  const getPreviewContent = (output) => {
    const outputTitle = output[1];

    if (outputTitle === "Research Notes") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-purple-300 mb-2">
              Research Structure
            </p>
            <ul className="space-y-2 text-sm text-gray-300 leading-relaxed">
              <li>• Topic overview and background</li>
              <li>• Key facts and important points</li>
              <li>• Source-based notes</li>
              <li>• Summary of useful findings</li>
              <li>• Suggested next questions</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
            <p className="text-sm text-gray-400 leading-relaxed">
              Real research notes will appear here once the AI API is connected.
              This section will be used for structured findings, references, and
              topic summaries.
            </p>
          </div>
        </div>
      );
    }

    if (outputTitle === "Written Content") {
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-purple-300 mb-2">
              Writing Draft
            </p>
            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">Title:</span> Draft
                title based on the user request
              </p>
              <p>
                <span className="text-white font-semibold">Introduction:</span>{" "}
                A clear opening paragraph will be generated here.
              </p>
              <p>
                <span className="text-white font-semibold">Body:</span> The main
                explanation, essay, report, or content draft will appear here.
              </p>
              <p>
                <span className="text-white font-semibold">Conclusion:</span> A
                clean closing section will be added here.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (outputTitle === "Image Ideas") {
      return (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
            Visual Prompt Ideas
          </p>

          <div className="space-y-3">
            <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Prompt 1: A clean, detailed visual concept based on the user’s
                topic, with strong composition and clear subject focus.
              </p>
            </div>

            <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Prompt 2: A more creative version with mood, lighting, color
                direction, and style details.
              </p>
            </div>

            <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                Prompt 3: A simple version suitable for posters, diagrams, or
                school/project visuals.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (outputTitle === "Website Code") {
      return (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
            Code Preview
          </p>

          <pre className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4 overflow-x-auto text-sm text-gray-300 leading-relaxed">
{`// Generated code will appear here

function GeneratedComponent() {
  return (
    <div className="page">
      <h1>Your generated website section</h1>
      <p>HTML, CSS, React, or JavaScript output will appear here.</p>
    </div>
  );
}

export default GeneratedComponent;`}
          </pre>
        </div>
      );
    }

    if (outputTitle === "Presentation") {
      return (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
            Slide Outline
          </p>

          <div className="space-y-3 text-sm text-gray-300">
            <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
              <p className="text-white font-semibold mb-1">Slide 1</p>
              <p>Title slide with topic name and short subtitle.</p>
            </div>

            <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
              <p className="text-white font-semibold mb-1">Slide 2</p>
              <p>Introduction and purpose of the presentation.</p>
            </div>

            <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
              <p className="text-white font-semibold mb-1">Slide 3</p>
              <p>Main points, visuals, and supporting explanation.</p>
            </div>

            <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
              <p className="text-white font-semibold mb-1">Slide 4</p>
              <p>Conclusion and final takeaway.</p>
            </div>
          </div>
        </div>
      );
    }

    if (outputTitle === "Video Plan") {
      return (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
            Scene Breakdown
          </p>

          <div className="space-y-3 text-sm text-gray-300">
            <p>Scene 1: Opening hook and visual direction.</p>
            <p>Scene 2: Main explanation or story moment.</p>
            <p>Scene 3: Supporting shots, transitions, or text overlays.</p>
            <p>Scene 4: Closing frame and final message.</p>
          </div>
        </div>
      );
    }

    if (outputTitle === "Translation") {
      return (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
            Translation Preview
          </p>

          <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              The translated version of the user’s content will appear here,
              along with tone-preserved phrasing where needed.
            </p>
          </div>
        </div>
      );
    }

    if (outputTitle === "Transcript") {
      return (
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.18em] text-purple-300">
            Voice Transcript
          </p>

          <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              Voice-to-text transcript will appear here after voice input is
              connected.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl bg-[#050B1A] border border-[#1B2540] p-4">
        <p className="text-sm text-gray-300 leading-relaxed">
          This output preview will show generated content once the AI API is
          connected.
        </p>
      </div>
    );
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outputs.map((output, index) => (
              <div
                key={index}
                className="rounded-2xl bg-[#101827] border border-[#1B2540] p-5"
              >
                <h3 className="text-lg font-bold mb-2">
                  {output[0]} {output[1]}
                </h3>

                <p className="text-sm text-gray-400 mb-5">{output[2]}</p>

                <div className="rounded-2xl bg-[#07101F] border border-[#1B2540] p-4">
                  {getPreviewContent(output)}
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