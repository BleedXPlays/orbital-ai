import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/orbital-logo.png";
import { analyzeTask, getOutputs } from "../utils/taskRouting";
import { apiFetch } from "../services/apiClient";

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
      const response = await apiFetch("/api/chat", {
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
    <div className="orbital-page relative h-full min-h-0 overflow-hidden text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(91,110,255,0.18),transparent_38%),radial-gradient(circle_at_90%_70%,rgba(147,51,234,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 auth-grid opacity-[0.14]" />

      <div className="relative h-full min-h-0 overflow-y-auto px-4 pb-40 pt-20 sm:px-8 sm:pb-44 sm:pt-14 lg:px-12 lg:pt-12">
        <div className="mx-auto w-full max-w-[980px]">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3.5 py-2 text-xs font-medium text-emerald-300 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
              Your AI workspace is ready
            </div>

            <img
              src={logo}
              alt="OrbitalAI"
              className="mb-5 h-auto w-44 object-contain drop-shadow-[0_0_30px_rgba(124,92,255,0.3)] sm:w-52"
            />

            <h1 className="max-w-[780px] text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-50 sm:text-5xl lg:text-[3.5rem]">
              What do you want to accomplish?
            </h1>
            <p className="mt-4 max-w-[620px] text-base leading-7 text-slate-400 sm:text-lg">
              Ask once. OrbitalAI routes your work to OpenAI, Claude or Gemini
              and keeps everything organized in one workspace.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-3 sm:mt-11 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Research & writing",
                description: "Write a clear report about renewable energy",
                accent: "from-blue-500/20 to-cyan-400/5",
                icon: "✦",
                action: () =>
                  createChatWithPrompt(
                    "Write a clear report about why renewable energy is important"
                  ),
              },
              {
                label: "Build a project",
                description: "Create a Chandrayaan-3 research workspace",
                accent: "from-violet-500/20 to-fuchsia-400/5",
                icon: "◇",
                action: createProjectFromSuggestion,
              },
              {
                label: "Learn something",
                description: "Explain photosynthesis in simple detail",
                accent: "from-emerald-500/15 to-teal-400/5",
                icon: "↗",
                action: () =>
                  createChatWithPrompt(
                    "Explain photosynthesis in simple detail with examples"
                  ),
              },
            ].map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={suggestion.action}
                className={`group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${suggestion.accent} p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:border-violet-400/35 hover:bg-white/[0.06]`}
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-black/20 text-lg text-violet-200">
                  {suggestion.icon}
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  {suggestion.label}
                </p>
                <p className="mt-1.5 pr-5 text-sm leading-6 text-slate-400">
                  {suggestion.description}
                </p>
                <span className="absolute bottom-5 right-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-300">
                  →
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-xs text-slate-600 sm:text-sm">
            <span>OpenAI</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>Claude</span>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <span>Gemini</span>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#030712] via-[#030712]/98 to-transparent px-3 pb-[max(0.8rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pb-7 lg:px-12">
        <div className="mx-auto flex w-full max-w-[820px] min-w-0 items-center gap-2 rounded-2xl border border-white/[0.1] bg-[#0a1020]/90 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:rounded-[22px] sm:p-2.5">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-violet-200 sm:flex">
            ✦
          </div>

          <input
            type="text"
            aria-label="Ask OrbitalAI"
            placeholder="Ask OrbitalAI anything..."
            value={homeInput}
            onChange={(event) => setHomeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") createChatWithPrompt(homeInput);
            }}
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-600 sm:text-base"
          />

          <button
            type="button"
            aria-label="Send prompt"
            onClick={() => createChatWithPrompt(homeInput)}
            disabled={!homeInput.trim() || creatingChatRef.current}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#557cff] to-[#963eff] text-xl text-white shadow-[0_10px_30px_rgba(109,74,255,0.3)] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 sm:h-12 sm:w-12"
          >
            ↑
          </button>
        </div>

        <p className="mt-3 hidden text-center text-xs text-slate-600 sm:block">
          Press Enter to send · Files and voice notes can be added inside a chat
        </p>
      </div>
    </div>
  );
}

export default Home;
