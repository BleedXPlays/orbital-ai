import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/orbital-logo.png";

function Home({
  chats,
  setChats,
  projects,
  setProjects,
  projectChats,
  setProjectChats,
  projectFiles,
  projectNotes,
  archivedChats,
  archivedProjects,
  pinnedChats,
  chatActivity,
  setChatActivity,
  activityLog,
  chatMessages,
  setChatMessages,
  setSelectedChat,
  setSelectedProject,
  setPage,
  addActivity,
}) {
  const [homeInput, setHomeInput] = useState("");
  const navigate = useNavigate();

  const slugify = (value) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
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

  const createChatWithPrompt = (promptText) => {
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt) return;

    const now = new Date().toISOString();
    const chatTitle = generateChatTitle(trimmedPrompt);
    const tasks = analyzeTask(trimmedPrompt);

    const userMessage = {
      role: "user",
      text: trimmedPrompt,
    };

    const aiMessage = {
      role: "ai",
      text: "OrbitalAI analyzed your request and assigned the best AI models.",
      tasks,
      outputs: getOutputs(tasks),
    };

    setChats([...chats, chatTitle]);

    setChatMessages({
      ...chatMessages,
      [chatTitle]: [userMessage, aiMessage],
    });

    setChatActivity({
      ...chatActivity,
      [chatTitle]: now,
    });

    setSelectedChat(chatTitle);
    setPage("chat");
    navigate(`/chat/${slugify(chatTitle)}`);

    if (addActivity) {
      addActivity("chat", "Chat created from home", chatTitle);
    }

    setHomeInput("");
  };

  const createProjectFromSuggestion = () => {
    const projectName = projects.includes("Chandrayaan-3 Research")
      ? `Chandrayaan-3 Research ${projects.length + 1}`
      : "Chandrayaan-3 Research";

    const chatName = "Chandrayaan-3 Research Notes";
    const now = new Date().toISOString();

    setProjects([...projects, projectName]);

    setProjectChats({
      ...projectChats,
      [projectName]: [chatName],
    });

    setChatActivity({
      ...chatActivity,
      [chatName]: now,
    });

    setSelectedProject(projectName);
    setSelectedChat(chatName);
    setPage("project");

    if (addActivity) {
      addActivity("project", "Project created from home", projectName);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020817] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(80,90,255,0.16),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.16),transparent_35%)]" />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-10 pb-40">
        <div className="text-center mt-8">
          <h1 className="text-5xl font-extrabold tracking-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              OrbitalAI
            </span>
          </h1>

          <p className="mt-4 text-xl text-gray-300">
            One request. Multiple AI experts.
          </p>
        </div>

        <div className="mt-12 relative flex items-center justify-center">
          <div className="absolute w-[420px] h-[110px] rounded-full border border-purple-500/30 rotate-[-4deg]" />
          <div className="absolute w-[360px] h-[90px] rounded-full border border-blue-500/20 rotate-[6deg]" />
          <div className="absolute w-3 h-3 rounded-full bg-purple-500 top-[-18px] right-8" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-500 bottom-[-12px] left-12" />
          <div className="absolute w-2 h-2 rounded-full bg-purple-400 top-6 left-[-18px]" />
          <div className="absolute w-2 h-2 rounded-full bg-blue-400 bottom-7 right-[-20px]" />

          <img
            src={logo}
            alt="OrbitalAI"
            className="relative h-32 w-auto object-contain drop-shadow-[0_0_30px_rgba(124,92,255,0.45)]"
          />
        </div>

        <div className="mt-16 text-center">
          <p className="text-xl text-gray-200">
            What would you like to do today?
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-[760px]">
            <button
              onClick={createProjectFromSuggestion}
              className="group h-28 rounded-2xl bg-[#08111F]/90 border border-[#1B2540] hover:border-purple-500/70 px-6 flex items-center justify-between text-left transition"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl">
                  ▣
                </div>

                <p className="text-base leading-relaxed text-gray-100">
                  Create a project on
                  <br />
                  Chandrayaan-3 with images
                </p>
              </div>

              <span className="text-3xl text-purple-400 group-hover:translate-x-1 transition">
                →
              </span>
            </button>

            <button
              onClick={() =>
                createChatWithPrompt("Write an essay on global warming")
              }
              className="group h-28 rounded-2xl bg-[#08111F]/90 border border-[#1B2540] hover:border-purple-500/70 px-6 flex items-center justify-between text-left transition"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-2xl">
                  ✎
                </div>

                <p className="text-base leading-relaxed text-gray-100">
                  Write an essay on
                  <br />
                  global warming
                </p>
              </div>

              <span className="text-3xl text-purple-400 group-hover:translate-x-1 transition">
                →
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 bottom-14 -translate-x-1/2 w-[760px] max-w-[calc(100vw-420px)]">
        <div className="bg-[#07101F]/95 border border-[#1B2540] shadow-2xl shadow-purple-950/20 rounded-3xl p-4 flex items-center gap-4">
          <button className="w-14 h-14 rounded-2xl bg-[#101827] border border-[#1B2540] text-3xl text-white hover:bg-[#141f33]">
            +
          </button>

          <button className="w-14 h-14 rounded-2xl bg-[#101827] border border-[#1B2540] text-2xl hover:bg-[#141f33]">
            🎙️
          </button>

          <input
            type="text"
            placeholder="Ask OrbitalAI anything..."
            value={homeInput}
            onChange={(e) => setHomeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createChatWithPrompt(homeInput);
            }}
            className="flex-1 bg-transparent outline-none text-lg text-gray-200 placeholder:text-gray-500"
          />

          <button
            onClick={() => createChatWithPrompt(homeInput)}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl shadow-lg shadow-purple-700/30 hover:scale-[1.03] transition"
          >
            ✈
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Press Enter to send&nbsp;&nbsp;•&nbsp;&nbsp;Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

export default Home;
