const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

export const buildQuizPrompt = ({ topic, classLevel, book, chapter, difficulty, questionCount }) => {
  const safeDifficulty = DIFFICULTIES.has(difficulty) ? difficulty : "medium";
  const safeCount = [5, 10, 20].includes(Number(questionCount)) ? Number(questionCount) : 5;

  return `Create an educational quiz using these details:
- Topic: ${String(topic || "").trim()}
- Class or grade: ${String(classLevel || "Not specified").trim() || "Not specified"}
- Book: ${String(book || "Not specified").trim() || "Not specified"}
- Chapter: ${String(chapter || "Not specified").trim() || "Not specified"}
- Difficulty: ${safeDifficulty}
- Number of questions: exactly ${safeCount}

Put the quiz in the requested Quiz Data output card. Its content must be ONLY valid JSON, without markdown fences, in this exact shape:
{"title":"Quiz title","questions":[{"question":"Question text","options":["Option A","Option B","Option C","Option D"],"correctIndex":0,"explanation":"A short, student-friendly explanation."}]}

Requirements: exactly ${safeCount} questions; exactly four distinct options per question; one correctIndex from 0 to 3; no trick ambiguity; explanations must explain why the correct answer is right; match the requested class level, book, chapter, topic, and ${safeDifficulty} difficulty.`;
};

const extractJson = (value) => {
  const text = String(value || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

export const parseQuizResponse = (content, expectedCount) => {
  const parsed = extractJson(content);
  const count = Number(expectedCount);

  if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length !== count || count > 20) {
    throw new Error("OrbitalAI could not create a complete quiz. Please try again.");
  }

  const questions = parsed.questions.map((item, index) => {
    const question = String(item?.question || "").trim();
    const options = Array.isArray(item?.options)
      ? item.options.map((option) => String(option || "").trim())
      : [];
    const correctIndex = Number(item?.correctIndex);
    const explanation = String(item?.explanation || "").trim();

    if (
      !question ||
      options.length !== 4 ||
      options.some((option) => !option) ||
      new Set(options.map((option) => option.toLowerCase())).size !== 4 ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3 ||
      !explanation
    ) {
      throw new Error(`Question ${index + 1} was incomplete. Please generate the quiz again.`);
    }

    return { question, options, correctIndex, explanation };
  });

  return {
    title: String(parsed.title || "OrbitalAI Quiz").trim().slice(0, 120) || "OrbitalAI Quiz",
    questions,
  };
};

