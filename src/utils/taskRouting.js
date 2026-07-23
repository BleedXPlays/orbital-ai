export const analyzeTask = (text = "") => {
  const lowerText = String(text).toLowerCase();
  const detectedTasks = [];

  if (
    /\b(pdf|document|documents|file|files|long document|summarize|summary)\b/.test(
      lowerText
    )
  ) {
    detectedTasks.push({
      task: "Document Analysis",
      ai: /\b(long document|large document|use claude)\b/.test(lowerText)
        ? "Claude"
        : "OpenAI",
    });
  }

  if (
    /\b(code|coding|website|app|react|javascript|typescript|python|debug|bug)\b/.test(
      lowerText
    )
  ) {
    detectedTasks.push({ task: "Coding", ai: "Claude" });
  }

  if (
    /\b(decide|decision|compare|comparison|recommend|recommendation|pros and cons|trade-off|tradeoff)\b/.test(
      lowerText
    )
  ) {
    detectedTasks.push({ task: "Decision Support", ai: "OpenAI" });
  }

  if (
    /\b(research|information|facts|sources|investigate)\b/.test(lowerText)
  ) {
    detectedTasks.push({ task: "Research", ai: "OpenAI" });
  }

  if (
    /\b(write|writing|essay|report|content|detailed|detail)\b/.test(lowerText)
  ) {
    detectedTasks.push({ task: "Writing", ai: "OpenAI" });
  }

  if (
    /\b(image|images|poster|posters|diagram|diagrams|chart|charts|graph|graphs|logo|logos|visual|visuals|photo|photos|photograph|photographs|picture|pictures)\b/.test(
      lowerText
    )
  ) {
    detectedTasks.push({ task: "Visual Analysis", ai: "Gemini" });
  }

  if (
    /\b(presentation|ppt|slides|video|reel|youtube|storyboard)\b/.test(
      lowerText
    )
  ) {
    detectedTasks.push({ task: "Content Plan", ai: "OpenAI" });
  }

  if (/\b(translate|translation|language)\b/.test(lowerText)) {
    detectedTasks.push({ task: "Translation", ai: "OpenAI" });
  }

  if (
    /\b(voice|audio|speech|transcribe|transcription|recording)\b/.test(
      lowerText
    )
  ) {
    detectedTasks.push({ task: "Voice Input", ai: "OpenAI" });
  }

  if (detectedTasks.length === 0) {
    detectedTasks.push({ task: "General Answer", ai: "OpenAI" });
  }

  return detectedTasks;
};

export const getOutputs = (tasks = []) => {
  const outputs = [];

  tasks.forEach((item) => {
    if (item.task === "Document Analysis") {
      outputs.push(["📑", "Document Analysis", "Detailed file findings"]);
    }

    if (item.task === "Research") {
      outputs.push(["📚", "Research Notes", "Detailed findings"]);
    }

    if (item.task === "Writing") {
      outputs.push(["📄", "Written Content", "Essay / report"]);
    }

    if (item.task === "Decision Support") {
      outputs.push(["⚖️", "Decision Support", "Options and recommendation"]);
    }

    if (item.task === "Visual Analysis") {
      outputs.push(["🖼️", "Visual Analysis", "Image and visual findings"]);
    }

    if (item.task === "Coding") {
      outputs.push(["💻", "Code", "Implementation and explanation"]);
    }

    if (item.task === "Content Plan") {
      outputs.push(["🗂️", "Content Plan", "Structured presentation or media plan"]);
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
