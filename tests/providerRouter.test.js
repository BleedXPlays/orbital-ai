/* global process */

import test from "node:test";
import assert from "node:assert/strict";

process.env.OPENAI_API_KEY ||= "routing-test-key";

const {
  classifyProviderError,
  generateWithProvider,
  getProviderForRequest,
} = await import(
  "../api/providers/providerRouter.js"
);

test("uses OpenAI for ordinary writing and short documents", () => {
  assert.equal(
    getProviderForRequest({
      message: "Write a short report",
      tasks: [{ task: "Writing" }],
    }),
    "openai"
  );

  assert.equal(
    getProviderForRequest({
      message: "Summarize this file",
      tasks: [{ task: "Document Analysis" }],
      fileText: "A short school document.",
    }),
    "openai"
  );
});

test("reserves Claude for coding, explicit requests, and long documents", () => {
  assert.equal(
    getProviderForRequest({
      message: "Build a React component",
      tasks: [{ task: "Coding" }],
    }),
    "claude"
  );

  assert.equal(
    getProviderForRequest({
      message: "Use Claude for this answer",
      tasks: [{ task: "General Answer" }],
    }),
    "claude"
  );

  assert.equal(
    getProviderForRequest({
      message: "Analyze this long document",
      tasks: [{ task: "Document Analysis" }],
      fileText: "x".repeat(20000),
    }),
    "claude"
  );
});

test("keeps image understanding on Gemini", () => {
  assert.equal(
    getProviderForRequest({
      message: "What is in this image?",
      tasks: [{ task: "Visual Analysis" }],
      attachment: { kind: "image" },
    }),
    "gemini"
  );
});

test("does not replace a failed Gemini image analysis with a guessed fallback", async () => {
  let openAiWasCalled = false;
  const geminiError = Object.assign(new Error("Model is not available"), {
    status: 404,
    code: "NOT_FOUND",
  });

  await assert.rejects(
    generateWithProvider(
      {
        message: "Count the objects in this image",
        tasks: [{ ai: "Gemini", task: "Visual Analysis" }],
        attachment: {
          name: "image.png",
          type: "image/png",
          kind: "image",
        },
        imageBase64: "aGVsbG8=",
        imageMimeType: "image/png",
      },
      {
        gemini: async () => {
          throw geminiError;
        },
        openai: async () => {
          openAiWasCalled = true;
          return { reply: "guessed answer", provider: "openai" };
        },
      }
    ),
    (error) => {
      assert.equal(error.provider, "gemini");
      assert.deepEqual(error.providerFailures, [
        { provider: "gemini", code: "model_access" },
      ]);
      return true;
    }
  );

  assert.equal(openAiWasCalled, false);
});

test("classifies unavailable Gemini models separately from temporary failures", () => {
  assert.deepEqual(
    classifyProviderError(
      Object.assign(new Error("Model is not found"), {
        status: 404,
        code: "NOT_FOUND",
      }),
      "gemini"
    ),
    { provider: "gemini", code: "model_access" }
  );
});
