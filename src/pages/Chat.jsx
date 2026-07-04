import { useEffect, useRef, useState } from "react";

function Chat({
  selectedChat,
  setSelectedChat,
  chats,
  setChats,
  projectChats,
  setProjectChats,
  chatMessages,
  setChatMessages,
  pinnedChats,
  setPinnedChats,
  chatActivity,
  setChatActivity,
  addActivity,
}) {
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");

  const mainScrollRef = useRef(null);

  const messages = selectedChat ? chatMessages[selectedChat] || [] : [];

  useEffect(() => {
    if (!mainScrollRef.current) return;

    mainScrollRef.current.scrollTo({
      top: mainScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  const showNotice = (message) => {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  const analyzeTask = (text) => {
    const lowerText = text.toLowerCase();
    const detectedTasks = [];

    if (
      lowerText.includes("research") ||
      lowerText.includes("information") ||
      lowerText.includes("facts") ||
      lowerText.includes("sources")
    ) {
      detectedTasks.push({ task: "Research", ai: "Claude" });
    }

    if (
      lowerText.includes("write") ||
      lowerText.includes("essay") ||
      lowerText.includes("report") ||
      lowerText.includes("content") ||
      lowerText.includes("explain")
    ) {
      detectedTasks.push({ task: "Writing", ai: "ChatGPT" });
    }

    if (
      lowerText.includes("image") ||
      lowerText.includes("poster") ||
      lowerText.includes("diagram") ||
      lowerText.includes("logo") ||
      lowerText.includes("visual")
    ) {
      detectedTasks.push({ task: "Images", ai: "Gemini" });
    }

    if (
      lowerText.includes("website") ||
      lowerText.includes("code") ||
      lowerText.includes("app") ||
      lowerText.includes("react")
    ) {
      detectedTasks.push({ task: "Coding", ai: "GitHub Copilot" });
    }

    if (
      lowerText.includes("presentation") ||
      lowerText.includes("ppt") ||
      lowerText.includes("slides")
    ) {
      detectedTasks.push({ task: "Presentation", ai: "Gamma" });
    }

    if (
      lowerText.includes("video") ||
      lowerText.includes("reel") ||
      lowerText.includes("youtube")
    ) {
      detectedTasks.push({ task: "Video", ai: "Runway" });
    }

    if (
      lowerText.includes("translate") ||
      lowerText.includes("translation") ||
      lowerText.includes("language")
    ) {
      detectedTasks.push({ task: "Translation", ai: "Google Translate AI" });
    }

    if (
      lowerText.includes("voice") ||
      lowerText.includes("audio") ||
      lowerText.includes("speech")
    ) {
      detectedTasks.push({ task: "Voice Input", ai: "Whisper" });
    }

    if (detectedTasks.length === 0) {
      detectedTasks.push({ task: "General Answer", ai: "ChatGPT" });
    }

    return detectedTasks;
  };

  const getOutputs = (tasks) => {
    const outputs = [];

    tasks.forEach((item) => {
      if (item.task === "Research")
        outputs.push(["📚", "Research Notes", "Detailed sources"]);
      if (item.task === "Writing")
        outputs.push(["📄", "Written Content", "Essay / report"]);
      if (item.task === "Images")
        outputs.push(["🖼️", "Image Ideas", "Visual prompts"]);
      if (item.task === "Coding")
        outputs.push(["💻", "Website Code", "HTML, CSS, JS"]);
      if (item.task === "Presentation")
        outputs.push(["📊", "Presentation", "Slides"]);
      if (item.task === "Video")
        outputs.push(["🎬", "Video Plan", "Scene prompts"]);
      if (item.task === "Translation")
        outputs.push(["🌍", "Translation", "Translated output"]);
      if (item.task === "Voice Input")
        outputs.push(["🎙️", "Transcript", "Voice to text"]);
      if (item.task === "General Answer")
        outputs.push(["💬", "Answer", "General response"]);
    });

    return outputs;
  };

  const generateChatTitle = (text) => {
    const words = text
      .replace(/[^\w\s]/gi, "")
      .split(" ")
      .filter((word) => word.length > 3)
      .slice(0, 4);

    if (words.length === 0) return `New Chat ${chats.length + 1}`;

    let title = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (chats.includes(title)) {
      title = `${title} ${chats.length + 1}`;
    }

    return title;
  };

  const updateProjectChatNames = (oldName, newName) => {
    const updatedProjectChats = {};

    Object.keys(projectChats).forEach((project) => {
      updatedProjectChats[project] = projectChats[project].map((chat) =>
        chat === oldName ? newName : chat
      );
    });

    return updatedProjectChats;
  };

  const formatChatForExport = () => {
    const title = selectedChat || "Untitled Chat";

    const formattedMessages = messages
      .map((message) => {
        if (message.role === "user") {
          return `You:\n${message.text}`;
        }

        const taskText =
          message.tasks && message.tasks.length > 0
            ? `\n\nAssigned AI Models:\n${message.tasks
                .map((item) => `- ${item.ai} → ${item.task}`)
                .join("\n")}`
            : "";

        const outputText =
          message.outputs && message.outputs.length > 0
            ? `\n\nGenerated Outputs:\n${message.outputs
                .map((output) => `- ${output[0]} ${output[1]}: ${output[2]}`)
                .join("\n")}`
            : "";

        return `OrbitalAI:\n${message.text}${taskText}${outputText}`;
      })
      .join("\n\n------------------------------\n\n");

    return `OrbitalAI Chat Export\n\nChat: ${title}\nExported: ${new Date().toLocaleString()}\n\n==============================\n\n${formattedMessages}`;
  };

  const handleShare = async () => {
    if (!selectedChat) {
      showNotice("Create or open a chat first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      showNotice("Chat link copied.");
      addActivity("share", "Chat link copied", selectedChat);
    } catch (error) {
      showNotice("Could not copy link.");
    }
  };

  const handleExport = () => {
    if (!selectedChat || messages.length === 0) {
      showNotice("No chat messages to export.");
      return;
    }

    const exportText = formatChatForExport();
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const safeFileName = selectedChat
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName || "orbitalai-chat"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showNotice("Chat exported.");
    addActivity("export", "Chat exported", selectedChat);
  };

  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const now = new Date().toISOString();
    const tasks = analyzeTask(trimmedInput);

    const userMessage = {
      role: "user",
      text: trimmedInput,
    };

    const aiMessage = {
      role: "ai",
      text: "OrbitalAI analyzed your request and assigned the best AI models.",
      tasks,
      outputs: getOutputs(tasks),
    };

    const newMessages = [userMessage, aiMessage];

    if (!selectedChat) {
      const newTitle = generateChatTitle(trimmedInput);

      setChats([...chats, newTitle]);

      setChatMessages({
        ...chatMessages,
        [newTitle]: newMessages,
      });

      setChatActivity({
        ...chatActivity,
        [newTitle]: now,
      });

      setSelectedChat(newTitle);

      addActivity("chat", "Chat created", newTitle);

      setInput("");
      return;
    }

    if (selectedChat.startsWith("New Chat") && messages.length === 0) {
      const newTitle = generateChatTitle(trimmedInput);

      const updatedChats = chats.map((chat) =>
        chat === selectedChat ? newTitle : chat
      );

      const updatedProjectChats = updateProjectChatNames(selectedChat, newTitle);

      const updatedChatMessages = {
        ...chatMessages,
        [newTitle]: newMessages,
      };

      delete updatedChatMessages[selectedChat];

      const updatedPinnedChats = pinnedChats.map((chat) =>
        chat === selectedChat ? newTitle : chat
      );

      const updatedChatActivity = { ...chatActivity };
      delete updatedChatActivity[selectedChat];
      updatedChatActivity[newTitle] = now;

      setChats(updatedChats);
      setProjectChats(updatedProjectChats);
      setChatMessages(updatedChatMessages);
      setPinnedChats(updatedPinnedChats);
      setChatActivity(updatedChatActivity);
      setSelectedChat(newTitle);

      addActivity("chat", "Chat renamed automatically", newTitle);

      setInput("");
      return;
    }

    setChatMessages({
      ...chatMessages,
      [selectedChat]: [...messages, userMessage, aiMessage],
    });

    setChatActivity({
      ...chatActivity,
      [selectedChat]: now,
    });

    addActivity("message", "Message sent", selectedChat);

    setInput("");
  };

  return (
    <div className="relative h-full min-h-0 bg-[#020817] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(80,90,255,0.12),transparent_38%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.14),transparent_35%)]" />

      {notice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 px-5 py-3 text-sm shadow-2xl shadow-purple-950/20">
          {notice}
        </div>
      )}

      <div className="relative h-full min-h-0 flex flex-col overflow-hidden">
        <header className="shrink-0 px-10 pt-8 pb-5 border-b border-[#1B2540]/70 bg-[#020817]/80 backdrop-blur-xl">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_16px_rgba(74,222,128,0.8)]" />
                <p className="text-sm text-green-300">
                  Multi-AI collaboration active
                </p>
              </div>

              <h1 className="text-3xl font-bold tracking-tight truncate">
                {selectedChat || "Untitled Chat"}
              </h1>
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={handleShare}
                className="px-5 py-3 rounded-2xl bg-[#07101F] border border-[#1B2540] text-sm text-gray-200 hover:bg-[#101827]"
              >
                Share
              </button>

              <button
                onClick={handleExport}
                className="px-5 py-3 rounded-2xl bg-[#07101F] border border-[#1B2540] text-sm text-gray-200 hover:bg-[#101827]"
              >
                Export
              </button>
            </div>
          </div>
        </header>

        <main
          ref={mainScrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-10 pt-8 pb-10"
        >
          {messages.length === 0 && (
            <div className="min-h-[520px] flex flex-col items-center justify-center text-center">
              <div className="relative mb-10">
                <div className="absolute inset-0 blur-3xl bg-purple-600/20 rounded-full" />
                <div className="relative w-24 h-24 rounded-3xl bg-[#07101F] border border-[#1B2540] flex items-center justify-center text-4xl shadow-2xl shadow-purple-950/30">
                  ✦
                </div>
              </div>

              <h2 className="text-4xl font-bold tracking-tight">
                Start a new conversation
              </h2>

              <p className="mt-4 text-gray-400 text-lg">
                Ask once. OrbitalAI routes the work to the right AI experts.
              </p>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                <button
                  onClick={() =>
                    setInput("Research Chandrayaan-3 and create key notes")
                  }
                  className="text-left p-5 rounded-2xl bg-[#07101F]/90 border border-[#1B2540] hover:border-purple-500/70"
                >
                  <p className="text-lg mb-2">📚 Research</p>
                  <p className="text-sm text-gray-400">
                    Build notes with useful facts and sources.
                  </p>
                </button>

                <button
                  onClick={() => setInput("Write an essay on global warming")}
                  className="text-left p-5 rounded-2xl bg-[#07101F]/90 border border-[#1B2540] hover:border-purple-500/70"
                >
                  <p className="text-lg mb-2">📄 Writing</p>
                  <p className="text-sm text-gray-400">
                    Draft essays, reports, summaries and explanations.
                  </p>
                </button>

                <button
                  onClick={() =>
                    setInput("Create a project idea with visuals and code")
                  }
                  className="text-left p-5 rounded-2xl bg-[#07101F]/90 border border-[#1B2540] hover:border-purple-500/70"
                >
                  <p className="text-lg mb-2">✦ Multi-output</p>
                  <p className="text-sm text-gray-400">
                    Combine writing, images, code and presentations.
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-7 max-w-6xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "user" ? (
                  <div className="max-w-[620px] rounded-3xl rounded-tr-md bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 p-[1px] shadow-xl shadow-purple-950/30">
                    <div className="rounded-3xl rounded-tr-md bg-[#111A2E]/90 p-6">
                      <p className="text-sm text-purple-200 mb-2">You</p>
                      <p className="text-gray-100 leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-5xl rounded-3xl rounded-tl-md bg-[#07101F]/95 border border-[#1B2540] p-7 shadow-xl shadow-purple-950/10">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        ✦
                      </div>

                      <div className="min-w-0">
                        <p className="text-xl font-semibold">
                          {message.text}
                        </p>

                        {message.tasks && message.tasks.length > 0 && (
                          <p className="text-gray-400 mt-2">
                            The request was routed across the best-fit AI roles.
                          </p>
                        )}
                      </div>
                    </div>

                    {message.tasks && message.tasks.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-8">
                        {message.tasks.map((item, taskIndex) => (
                          <span
                            key={taskIndex}
                            className="px-4 py-2 rounded-full bg-[#101827] border border-[#1B2540] text-sm text-gray-200"
                          >
                            {item.ai} → {item.task}
                          </span>
                        ))}
                      </div>
                    )}

                    {message.outputs && message.outputs.length > 0 && (
                      <>
                        <h2 className="text-2xl font-bold mb-5">
                          Generated Outputs
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {message.outputs.map((output, outputIndex) => (
                            <div
                              key={outputIndex}
                              className="bg-[#101827] border border-[#1B2540] rounded-2xl p-5 hover:border-purple-500/60 transition"
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

                        <button className="mt-7 text-purple-300 font-semibold hover:text-purple-200">
                          Open all files →
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        <div className="shrink-0 px-10 pb-8 pt-4 bg-gradient-to-t from-[#020817] via-[#020817]/95 to-transparent">
          <div className="mx-auto w-[820px] max-w-full">
            <div className="bg-[#07101F]/95 border border-[#1B2540] shadow-2xl shadow-purple-950/30 rounded-3xl p-4 flex items-center gap-4 backdrop-blur-xl">
              <button className="w-14 h-14 rounded-2xl bg-[#101827] border border-[#1B2540] text-3xl text-white hover:bg-[#141f33]">
                +
              </button>

              <button className="w-14 h-14 rounded-2xl bg-[#101827] border border-[#1B2540] text-2xl hover:bg-[#141f33]">
                🎤
              </button>

              <input
                type="text"
                value={input}
                placeholder="Ask OrbitalAI anything..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                className="flex-1 bg-transparent outline-none text-lg text-gray-200 placeholder:text-gray-500"
              />

              <button
                onClick={sendMessage}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl shadow-lg shadow-purple-700/30 hover:scale-[1.03] transition"
              >
                ➤
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Press Enter to send&nbsp;&nbsp;•&nbsp;&nbsp;Shift + Enter for new
              line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;