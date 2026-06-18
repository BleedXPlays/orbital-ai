function Search() {
  const results = [
    ["💬", "Global Warming Project", "Chat • Updated today"],
    ["📂", "Global Warming Research", "Project • 6 chats"],
    ["📄", "Global Warming Report", "File • PDF • 12 pages"],
    ["🖼️", "Global Warming Images", "Images • 8 items"],
    ["📝", "Causes of Global Warming", "Note • Edited yesterday"],
  ];

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8">
      <h1 className="text-4xl font-bold mb-2">Search Results</h1>
      <p className="text-gray-400 mb-8">
        Showing results for <span className="text-purple-400">“Global Warming”</span>
      </p>

      <div className="grid grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              value="Global Warming"
              readOnly
              className="flex-1 p-4 rounded-xl bg-[#101827] border border-purple-700 outline-none"
            />
            <button className="px-6 rounded-xl bg-[#101827] border border-gray-700">
              Filter
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            {["All", "Chats", "Projects", "Files", "Images", "Notes"].map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 rounded-xl ${
                  tab === "All" ? "bg-purple-700" : "bg-[#101827]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {results.map(([icon, title, desc]) => (
              <div
                key={title}
                className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-5 flex items-center gap-5"
              >
                <div className="text-3xl">{icon}</div>
                <div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-6">Filters</h2>

          <p className="text-purple-400 mb-3">TYPE</p>
          {["Chats", "Projects", "Files", "Images", "Notes"].map((item) => (
            <label key={item} className="block mb-4">
              <input type="checkbox" defaultChecked className="mr-3" />
              {item}
            </label>
          ))}

          <p className="text-purple-400 mt-8 mb-3">DATE</p>
          {["All Time", "Today", "This Week", "This Month"].map((item) => (
            <label key={item} className="block mb-4">
              <input type="radio" name="date" className="mr-3" />
              {item}
            </label>
          ))}

          <button className="w-full mt-6 p-3 rounded-xl bg-purple-700">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default Search;