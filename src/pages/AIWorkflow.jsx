function AIWorkflow() {
  const providers = [
    [
      "🟢",
      "OpenAI",
      "General chat, clarifying questions, conversation memory, and voice transcription",
    ],
    [
      "🟣",
      "Claude",
      "Long-document analysis, detailed writing, decision support, and coding",
    ],
    [
      "🔵",
      "Gemini",
      "Image understanding, visual-data analysis, and multimodal research",
    ],
  ];

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-2">AI Collaboration View</h1>
      <p className="text-gray-400 mb-8">
        OrbitalAI selects one of three focused AI providers for each request.
      </p>

      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 mb-8 max-w-4xl">
        <p className="font-semibold mb-2">User Request</p>
        <p>
          Analyze this renewable-energy chart and explain the most important
          trend.
        </p>
      </div>

      <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">AI Provider Roles</h2>

        <div className="space-y-4">
          {providers.map(([icon, provider, description]) => (
            <div
              key={provider}
              className="bg-[#101827] border border-gray-800 rounded-xl p-5 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h3 className="text-xl font-bold">{provider}</h3>
                  <p className="text-gray-400">{description}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-green-400 text-sm">Assigned role</p>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
          Route Request
        </button>
      </div>
    </div>
  );
}

export default AIWorkflow;
