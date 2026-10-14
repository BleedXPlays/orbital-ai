import test from "node:test";
import assert from "node:assert/strict";
import { buildQuizPrompt, parseQuizResponse } from "../src/utils/quiz.js";

const validQuestion = {
  question: "What is 2 + 2?",
  options: ["2", "3", "4", "5"],
  correctIndex: 2,
  explanation: "Adding two and two gives four.",
};

test("parses a fenced quiz response", () => {
  const response = `\`\`\`json\n${JSON.stringify({ title: "Math", questions: [validQuestion] })}\n\`\`\``;
  assert.equal(parseQuizResponse(response, 1).questions[0].correctIndex, 2);
});

test("rejects incomplete quiz questions", () => {
  const invalid = JSON.stringify({ title: "Math", questions: [{ ...validQuestion, options: ["2", "4"] }] });
  assert.throws(() => parseQuizResponse(invalid, 1), /Question 1 was incomplete/);
});

test("builds a prompt with the chosen study details", () => {
  const prompt = buildQuizPrompt({ topic: "Cells", classLevel: "Class 8", book: "Science", chapter: "8", difficulty: "hard", questionCount: 10 });
  assert.match(prompt, /Topic: Cells/);
  assert.match(prompt, /exactly 10/);
  assert.match(prompt, /Difficulty: hard/);
});
