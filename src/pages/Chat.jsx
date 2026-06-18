import { useState } from "react";

function Chat({
  selectedChat,
  setSelectedChat,
  chats,
  setChats,
  projectChats,
  setProjectChats,
  chatMessages,
  setChatMessages,
}) {
  const [input, setInput] = useState("");

  const messages = chatMessages[selectedChat] || [];

  const analyzeTask = (text) => {
    const lowerText = text.toLowerCase();
    const detectedTasks = [];

    if (
      lowerText.includes("research") ||
      lowerText.includes("information") ||
      lowerText.includes("facts") ||
      lowerText.includes("sources")
    ) {
      detectedTasks.push({
        task: "Research",
        ai: "Claude",
      });
    }

    if (
      lowerText.includes("write") ||
      lowerText.includes("essay") ||
      lowerText.includes("report") ||
      lowerText.includes("content") ||
      lowerText.includes("explain")
    ) {
      detectedTasks.push({
        task: "Writing",
        ai: "ChatGPT",
      });
    }

    if (
      lowerText.includes("image") ||
      lowerText.includes("poster") ||
      lowerText.includes("diagram") ||
      lowerText.includes("logo") ||
      lowerText.includes("visual")
    ) {
      detectedTasks.push({
        task: "Images",
        ai: "Gemini",
      });
    }

    if (
      lowerText.includes("website") ||
      lowerText.includes("code") ||
      lowerText.includes("app") ||
      lowerText.includes("react")
    ) {
      detectedTasks.push({
        task: "Coding",
        ai: "GitHub Copilot",
      });
    }

    if (
      lowerText.includes("presentation") ||
      lowerText.includes("ppt") ||
      lowerText.includes("slides")
    ) {
      detectedTasks.push({
        task: "Presentation",
        ai: "Gamma",
      });
    }

    if (
      lowerText.includes("video") ||
      lowerText.includes("reel") ||
      lowerText.includes("youtube")
    ) {
      detectedTasks.push({
        task: "Video",
        ai: "Runway",
      });
    }

    if (
      lowerText.includes("translate") ||
      lowerText.includes("translation") ||
      lowerText.includes("language")
    ) {
      detectedTasks.push({
        task: "Translation",
        ai: "Google Translate AI",
      });
    }

    if (
      lowerText.includes("voice") ||
      lowerText.includes("audio") ||
      lowerText.includes("speech")
    ) {
      detectedTasks.push({
        task: "Voice Input",
        ai: "Whisper",
      });
    }

    if (detectedTasks.length === 0) {
      detectedTasks.push({
        task: "General Answer",
        ai: "ChatGPT",
      });
    }

    return detectedTasks;
  };

  const getOutputs = (tasks) => {
    const outputs = [];

    tasks.forEach((item) => {
      if (item.task === "Research") {
        outputs.push(["📚", "Research Notes", "Detailed sources"]);
      }

      if (item.task === "Writing") {
        outputs.push(["📄", "Written Content", "Essay / report"]);
      }

      if (item.task === "Images") {
        outputs.push(["🖼️", "Image Ideas", "Visual prompts"]);
      }

      if (item.task === "Coding") {
        outputs.push(["💻", "Website Code", "HTML, CSS, JS"]);
      }

      if (item.task === "Presentation") {
        outputs.push(["📊", "Presentation", "Slides"]);
      }

      if (item.task === "Video") {
        outputs.push(["🎬", "Video Plan", "Scene prompts"]);
      }

      if (item.task === "Translation") {
        outputs.push(["🌍", "Translation", "Translated output"]);
      }

      if (item.task === "Voice Input") {
        outputs.push(["🎙️", "Transcript", "Voice to text"]);
      }

      if (item.task === "General Answer") {
        outputs.push(["💬", "Answer", "General response"]);
      }
    });

    return outputs;
  };

  const generateChatTitle = (text) => {
    const words = text
      .replace(/[^\w\s]/gi, "")
      .split(" ")
      .filter((word) => word.length > 3)
      .slice(0, 4);

    if (words.length === 0) return "Untitled Chat";

    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const setMessagesForCurrentChat = (newMessages) => {
    setChatMessages({
      ...chatMessages,
      [selectedChat]: newMessages,
    });
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const tasks = analyzeTask(input);

    const userMessage = {
      role: "user",
      text: input,
    };

    const aiMessage = {
      role: "ai",
      text: "OrbitalAI analyzed your request and assigned the best AI models.",
      tasks: tasks,
      outputs: getOutputs(tasks),
    };

    if (selectedChat.startsWith("New Chat") && messages.length === 0) {
      const newTitle = generateChatTitle(input);

      const updatedChats = chats.map((chat) =>
        chat === selectedChat ? newTitle : chat
      );

      const updatedChatMessages = {
        ...chatMessages,
        [newTitle]: [userMessage, aiMessage],
      };

      delete updatedChatMessages[selectedChat];

      const updatedProjectChats = {};

      Object.keys(projectChats).forEach((project) => {
        updatedProjectChats[project] = projectChats[project].map((chat) =>
          chat === selectedChat ? newTitle : chat
        );
      });

      setChats(updatedChats);
      setChatMessages(updatedChatMessages);
      setProjectChats(updatedProjectChats);
      setSelectedChat(newTitle);
      setInput("");
      return;
    }

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

                  {message.tasks && message.tasks.length > 0 && (
                    <>
                      <p className="text-gray-400 mb-8">
                        OrbitalAI automatically assigned the best AI model for
                        each task.
                      </p>

                      <div className="flex flex-wrap gap-3 mb-8">
                        {message.tasks.map((item, taskIndex) => (
                          <span
                            key={taskIndex}
                            className="px-3 py-2 rounded-lg bg-[#101827] border border-gray-700"
                          >
                            {item.ai} → {item.task}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {message.outputs && message.outputs.length > 0 && (
                    <>
                      <h2 className="text-2xl font-bold mb-6">
                        Generated Outputs
                      </h2>

                      <div className="grid grid-cols-3 gap-5">
                        {message.outputs.map((output, outputIndex) => (
                          <div
                            key={outputIndex}
                            className="bg-[#101827] border border-gray-800 rounded-xl p-5"
                          >
                            <h3 className="font-bold text-lg mb-2">
                              {output[0]} {output[1]}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {output[2]}
                            </p>
                          </div>
                        ))}
                      </div>

                      <button className="mt-8 text-purple-400 font-semibold hover:text-purple-300">
                        Open All Files →
                      </button>
                    </>
                  )}
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