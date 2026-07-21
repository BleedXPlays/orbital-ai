import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutputPreviewModal from "../components/OutputPreviewModal";
import {
  getChatAttachmentUrl,
  uploadChatAttachment,
} from "../services/attachmentService";
import { apiFetch } from "../services/apiClient";
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
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
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
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const voiceTimerRef = useRef(null);
  const voiceStartTimeRef = useRef(null);
  const voiceStreamRef = useRef(null);
  const selectedAttachmentFileRef = useRef(null);

  const messages = useMemo(
    () => (selectedChat ? chatMessages[selectedChat] || [] : []),
    [selectedChat, chatMessages]
  );

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

  const openStoredAttachment = async (attachment) => {
    if (!attachment?.path && !attachment?.url) {
      showNotice("This older attachment was not saved to storage.");
      return;
    }

    try {
      const url = attachment.path
        ? await getChatAttachmentUrl(attachment.path)
        : attachment.url;
      const link = document.createElement("a");
      link.href = url;
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
  
  const getReadableFileText = async ({ attachment, attachmentFile }) => {
    if (!attachmentFile || attachment?.kind !== "file") {
      return "";
    }

    const fileBase64 = await blobToBase64(attachmentFile);

    const fileResponse = await apiFetch("/api/read-file", {
      method: "POST",
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
      throw new Error(fileData.error || "Failed to read file.");
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
  }) => {
    let newFileText = "";
    let transcriptText = "";

    try {
      if (attachment?.kind === "voice" && attachmentFile) {
        const audioBase64 = await blobToBase64(attachmentFile);

        const transcriptionResponse = await apiFetch("/api/transcribe", {
          method: "POST",
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

        const response = await apiFetch("/api/chat", {
          method: "POST",
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
            data.error || "Failed to answer the transcribed voice note."
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

      newFileText =
        existingFileText ||
        (await getReadableFileText({
          attachment,
          attachmentFile,
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

      const response = await apiFetch("/api/chat", {
        method: "POST",
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
        throw new Error(data.error || "Failed to generate AI response.");
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
      };
    } catch (error) {
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
      id: `attachment-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`,
      name:
        file.name ||
        (isImage ? `pasted-image-${Date.now()}` : `pasted-file-${Date.now()}`),
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

    if (isGenerating || isRecording) {
      showNotice("Wait for the current action to finish before adding a file.");
      return;
    }

    setActionMenuOpen(false);
    selectAttachmentFile(file);
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
      showNotice("Requesting microphone access...");

      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(attachmentPreviewUrl);
      }

      setActionMenuOpen(false);
      setSelectedAttachment(null);
      setAttachmentPreviewUrl("");
      selectedAttachmentFileRef.current = null;
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

        const durationSeconds = Math.max(
          1,
          Math.round((Date.now() - voiceStartTimeRef.current) / 1000)
        );

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

          selectedAttachmentFileRef.current = null;
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
          voiceStartTimeRef.current = null;
          return;
        }

        selectedAttachmentFileRef.current = audioBlob;

        const audioUrl = URL.createObjectURL(audioBlob);

        const attachment = {
          id: `attachment-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`,
          name: `voice-note-${Date.now()}.${extension}`,
          type: normalizedMimeType,
          size: audioBlob.size,
          sizeLabel: formatFileSize(audioBlob.size),
          kind: "voice",
          durationLabel: formatDuration(durationSeconds),
          createdAt: new Date().toISOString(),
        };

        setSelectedAttachment(attachment);
        setAttachmentPreviewUrl(audioUrl);

        setInput((prev) => prev);

        showNotice("Voice note recorded.");

        if (voiceStreamRef.current) {
          voiceStreamRef.current.getTracks().forEach((track) => track.stop());
          voiceStreamRef.current = null;
        }

        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        voiceStartTimeRef.current = null;
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
    if (isRecording) {
      showNotice("Stop recording first.");
      return;
    }

    setInput("");
    setActionMenuOpen(false);
    showNotice("Input cleared.");
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

    if (isRecording) {
      showNotice("Stop recording before sending.");
      return;
    }

    if ((!trimmedInput && !selectedAttachment) || isGenerating) return;

    setIsGenerating(true);
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
    const requestId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const userMessage = {
      role: "user",
      text: messageText,
      attachment: attachmentToSend,
      requestId,
    };

    const loadingMessage = {
      role: "ai",
      text: attachmentToSend
        ? "OrbitalAI is generating a real response for your request and attachment..."
        : "OrbitalAI is generating a real response...",
      isLoading: true,
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

    const createFinalAiMessage = (result) => {
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
          sizeLabel:
            attachmentToSend.sizeLabel ||
            formatFileSize(uploadedAttachment.size),
        };
      } catch (error) {
        console.error("Chat attachment upload error:", error);
        showNotice(
          "The AI processed the attachment, but the original file could not be saved."
        );
        return attachmentToSend;
      }
    };

    setInput("");

    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl);
    }

    setSelectedAttachment(null);
    setAttachmentPreviewUrl("");
    selectedAttachmentFileRef.current = null;

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
      navigate(`/chat/${slugify(newTitle)}`, { replace: true });

      addActivity("chat", "Chat created", newTitle);

      const [result, savedAttachment] = await Promise.all([
        getRealAiReply({
          message: messageText,
          tasks,
          outputs,
          attachment: attachmentToSend,
          attachmentFile: attachmentFileToSend,
          previousFileText,
          previousFileName,
          conversationHistory,
        }),
        saveAttachment(newTitle),
      ]);

      setChatMessages((prev) => ({
        ...prev,
        [newTitle]: [
          createFinalUserMessage(result, savedAttachment),
          createFinalAiMessage(result),
        ],
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
      navigate(`/chat/${slugify(newTitle)}`, { replace: true });

      addActivity("chat", "Chat renamed automatically", newTitle);

      const [result, savedAttachment] = await Promise.all([
        getRealAiReply({
          message: messageText,
          tasks,
          outputs,
          attachment: attachmentToSend,
          attachmentFile: attachmentFileToSend,
          previousFileText,
          previousFileName,
          conversationHistory,
        }),
        saveAttachment(newTitle),
      ]);

      setChatMessages((prev) => ({
        ...prev,
        [newTitle]: [
          createFinalUserMessage(result, savedAttachment),
          createFinalAiMessage(result),
        ],
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

    const [result, savedAttachment] = await Promise.all([
      getRealAiReply({
        message: messageText,
        tasks,
        outputs,
        attachment: attachmentToSend,
        attachmentFile: attachmentFileToSend,
        previousFileText,
        previousFileName,
        conversationHistory,
      }),
      saveAttachment(selectedChat),
    ]);

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
            return createFinalAiMessage(result);
          }

          return message;
        }),
      };
    });

    setIsGenerating(false);
  };

  const retryFailedMessage = async (failedMessage) => {
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

    const retryTasks =
      failedMessage.retryTasks ||
      analyzeTask(
        `${originalUserMessage.text || ""} ${
          originalUserMessage.attachment?.name || ""
        }`
      );
    const retryOutputs =
      failedMessage.retryOutputs || getOutputs(retryTasks);
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

    setIsGenerating(true);
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
        message: originalUserMessage.text,
        tasks: retryTasks,
        outputs: retryOutputs,
        attachment,
        attachmentFile,
        existingFileText,
        existingFileName: attachment?.name || "",
        previousFileText,
        previousFileName,
        conversationHistory,
      });
    } catch (error) {
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

    setIsGenerating(false);
  };

  return (
    <div
      onClick={() => {
        setActionMenuOpen(false);
        setExportMenuOpen(false);
      }}
      className="relative h-full min-h-0 overflow-hidden bg-[#030712] text-white"
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

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(91,110,255,0.11),transparent_38%),radial-gradient(circle_at_90%_75%,rgba(147,51,234,0.08),transparent_30%)]" />

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
        <header className="shrink-0 border-b border-white/[0.07] bg-[#030712]/80 px-4 pb-4 pt-16 backdrop-blur-xl sm:px-6 sm:pt-6 lg:px-10 lg:pb-5 lg:pt-8">
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-400 shadow-[0_0_16px_rgba(74,222,128,0.8)] sm:h-3 sm:w-3" />
                <p className="truncate text-xs text-green-300 sm:text-sm">
                  Multi-AI collaboration active
                </p>
              </div>

              <h1 className="truncate text-2xl font-semibold tracking-[-0.035em] text-slate-50 sm:text-3xl">
                {selectedChat || "Untitled Chat"}
              </h1>
            </div>

            <div className="flex shrink-0 gap-2 sm:gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare();
                }}
                className="flex-1 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white sm:flex-none sm:px-5"
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
                  className="w-full rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-white sm:px-5"
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
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-7 lg:px-10 lg:pb-10 lg:pt-8"
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

          <div className="mx-auto max-w-6xl space-y-4 sm:space-y-7">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "user" ? (
                  <div className="min-w-0 max-w-[94%] rounded-2xl rounded-tr-md bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 p-[1px] shadow-xl shadow-purple-950/30 sm:max-w-[620px] sm:rounded-3xl">
                    <div className="rounded-2xl rounded-tr-md bg-[#111A2E]/90 p-4 sm:rounded-3xl sm:p-6">
                      <p className="text-sm text-purple-200 mb-2">You</p>
                      <p className="break-words text-gray-100 leading-relaxed">
                        {message.text}
                      </p>

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
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full min-w-0 max-w-3xl rounded-2xl rounded-tl-md border bg-[#07101F]/95 p-4 shadow-xl shadow-purple-950/10 sm:w-fit sm:rounded-3xl sm:p-6 ${
                      message.failed
                        ? "border-red-500/30"
                        : "border-[#1B2540]"
                    }`}
                  >
                    <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-600/20 sm:h-11 sm:w-11 sm:rounded-2xl">
                        ✦
                      </div>

                      <div className="min-w-0">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
                            <p className="text-sm font-semibold text-purple-300">
                              OrbitalAI
                            </p>

                            {message.provider && (
                              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-purple-200">
                                {message.provider}
                                {message.fallbackFrom ? " fallback" : ""}
                              </span>
                            )}

                            {message.isLoading && (
                              <span className="flex gap-1 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce [animation-delay:120ms]" />
                                <span className="w-2 h-2 rounded-full bg-purple-300 animate-bounce [animation-delay:240ms]" />
                              </span>
                            )}
                          </div>

                          <p className="break-words text-[15px] font-normal leading-7 text-gray-100 whitespace-pre-wrap">
                            {message.text}
                          </p>

                          {message.providerNotice && (
                            <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-200">
                              {message.providerNotice}
                            </p>
                          )}

                          {message.failed && !message.isLoading && (
                            <button
                              type="button"
                              onClick={() => retryFailedMessage(message)}
                              disabled={isGenerating}
                              className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Retry request
                            </button>
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
                      className="h-9 w-9 shrink-0 rounded-xl bg-[#101827] border border-[#1B2540] text-gray-300 hover:text-white hover:bg-[#141f33] sm:h-10 sm:w-10"
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
                className={`flex min-w-0 items-center gap-2 rounded-2xl border bg-[#07101F]/95 p-2 shadow-2xl shadow-purple-950/30 backdrop-blur-xl transition sm:gap-3 sm:rounded-3xl sm:p-3 lg:gap-4 lg:p-4 ${
                  isDraggingAttachment
                    ? "border-purple-400 bg-purple-500/10"
                    : "border-[#1B2540]"
                }`}
              >
                <button
                  onClick={() => setActionMenuOpen(!actionMenuOpen)}
                  disabled={isGenerating || isRecording}
                  className={`h-11 w-11 shrink-0 rounded-xl border text-2xl text-white transition sm:h-14 sm:w-14 sm:rounded-2xl sm:text-3xl ${
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
                  className={`h-11 w-11 shrink-0 rounded-xl border text-xl transition sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl ${
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
                  onPaste={handleAttachmentPaste}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent text-base text-gray-200 outline-none placeholder:text-gray-500 disabled:opacity-60 sm:text-lg"
                />

                <button
                  onClick={sendMessage}
                  disabled={isGenerating || isRecording}
                  className={`h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-lg shadow-purple-700/30 transition sm:h-16 sm:w-16 sm:rounded-2xl sm:text-3xl ${
                    isGenerating || isRecording
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-[1.03]"
                  }`}
                >
                  {isGenerating ? "…" : "➤"}
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
