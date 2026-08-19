import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutputPreviewModal from "../components/OutputPreviewModal";
import GeneratedImageContent from "../components/GeneratedImageContent";
import MarkdownContent from "../components/MarkdownContent";
import orbitalLogo from "../assets/orbital-logo.png";
import {
  getChatAttachmentUrl,
  uploadChatAttachment,
} from "../services/attachmentService";
import { apiFetch, getApiErrorMessage } from "../services/apiClient";
import { analyzeTask, getOutputs } from "../utils/taskRouting";

const MAX_INLINE_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_READABLE_FILE_BYTES = 3 * 1024 * 1024;
const MOBILE_AUDIO_FORMATS = [
  { mimeType: "audio/webm;codecs=opus", extension: "webm" },
  { mimeType: "audio/mp4", extension: "mp4" },
  { mimeType: "audio/webm", extension: "webm" },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
];
const SUPPORTED_DOCUMENT_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".odt",
  ".odp",
  ".ods",
  ".epub",
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".tsv",
  ".json",
  ".xml",
  ".html",
  ".htm",
  ".rtf",
  ".log",
  ".yaml",
  ".yml",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".css",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".sql",
]);
const SUPPORTED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "application/xml",
  "application/rtf",
  "application/epub+zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.spreadsheet",
]);
const LEGACY_OFFICE_EXTENSIONS = new Set([".doc", ".ppt", ".xls"]);
const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const getChatDraftKey = (userId, chatName) =>
  userId && chatName
    ? `orbitalai:draft:${userId}:${encodeURIComponent(chatName)}`
    : "";

const createClientId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

const OpenAIIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path
      d="M12 3.25a4.15 4.15 0 0 1 3.9 2.72 4.15 4.15 0 0 1 4.48 5.72 4.15 4.15 0 0 1-2.06 6.96A4.15 4.15 0 0 1 12 22.28a4.15 4.15 0 0 1-6.32-3.63 4.15 4.15 0 0 1-2.06-6.96A4.15 4.15 0 0 1 8.1 5.97 4.15 4.15 0 0 1 12 3.25Z"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinejoin="round"
    />
    <path
      d="m8.2 6.05 7.55 4.35v7.2M15.8 6.05 8.25 10.4v7.2M4.45 11.7 12 16.05l7.55-4.35M8.25 17.6 12 19.75l3.75-2.15M12 3.25v4.4"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ClaudeIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path
      d="M12 2.75v18.5M4 7.38l16 9.24M4 16.62l16-9.24M6.35 3.95l11.3 16.1M17.65 3.95 6.35 20.05"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const GeminiIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path
      d="M12 2.5c.7 5.65 3.85 8.8 9.5 9.5-5.65.7-8.8 3.85-9.5 9.5-.7-5.65-3.85-8.8-9.5-9.5 5.65-.7 8.8-3.85 9.5-9.5Z"
      fill="currentColor"
    />
  </svg>
);

