import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProviderRequest,
  normalizeConversationHistory,
  normalizeProviderResult,
} from "../api/providers/providerUtils.js";

test("normalizes JSON provider responses and removes markdown decoration", () => {
  const result = normalizeProviderResult(
    JSON.stringify({
      reply: "**Useful answer**",
      generatedOutputs: [
        { title: "## Code", content: "*const ready = true;*" },
        { title: "", content: "ignored" },
      ],
    }),
    "claude"
  );

  assert.deepEqual(result, {
    reply: "Useful answer",
    generatedOutputs: [{ title: "Code", content: "const ready = true;" }],
    provider: "claude",
  });
});

test("limits conversation history to valid recent messages", () => {
  const history = Array.from({ length: 14 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `message-${index}`,
  }));
  history.push({ role: "system", content: "must be ignored" });

  const normalized = normalizeConversationHistory(history);

  assert.equal(normalized.length, 10);
  assert.equal(normalized[0].content, "message-4");
  assert.equal(normalized.at(-1).content, "message-13");
  assert.ok(normalized.every((item) => item.role !== "system"));
});

test("scopes document questions to the active document", () => {
  const request = buildProviderRequest({
    message: "How many questions are in the latest file?",
    tasks: [],
    outputs: [],
    fileName: "worksheet.pdf",
    fileText: "Question 1\nQuestion 2",
  });

  assert.match(request, /active\/latest document named "worksheet\.pdf"/);
  assert.match(request, /use only this content/);
  assert.match(request, /Question 1/);
});
