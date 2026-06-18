function AIWorkflow() {
  const tasks = [
    ["🎙️", "Voice Input", "Whisper", "Converts voice notes into text"],
    ["🌍", "Translation", "Google Translate AI", "Translates user input and output"],
    ["🔍", "Research", "Claude", "Collects deep research and detailed information"],
    ["✍️", "Writing", "ChatGPT", "Writes essays, reports, and explanations"],
    ["🖼️", "Images", "Gemini", "Creates image ideas and visual prompts"],
    ["💻", "Coding", "GitHub Copilot", "Generates website and app code"],
    ["📊", "Presentation", "Gamma", "Creates presentation slides"],
    ["🎬", "Video", "Runway", "Creates video scenes and video prompts"],
  ];

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-2">AI Collaboration View</h1>
      <p className="text-gray-400 mb-8">
        OrbitalAI breaks one request into tasks and assigns the best AI model for each task.
      </p>

      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 mb-8 max-w-4xl">
        <p className="font-semibold mb-2">User Request</p>
        <p>
          Create a school project on Global Warming with images, website, presentation and video.
        </p>
      </div>

      <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6">Detected Tasks</h2>

        <div className="grid grid-cols-4 gap-5">
          {tasks.map(([icon, task]) => (
            <div
              key={task}
              className="bg-[#101827] border border-gray-800 rounded-xl p-5 text-center"
            >
              <p className="text-3xl mb-3">{icon}</p>
              <h3 className="font-bold">{task}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">Assigned AI Models</h2>

        <div className="space-y-4">
          {tasks.map(([icon, task, ai, desc]) => (
            <div
              key={task}
              className="bg-[#101827] border border-gray-800 rounded-xl p-5 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{icon}</span>
                <div>
                  <h3 className="text-xl font-bold">{task}</h3>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-purple-400 font-bold">{ai}</p>
                <p className="text-green-400 text-sm">Assigned</p>
              </div>
            </div>
          ))}
        </div>

        <button className="mt-8 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
          Generate Final Output
        </button>
      </div>
    </div>
  );
}

export default AIWorkflow;