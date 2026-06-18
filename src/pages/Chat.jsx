import { useState } from "react";

function Chat({ selectedChat, chatMessages, setChatMessages }) {
  const [input, setInput] = useState("");

  const messages = chatMessages[selectedChat] || [];

  const setMessagesForCurrentChat = (newMessages) => {
    setChatMessages({
      ...chatMessages,
      [selectedChat]: newMessages,
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input,
    };

    const aiMessage = {
      role: "ai",
      text: "OrbitalAI received your request. It is assigning the best AI models for the task.",
    };

    setMessagesForCurrentChat([...messages, userMessage, aiMessage]);

    setInput("");
  };

  return (
    <div className="flex-1 min-h-screen bg-black text-white px-10 py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-black to-purple-950/20"></div>

      <div className="relative min-h-screen pb-40">
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold">
              {selectedChat || "Untitled Chat"}
            </h1>

            <p className="text-green-400 mt-1">
              ● Multi-AI collaboration active
            </p>
          </div>

          <div className="flex gap-4">
            <button className="px-5 py-3 rounded-xl border border-gray-700 bg-[#101827]">
              Share
            </button>

            <button className="px-5 py-3 rounded-xl border border-gray-700 bg-[#101827]">
              Export
            </button>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-32 mb-32">
            <h2 className="text-3xl font-bold mb-3 text-gray-300">
              Start a new conversation
            </h2>
            <p>Ask OrbitalAI anything.</p>
          </div>
        )}

        <div className="space-y-6 max-w-6xl mx-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "user" ? (
                <div className="bg-gradient-to-br from-purple-900 to-blue-900 p-6 rounded-2xl w-[560px]">
                  <p className="font-semibold mb-2">You</p>
                  <p>{message.text}</p>
                </div>
              ) : (
                <div className="bg-[#08111F] border border-[#1B2540] rounded-2xl p-8 max-w-5xl">
                  <p className="text-xl font-semibold mb-4">
                    {message.text}
                  </p>

                  <p className="text-gray-400 mb-8">
                    OrbitalAI automatically assigned the best AI model for each
                    task.
                  </p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <span className="px-3 py-2 rounded-lg bg-[#101827] border border-gray-700">
                      Claude → Research
                    </span>

                    <span className="px-3 py-2 rounded-lg bg-[#101827] border border-gray-700">
                      ChatGPT → Writing
                    </span>

                    <span className="px-3 py-2 rounded-lg bg-[#101827] border border-gray-700">
                      Gemini → Images
                    </span>

                    <span className="px-3 py-2 rounded-lg bg-[#101827] border border-gray-700">
                      Copilot → Website
                    </span>

                    <span className="px-3 py-2 rounded-lg bg-[#101827] border border-gray-700">
                      Gamma → Presentation
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold mb-6">
                    Generated Outputs
                  </h2>

                  <div className="grid grid-cols-5 gap-5">
                    <div className="bg-[#101827] border border-gray-800 rounded-xl p-5">
                      <h3 className="font-bold text-lg mb-2">
                        📄 Project Report
                      </h3>
                      <p className="text-gray-400 text-sm">12 pages</p>
                    </div>

                    <div className="bg-[#101827] border border-gray-800 rounded-xl p-5">
                      <h3 className="font-bold text-lg mb-2">🖼️ Images</h3>
                      <p className="text-gray-400 text-sm">8 image ideas</p>
                    </div>

                    <div className="bg-[#101827] border border-gray-800 rounded-xl p-5">
                      <h3 className="font-bold text-lg mb-2">
                        💻 Website Code
                      </h3>
                      <p className="text-gray-400 text-sm">HTML, CSS, JS</p>
                    </div>

                    <div className="bg-[#101827] border border-gray-800 rounded-xl p-5">
                      <h3 className="font-bold text-lg mb-2">
                        📊 Presentation
                      </h3>
                      <p className="text-gray-400 text-sm">12 slides</p>
                    </div>

                    <div className="bg-[#101827] border border-gray-800 rounded-xl p-5">
                      <h3 className="font-bold text-lg mb-2">
                        📚 Bibliography
                      </h3>
                      <p className="text-gray-400 text-sm">15 sources</p>
                    </div>
                  </div>

                  <button className="mt-8 text-purple-400 font-semibold hover:text-purple-300">
                    Open All Files →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 mx-auto w-[760px] bg-[#101827] border border-purple-900/60 rounded-2xl p-4 flex items-center gap-4">
          <button className="w-12 h-12 rounded-xl bg-[#151E33] text-3xl">
            +
          </button>

          <button className="w-12 h-12 rounded-xl bg-[#151E33]">🎤</button>

          <input
            type="text"
            value={input}
            placeholder="Ask OrbitalAI anything..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            className="flex-1 bg-transparent outline-none text-gray-300"
          />

          <button
            onClick={sendMessage}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;