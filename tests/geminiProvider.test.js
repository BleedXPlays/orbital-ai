/* global process */

import test from "node:test";
import assert from "node:assert/strict";

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;

test("sends inline image data to the compatible default Gemini model", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;

  let requestUrl = "";
  let requestBody;
  globalThis.fetch = async (url, options) => {
    requestUrl = String(url);
    requestBody = JSON.parse(options.body);

    return {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    reply: "The image was inspected.",
                    generatedOutputs: [],
                  }),
                },
              ],
            },
          },
        ],
      }),
    };
  };

  const { generateWithGemini } = await import(
    "../api/providers/geminiProvider.js"
  );
  const result = await generateWithGemini({
    message: "Inspect this image",
    tasks: [{ ai: "Gemini", task: "Visual Analysis" }],
    outputs: [],
    attachment: {
      name: "image.png",
      type: "image/png",
      kind: "image",
    },
    imageBase64: "aGVsbG8=",
    imageMimeType: "image/png",
  });

  assert.match(requestUrl, /models\/gemini-2\.5-flash:generateContent$/);
  assert.deepEqual(requestBody.contents[0].parts[0], {
    inline_data: {
      mime_type: "image/png",
      data: "aGVsbG8=",
    },
  });
  assert.equal(result.reply, "The image was inspected.");
});

test.after(() => {
  globalThis.fetch = originalFetch;

  if (originalApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalApiKey;
  }

  if (originalModel === undefined) {
    delete process.env.GEMINI_MODEL;
  } else {
    process.env.GEMINI_MODEL = originalModel;
  }
});
