import { PDFParse } from "pdf-parse";

const extractBase64 = (base64 = "") => {
  if (!base64) return "";
  if (base64.includes(",")) return base64.split(",")[1] || "";
  return base64;
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { fileBase64, filename, mimeType } = request.body || {};

    if (!fileBase64) {
      return response.status(400).json({
        error: "File is required.",
      });
    }

    const cleanBase64 = extractBase64(fileBase64);
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    const lowerFilename = String(filename || "").toLowerCase();
    const type = String(mimeType || "").toLowerCase();

    let text = "";

    if (type.includes("text/plain") || lowerFilename.endsWith(".txt")) {
      text = fileBuffer.toString("utf-8");
    } else if (
      type.includes("application/pdf") ||
      lowerFilename.endsWith(".pdf")
    ) {
      const parser = new PDFParse({ data: fileBuffer });

      try {
        const parsedPdf = await parser.getText();
        text = parsedPdf.text || "";
      } finally {
        await parser.destroy();
      }
    } else {
      return response.status(400).json({
        error: "Only TXT and PDF files are supported right now.",
      });
    }

    const cleanedText = text.replace(/\s+\n/g, "\n").trim();

    if (!cleanedText) {
      return response.status(400).json({
        error:
          "No readable text found. Scanned PDFs require OCR, which is not supported yet.",
      });
    }

    const wasTruncated = cleanedText.length > 45000;

    return response.status(200).json({
      filename: filename || "uploaded-file",
      text: cleanedText.slice(0, 45000),
      wasTruncated,
    });
  } catch (error) {
    console.error("File reading API error:", error);

    return response.status(500).json({
      error: "Failed to read file.",
    });
  }
}