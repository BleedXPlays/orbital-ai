function Home() {
  return (
    <div className="flex-1 min-h-screen bg-black text-white relative overflow-hidden pb-10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20"></div>

      <div className="relative h-screen flex flex-col items-center justify-center px-8">
        <h1 className="text-6xl font-bold mb-4">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            OrbitalAI
          </span>
        </h1>

        <p className="text-xl text-gray-400 mb-16">
          One Request. Multiple AI Experts.
        </p>

        <p className="text-lg text-gray-300 mb-8">
          What would you like to do today?
        </p>

        <div className="flex gap-6 mb-24">
          <div className="w-80 p-6 rounded-2xl bg-[#101827] border border-gray-800 hover:border-purple-500 cursor-pointer">
            <h3 className="font-semibold mb-2">
              Create a project
            </h3>
            <p className="text-gray-400 text-sm">
              Create a project on Chandrayaan-3 with images.
            </p>
          </div>

          <div className="w-80 p-6 rounded-2xl bg-[#101827] border border-gray-800 hover:border-purple-500 cursor-pointer">
            <h3 className="font-semibold mb-2">
              Write an essay
            </h3>
            <p className="text-gray-400 text-sm">
              Write an essay on global warming.
            </p>
          </div>
        </div>

        <div className="absolute bottom-16 w-[720px] bg-[#101827] border border-purple-900/60 rounded-2xl p-4 flex items-center gap-4">
          <button className="w-12 h-12 rounded-xl bg-[#151E33] text-3xl">
            +
          </button>

          <button className="w-12 h-12 rounded-xl bg-[#151E33] text-xl">
            🎤
          </button>

          <input
            type="text"
            placeholder="Ask OrbitalAI anything..."
            className="flex-1 bg-transparent outline-none text-gray-300"
          />

          <button className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;