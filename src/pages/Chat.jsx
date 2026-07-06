import { useEffect, useRef, useState } from "react";
import OutputPreviewModal from "../components/OutputPreviewModal";

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
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);

  const [outputModal, setOutputModal] = useState({
    isOpen: false,
    title: "",
    outputs: [],
  });

  const mainScrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);
  const voiceStartTimeRef = useRef(null);
  const voiceStreamRef = useRef(null);

  const messages = selectedChat ? chatMessages[selectedChat] || [] : [];

  useEffect(() => {
    if (!mainScrollRef.current) return;

    mainScrollRef.current.scrollTo({
      top: mainScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(attachmentPreviewUrl);
      }
    };
  }, [attachmentPreviewUrl]);

  useEffect(() => {
    return () => {
      if (voiceTimerRef.current) {
        clearInterval(voiceTimerRef.current);
      }

      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const showNotice = (message) => {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 2500);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";

    const kb = bytes / 1024;
    const mb = kb / 1024;

    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(1)} KB`;
  };

  const formatDuration = (seconds) => {
    const safeSeconds = Math.max(0, seconds || 0);
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;

    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getAttachmentIcon = (kind) => {
    if (kind === "image") return "🖼️";
    if (kind === "voice") return "🎙️";
    return "📎";
  };

  const openSingleOutput = (output) => {
    setOutputModal({
      isOpen: true,
      title: output[1],
      outputs: [output],
    });
  };

  const openAllOutputs = (outputs) => {
    setOutputModal({
      isOpen: true,
      title: "All Generated Outputs",
      outputs,
    });
  };

  const closeOutputModal = () => {
    setOutputModal({
      isOpen: false,
      title: "",
      outputs: [],
    });
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
      lowerText.includes("visual") ||
      lowerText.includes("photo") ||
      lowerText.includes("picture")
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
      lowerText.includes("speech") ||
      lowerText.includes("transcribe") ||
      lowerText.includes("recording")
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

  const getRealAiReply = async ({ message, tasks, outputs, attachment }) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          tasks,
          outputs,
          attachment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate AI response.");
      }

      return (
        data.reply ||
        "OrbitalAI generated a response, but no text was returned."
      );
    } catch (error) {
      console.error("AI response error:", error);
      showNotice("Real AI response failed. Showing fallback response.");

      return "OrbitalAI analyzed your request and assigned the best AI models. Real AI response could not be generated right now.";
    }
  };

  const handleAttachFile = () => {
    setActionMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleUploadImage = () => {
    setActionMenuOpen(false);
    imageInputRef.current?.click();
  };

  const handleFileSelected = (event, kind) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }

    const isImage = kind === "image" || file.type.startsWith("image/");

    const attachment = {
      name: file.name,
      type: file.type || "Unknown type",
      size: file.size,
      sizeLabel: formatFileSize(file.size),
      kind: isImage ? "image" : "file",
    };

    setSelectedAttachment(attachment);
    setAttachmentPreviewUrl(isImage ? URL.createObjectURL(file) : "");
    showNotice(isImage ? "Image selected." : "File attached.");

    event.target.value = "";
  };

  const startVoiceRecording = async () => {
    if (isGenerating) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showNotice("Voice recording is not supported in this browser.");
      return;
    }

    if (!window.MediaRecorder) {
      showNotice("Media recording is not supported in this browser.");
      return;
    }

    try {
      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(attachmentPreviewUrl);
      }

      setActionMenuOpen(false);
      setSelectedAttachment(null);
      setAttachmentPreviewUrl("");
      setVoiceDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      voiceStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      voiceStartTimeRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - voiceStartTimeRef.current) / 1000)
        );

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        const audioUrl = URL.createObjectURL(audioBlob);

        const attachment = {
          name: `voice-note-${Date.now()}.webm`,
          type: "audio/webm",
          size: audioBlob.size,
          sizeLabel: formatFileSize(audioBlob.size),
          kind: "voice",
          durationLabel: formatDuration(durationSeconds),
        };

        setSelectedAttachment(attachment);
        setAttachmentPreviewUrl(audioUrl);

        setInput((prev) => {
          if (prev.trim()) return prev;
          return "Transcribe this voice note";
        });

        showNotice("Voice note recorded.");

        if (voiceStreamRef.current) {
          voiceStreamRef.current.getTracks().forEach((track) => track.stop());
          voiceStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        voiceStartTimeRef.current = null;
      };

      recorder.start();
      setIsRecording(true);

      voiceTimerRef.current = setInterval(() => {
        setVoiceDuration((prev) => prev + 1);
      }, 1000);

      showNotice("Recording started.");
    } catch (error) {
      showNotice("Microphone permission was denied.");
    }
  };

  const stopVoiceRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }

    setIsRecording(false);

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopVoiceRecording();
      return;
    }

    startVoiceRecording();
  };

  const removeAttachment = () => {
    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }

    setSelectedAttachment(null);
    setAttachmentPreviewUrl("");
    showNotice("Attachment removed.");
  };

  const handleClearInput = () => {
    if (isRecording) {
      showNotice("Stop recording first.");
      return;
    }

    setInput("");
    setActionMenuOpen(false);
    showNotice("Input cleared.");
  };

  const formatChatForExport = () => {
    const title = selectedChat || "Untitled Chat";

    const formattedMessages = messages
      .map((message) => {
        const attachmentText = message.attachment
          ? `\n\nAttachment:\n- ${message.attachment.name} (${message.attachment.sizeLabel})`
          : "";

        if (message.role === "user") {
          return `You:\n${message.text}${attachmentText}`;
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

        return `OrbitalAI:\n${message.text}${attachmentText}${taskText}${outputText}`;
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

  const sendMessage = async () => {
    const trimmedInput = input.trim();

    if (isRecording) {
      showNotice("Stop recording before sending.");
      return;
    }

    if ((!trimmedInput && !selectedAttachment) || isGenerating) return;

    setIsGenerating(true);
    setActionMenuOpen(false);

    const now = new Date().toISOString();

    const attachmentToSend = selectedAttachment;

    const attachmentText = attachmentToSend
      ? `Attached ${attachmentToSend.kind}: ${attachmentToSend.name}`
      : "";

    const messageText = trimmedInput || attachmentText;

    const textForAnalysis = `${messageText} ${
      attachmentToSend?.name || ""
    } ${attachmentToSend?.kind || ""}`;

    const tasks = analyzeTask(textForAnalysis);
    const outputs = getOutputs(tasks);

    const userMessage = {
      role: "user",
      text: messageText,
      attachment: attachmentToSend,
    };

    const loadingMessage = {
      role: "ai",
      text: attachmentToSend
        ? "OrbitalAI is generating a real response for your request and attachment..."
        : "OrbitalAI is generating a real response...",
      isLoading: true,
    };

    const createFinalAiMessage = (reply) => ({
      role: "ai",
      text: reply,
      tasks,
      outputs,
    });

    setInput("");

    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }

    setSelectedAttachment(null);
    setAttachmentPreviewUrl("");

    if (!selectedChat) {
      const newTitle = generateChatTitle(messageText);

      setChats([...chats, newTitle]);

      setChatMessages({
        ...chatMessages,
        [newTitle]: [userMessage, loadingMessage],
      });

      setChatActivity({
        ...chatActivity,
        [newTitle]: now,
      });

      setSelectedChat(newTitle);

      addActivity("chat", "Chat created", newTitle);

      const reply = await getRealAiReply({
        message: messageText,
        tasks,
        outputs,
        attachment: attachmentToSend,
      });

      setChatMessages((prev) => ({
        ...prev,
        [newTitle]: [userMessage, createFinalAiMessage(reply)],
      }));

      setIsGenerating(false);
      return;
    }

    if (selectedChat.startsWith("New Chat") && messages.length === 0) {
      const newTitle = generateChatTitle(messageText);

      const updatedChats = chats.map((chat) =>
        chat === selectedChat ? newTitle : chat
      );

      const updatedProjectChats = updateProjectChatNames(selectedChat, newTitle);

      const updatedChatMessages = {
        ...chatMessages,
        [newTitle]: [userMessage, loadingMessage],
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

      const reply = await getRealAiReply({
        message: messageText,
        tasks,
        outputs,
        attachment: attachmentToSend,
      });

      setChatMessages((prev) => ({
        ...prev,
        [newTitle]: [userMessage, createFinalAiMessage(reply)],
      }));

      setIsGenerating(false);
      return;
    }

    setChatMessages({
      ...chatMessages,
      [selectedChat]: [...messages, userMessage, loadingMessage],
    });

    setChatActivity({
      ...chatActivity,
      [selectedChat]: now,
    });

    addActivity(
      "message",
      attachmentToSend ? "Message with attachment sent" : "Message sent",
      selectedChat
    );

    const reply = await getRealAiReply({
      message: messageText,
      tasks,
      outputs,
      attachment: attachmentToSend,
    });

    setChatMessages((prev) => {
      const currentMessages = prev[selectedChat] || [];

      return {
        ...prev,
        [selectedChat]: currentMessages.map((message) =>
          message.isLoading ? createFinalAiMessage(reply) : message
        ),
      };
    });

    setIsGenerating(false);
  };

  return (
    <div
      onClick={() => setActionMenuOpen(false)}
      className="relative h-full min-h-0 bg-[#020817] text-white overflow-hidden"
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelected(e, "file")}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelected(e, "image")}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(80,90,255,0.12),transparent_38%),linear-gradient(135deg,rgba(20,60,120,0.18),transparent_35%),linear-gradient(315deg,rgba(120,60,255,0.14),transparent_35%)]" />

      {notice && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 px-5 py-3 text-sm shadow-2xl shadow-purple-950/20">
          {notice}
        </div>
      )}

      <OutputPreviewModal
        isOpen={outputModal.isOpen}
        title={outputModal.title}
        outputs={outputModal.outputs}
        onClose={closeOutputModal}
      />

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
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="px-5 py-3 rounded-2xl bg-[#07101F] border border-[#1B2540] text-sm text-gray-200 hover:bg-[#101827]"
              >
                Share
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport();
                }}
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

                      {message.attachment && (
                        <div className="mt-4 rounded-2xl bg-[#07101F] border border-purple-500/30 p-4">
                          <p className="text-sm font-semibold text-purple-200">
                            {getAttachmentIcon(message.attachment.kind)}{" "}
                            {message.attachment.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {message.attachment.sizeLabel} •{" "}
                            {message.attachment.type}
                            {message.attachment.durationLabel
                              ? ` • ${message.attachment.durationLabel}`
                              : ""}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl w-fit rounded-3xl rounded-tl-md bg-[#07101F]/95 border border-[#1B2540] p-6 shadow-xl shadow-purple-950/10">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        ✦
                      </div>

                      <div className="min-w-0">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <p className="text-sm font-semibold text-purple-300">
                              OrbitalAI
                            </p>

                            {message.isLoading && (
                              <span className="flex gap-1 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce [animation-delay:120ms]" />
                                <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce [animation-delay:240ms]" />
                              </span>
                            )}
                          </div>

                          <p className="text-[15px] leading-7 text-gray-100 whitespace-pre-wrap font-normal">
                            {message.text}
                          </p>
                        </div>

                        {message.tasks &&
  message.tasks.length > 0 &&
  !(
    message.tasks.length === 1 &&
    message.tasks[0].task === "General Answer"
  ) && (
    <p className="text-gray-400 mt-4">
      The request was routed across the best-fit AI roles.
    </p>
  )}
                      </div>
                    </div>

{message.tasks &&
  message.tasks.length > 0 &&
  !(
    message.tasks.length === 1 &&
    message.tasks[0].task === "General Answer"
  ) && (
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

                    {message.outputs &&
                      message.outputs.length > 0 &&
                      !(
                        message.outputs.length === 1 &&
                        message.outputs[0][1] === "Answer"
                      ) && (
                        <>
                          <h2 className="text-2xl font-bold mb-5">
                            Generated Outputs
                          </h2>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {message.outputs.map((output, outputIndex) => (
                              <button
                                key={outputIndex}
                                onClick={() => openSingleOutput(output)}
                                className="text-left bg-[#101827] border border-[#1B2540] rounded-2xl p-5 hover:border-purple-500/60 hover:bg-[#141f33] transition"
                              >
                                <h3 className="font-bold text-lg mb-2">
                                  {output[0]} {output[1]}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {output[2]}
                                </p>
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => openAllOutputs(message.outputs)}
                            className="mt-7 text-purple-300 font-semibold hover:text-purple-200"
                          >
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
            <div className="relative">
              {actionMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 bottom-[92px] w-72 rounded-3xl bg-[#08111F]/95 border border-[#1B2540] shadow-2xl shadow-black/40 backdrop-blur-xl p-3 z-[9999]"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-300/80 px-3 pt-1 pb-3">
                    Quick Actions
                  </p>

                  <div className="space-y-1">
                    <button
                      onClick={handleAttachFile}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-gray-100 hover:bg-[#101827] transition"
                    >
                      <span className="text-xl">📎</span>
                      <div>
                        <p className="text-sm font-medium">Attach File</p>
                        <p className="text-xs text-gray-400">
                          Add a document or file
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={handleUploadImage}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-gray-100 hover:bg-[#101827] transition"
                    >
                      <span className="text-xl">🖼️</span>
                      <div>
                        <p className="text-sm font-medium">Upload Image</p>
                        <p className="text-xs text-gray-400">
                          Add an image to your chat
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={handleClearInput}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-gray-100 hover:bg-[#101827] transition"
                    >
                      <span className="text-xl">🧹</span>
                      <div>
                        <p className="text-sm font-medium">Clear Input</p>
                        <p className="text-xs text-gray-400">
                          Remove current typed text
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {isRecording && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mb-3 rounded-3xl bg-red-500/10 border border-red-500/30 p-4 shadow-xl shadow-red-950/20"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
                      <div>
                        <p className="font-semibold text-red-200">
                          Recording voice note
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatDuration(voiceDuration)} • Click mic again to
                          stop
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={stopVoiceRecording}
                      className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 hover:bg-red-500/20"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {selectedAttachment && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mb-3 rounded-3xl bg-[#07101F]/95 border border-[#1B2540] p-4 shadow-xl shadow-purple-950/20"
                >
                  <div className="flex items-center gap-4">
                    {selectedAttachment.kind === "image" &&
                    attachmentPreviewUrl ? (
                      <img
                        src={attachmentPreviewUrl}
                        alt={selectedAttachment.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#1B2540]"
                      />
                    ) : selectedAttachment.kind === "voice" &&
                      attachmentPreviewUrl ? (
                      <div className="min-w-[170px]">
                        <div className="w-16 h-16 rounded-2xl bg-[#101827] border border-[#1B2540] flex items-center justify-center text-2xl mb-2">
                          🎙️
                        </div>
                        <audio
                          controls
                          src={attachmentPreviewUrl}
                          className="w-48 h-8"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-[#101827] border border-[#1B2540] flex items-center justify-center text-2xl">
                        📎
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {getAttachmentIcon(selectedAttachment.kind)}{" "}
                        {selectedAttachment.name}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedAttachment.sizeLabel} •{" "}
                        {selectedAttachment.type}
                        {selectedAttachment.durationLabel
                          ? ` • ${selectedAttachment.durationLabel}`
                          : ""}
                      </p>
                    </div>

                    <button
                      onClick={removeAttachment}
                      className="w-10 h-10 rounded-xl bg-[#101827] border border-[#1B2540] text-gray-300 hover:text-white hover:bg-[#141f33]"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#07101F]/95 border border-[#1B2540] shadow-2xl shadow-purple-950/30 rounded-3xl p-4 flex items-center gap-4 backdrop-blur-xl"
              >
                <button
                  onClick={() => setActionMenuOpen(!actionMenuOpen)}
                  disabled={isGenerating || isRecording}
                  className={`w-14 h-14 rounded-2xl border text-3xl text-white transition ${
                    isGenerating || isRecording
                      ? "bg-[#101827] border-[#1B2540] opacity-50 cursor-not-allowed"
                      : actionMenuOpen
                      ? "bg-[#16213A] border-purple-500/60 shadow-lg shadow-purple-900/20"
                      : "bg-[#101827] border-[#1B2540] hover:bg-[#141f33]"
                  }`}
                >
                  +
                </button>

                <button
                  onClick={handleVoiceInput}
                  disabled={isGenerating}
                  className={`w-14 h-14 rounded-2xl border text-2xl transition ${
                    isRecording
                      ? "bg-red-500/10 border-red-500/40 text-red-200 hover:bg-red-500/20"
                      : isGenerating
                      ? "bg-[#101827] border-[#1B2540] opacity-50 cursor-not-allowed"
                      : "bg-[#101827] border-[#1B2540] hover:bg-[#141f33]"
                  }`}
                >
                  {isRecording ? "■" : "🎤"}
                </button>

                <input
                  type="text"
                  value={input}
                  placeholder={
                    isRecording
                      ? "Recording voice note..."
                      : isGenerating
                      ? "OrbitalAI is working..."
                      : selectedAttachment
                      ? "Add a message for this attachment..."
                      : "Ask OrbitalAI anything..."
                  }
                  disabled={isGenerating || isRecording}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-lg text-gray-200 placeholder:text-gray-500 disabled:opacity-60"
                />

                <button
                  onClick={sendMessage}
                  disabled={isGenerating || isRecording}
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl shadow-lg shadow-purple-700/30 transition ${
                    isGenerating || isRecording
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-[1.03]"
                  }`}
                >
                  {isGenerating ? "…" : "➤"}
                </button>
              </div>
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