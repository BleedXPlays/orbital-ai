import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/orbital-logo.png";
import { analyzeTask, getOutputs } from "../utils/taskRouting";

function Home({
  chats,
  setChats,
  projects,
  setProjects,
  projectChats,
  setProjectChats,
  chatActivity,
  setChatActivity,
  setChatMessages,
  setSelectedChat,
  setSelectedProject,
  setPage,
  addActivity,
}) {
  const [homeInput, setHomeInput] = useState("");
  const creatingChatRef = useRef(false);
  const navigate = useNavigate();

  const slugify = (value) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
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

  const createChatWithPrompt = async (promptText) => {
    const trimmedPrompt = promptText.trim();
    if (!trimmedPrompt || creatingChatRef.current) return;

    creatingChatRef.current = true;

    const now = new Date().toISOString();
    const chatTitle = generateChatTitle(trimmedPrompt);
    const tasks = analyzeTask(trimmedPrompt);
    const outputs = getOutputs(tasks);
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const userMessage = {
      role: "user",
      text: trimmedPrompt,
      requestId,
    };

    const loadingMessage = {
      role: "ai",
      text: "OrbitalAI is generating a real response...",
      isLoading: true,
      requestId,
    };

    setChats((prev) => [...prev, chatTitle]);

    setChatMessages((prev) => ({
      ...prev,
      [chatTitle]: [userMessage, loadingMessage],
    }));

    setChatActivity((prev) => ({
      ...prev,
      [chatTitle]: now,
    }));

    setSelectedChat(chatTitle);
    setPage("chat");
    navigate(`/chat/${slugify(chatTitle)}`);

    if (addActivity) {
      addActivity("chat", "Chat created from home", chatTitle);
    }

    setHomeInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedPrompt,
          tasks,
          outputs,
          conversationHistory: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI response.");
      }

      const generatedOutputs = Array.isArray(data.generatedOutputs)
        ? data.generatedOutputs
        : [];

      const outputsWithContent = outputs.map((output) => {
        const matchingOutput = generatedOutputs.find((item) =>
          String(item.title || "")
            .toLowerCase()
            .startsWith(output[1].toLowerCase())
        );

        return [
          output[0],
          output[1],
          output[2],
          matchingOutput?.content || "",
        ];
      });

      const aiMessage = {
        role: "ai",
        text:
          data.reply ||
          "OrbitalAI generated a response, but no text was returned.",
        tasks,
        outputs: outputsWithContent,
        provider: data.provider || "",
        fallbackFrom: data.fallbackFrom || "",
        providerNotice: data.providerNotice || "",
        requestId,
      };

      setChatMessages((prev) => ({
        ...prev,
        [chatTitle]: [userMessage, aiMessage],
      }));
    } catch (error) {
      console.error("Home AI response error:", error);

      setChatMessages((prev) => ({
        ...prev,
        [chatTitle]: [
          userMessage,
          {
            role: "ai",
            text: `OrbitalAI could not complete this request: ${
              String(error?.message || "").trim() ||
              "Please try again in a moment."
            }`,
            tasks,
            outputs: [],
            requestId,
            failed: true,
            errorMessage:
              String(error?.message || "").trim() ||
              "Please try again in a moment.",
            retryTasks: tasks,
            retryOutputs: outputs,
          },
        ],
      }));
    } finally {
      creatingChatRef.current = false;
    }
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
    <div className="relative h-full min-h-0 overflow-hidden bg-[#020817] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(80,90,255,0.16),transparent_35%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.16),transparent_35%)]" />

      <div className="relative flex h-full min-h-0 flex-col items-center justify-center overflow-y-auto px-4 pb-36 pt-16 sm:px-8 sm:pb-40 sm:pt-8 lg:px-10">
        <div className="mt-4 text-center sm:mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
              OrbitalAI
            </span>
          </h1>

          <p className="mt-3 text-base text-gray-300 sm:mt-4 sm:text-xl">
            One request. Multiple AI experts.
          </p>
        </div>

        <div className="relative mt-7 flex max-w-full items-center justify-center sm:mt-12">
          <div className="absolute h-[80px] w-[280px] max-w-[82vw] rotate-[-4deg] rounded-full border border-purple-500/30 sm:h-[110px] sm:w-[420px]" />
          <div className="absolute h-[66px] w-[240px] max-w-[72vw] rotate-[6deg] rounded-full border border-blue-500/20 sm:h-[90px] sm:w-[360px]" />
          <div className="absolute w-3 h-3 rounded-full bg-purple-500 top-[-18px] right-8" />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-blue-500 bottom-[-12px] left-12" />
          <div className="absolute w-2 h-2 rounded-full bg-purple-400 top-6 left-[-18px]" />
          <div className="absolute w-2 h-2 rounded-full bg-blue-400 bottom-7 right-[-20px]" />

          <img
            src={logo}
            alt="OrbitalAI"
            className="relative h-20 w-auto object-contain drop-shadow-[0_0_30px_rgba(124,92,255,0.45)] sm:h-32"
          />
        </div>

        <div className="mt-9 w-full text-center sm:mt-16">
          <p className="text-base text-gray-200 sm:text-xl">
            What would you like to do today?
          </p>

          <div className="mx-auto mt-5 grid w-full max-w-[760px] grid-cols-1 gap-3 sm:mt-8 sm:gap-5 md:grid-cols-2">
            <button
              onClick={createProjectFromSuggestion}
              className="group flex min-h-24 items-center justify-between rounded-2xl border border-[#1B2540] bg-[#08111F]/90 px-4 text-left transition hover:border-purple-500/70 sm:h-28 sm:px-6"
            >
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-600/20 text-xl sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
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
              className="group flex min-h-24 items-center justify-between rounded-2xl border border-[#1B2540] bg-[#08111F]/90 px-4 text-left transition hover:border-purple-500/70 sm:h-28 sm:px-6"
            >
              <div className="flex items-center gap-3 sm:gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-600/20 text-xl sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
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

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020817] via-[#020817]/95 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-8 lg:px-10">
        <div className="mx-auto flex w-full max-w-[760px] min-w-0 items-center gap-2 rounded-2xl border border-[#1B2540] bg-[#07101F]/95 p-2 shadow-2xl shadow-purple-950/20 sm:gap-3 sm:rounded-3xl sm:p-3 lg:gap-4 lg:p-4">
          <button className="h-11 w-11 shrink-0 rounded-xl bg-[#101827] border border-[#1B2540] text-2xl text-white hover:bg-[#141f33] sm:h-14 sm:w-14 sm:rounded-2xl sm:text-3xl">
            +
          </button>

          <button className="h-11 w-11 shrink-0 rounded-xl bg-[#101827] border border-[#1B2540] text-xl hover:bg-[#141f33] sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">
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
            className="min-w-0 flex-1 bg-transparent text-base text-gray-200 outline-none placeholder:text-gray-500 sm:text-lg"
          />

          <button
            onClick={() => createChatWithPrompt(homeInput)}
            className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg shadow-purple-700/30 transition hover:scale-[1.03] sm:h-16 sm:w-16 sm:rounded-2xl sm:text-3xl"
          >
            ✈
          </button>
        </div>

        <p className="mt-4 hidden text-center text-sm text-gray-500 sm:block">
          Press Enter to send&nbsp;&nbsp;•&nbsp;&nbsp;Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}

export default Home;