const ProviderBadge = ({ provider, fallbackFrom = "" }) => {
  if (!provider) return null;

  const providerKey = String(provider).toLowerCase();
  const isOrbitalImage = providerKey === "orbital-image";
  const isOpenAI = providerKey.includes("openai") || providerKey.includes("gpt");
  const isClaude = providerKey.includes("claude") || providerKey.includes("anthropic");
  const isGemini = providerKey.includes("gemini") || providerKey.includes("google");
  const providerLabel = isOrbitalImage
    ? "OrbitalAI Image"
    : isOpenAI
      ? "OpenAI"
      : isClaude
        ? "Claude"
        : isGemini
          ? "Gemini"
          : provider;
  const colorClasses = isOrbitalImage
    ? "border-violet-300/30 bg-violet-400/[0.1] text-violet-200 shadow-[0_0_20px_rgba(139,92,246,0.08)]"
    : isOpenAI
      ? "border-emerald-300/30 bg-emerald-400/[0.1] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
    : isClaude
      ? "border-orange-300/30 bg-orange-400/[0.1] text-orange-200"
      : isGemini
        ? "border-blue-300/30 bg-blue-400/[0.1] text-blue-200"
        : "border-violet-300/30 bg-violet-400/[0.1] text-violet-200";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] sm:text-[10px] ${colorClasses}`}
    >
      {isOrbitalImage ? (
        <span aria-hidden="true" className="text-[12px] leading-none">✦</span>
      ) : isOpenAI ? (
        <OpenAIIcon className="h-3.5 w-3.5" />
      ) : isGemini ? (
        <GeminiIcon className="h-3.5 w-3.5" />
      ) : isClaude ? (
        <ClaudeIcon className="h-3.5 w-3.5" />
      ) : null}
      <span className="leading-none">
        {providerLabel}
        {fallbackFrom ? " fallback" : ""}
      </span>
    </span>
  );
};

const base64ToFile = ({ data, mimeType, name }) => {
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], name, { type: mimeType });
};

function Chat({
  user,
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
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [requestStage, setRequestStage] = useState("Selecting the best AI");
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribingVoice, setIsTranscribingVoice] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [editingRequestId, setEditingRequestId] = useState("");
  const [editingMessageText, setEditingMessageText] = useState("");

  const [outputModal, setOutputModal] = useState({
    isOpen: false,
    title: "",
    outputs: [],
  });

  const mainScrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);
  const voiceStartTimeRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const selectedAttachmentFileRef = useRef(null);
  const activeGenerationRef = useRef(null);
  const isRestoringDraftRef = useRef(false);

  const messages = useMemo(
    () => (selectedChat ? chatMessages[selectedChat] || [] : []),
    [selectedChat, chatMessages]
  );

  const clearDraft = (chatName) => {
    const key = getChatDraftKey(user?.uid, chatName);
    if (key) window.localStorage.removeItem(key);
  };

  useEffect(() => {
    let cancelled = false;
    isRestoringDraftRef.current = true;
    const key = getChatDraftKey(user?.uid, selectedChat);
    const savedDraft = key ? window.localStorage.getItem(key) || "" : "";

    queueMicrotask(() => {
      if (!cancelled) setInput(savedDraft);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedChat, user?.uid]);

  useEffect(() => {
    if (isRestoringDraftRef.current) {
      isRestoringDraftRef.current = false;
      return;
    }

    const key = getChatDraftKey(user?.uid, selectedChat);
    if (!key) return;

    if (input) {
      window.localStorage.setItem(key, input);
    } else {
      window.localStorage.removeItem(key);
    }
  }, [input, selectedChat, user?.uid]);

  useEffect(() => {
    const scrollElement = mainScrollRef.current;
    if (!scrollElement) return;

    const scrollToBottom = () => {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth",
      });
    };

    requestAnimationFrame(() => {
      scrollToBottom();

      setTimeout(() => {
        scrollToBottom();
      }, 150);
    });
  }, [messages, isGenerating]);

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

      activeGenerationRef.current?.controller.abort();
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

  const openStoredAttachment = async (attachment, pageNumber = null) => {
    if (attachment?.storageStatus === "saving") {
      showNotice(
        "This attachment is still being saved. Open it after the AI response finishes."
      );
      return;
    }

    if (attachment?.storageStatus === "failed") {
      showNotice(
        "This attachment could not be saved to storage. Attach the original file again."
      );
      return;
    }

    if (!attachment?.path && !attachment?.url) {
      showNotice("This older attachment was not saved to storage.");
      return;
    }

    try {
      const url = attachment.path
        ? await getChatAttachmentUrl(attachment.path)
        : attachment.url;
      const link = document.createElement("a");
      link.href = pageNumber ? `${url}#page=${pageNumber}` : url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Attachment open error:", error);
      showNotice("Could not open this attachment.");
    }
  };

  const formatMarkdownForMessaging = (value) => {
    const lines = String(value || "").replace(/\r\n/g, "\n").split("\n");
    const formattedLines = [];
    let inCodeBlock = false;

    const parseTableRow = (line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());

    const isTableDivider = (line) => {
      const cells = parseTableRow(line);
      return (
        cells.length > 0 &&
        cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))
      );
    };

    for (let index = 0; index < lines.length; index += 1) {
      const originalLine = lines[index];
      const trimmedLine = originalLine.trim();

      if (trimmedLine.startsWith("```")) {
        inCodeBlock = !inCodeBlock;
        formattedLines.push("```");
        continue;
      }

      if (inCodeBlock) {
        formattedLines.push(originalLine);
        continue;
      }

      const nextLine = lines[index + 1] || "";
      const isTableStart =
        trimmedLine.includes("|") && isTableDivider(nextLine);

      if (isTableStart) {
        const headers = parseTableRow(originalLine);
        index += 2;

        while (index < lines.length && lines[index].trim().includes("|")) {
          const cells = parseTableRow(lines[index]);
          const rowTitle = cells[0] || `Item ${index}`;

          formattedLines.push(`*${rowTitle}*`);
          headers.slice(1).forEach((header, headerIndex) => {
            const cellValue = cells[headerIndex + 1];
            if (header && cellValue) {
              formattedLines.push(`• *${header}:* ${cellValue}`);
            }
          });
          formattedLines.push("");
          index += 1;
        }

        index -= 1;
        continue;
      }

      let formattedLine = originalLine
        .replace(/^\s{0,3}#{1,6}\s+(.+)$/, "*$1*")
        .replace(/^\s*[-+*·]\s+/, "• ")
        .replace(/^\s*>\s?/, "› ")
        .replace(/\*\*(.+?)\*\*/g, "*$1*")
        .replace(/__(.+?)__/g, "*$1*")
        .replace(/\[([^\]]+)]\((https?:\/\/[^)]+)\)/g, "$1 ($2)");

      if (/^\s*([-*_])\1{2,}\s*$/.test(formattedLine)) {
        formattedLine = "────────────";
      }

      formattedLines.push(formattedLine.replace(/\s+$/, ""));
    }

    return formattedLines
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const formatResponseForClipboard = (message) => {
    const sections = [];
    const reply = formatMarkdownForMessaging(message?.text);

    if (reply) sections.push(reply);

    const generatedOutputs = Array.isArray(message?.outputs)
      ? message.outputs
      : [];

    generatedOutputs.forEach((output) => {
      if (!Array.isArray(output)) return;

      const title = [output[0], output[1]]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .join(" ");
      const description = String(output[2] || "").trim();
      const rawContent = output[3];
      let content = "";

      if (typeof rawContent === "string") {
        content = formatMarkdownForMessaging(rawContent);
      } else if (rawContent?.kind === "generated-image") {
        content = String(
          rawContent.revisedPrompt ||
            rawContent.prompt ||
            rawContent.alt ||
            "Generated image"
        ).trim();
      }

      const outputParts = [];
      if (title) outputParts.push(`*${title}*`);
      if (description) outputParts.push(`_${description}_`);
      if (content && content !== reply) outputParts.push(content);

      if (outputParts.length > 0) {
        sections.push(outputParts.join("\n\n"));
      }
    });

    return sections.join("\n\n────────────\n\n");
  };

  const copyMessageResponse = async (message) => {
    try {
      const responseText = formatResponseForClipboard(message);
      await navigator.clipboard.writeText(responseText);
      showNotice("Complete response copied.");
    } catch {
      showNotice("Could not copy this response.");
    }
  };

  const beginEditingMessage = (message) => {
    if (!message?.requestId) {
      showNotice("This older prompt cannot be edited.");
      return;
    }

    setEditingRequestId(message.requestId);
    setEditingMessageText(String(message.text || ""));
  };

  const cancelEditingMessage = () => {
    setEditingRequestId("");
    setEditingMessageText("");
  };

  const setMessageFeedback = (requestId, feedback) => {
    setChatMessages((current) => ({
      ...current,
      [selectedChat]: (current[selectedChat] || []).map((message) =>
        message.role === "ai" && message.requestId === requestId
          ? {
              ...message,
              feedback: message.feedback === feedback ? "" : feedback,
            }
          : message
      ),
    }));
  };

  const getMessageCitations = (message) => {
    const citations = [];
    const pattern = /\[Source:\s*([^\]]+?)\]/gi;
    const text = String(message?.text || "");
    let match;

    while ((match = pattern.exec(text))) {
      const rawLabel = match[1].trim();
      const pageMatch = rawLabel.match(/,\s*page\s+(\d+)\s*$/i);
      const pageNumber = pageMatch ? Number(pageMatch[1]) : null;
      const filename = pageMatch
        ? rawLabel.slice(0, pageMatch.index).trim()
        : rawLabel;
      const key = `${filename}:${pageNumber || "file"}`;

      if (!citations.some((citation) => citation.key === key)) {
        citations.push({ key, filename, pageNumber });
      }
    }

    return citations;
  };

  const loadStoredAttachmentFile = async (attachment) => {
    if (!attachment?.path && !attachment?.url) {
      throw new Error(
        "The original attachment was not saved, so this request cannot be retried with the file."
      );
    }

    const url = attachment.path
      ? await getChatAttachmentUrl(attachment.path)
      : attachment.url;
    const fileResponse = await fetch(url);

    if (!fileResponse.ok) {
      throw new Error(
        "The saved attachment could not be loaded. Open the file and attach it again."
      );
    }

    const blob = await fileResponse.blob();
    return new File([blob], attachment.name || "attachment", {
      type:
        attachment.type ||
        blob.type ||
        "application/octet-stream",
    });
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

  const saveGeneratedImages = async (result, chatName) => {
    const generatedImages = Array.isArray(result?.generatedImages)
      ? result.generatedImages
      : [];

    if (generatedImages.length === 0 || !user?.uid) return result;

    try {
      const savedImages = await Promise.all(
        generatedImages.map(async (image, index) => {
          const mimeType = image.mimeType || "image/png";
          const extension = mimeType === "image/jpeg" ? "jpg" : "png";
        const filename = `orbitalai-openai-${Date.now()}-${
            index + 1
          }.${extension}`;
          const file = base64ToFile({
            data: image.data,
            mimeType,
            name: filename,
          });
          const uploaded = await uploadChatAttachment({
            userId: user.uid,
            chatName,
            file,
            filename,
          });

          return {
            kind: "generated-image",
            ...uploaded,
            storageStatus: "saved",
            sizeLabel: formatFileSize(uploaded.size),
          };
        })
      );

      return {
        ...result,
        generatedImages: [],
        outputs: (result.outputs || []).map((output) =>
          output[1] === "Generated Image"
            ? [...output.slice(0, 3), savedImages[0]]
            : output
        ),
      };
    } catch (error) {
      console.error("Generated image storage error:", error);
      return {
        ...result,
        generatedImages: [],
        outputs: [],
        failed: true,
        errorMessage:
          "OpenAI created the image, but OrbitalAI could not save it. Please try again.",
        reply:
          "OpenAI created the image, but OrbitalAI could not save it. Please try again.",
      };
    }
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

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result || "";
        const base64 = String(result).split(",")[1] || "";
        resolve(base64);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribeVoiceToDraft = async ({
    audioBlob,
    filename,
    mimeType,
  }) => {
    setIsTranscribingVoice(true);
    showNotice("Transcribing voice note...");

    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const response = await apiFetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioBase64,
          filename,
          mimeType,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(data, "Voice transcription failed.")
        );
      }

      const transcript = String(data.text || "").trim();
      if (!transcript) {
        throw new Error("No speech was detected in that recording.");
      }

      setInput((current) =>
        [current.trim(), transcript].filter(Boolean).join(" ")
      );
      showNotice("Voice note transcribed. Review it, then send.");
    } catch (error) {
      showNotice(
        String(error?.message || "").trim() ||
          "OrbitalAI could not transcribe that voice note."
      );
    } finally {
      setIsTranscribingVoice(false);
    }
  };
  
  const getReadableFileText = async ({
    attachment,
    attachmentFile,
    signal,
  }) => {
    if (!attachmentFile || attachment?.kind !== "file") {
      return "";
    }

    const fileBase64 = await blobToBase64(attachmentFile);

    const fileResponse = await apiFetch("/api/read-file", {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileBase64,
        filename: attachment.name,
        mimeType: attachment.type,
      }),
    });

    const fileData = await fileResponse.json();

    if (!fileResponse.ok) {
      throw new Error(getApiErrorMessage(fileData, "Failed to read file."));
    }

    if (fileData.wasTruncated) {
      showNotice(
        "This document is long. OrbitalAI will use the first 45,000 characters."
      );
    }

    return fileData.text || "";
  };

  const getRealAiReply = async ({
    message,
    tasks,
    outputs,
    attachment,
    attachmentFile,
    existingFileText = "",
    existingFileName = "",
    previousFileText,
    previousFileName,
    conversationHistory,
    onStage = () => {},
    signal,
  }) => {
    let newFileText = "";
    let transcriptText = "";

    try {
      if (attachment?.kind === "voice" && attachmentFile) {
        onStage("Transcribing voice note");
        const audioBase64 = await blobToBase64(attachmentFile);

        const transcriptionResponse = await apiFetch("/api/transcribe", {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audioBase64,
            filename: attachment.name,
            mimeType: attachment.type,
          }),
        });

        const transcriptionData = await transcriptionResponse.json();

        if (!transcriptionResponse.ok) {
          throw new Error(
            transcriptionData.error || "Failed to transcribe audio."
          );
        }

        transcriptText = String(transcriptionData.text || "").trim();

        if (!transcriptText) {
          throw new Error("No transcript was returned.");
        }

        const answerTasks = analyzeTask(transcriptText);
        const answerOutputs = getOutputs(answerTasks);

        onStage(
          `Generating response with ${answerTasks[0]?.ai || "OpenAI"}`
        );

        const response = await apiFetch("/api/chat", {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: transcriptText,
            tasks: answerTasks,
            outputs: answerOutputs,
            attachment,
            conversationHistory,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              "Failed to answer the transcribed voice note."
            )
          );
        }

        const generatedOutputs = Array.isArray(data.generatedOutputs)
          ? data.generatedOutputs
          : [];

        const answerOutputsWithContent = answerOutputs
          .filter(
            (output) =>
              output[1] !== "Answer" && output[1] !== "Transcript"
          )
          .map((output) => {
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
          })
          .filter((output) => String(output[3] || "").trim());

        const voiceTasks = [
          { task: "Voice Input", ai: "OpenAI" },
          ...answerTasks.filter((item) => item.task !== "Voice Input"),
        ];

        return {
          reply:
            data.reply ||
            "OrbitalAI transcribed the voice note, but no answer was returned.",
          outputs: [
            ["🎙️", "Transcript", "Voice to text", transcriptText],
            ...answerOutputsWithContent,
          ],
          tasks: voiceTasks,
          transcriptText,
          provider: data.provider,
          fallbackFrom: data.fallbackFrom || "",
          providerNotice: data.providerNotice || "",
        };
      }

      if (attachment?.kind === "file") {
        onStage(`Reading ${attachment.name || "document"}`);
      } else if (attachment?.kind === "image") {
        onStage("Preparing image for Gemini");
      } else {
        onStage("Selecting the best AI");
      }

      newFileText =
        existingFileText ||
        (await getReadableFileText({
          attachment,
          attachmentFile,
          signal,
        }));
      const fileText = newFileText || (!attachment ? previousFileText : "");
      const fileName = newFileText
        ? existingFileName || attachment?.name || ""
        : !attachment && previousFileText
        ? previousFileName || ""
        : "";
      const imageBase64 =
        attachment?.kind === "image" && attachmentFile
          ? await blobToBase64(attachmentFile)
          : "";

      onStage(`Generating response with ${tasks[0]?.ai || "OpenAI"}`);

      const response = await apiFetch("/api/chat", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          tasks,
          outputs,
          attachment,
          fileText,
          fileName,
          conversationHistory,
          imageBase64,
          imageMimeType: imageBase64 ? attachment.type : "",
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

      const outputsWithContent = outputs
        .map((output) => {
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
        })
        .filter((output) => String(output[3] || "").trim());

      return {
        reply:
          data.reply ||
          "OrbitalAI generated a response, but no text was returned.",
        outputs: outputsWithContent,
        fileText: newFileText,
        provider: data.provider,
        fallbackFrom: data.fallbackFrom || "",
        providerNotice: data.providerNotice || "",
        generatedImages: Array.isArray(data.generatedImages)
          ? data.generatedImages
          : [],
      };
    } catch (error) {
      if (error?.name === "AbortError" || signal?.aborted) {
        return {
          reply: "Response generation stopped.",
          outputs: [],
          fileText: newFileText,
          transcriptText,
          aborted: true,
        };
      }

      console.error("AI response error:", error);
      const errorMessage =
        String(error?.message || "").trim() ||
        "The request could not be completed. Please try again.";
      showNotice(errorMessage);

      return {
        reply: `OrbitalAI could not complete this request: ${errorMessage}`,
        outputs: [],
        fileText: newFileText,
        transcriptText,
        failed: true,
        errorMessage,
      };
    }
  };

  const selectAttachmentFile = (file, kind = "") => {
    if (!file) return false;

    const isImage = kind === "image" || file.type.startsWith("image/");
    const lowerName = String(file.name || "").toLowerCase();
    const extension = lowerName.match(/\.[^.]+$/)?.[0] || "";
    const isSupportedDocument =
      file.type.startsWith("text/") ||
      SUPPORTED_DOCUMENT_MIME_TYPES.has(file.type) ||
      SUPPORTED_DOCUMENT_EXTENSIONS.has(extension);

    if (isImage && file.size > MAX_INLINE_IMAGE_BYTES) {
      showNotice("Choose an image smaller than 3 MB for Gemini analysis.");
      return false;
    }

    if (!isImage && file.size > MAX_READABLE_FILE_BYTES) {
      showNotice("Choose a document smaller than 3 MB for AI analysis.");
      return false;
    }

    if (!isImage && LEGACY_OFFICE_EXTENSIONS.has(extension)) {
      showNotice(
        "Convert this legacy Office file to DOCX, PPTX, or XLSX before uploading."
      );
      return false;
    }

    if (!isImage && !isSupportedDocument) {
      showNotice(
        "This format cannot be read yet. Try PDF, DOCX, PPTX, XLSX, EPUB, OpenDocument, or a text file."
      );
      return false;
    }

    selectedAttachmentFileRef.current = file;

    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }

    const attachment = {
      id: createClientId("attachment"),
      name:
        file.name ||
        createClientId(isImage ? "pasted-image" : "pasted-file"),
      type: file.type || "Unknown type",
      size: file.size,
      sizeLabel: formatFileSize(file.size),
      kind: isImage ? "image" : "file",
      createdAt: new Date().toISOString(),
    };

    setSelectedAttachment(attachment);
    setAttachmentPreviewUrl(isImage ? URL.createObjectURL(file) : "");
    showNotice(isImage ? "Image selected." : "File attached.");

    return true;
  };

  const handleFileSelected = (event, kind) => {
    const file = event.target.files?.[0];
    setActionMenuOpen(false);
    selectAttachmentFile(file, kind);
    event.target.value = "";
  };

  const handleAttachmentPaste = (event) => {
    const clipboardFiles = Array.from(event.clipboardData?.files || []);
    const clipboardItemFile = Array.from(
      event.clipboardData?.items || []
    ).find((item) => item.kind === "file")?.getAsFile();
    const pastedFile = clipboardFiles[0] || clipboardItemFile;

    if (!pastedFile) {
      const pastedText = event.clipboardData?.getData("text/plain")?.trim();

      if (
        /\.(pdf|docx?|pptx?|xlsx?|odt|odp|ods|epub|txt|md|csv|json|rtf)$/i.test(
          pastedText || ""
        )
      ) {
        event.preventDefault();
        showNotice(
          "The browser received only the filename. Drag the document onto the message box instead."
        );
      }

      return;
    }

    event.preventDefault();

    if (isGenerating || isRecording) {
      showNotice("Wait for the current action to finish before pasting a file.");
      return;
    }

    setActionMenuOpen(false);
    selectAttachmentFile(pastedFile);
  };

  const handleAttachmentDragOver = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDraggingAttachment(true);
  };

  const handleAttachmentDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDraggingAttachment(false);
  };

  const handleAttachmentDrop = (event) => {
    event.preventDefault();
    setIsDraggingAttachment(false);

    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    if (isGenerating || isRecording || isTranscribingVoice) {
      showNotice("Wait for the current action to finish before adding a file.");
      return;
    }

    setActionMenuOpen(false);
    selectAttachmentFile(file);
  };

  const startVoiceRecording = async () => {
    if (isGenerating || isTranscribingVoice) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showNotice("Voice recording is not supported in this browser.");
      return;
    }

    if (!window.MediaRecorder) {
      showNotice("Media recording is not supported in this browser.");
      return;
    }

    try {
      showNotice("Requesting microphone access...");

      setActionMenuOpen(false);
      setVoiceDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      voiceStreamRef.current = stream;
      audioChunksRef.current = [];

      const supportedAudioFormat =
        typeof MediaRecorder.isTypeSupported === "function"
          ? MOBILE_AUDIO_FORMATS.find(({ mimeType }) =>
              MediaRecorder.isTypeSupported(mimeType)
            )
          : null;
      const recorder = supportedAudioFormat
        ? new MediaRecorder(stream, {
            mimeType: supportedAudioFormat.mimeType,
          })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      voiceStartTimeRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        setIsRecording(false);

        if (voiceTimerRef.current) {
          clearInterval(voiceTimerRef.current);
          voiceTimerRef.current = null;
        }

        const recordedMimeType =
          recorder.mimeType ||
          audioChunksRef.current[0]?.type ||
          supportedAudioFormat?.mimeType ||
          "audio/webm";
        const normalizedMimeType = recordedMimeType.split(";")[0];
        const extension =
          MOBILE_AUDIO_FORMATS.find(({ mimeType }) =>
            mimeType.startsWith(normalizedMimeType)
          )?.extension || "webm";
        const audioBlob = new Blob(audioChunksRef.current, {
          type: normalizedMimeType,
        });

        if (audioBlob.size === 0) {
          showNotice(
            "No audio was recorded. Check microphone permission and try again."
          );

          if (voiceStreamRef.current) {
            voiceStreamRef.current
              .getTracks()
              .forEach((track) => track.stop());
            voiceStreamRef.current = null;
          }

          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
          voiceStartTimeRef.current = null;
          return;
        }

        if (voiceStreamRef.current) {
          voiceStreamRef.current.getTracks().forEach((track) => track.stop());
          voiceStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        voiceStartTimeRef.current = null;

        transcribeVoiceToDraft({
          audioBlob,
          filename: `voice-note-${Date.now()}.${extension}`,
          mimeType: normalizedMimeType,
        });
      };

      recorder.onerror = () => {
        setIsRecording(false);
        showNotice("Voice recording stopped because the browser reported an error.");

        if (voiceTimerRef.current) {
          clearInterval(voiceTimerRef.current);
          voiceTimerRef.current = null;
        }

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
      if (voiceStreamRef.current) {
        voiceStreamRef.current.getTracks().forEach((track) => track.stop());
        voiceStreamRef.current = null;
      }

      if (error?.name === "NotAllowedError") {
        showNotice(
          "Microphone access is blocked. Allow it in your browser settings and try again."
        );
      } else if (error?.name === "NotFoundError") {
        showNotice("No microphone was found on this device.");
      } else {
        showNotice(
          "Voice recording could not start in this browser. Try Safari or Chrome with microphone access enabled."
        );
      }
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
    selectedAttachmentFileRef.current = null;
    showNotice("Attachment removed.");
  };

  const handleClearInput = () => {
    if (isRecording || isTranscribingVoice) {
      showNotice(
        isRecording
          ? "Stop recording first."
          : "Wait for the voice transcription to finish."
      );
      return;
    }

    setInput("");
    setActionMenuOpen(false);
    showNotice("Input cleared.");
  };

  const finishGeneration = (controller) => {
    if (activeGenerationRef.current?.controller === controller) {
      activeGenerationRef.current = null;
      setIsGenerating(false);
      setRequestStage("Selecting the best AI");
    }
  };

  const stopGeneration = () => {
    const activeRequest = activeGenerationRef.current;
    if (!activeRequest) return;

    activeRequest.controller.abort();

    if (activeRequest.chatName) {
      setChatMessages((current) => ({
        ...current,
        [activeRequest.chatName]: (
          current[activeRequest.chatName] || []
        ).map((message) =>
          message.role === "ai" &&
          message.isLoading &&
          message.requestId === activeRequest.requestId
            ? {
                ...message,
                text: "Response generation stopped.",
                isLoading: false,
                stopped: true,
                outputs: [],
              }
            : message
        ),
      }));
    }

    activeGenerationRef.current = null;
    setIsGenerating(false);
    setRequestStage("Selecting the best AI");
    showNotice("Response generation stopped.");
  };

  const formatChatForExport = (format = "txt") => {
    const title = selectedChat || "Untitled Chat";
    const exportedAt = new Date().toLocaleString();
    const isMarkdown = format === "md";

    const formattedMessages = messages
      .map((message) => {
        const attachmentName = message.attachment?.name || "";
        const attachmentDetails = message.attachment
          ? [
              message.attachment.sizeLabel,
              message.attachment.type,
              message.attachment.durationLabel,
            ]
              .filter(Boolean)
              .join(" • ")
          : "";
        const attachmentText = message.attachment
          ? isMarkdown
            ? `\n\n**Attachment:** ${attachmentName}${
                attachmentDetails ? ` — ${attachmentDetails}` : ""
              }`
            : `\n\nAttachment:\n- ${attachmentName}${
                attachmentDetails ? ` (${attachmentDetails})` : ""
              }`
          : "";

        if (message.role === "user") {
          return isMarkdown
            ? `## You\n\n${message.text}${attachmentText}`
            : `You:\n${message.text}${attachmentText}`;
        }

        const providerName = message.provider
          ? `${message.provider}${message.fallbackFrom ? " fallback" : ""}`
          : "";
        const providerText = providerName
          ? isMarkdown
            ? `\n\n**Provider:** ${providerName}`
            : `\n\nProvider: ${providerName}`
          : "";
        const providerNoticeText = message.providerNotice
          ? isMarkdown
            ? `\n\n> ${message.providerNotice}`
            : `\n\nProvider notice: ${message.providerNotice}`
          : "";
        const taskText =
          message.tasks && message.tasks.length > 0
            ? isMarkdown
              ? `\n\n### Assigned AI roles\n\n${message.tasks
                  .map((item) => `- ${item.ai} → ${item.task}`)
                  .join("\n")}`
              : `\n\nAssigned AI Models:\n${message.tasks
                  .map((item) => `- ${item.ai} → ${item.task}`)
                  .join("\n")}`
            : "";
        const outputText =
          message.outputs && message.outputs.length > 0
            ? isMarkdown
              ? `\n\n### Generated outputs\n\n${message.outputs
                  .map((output) => {
                    const outputTitle = `${output[0]} ${output[1]}`.trim();
                    const outputDescription = output[2] || "";
                    const rawContent = String(output[3] || "").trim();
                    const isCodeOutput = String(output[1] || "")
                      .toLowerCase()
                      .includes("code");
                    const content = isCodeOutput
                      ? rawContent
                          .replace(/^```[\w-]*\s*/i, "")
                          .replace(/\s*```$/i, "")
                          .trim()
                      : rawContent;
                    const contentBlock = content
                      ? isCodeOutput
                        ? `\n\n\`\`\`\n${content}\n\`\`\``
                        : `\n\n${content}`
                      : "";

                    return `#### ${outputTitle}\n\n${outputDescription}${contentBlock}`;
                  })
                  .join("\n\n")}`
              : `\n\nGenerated Outputs:\n${message.outputs
                  .map((output) => {
                    const content = output[3] ? `\n${output[3]}` : "";
                    return `- ${output[0]} ${output[1]}: ${output[2]}${content}`;
                  })
                  .join("\n")}`
            : "";

        return isMarkdown
          ? `## OrbitalAI\n\n${message.text}${providerText}${providerNoticeText}${attachmentText}${taskText}${outputText}`
          : `OrbitalAI:\n${message.text}${providerText}${providerNoticeText}${attachmentText}${taskText}${outputText}`;
      })
      .join(
        isMarkdown
          ? "\n\n---\n\n"
          : "\n\n------------------------------\n\n"
      );

    return isMarkdown
      ? `# OrbitalAI Chat Export\n\n**Chat:** ${title}  \n**Exported:** ${exportedAt}\n\n---\n\n${formattedMessages}\n`
      : `OrbitalAI Chat Export\n\nChat: ${title}\nExported: ${exportedAt}\n\n==============================\n\n${formattedMessages}`;
  };

  const handleShare = async () => {
    if (!selectedChat) {
      showNotice("Create or open a chat first.");
      return;
    }

    const shareData = {
      title: `OrbitalAI — ${selectedChat}`,
      text: `Private OrbitalAI chat: ${selectedChat}. This link opens only for the signed-in workspace owner.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showNotice("Private chat link shared.");
        addActivity("share", "Private chat link shared", selectedChat);
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(
        `${shareData.title}\n${shareData.text}\n${shareData.url}`
      );
      showNotice(
        "Private chat link copied. It only opens for this workspace owner."
      );
      addActivity("share", "Private chat link copied", selectedChat);
    } catch {
      showNotice("Could not share or copy the private chat link.");
    }
  };

  const handleExport = (format) => {
    if (!selectedChat || messages.length === 0) {
      showNotice("No chat messages to export.");
      return;
    }

    const safeFormat = format === "md" ? "md" : "txt";
    const exportText = formatChatForExport(safeFormat);
    const mimeType =
      safeFormat === "md"
        ? "text/markdown;charset=utf-8"
        : "text/plain;charset=utf-8";
    const blob = new Blob([exportText], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const safeFileName = selectedChat
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName || "orbitalai-chat"}.${safeFormat}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setExportMenuOpen(false);
    showNotice(`Chat exported as ${safeFormat.toUpperCase()}.`);
    addActivity(
      "export",
      `Chat exported as ${safeFormat.toUpperCase()}`,
      selectedChat
    );
  };

  const sendMessage = async () => {
    const trimmedInput = input.trim();

    if (isRecording || isTranscribingVoice) {
      showNotice("Stop recording before sending.");
      return;
    }

    if ((!trimmedInput && !selectedAttachment) || isGenerating) return;

    setIsGenerating(true);
    setRequestStage(
      selectedAttachment?.kind === "voice"
        ? "Preparing voice note"
        : selectedAttachment?.kind === "file"
        ? `Preparing ${selectedAttachment.name || "document"}`
        : selectedAttachment?.kind === "image"
        ? "Preparing image for Gemini"
        : "Selecting the best AI"
    );
    setActionMenuOpen(false);

    const now = new Date().toISOString();

    const attachmentToSend = selectedAttachment;
    const attachmentFileToSend = selectedAttachmentFileRef.current;
    const latestDocumentMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          (message.attachment?.kind === "file" &&
            message.attachment?.extractedText) ||
          message.fileText
      );
    const previousFileText =
      latestDocumentMessage?.attachment?.extractedText ||
      latestDocumentMessage?.fileText ||
      "";
    const previousFileName =
      latestDocumentMessage?.attachment?.name ||
      latestDocumentMessage?.sourceFilename ||
      "";
    const conversationHistory = messages
      .filter((message) => !message.isLoading && message.text)
      .slice(-10)
      .map((message) => ({
        role: message.role === "ai" ? "assistant" : "user",
        content: String(message.transcriptText || message.text).slice(0, 6000),
      }));

    const attachmentText =
      attachmentToSend?.kind === "voice"
        ? "Voice note"
        : attachmentToSend
        ? `Attached ${attachmentToSend.kind}: ${attachmentToSend.name}`
        : "";

    const messageText = trimmedInput || attachmentText;

    const textForAnalysis = `${messageText} ${
      attachmentToSend?.name || ""
    } ${attachmentToSend?.kind || ""}`;

    const tasks = analyzeTask(textForAnalysis);
    const outputs = getOutputs(tasks);
    const requestId = createClientId("request");
    const requestController = new AbortController();
    activeGenerationRef.current = {
      controller: requestController,
      requestId,
      chatName: selectedChat || "",
    };

    const userMessage = {
      role: "user",
      text: messageText,
      attachment: attachmentToSend
        ? {
            ...attachmentToSend,
            storageStatus: attachmentFileToSend ? "saving" : "unavailable",
          }
        : null,
      requestId,
    };

    const loadingMessage = {
      role: "ai",
      text: "OrbitalAI is working on your request.",
      isLoading: true,
      loadingStage:
        attachmentToSend?.kind === "voice"
          ? "Preparing voice note"
          : attachmentToSend?.kind === "file"
          ? `Preparing ${attachmentToSend.name || "document"}`
          : attachmentToSend?.kind === "image"
          ? "Preparing image for Gemini"
          : "Selecting the best AI",
      requestId,
    };

    const createFinalUserMessage = (
      result,
      savedAttachment = attachmentToSend
    ) => {
      const attachmentWithContext = savedAttachment
        ? {
            ...savedAttachment,
            ...(result.fileText
              ? {
                  extractedText: result.fileText,
                  extractedAt: new Date().toISOString(),
                }
              : {}),
          }
        : null;

      return {
        ...userMessage,
        ...(attachmentWithContext
          ? { attachment: attachmentWithContext }
          : {}),
        ...(result.transcriptText
          ? { transcriptText: result.transcriptText }
          : {}),
      };
    };

    const createFinalAiMessage = (result, savedAttachment = null) => {
      const sourceAttachment =
        savedAttachment?.kind === "file"
          ? savedAttachment
          : !attachmentToSend && latestDocumentMessage?.attachment?.kind === "file"
          ? latestDocumentMessage.attachment
          : null;
      const finalMessage = {
        role: "ai",
        text: result.reply,
        tasks: result.tasks || tasks,
        outputs: Array.isArray(result.outputs) ? result.outputs : [],
        requestId,
        provider: result.provider || "",
        fallbackFrom: result.fallbackFrom || "",
        providerNotice: result.providerNotice || "",
        failed: Boolean(result.failed),
        errorMessage: result.errorMessage || "",
        ...(sourceAttachment ? { sourceAttachment } : {}),
      };

      if (result.failed) {
        finalMessage.retryTasks = tasks;
        finalMessage.retryOutputs = outputs;
      }

      return finalMessage;
    };

    const saveAttachment = async (chatName) => {
      if (!attachmentToSend || !attachmentFileToSend || !user?.uid) {
        return attachmentToSend;
      }

      try {
        const uploadedAttachment = await uploadChatAttachment({
          userId: user.uid,
          chatName,
          file: attachmentFileToSend,
          filename: attachmentToSend.name,
        });

        return {
          ...attachmentToSend,
          ...uploadedAttachment,
          storageStatus: "saved",
          sizeLabel:
            attachmentToSend.sizeLabel ||
            formatFileSize(uploadedAttachment.size),
        };
      } catch (error) {
        console.error("Chat attachment upload error:", error);
        showNotice(
          "The AI processed the attachment, but the original file could not be saved."
        );
        return {
          ...attachmentToSend,
          storageStatus: "failed",
        };
      }
    };

    clearDraft(selectedChat);
    setInput("");

    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }

    setSelectedAttachment(null);
    setAttachmentPreviewUrl("");
    selectedAttachmentFileRef.current = null;

    if (!selectedChat) {
      const newTitle = generateChatTitle(messageText);
      activeGenerationRef.current.chatName = newTitle;

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
      navigate(`/chat/${slugify(newTitle)}`, { replace: true });

      addActivity("chat", "Chat created", newTitle);

      const [rawResult, savedAttachment] = await Promise.all([
        getRealAiReply({
          message: messageText,
          tasks,
          outputs,
          attachment: attachmentToSend,
          attachmentFile: attachmentFileToSend,
          previousFileText,
          previousFileName,
          conversationHistory,
          onStage: setRequestStage,
          signal: requestController.signal,
        }),
        saveAttachment(newTitle),
      ]);
      if (requestController.signal.aborted || rawResult.aborted) return;
      const result = await saveGeneratedImages(rawResult, newTitle);
      if (requestController.signal.aborted) return;

      setChatMessages((prev) => ({
        ...prev,
        [newTitle]: [
          createFinalUserMessage(result, savedAttachment),
          createFinalAiMessage(result, savedAttachment),
        ],
      }));

      finishGeneration(requestController);
      return;
    }

    if (selectedChat.startsWith("New Chat") && messages.length === 0) {
      const newTitle = generateChatTitle(messageText);
      activeGenerationRef.current.chatName = newTitle;
      clearDraft(selectedChat);

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
      navigate(`/chat/${slugify(newTitle)}`, { replace: true });

      addActivity("chat", "Chat renamed automatically", newTitle);

      const [rawResult, savedAttachment] = await Promise.all([
        getRealAiReply({
          message: messageText,
          tasks,
          outputs,
          attachment: attachmentToSend,
          attachmentFile: attachmentFileToSend,
          previousFileText,
          previousFileName,
          conversationHistory,
          onStage: setRequestStage,
          signal: requestController.signal,
        }),
        saveAttachment(newTitle),
      ]);
      if (requestController.signal.aborted || rawResult.aborted) return;
      const result = await saveGeneratedImages(rawResult, newTitle);
      if (requestController.signal.aborted) return;

      setChatMessages((prev) => ({
        ...prev,
        [newTitle]: [
          createFinalUserMessage(result, savedAttachment),
          createFinalAiMessage(result, savedAttachment),
        ],
      }));

      finishGeneration(requestController);
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

    const [rawResult, savedAttachment] = await Promise.all([
      getRealAiReply({
        message: messageText,
        tasks,
        outputs,
        attachment: attachmentToSend,
        attachmentFile: attachmentFileToSend,
        previousFileText,
        previousFileName,
        conversationHistory,
        onStage: setRequestStage,
        signal: requestController.signal,
      }),
      saveAttachment(selectedChat),
    ]);
    if (requestController.signal.aborted || rawResult.aborted) return;
    const result = await saveGeneratedImages(rawResult, selectedChat);
    if (requestController.signal.aborted) return;

    setChatMessages((prev) => {
      const currentMessages = prev[selectedChat] || [];

      return {
        ...prev,
        [selectedChat]: currentMessages.map((message) => {
          if (message.requestId !== requestId) return message;

          if (message.role === "user") {
            return createFinalUserMessage(result, savedAttachment);
          }

          if (message.isLoading) {
            return createFinalAiMessage(result, savedAttachment);
          }

          return message;
        }),
      };
    });

    finishGeneration(requestController);
  };

  const retryFailedMessage = async (failedMessage, options = {}) => {
    if (isGenerating || !selectedChat || !failedMessage?.requestId) return;

    const originalUserMessage = messages.find(
      (message) =>
        message.role === "user" &&
        message.requestId === failedMessage.requestId
    );

    if (!originalUserMessage) {
      showNotice("The original request could not be found.");
      return;
    }

    const hasEditedText = typeof options.overrideText === "string";
    const requestText = hasEditedText
      ? options.overrideText.trim()
      : String(originalUserMessage.text || "").trim();
    const retryTasks = hasEditedText
      ? analyzeTask(
          `${requestText} ${originalUserMessage.attachment?.name || ""}`
        )
      : failedMessage.retryTasks ||
        analyzeTask(
          `${requestText} ${originalUserMessage.attachment?.name || ""}`
        );
    const retryOutputs = hasEditedText
      ? getOutputs(retryTasks)
      : failedMessage.retryOutputs || getOutputs(retryTasks);
    const attachment = originalUserMessage.attachment || null;
    const earlierMessages = messages.filter(
      (message) => message.requestId !== failedMessage.requestId
    );
    const previousDocumentMessage = [...earlierMessages]
      .reverse()
      .find(
        (message) =>
          (message.attachment?.kind === "file" &&
            message.attachment?.extractedText) ||
          message.fileText
      );
    const previousFileText =
      previousDocumentMessage?.attachment?.extractedText ||
      previousDocumentMessage?.fileText ||
      "";
    const previousFileName =
      previousDocumentMessage?.attachment?.name ||
      previousDocumentMessage?.sourceFilename ||
      "";
    const conversationHistory = earlierMessages
      .filter((message) => !message.isLoading && message.text)
      .slice(-10)
      .map((message) => ({
        role: message.role === "ai" ? "assistant" : "user",
        content: String(message.transcriptText || message.text).slice(0, 6000),
      }));
    const requestController = new AbortController();
    activeGenerationRef.current = {
      controller: requestController,
      requestId: failedMessage.requestId,
      chatName: selectedChat,
    };

    setIsGenerating(true);
    setRequestStage("Retrying request");
    setChatMessages((prev) => ({
      ...prev,
      [selectedChat]: (prev[selectedChat] || []).map((message) =>
        message.role === "ai" &&
        message.requestId === failedMessage.requestId
          ? {
              ...message,
              text: "OrbitalAI is retrying this request...",
              outputs: [],
              isLoading: true,
              loadingStage: "Retrying request",
              failed: false,
            }
          : message
      ),
    }));

    let result;

    try {
      let attachmentFile = null;
      const existingFileText =
        attachment?.kind === "file"
          ? attachment.extractedText || ""
          : "";

      if (
        attachment &&
        (attachment.kind !== "file" || !existingFileText)
      ) {
        attachmentFile = await loadStoredAttachmentFile(attachment);
      }

      result = await getRealAiReply({
        message: requestText,
        tasks: retryTasks,
        outputs: retryOutputs,
        attachment,
        attachmentFile,
        existingFileText,
        existingFileName: attachment?.name || "",
        previousFileText,
        previousFileName,
        conversationHistory,
        onStage: setRequestStage,
        signal: requestController.signal,
      });
      if (requestController.signal.aborted || result.aborted) return;
      result = await saveGeneratedImages(result, selectedChat);
      if (requestController.signal.aborted) return;
    } catch (error) {
      if (error?.name === "AbortError" || requestController.signal.aborted) {
        return;
      }

      const errorMessage =
        String(error?.message || "").trim() ||
        "The retry could not be completed.";

      result = {
        reply: `OrbitalAI could not complete this request: ${errorMessage}`,
        outputs: [],
        failed: true,
        errorMessage,
      };
      showNotice(errorMessage);
    }

    setChatMessages((prev) => ({
      ...prev,
      [selectedChat]: (prev[selectedChat] || []).map((message) => {
        if (message.requestId !== failedMessage.requestId) return message;

        if (message.role === "user") {
          return {
            ...message,
            text: requestText,
            ...(message.transcriptText
              ? { transcriptText: requestText }
              : {}),
            ...(result.fileText && message.attachment
              ? {
                  attachment: {
                    ...message.attachment,
                    extractedText: result.fileText,
                    extractedAt: new Date().toISOString(),
                  },
                }
              : {}),
            ...(result.transcriptText
              ? { transcriptText: result.transcriptText }
              : {}),
          };
        }

        if (message.role === "ai") {
          const sourceAttachment =
            attachment?.kind === "file"
              ? attachment
              : failedMessage.sourceAttachment ||
                previousDocumentMessage?.attachment ||
                null;
          return {
            role: "ai",
            text: result.reply,
            tasks: result.tasks || retryTasks,
            outputs: Array.isArray(result.outputs) ? result.outputs : [],
            requestId: failedMessage.requestId,
            provider: result.provider || "",
            fallbackFrom: result.fallbackFrom || "",
            providerNotice: result.providerNotice || "",
            failed: Boolean(result.failed),
            errorMessage: result.errorMessage || "",
            feedback: "",
            ...(sourceAttachment ? { sourceAttachment } : {}),
            ...(result.failed
              ? {
                  retryTasks,
                  retryOutputs,
                }
              : {}),
          };
        }

        return message;
      }),
    }));

    setChatActivity((prev) => ({
      ...prev,
      [selectedChat]: new Date().toISOString(),
    }));
    addActivity(
      "retry",
      result.failed ? "AI request retry failed" : "AI request retried",
      selectedChat
    );

    if (!result.failed) {
      showNotice("Request completed successfully.");
    }

    finishGeneration(requestController);
  };

  const finishEditingMessage = async (message) => {
    const editedText = editingMessageText.trim();
    if (!editedText) {
      showNotice("The prompt cannot be empty.");
      return;
    }

    const matchingResponse = messages.find(
      (candidate) =>
        candidate.role === "ai" &&
        candidate.requestId === message.requestId
    );

    if (!matchingResponse) {
      showNotice("The matching AI response could not be found.");
      return;
    }

    setChatMessages((current) => ({
      ...current,
      [selectedChat]: (current[selectedChat] || []).map((candidate) =>
        candidate.role === "user" &&
        candidate.requestId === message.requestId
          ? {
              ...candidate,
              text: editedText,
              ...(candidate.transcriptText
                ? { transcriptText: editedText }
                : {}),
            }
          : candidate
      ),
    }));
    cancelEditingMessage();
    await retryFailedMessage(matchingResponse, { overrideText: editedText });
  };

  return (
    <div
      onClick={() => {
        setActionMenuOpen(false);
        setExportMenuOpen(false);
      }}
      className="orbital-page relative h-full min-h-0 overflow-hidden text-white"
    >
      <input
        id="chat-file-input"
        accept=".pdf,.docx,.pptx,.xlsx,.odt,.odp,.ods,.epub,.txt,.md,.markdown,.csv,.tsv,.json,.xml,.html,.htm,.rtf,.log,.yaml,.yml,.js,.jsx,.ts,.tsx,.css,.py,.java,.c,.cpp,.h,.sql"
        type="file"
        className="sr-only"
        onChange={(e) => handleFileSelected(e, "file")}
      />

      <input
        id="chat-image-input"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFileSelected(e, "image")}
      />

      <div className="orbital-earth-horizon pointer-events-none absolute inset-0 opacity-55" />

      {notice && (
        <div className="fixed left-3 right-3 top-16 z-[10000] rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-200 px-4 py-3 text-sm shadow-2xl shadow-purple-950/20 sm:left-1/2 sm:right-auto sm:top-5 sm:max-w-xl sm:-translate-x-1/2 sm:px-5">
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
        <header className="shrink-0 border-b border-blue-200/[0.1] bg-[#030b18]/78 px-4 pb-3 pt-[4.6rem] backdrop-blur-xl sm:px-6 sm:py-4 lg:px-7">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200/[0.1] bg-white/[0.025] text-slate-400"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="m14 7-5 5 5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <span className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:block">
                  Conversation
                </span>
                <h1 className="truncate bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-base font-semibold tracking-[-0.025em] text-transparent sm:text-lg">
                  {selectedChat || "Untitled Chat"}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="hidden rounded-lg border border-white/[0.1] bg-white/[0.025] px-3 py-2 text-xs text-slate-400 transition hover:text-white sm:block"
              >
                Share
              </button>

              <div className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  aria-expanded={exportMenuOpen}
                  aria-haspopup="menu"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExportMenuOpen((open) => !open);
                  }}
                  className="hidden w-full rounded-lg border border-white/[0.1] bg-white/[0.025] px-3 py-2 text-xs text-slate-400 transition hover:text-white sm:block"
                >
                  Export ▾
                </button>

                {exportMenuOpen && (
                  <div
                    role="menu"
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-[calc(100%+0.5rem)] z-[5000] w-52 overflow-hidden rounded-2xl border border-[#1B2540] bg-[#08111F]/95 p-2 shadow-2xl shadow-black/40 backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport("txt")}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm text-gray-100 hover:bg-[#101827]"
                    >
                      <span className="block font-semibold">Plain text</span>
                      <span className="mt-1 block text-xs text-gray-400">
                        Download .txt
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleExport("md")}
                      className="w-full rounded-xl px-4 py-3 text-left text-sm text-gray-100 hover:bg-[#101827]"
                    >
                      <span className="block font-semibold">Markdown</span>
                      <span className="mt-1 block text-xs text-gray-400">
                        Preserves code formatting
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main
          ref={mainScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-7 lg:px-7 lg:pb-10 lg:pt-7"
        >
          {messages.length === 0 && (
            <div className="flex min-h-full flex-col items-center justify-center py-8 text-center sm:min-h-[520px]">
              <div className="relative mb-6 sm:mb-10">
                <div className="absolute inset-0 blur-3xl bg-purple-600/20 rounded-full" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[#1B2540] bg-[#07101F] text-3xl shadow-2xl shadow-purple-950/30 sm:h-24 sm:w-24 sm:rounded-3xl sm:text-4xl">
                  ✦
                </div>
              </div>

              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
                Start a new conversation
              </h2>

              <p className="mt-3 max-w-md text-sm text-gray-400 sm:mt-4 sm:text-lg">
                Ask once. OrbitalAI routes the work to the right AI experts.
              </p>

              <div className="mt-6 grid w-full max-w-4xl grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                <button
                  onClick={() =>
                    setInput("Research Chandrayaan-3 and create key notes")
                  }
                  className="rounded-2xl border border-[#1B2540] bg-[#07101F]/90 p-4 text-left hover:border-purple-500/70 sm:p-5"
                >
                  <p className="text-lg mb-2">📚 Research</p>
                  <p className="text-sm text-gray-400">
                    Build notes with useful facts and sources.
                  </p>
                </button>

                <button
                  onClick={() => setInput("Write an essay on global warming")}
                  className="rounded-2xl border border-[#1B2540] bg-[#07101F]/90 p-4 text-left hover:border-purple-500/70 sm:p-5"
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
                  className="rounded-2xl border border-[#1B2540] bg-[#07101F]/90 p-4 text-left hover:border-purple-500/70 sm:p-5"
                >
                  <p className="text-lg mb-2">✦ Multi-output</p>
                  <p className="text-sm text-gray-400">
                    Combine writing, images, code and presentations.
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="mx-auto max-w-[900px] space-y-5 sm:space-y-7 lg:max-w-[1040px] xl:max-w-[1100px]">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "user" ? (
                  <div
                    className={`min-w-0 max-w-[94%] overflow-hidden rounded-xl border transition-[width,max-width] duration-200 ${
                      editingRequestId === message.requestId
                        ? "w-full border-blue-200/15 bg-[#020817]/35 shadow-[0_20px_55px_rgba(0,0,0,0.22)] backdrop-blur-[3px] sm:max-w-[760px] lg:max-w-[820px]"
                        : "border-slate-400/25 bg-[#111a2a]/88 shadow-xl shadow-black/20 sm:max-w-[560px]"
                    }`}
                  >
                    <div
                      className={`p-3.5 sm:p-4 ${
                        editingRequestId === message.requestId
                          ? "sm:p-5"
                          : ""
                      }`}
                    >
                      {editingRequestId === message.requestId ? (
                        <div className="mb-4 flex items-center justify-between gap-3 border-b border-blue-100/[0.08] pb-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-200/15 bg-blue-300/[0.06] text-sm text-blue-100/80">
                              ✎
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-100">
                                Editing prompt
                              </p>
                              <p className="truncate text-[11px] text-slate-500">
                                Update your request before regenerating
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full border border-blue-200/10 bg-blue-300/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-100/70">
                            You
                          </span>
                        </div>
                      ) : (
                        <p className="mb-1 text-[11px] text-slate-500">You</p>
                      )}
                      {editingRequestId === message.requestId ? (
                        <div>
                          <textarea
                            autoFocus
                            value={editingMessageText}
                            onChange={(event) =>
                              setEditingMessageText(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key === "Enter" &&
                                (event.metaKey || event.ctrlKey)
                              ) {
                                event.preventDefault();
                                finishEditingMessage(message);
                              }
                            }}
                            rows={Math.min(
                              14,
                              Math.max(
                                6,
                                String(editingMessageText).split("\n").length +
                                  Math.ceil(editingMessageText.length / 85)
                              )
                            )}
                            className="max-h-[420px] min-h-48 w-full resize-y rounded-xl border border-blue-100/10 bg-white/[0.018] px-4 py-3 text-sm leading-relaxed text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none transition placeholder:text-slate-600 focus:border-violet-300/35 focus:bg-white/[0.028] focus:ring-2 focus:ring-violet-500/[0.07] sm:min-h-56 sm:px-5 sm:py-4 sm:text-base"
                            aria-label="Edit prompt"
                          />
                          <div className="mt-4 flex flex-col-reverse gap-2 border-t border-blue-100/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="hidden text-[11px] text-slate-500 sm:block">
                              Command/Ctrl + Enter to resend
                            </p>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <button
                              type="button"
                              onClick={cancelEditingMessage}
                              disabled={isGenerating}
                              className="group flex items-center justify-center gap-2 rounded-lg border border-blue-300/35 bg-gradient-to-br from-[#183054]/95 via-[#122441]/95 to-[#1b2048]/95 px-4 py-2.5 text-sm font-semibold text-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_9px_26px_rgba(12,45,94,0.2)] transition-all hover:border-blue-200/55 hover:from-[#1d3b68] hover:via-[#172d50] hover:to-[#25265a] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_32px_rgba(38,89,170,0.24)] active:scale-[0.98] disabled:opacity-40"
                            >
                              <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                aria-hidden="true"
                                className="h-4 w-4 text-blue-200/80 transition group-hover:text-blue-100"
                              >
                                <path d="m6 6 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              </svg>
                              <span>Cancel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => finishEditingMessage(message)}
                              disabled={
                                isGenerating || !editingMessageText.trim()
                              }
                              className="group relative isolate flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-cyan-200/25 bg-[#0b1730] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.2),inset_0_1px_0_rgba(255,255,255,0.13)] transition-all hover:-translate-y-px hover:border-cyan-100/40 hover:shadow-[0_14px_34px_rgba(37,99,235,0.3),0_0_22px_rgba(99,102,241,0.13),inset_0_1px_0_rgba(255,255,255,0.17)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <span className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,rgba(34,211,238,0.2),rgba(59,130,246,0.78)_48%,rgba(99,102,241,0.85))] transition-transform duration-300 group-hover:scale-105" />
                              <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/75 to-transparent" />
                              <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                aria-hidden="true"
                                className="h-4 w-4 text-cyan-50"
                              >
                                <path d="M15.5 7.5A6 6 0 1 0 16 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                                <path d="M12.5 4.5h3.5V8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span>Done &amp; resend</span>
                            </button>
                            </div>
                          </div>
                          <p className="mt-2 text-center text-[11px] text-slate-500 sm:hidden">
                            Command/Ctrl + Enter to resend
                          </p>
                        </div>
                      ) : (
                        <p className="break-words text-gray-100 leading-relaxed">
                          {message.text}
                        </p>
                      )}

                      {message.attachment && (
                        <button
                          type="button"
                          onClick={() =>
                            openStoredAttachment(message.attachment)
                          }
                          className="mt-4 w-full text-left rounded-2xl bg-[#07101F] border border-purple-500/30 p-4 transition hover:border-purple-400/70 disabled:cursor-default"
                        >
                          <p className="break-all text-sm font-semibold text-purple-200">
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
                          {(message.attachment.path ||
                            message.attachment.url) && (
                            <p className="text-xs text-purple-300 mt-2">
                              Open attachment ↗
                            </p>
                          )}
                          {message.attachment.storageStatus === "saving" && (
                            <p className="mt-2 text-xs text-blue-300">
                              Saving attachment…
                            </p>
                          )}
                          {message.attachment.storageStatus === "failed" && (
                            <p className="mt-2 text-xs text-red-300">
                              Attachment was not saved
                            </p>
                          )}
                        </button>
                      )}

                      {!message.isLoading &&
                        editingRequestId !== message.requestId && (
                        <button
                          type="button"
                          onClick={() => beginEditingMessage(message)}
                          disabled={isGenerating}
                          className="mt-3 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-violet-200 disabled:opacity-40"
                        >
                          ✎ Edit and resend
                        </button>
                        )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full min-w-0 max-w-[760px] border-l bg-[#06101e]/28 p-3.5 shadow-none backdrop-blur-[1px] sm:p-4 ${
                      message.failed
                        ? "border-red-500/35"
                        : "border-violet-400/15"
                    }`}
                  >
                    <div className="mb-5 flex flex-col sm:mb-6">
                      <div className="min-w-0">
                        <div>
                          <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-4">
                            <img
                              src={orbitalLogo}
                              alt="OrbitalAI"
                              className="h-auto w-[112px] object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.2)] sm:w-[124px]"
                            />
                            <ProviderBadge
                              provider={
                                message.outputs?.some(
                                  (output) => output?.[1] === "Generated Image"
                                )
                                  ? "orbital-image"
                                  : message.provider
                              }
                              fallbackFrom={
                                message.outputs?.some(
                                  (output) => output?.[1] === "Generated Image"
                                )
                                  ? ""
                                  : message.fallbackFrom
                              }
                            />
                          </div>

                          {message.isLoading ? (
                            <div className="relative mt-1 min-w-0 max-w-lg overflow-hidden rounded-2xl border border-blue-300/[0.14] bg-[#071426]/80 shadow-[0_18px_45px_rgba(2,8,23,0.22)] backdrop-blur-xl">
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/70 to-transparent" />

                              <div className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
                                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/20 bg-gradient-to-br from-blue-500/15 to-violet-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200/20 border-t-violet-200" />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold tracking-[-0.01em] text-slate-100">
                                    {isGenerating
                                      ? requestStage
                                      : message.loadingStage ||
                                        "Selecting the best AI"}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    OrbitalAI is preparing your response
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={stopGeneration}
                                  aria-label="Stop generating response"
                                  className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.045] px-3 text-xs font-semibold text-slate-300 transition duration-200 hover:border-rose-300/25 hover:bg-rose-400/[0.08] hover:text-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 sm:px-3.5"
                                >
                                  <span className="h-2.5 w-2.5 rounded-[3px] border border-current bg-current/80 transition group-hover:scale-90" />
                                  <span>Stop</span>
                                </button>
                              </div>

                              <div className="h-0.5 overflow-hidden bg-white/[0.045]">
                                <div className="h-full w-2/3 animate-pulse bg-gradient-to-r from-blue-500 via-violet-400 to-fuchsia-500 shadow-[0_0_12px_rgba(139,92,246,0.65)]" />
                              </div>
                            </div>
                          ) : message.failed ? (
                            <div className="rounded-xl border border-red-400/20 bg-red-500/[0.07] p-4">
                              <p className="text-sm font-semibold text-red-200">
                                Request couldn’t be completed
                              </p>
                              <p className="mt-2 text-sm leading-6 text-red-100/70">
                                {message.errorMessage ||
                                  "Something interrupted the request. Your prompt is preserved."}
                              </p>
                              <button
                                type="button"
                                onClick={() => retryFailedMessage(message)}
                                disabled={isGenerating}
                                className="mt-4 rounded-lg border border-red-300/20 bg-red-400/10 px-3.5 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Retry request
                              </button>
                            </div>
                          ) : (
                            <MarkdownContent>{message.text}</MarkdownContent>
                          )}

                          {message.providerNotice && (
                            <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-200">
                              {message.providerNotice}
                            </p>
                          )}

                        </div>

                        {message.tasks &&
                          message.tasks.length > 0 &&
                          !(
                            message.tasks.length === 1 &&
                            message.tasks[0].task === "General Answer"
                          ) && (
                            <p className="text-gray-400 mt-4">
                              The request was routed across the best-fit AI
                              roles.
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
                        <div className="mb-6 flex flex-wrap gap-2 sm:mb-8 sm:gap-3">
                          {message.tasks.map((item, taskIndex) => (
                            <span
                              key={taskIndex}
                              className="rounded-full border border-[#1B2540] bg-[#101827] px-3 py-2 text-xs text-gray-200 sm:px-4 sm:text-sm"
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
                          <h2 className="mb-4 text-xl font-bold sm:mb-5 sm:text-2xl">
                            Generated Outputs
                          </h2>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                            {message.outputs.map((output, outputIndex) => (
                              <button
                                key={outputIndex}
                                onClick={() => openSingleOutput(output)}
                                className="min-w-0 rounded-2xl border border-[#1B2540] bg-[#101827] p-4 text-left transition hover:border-purple-500/60 hover:bg-[#141f33] sm:p-5"
                              >
                                <h3 className="font-bold text-lg mb-2">
                                  {output[0]} {output[1]}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                  {output[2]}
                                </p>
                                {typeof output[3] === "object" &&
                                  output[3]?.kind === "generated-image" && (
                                    <div className="mt-4">
                                      <GeneratedImageContent
                                        image={output[3]}
                                        compact
                                      />
                                    </div>
                                  )}
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

                    {!message.isLoading && !message.failed && (
                      <>
                        {getMessageCitations(message).length > 0 && (
                          <div className="mt-6 border-t border-white/[0.06] pt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Sources
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {getMessageCitations(message).map((citation) => (
                                <button
                                  key={citation.key}
                                  type="button"
                                  onClick={() =>
                                    openStoredAttachment(
                                      message.sourceAttachment,
                                      citation.pageNumber
                                    )
                                  }
                                  className="rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-left text-xs text-violet-200 transition hover:border-violet-300/40 hover:bg-violet-400/[0.12]"
                                >
                                  {citation.filename}
                                  {citation.pageNumber
                                    ? ` · page ${citation.pageNumber}`
                                    : ""}
                                  {message.sourceAttachment?.path ||
                                  message.sourceAttachment?.url
                                    ? " ↗"
                                    : ""}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center gap-1 border-t border-white/[0.06] pt-3">
                          <button
                            type="button"
                            onClick={() => copyMessageResponse(message)}
                            className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                            aria-label="Copy response"
                          >
                            ⧉ Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => retryFailedMessage(message)}
                            disabled={isGenerating}
                            className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-40"
                          >
                            ↻ Regenerate
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMessageFeedback(message.requestId, "up")
                            }
                            className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                              message.feedback === "up"
                                ? "bg-emerald-400/10 text-emerald-300"
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                            }`}
                            aria-label="Helpful response"
                          >
                            ♡ Helpful
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMessageFeedback(message.requestId, "down")
                            }
                            className={`rounded-lg px-2.5 py-1.5 text-xs transition ${
                              message.feedback === "down"
                                ? "bg-amber-400/10 text-amber-200"
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                            }`}
                            aria-label="Not helpful response"
                          >
                            ◇ Not helpful
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        <div className="shrink-0 bg-gradient-to-t from-[#020817] via-[#020817]/95 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-5 sm:pt-4 lg:px-10 lg:pb-8">
          <div className="mx-auto w-[820px] max-w-full">
            <div className="relative">
              {actionMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-[72px] left-0 z-[9999] w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#1B2540] bg-[#08111F]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-xl sm:bottom-[92px] sm:rounded-3xl"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-purple-300/80 px-3 pt-1 pb-3">
                    Quick Actions
                  </p>

                  <div className="space-y-1">
                    <label
                      htmlFor="chat-file-input"
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-gray-100 transition hover:bg-[#101827]"
                    >
                      <span className="text-xl">📎</span>
                      <div>
                        <p className="text-sm font-medium">Attach File</p>
                        <p className="text-xs text-gray-400">
                          Add a document or file
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="chat-image-input"
                      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-gray-100 transition hover:bg-[#101827]"
                    >
                      <span className="text-xl">🖼️</span>
                      <div>
                        <p className="text-sm font-medium">Upload Image</p>
                        <p className="text-xs text-gray-400">
                          Add an image to your chat
                        </p>
                      </div>
                    </label>

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
                  className="mb-3 rounded-2xl bg-red-500/10 border border-red-500/30 p-3 shadow-xl shadow-red-950/20 sm:rounded-3xl sm:p-4"
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
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

              {isTranscribingVoice && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mb-3 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-3 shadow-xl shadow-blue-950/20 sm:rounded-3xl sm:p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200/25 border-t-blue-200" />
                    <div>
                      <p className="font-semibold text-blue-100">
                        Transcribing voice note
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Your text will appear in the message box.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedAttachment && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mb-3 rounded-2xl bg-[#07101F]/95 border border-[#1B2540] p-3 shadow-xl shadow-purple-950/20 sm:rounded-3xl sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    {selectedAttachment.kind === "image" &&
                    attachmentPreviewUrl ? (
                      <img
                        src={attachmentPreviewUrl}
                        alt={selectedAttachment.name}
                        className="h-12 w-12 shrink-0 rounded-xl object-cover border border-[#1B2540] sm:h-16 sm:w-16 sm:rounded-2xl"
                      />
                    ) : selectedAttachment.kind === "voice" &&
                      attachmentPreviewUrl ? (
                      <div className="min-w-0">
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl border border-[#1B2540] bg-[#101827] text-xl sm:h-16 sm:w-16 sm:rounded-2xl sm:text-2xl">
                          🎙️
                        </div>
                        <audio
                          controls
                          src={attachmentPreviewUrl}
                          className="h-8 w-36 max-w-full sm:w-48"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#1B2540] bg-[#101827] text-xl sm:h-16 sm:w-16 sm:rounded-2xl sm:text-2xl">
                        📎
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">
                        {getAttachmentIcon(selectedAttachment.kind)}{" "}
                        {selectedAttachment.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-gray-400 sm:text-sm">
                        {selectedAttachment.sizeLabel} •{" "}
                        {selectedAttachment.type}
                        {selectedAttachment.durationLabel
                          ? ` • ${selectedAttachment.durationLabel}`
                          : ""}
                      </p>
                    </div>

                    <button
                      onClick={removeAttachment}
                      className="h-9 w-9 shrink-0 rounded-xl bg-[#11827] border border-[#1B2540] text-gray-300 hover:text-white hover:bg-[#141f33] sm:h-10 sm:w-10"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div
                onClick={(e) => e.stopPropagation()}
                onDragOver={handleAttachmentDragOver}
                onDragLeave={handleAttachmentDragLeave}
                onDrop={handleAttachmentDrop}
                className={`flex min-w-0 items-center gap-2 rounded-2xl border bg-[radial-gradient(circle_at_78%_0%,rgba(91,93,255,0.09),transparent_38%),linear-gradient(135deg,rgba(8,19,37,0.9),rgba(3,11,25,0.86))] p-2 shadow-[0_20px_55px_rgba(0,0,0,0.3),0_0_35px_rgba(79,70,229,0.07),inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-xl transition-all focus-within:border-violet-300/30 focus-within:shadow-[0_22px_60px_rgba(0,0,0,0.34),0_0_38px_rgba(99,102,241,0.12),inset_0_1px_0_rgba(255,255,255,0.05)] sm:gap-3 sm:rounded-3xl sm:p-3 lg:gap-4 lg:p-4 ${
                  isDraggingAttachment
                    ? "border-purple-400 bg-purple-500/10"
                    : "border-blue-200/15"
                }`}
              >
                <button
                  type="button"
                  aria-label="Add attachment"
                  title="Add attachment"
                  onClick={() => setActionMenuOpen(!actionMenuOpen)}
                  disabled={
                    isGenerating || isRecording || isTranscribingVoice
                  }
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-white transition-all sm:h-14 sm:w-14 sm:rounded-2xl ${
                    isGenerating || isRecording || isTranscribingVoice
                      ? "bg-[#101827] border-[#1B2540] opacity-50 cursor-not-allowed"
                      : actionMenuOpen
                      ? "border-violet-300/45 bg-gradient-to-br from-blue-400/20 to-violet-500/20 shadow-[0_8px_24px_rgba(99,102,241,0.18)]"
                      : "border-blue-200/15 bg-gradient-to-br from-blue-200/[0.08] to-violet-300/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-blue-200/30 hover:from-blue-200/[0.13] hover:to-violet-300/[0.09]"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    className="h-5 w-5 sm:h-6 sm:w-6"
                  >
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label={isRecording ? "Stop recording" : "Record voice note"}
                  title={isRecording ? "Stop recording" : "Record voice note"}
                  onClick={handleVoiceInput}
                  disabled={isGenerating || isTranscribingVoice}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all sm:h-14 sm:w-14 sm:rounded-2xl ${
                    isRecording
                      ? "bg-red-500/10 border-red-500/40 text-red-200 hover:bg-red-500/20"
                      : isGenerating || isTranscribingVoice
                      ? "bg-[#101827] border-[#1B2540] opacity-50 cursor-not-allowed"
                      : "border-blue-200/15 bg-gradient-to-br from-blue-200/[0.08] to-violet-300/[0.045] text-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-violet-200/30 hover:from-blue-200/[0.13] hover:to-violet-300/[0.09]"
                  }`}
                >
                  {isRecording ? (
                    <span className="h-3.5 w-3.5 rounded-[3px] bg-current" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="h-5 w-5 sm:h-6 sm:w-6"
                    >
                      <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  )}
                </button>

                <input
                  type="text"
                  value={input}
                  placeholder={
                    isRecording
                      ? "Recording voice note..."
                      : isTranscribingVoice
                      ? "Transcribing voice note..."
                      : isGenerating
                      ? "OrbitalAI is working..."
                      : selectedAttachment
                      ? "Add a message for this attachment..."
                      : "Ask OrbitalAI anything..."
                  }
                  disabled={
                    isGenerating || isRecording || isTranscribingVoice
                  }
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handleAttachmentPaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="orbital-chat-input min-w-0 flex-1 bg-transparent px-1 text-base text-slate-100 outline-none placeholder:text-slate-500 transition placeholder:transition-colors focus:placeholder:text-slate-600 disabled:opacity-60 sm:text-lg"
                />

                <button
                  type="button"
                  aria-label="Send message"
                  title="Send message"
                  onClick={sendMessage}
                  disabled={
                    isGenerating || isRecording || isTranscribingVoice
                  }
                  className={`group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-blue-200/20 bg-[linear-gradient(145deg,#3b6ff5,#5a55e7_52%,#7138cf)] text-white shadow-[0_10px_28px_rgba(55,65,190,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all sm:h-16 sm:w-16 sm:rounded-2xl ${
                    isGenerating || isRecording || isTranscribingVoice
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:-translate-y-px hover:border-blue-100/35 hover:brightness-110 hover:shadow-[0_13px_32px_rgba(67,70,205,0.34),inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-0 active:scale-[0.97]"
                  }`}
                >
                  <span className="absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
                  {isGenerating ? (
                    <span className="text-2xl leading-none">…</span>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                      className="relative h-5 w-5 translate-x-px drop-shadow-[0_2px_4px_rgba(9,18,55,0.3)] transition-transform group-hover:translate-x-0.5 sm:h-6 sm:w-6"
                    >
                      <path d="m4.75 5.25 14.5 6.75-14.5 6.75 2.7-6.75-2.7-6.75Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
                      <path d="M7.6 12h7" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <p className="mt-4 hidden text-center text-sm text-gray-500 sm:block">
              Press Enter to send&nbsp;&nbsp;•&nbsp;&nbsp;Drag documents
              here&nbsp;&nbsp;•&nbsp;&nbsp;Paste images with Command + V
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;
