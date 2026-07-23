import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyzeTask, getOutputs } from "../utils/taskRouting";
import { apiFetch, getApiErrorMessage } from "../services/apiClient";

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
  const [pendingFile, setPendingFile] = useState(null);
  const [homeNotice, setHomeNotice] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const creatingChatRef = useRef(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceStreamRef = useRef(null);
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

  const showHomeNotice = (message) => {
    setHomeNotice(message);
    window.setTimeout(() => setHomeNotice(""), 3200);
  };

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const transcribeRecording = async (audioBlob, mimeType) => {
    setIsTranscribing(true);
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const response = await apiFetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          filename: `voice-note-${Date.now()}.webm`,
          mimeType: mimeType || "audio/webm",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Voice transcription failed.");
      setHomeInput(String(data.text || "").trim());
      showHomeNotice("Voice note transcribed. Review it, then send.");
    } catch (error) {
      showHomeNotice(error.message || "Voice transcription failed.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleVoiceRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current?.state !== "inactive") mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      showHomeNotice("Voice recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
        voiceStreamRef.current = null;
        if (audioBlob.size) transcribeRecording(audioBlob, mimeType);
      };
      recorder.start();
      setIsRecording(true);
      showHomeNotice("Recording… click the microphone again to stop.");
    } catch (error) {
      showHomeNotice(error?.name === "NotAllowedError" ? "Allow microphone access and try again." : "Could not start voice recording.");
    }
  };

  const createChatWithPrompt = async (promptText) => {
    const trimmedPrompt = promptText.trim();
    if ((!trimmedPrompt && !pendingFile) || creatingChatRef.current) return;

    creatingChatRef.current = true;

    let fileText = "";
    if (pendingFile) {
      try {
        showHomeNotice(`Reading ${pendingFile.name}…`);
        const fileBase64 = await blobToBase64(pendingFile);
        const fileResponse = await apiFetch("/api/read-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64,
            filename: pendingFile.name,
            mimeType: pendingFile.type,
          }),
        });
        const fileData = await fileResponse.json();
        if (!fileResponse.ok) {
          throw new Error(
            getApiErrorMessage(fileData, "Failed to read this file.")
          );
        }
        fileText = fileData.text || "";
      } catch (error) {
        creatingChatRef.current = false;
        showHomeNotice(error.message || "Failed to read this file.");
        return;
      }
    }

    const now = new Date().toISOString();
    const chatTitle = generateChatTitle(trimmedPrompt);
    const tasks = analyzeTask(trimmedPrompt);
    const outputs = getOutputs(tasks);
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const userMessage = {
      role: "user",
      text: trimmedPrompt || "Analyze this document.",
      requestId,
      ...(pendingFile
        ? {
            attachment: {
              name: pendingFile.name,
              type: pendingFile.type || "application/octet-stream",
              sizeLabel: `${Math.max(0.1, pendingFile.size / 1024).toFixed(1)} KB`,
              kind: "file",
            },
            fileText,
            fileName: pendingFile.name,
          }
        : {}),
    };

    const loadingMessage = {
      role: "ai",
      text: "OrbitalAI is working on your request.",
      isLoading: true,
      loadingStage: `Generating response with ${tasks[0]?.ai || "OpenAI"}`,
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
    const submittedFile = pendingFile;
    setPendingFile(null);

    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedPrompt || "Analyze this document.",
          tasks,
          outputs,
          fileText,
          fileName: submittedFile?.name || "",
          conversationHistory: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, "Failed to generate AI response.")
        );
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
      <div className="orbital-earth-horizon pointer-events-none absolute inset-0" />

      <div className="relative h-full min-h-0 overflow-y-auto px-4 pb-8 pt-24 sm:px-8 sm:pt-20 lg:px-12 lg:py-14">
        <div className="mx-auto flex min-h-full w-full max-w-[900px] flex-col justify-center py-6 lg:py-0">
          <p className="text-center text-base font-medium text-slate-400 sm:text-lg">Good evening, Ashwin</p>

          <div className="orbital-home-composer mx-auto mt-6 w-full max-w-[650px] rounded-2xl border border-slate-400/40 bg-[#0a1220]/78 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-5">
            <textarea
              aria-label="Ask OrbitalAI"
              placeholder="How can I help you today?"
              value={homeInput}
              onChange={(event) => setHomeInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  createChatWithPrompt(homeInput);
                }
              }}
              rows={3}
              className="w-full resize-none bg-transparent text-[15px] leading-6 text-slate-100 outline-none placeholder:text-slate-500 sm:text-base"
            />
            {pendingFile && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-blue-300/15 bg-blue-400/[0.06] px-3 py-2 text-xs text-slate-300">
                <span className="text-blue-300">▤</span><span className="min-w-0 flex-1 truncate">{pendingFile.name}</span>
                <button type="button" onClick={() => setPendingFile(null)} aria-label="Remove attached file" className="text-slate-500 hover:text-white">×</button>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <input ref={fileInputRef} type="file" hidden accept=".pdf,.docx,.pptx,.xlsx,.odt,.odp,.ods,.epub,.txt,.md,.csv,.json,.rtf" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setPendingFile(file); showHomeNotice(`${file.name} attached.`); } event.target.value = ""; }} />
              <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Add a file" title="Add a file" className="flex h-10 items-center gap-2 rounded-lg border border-transparent px-2.5 text-slate-300 transition hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="m8.5 12.5 5.9-5.9a3.2 3.2 0 0 1 4.5 4.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l7.4-7.4" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="hidden text-xs sm:inline">Add file</span>
              </button>
              <button type="button" onClick={toggleVoiceRecording} disabled={isTranscribing} aria-label={isRecording ? "Stop voice recording" : "Record a voice note"} title="Voice note" className={`flex h-10 items-center gap-2 rounded-lg border px-2.5 transition ${isRecording ? "border-red-400/30 bg-red-500/10 text-red-300" : "border-transparent text-slate-300 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white"}`}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" strokeLinecap="round" /></svg><span className="hidden text-xs sm:inline">{isTranscribing ? "Transcribing" : isRecording ? "Stop" : "Voice note"}</span>
              </button>
              <button type="button" aria-label="Send prompt" onClick={() => createChatWithPrompt(homeInput)} disabled={(!homeInput.trim() && !pendingFile) || creatingChatRef.current || isRecording || isTranscribing} className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-base text-white shadow-[0_0_20px_rgba(124,92,255,0.28)] disabled:opacity-40">➤</button>
            </div>
          </div>

          {homeNotice && <p className="mx-auto mt-3 max-w-[650px] text-center text-xs text-violet-200">{homeNotice}</p>}

          <div className="mx-auto mt-8 grid w-full max-w-[650px] grid-cols-1 border-t border-white/[0.1] sm:grid-cols-2 sm:divide-x sm:divide-white/[0.1]">
            <section className="py-5 sm:pr-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Recent chats</h2>
                <button type="button" onClick={() => chats[0] && (setSelectedChat(chats[0]), setPage("chat"))} className="text-xs text-violet-300">View all</button>
              </div>
              <div className="divide-y divide-white/[0.08]">
                {chats.slice(0, 3).map((chat, index) => (
                  <button key={chat} type="button" onClick={() => { setSelectedChat(chat); setPage("chat"); }} className="flex w-full items-center gap-3 py-3 text-left text-xs text-slate-300 transition hover:text-white">
                    <span className="text-slate-500">▢</span><span className="min-w-0 flex-1 truncate">{chat}</span><span className="text-[10px] text-slate-600">{index === 0 ? "Today" : index === 1 ? "Yesterday" : "2 days ago"}</span>
                  </button>
                ))}
                {chats.length === 0 && <p className="py-5 text-xs text-slate-600">Your recent chats will appear here.</p>}
              </div>
            </section>

            <section className="border-t border-white/[0.1] py-5 sm:border-t-0 sm:pl-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200">Projects</h2>
                <button type="button" onClick={() => projects[0] && (setSelectedProject(projects[0]), setPage("project"))} className="text-xs text-violet-300">View all</button>
              </div>
              <div className="divide-y divide-white/[0.08]">
                {projects.slice(0, 3).map((project) => (
                  <button key={project} type="button" onClick={() => { setSelectedProject(project); setPage("project"); }} className="flex w-full items-center gap-3 py-3 text-left text-xs text-slate-300 transition hover:text-white">
                    <span className="text-blue-400">◇</span><span className="min-w-0 flex-1 truncate">{project}</span><span className="text-[10px] text-slate-600">{(projectChats[project] || []).length} chats</span>
                  </button>
                ))}
                {projects.length === 0 && <button type="button" onClick={createProjectFromSuggestion} className="py-5 text-left text-xs text-slate-600 hover:text-violet-300">Create your first project →</button>}
              </div>
            </section>
          </div>

          <div className="mx-auto mt-8 flex w-full max-w-[520px] items-center justify-around rounded-2xl border border-white/[0.15] bg-[#0b1320]/78 px-4 py-3 backdrop-blur-xl">
            {[["O", "OpenAI"], ["C", "Claude"], ["G", "Gemini"]].map(([letter, provider], index) => (
              <div key={provider} className={`flex items-center gap-2 px-3 ${index ? "border-l border-white/[0.12]" : ""}`}>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${provider === "OpenAI" ? "bg-emerald-400/15 text-emerald-300" : provider === "Claude" ? "bg-orange-400/15 text-orange-300" : "bg-blue-400/15 text-blue-300"}`}>{letter}</span>
                <span className="text-xs text-slate-200">{provider}<span className="mt-0.5 block text-[9px] text-emerald-400">● Available</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
