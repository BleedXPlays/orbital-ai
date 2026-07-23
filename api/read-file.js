/* global Buffer, process */

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import JSZip from "jszip";
import mammoth from "mammoth";
import { protectApiRoute } from "./_lib/apiSecurity.js";

const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_LENGTH = 45000;
const DOCUMENT_WINDOW_LIMIT =
  Number.parseInt(process.env.DOCUMENT_WINDOW_LIMIT || "30", 10) || 30;
const DOCUMENT_WINDOW_HOURS =
  Number.parseInt(
    process.env.USAGE_WINDOW_HOURS ||
      process.env.CHAT_WINDOW_HOURS ||
      "8",
    10
  ) || 8;

const PLAIN_TEXT_EXTENSIONS = new Set([
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

const extractBase64 = (base64 = "") => {
  if (!base64) return "";
  if (base64.includes(",")) return base64.split(",")[1] || "";
  return base64;
};

const getFileExtension = (filename = "") => {
  const match = String(filename).toLowerCase().match(/\.[^.]+$/);
  return match?.[0] || "";
};

const decodeXmlEntities = (value = "") => {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10))
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
};

const stripMarkup = (value = "") => {
  return decodeXmlEntities(
    String(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  );
};

const collectXmlTagText = (xml = "", tagNames = []) => {
  const names = tagNames.join("|");
  const pattern = new RegExp(
    `<(?:${names})(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:${names})>`,
    "gi"
  );

  return [...String(xml).matchAll(pattern)]
    .map((match) => stripMarkup(match[1]).trim())
    .filter(Boolean);
};

const sortNumberedXmlFiles = (files, pattern) => {
  return files.sort((left, right) => {
    const leftNumber = Number(left.match(pattern)?.[1] || 0);
    const rightNumber = Number(right.match(pattern)?.[1] || 0);
    return leftNumber - rightNumber;
  });
};

const extractPptxText = async (fileBuffer) => {
  const archive = await JSZip.loadAsync(fileBuffer);
  const slideFiles = sortNumberedXmlFiles(
    Object.keys(archive.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(name)
    ),
    /slide(\d+)\.xml$/i
  );

  const slides = await Promise.all(
    slideFiles.map(async (name, index) => {
      const xml = await archive.file(name).async("string");
      const text = collectXmlTagText(xml, ["a:t"]).join("\n");
      return text ? `Slide ${index + 1}\n${text}` : "";
    })
  );

  return slides.filter(Boolean).join("\n\n");
};

const extractXlsxText = async (fileBuffer) => {
  const archive = await JSZip.loadAsync(fileBuffer);
  const sharedStringsFile = archive.file("xl/sharedStrings.xml");
  const sharedStringsXml = sharedStringsFile
    ? await sharedStringsFile.async("string")
    : "";
  const sharedStrings = [...sharedStringsXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/gi)]
    .map((match) => collectXmlTagText(match[1], ["t"]).join(""));
  const worksheetFiles = sortNumberedXmlFiles(
    Object.keys(archive.files).filter((name) =>
      /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)
    ),
    /sheet(\d+)\.xml$/i
  );

  const worksheets = await Promise.all(
    worksheetFiles.map(async (name, sheetIndex) => {
      const xml = await archive.file(name).async("string");
      const rows = [...xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/gi)]
        .map((rowMatch) => {
          const cells = [
            ...rowMatch[1].matchAll(/<c(?:\s([^>]*))?>([\s\S]*?)<\/c>/gi),
          ];

          return cells
            .map((cellMatch) => {
              const attributes = cellMatch[1] || "";
              const body = cellMatch[2] || "";
              const type = attributes.match(/\bt="([^"]+)"/i)?.[1] || "";

              if (type === "inlineStr") {
                return collectXmlTagText(body, ["t"]).join("");
              }

              const rawValue = body.match(/<v>([\s\S]*?)<\/v>/i)?.[1] || "";
              if (type === "s") {
                return sharedStrings[Number(rawValue)] || "";
              }

              return decodeXmlEntities(rawValue);
            })
            .join("\t");
        })
        .filter((row) => row.trim());

      return rows.length
        ? `Worksheet ${sheetIndex + 1}\n${rows.join("\n")}`
        : "";
    })
  );

  return worksheets.filter(Boolean).join("\n\n");
};

const extractOpenDocumentText = async (fileBuffer) => {
  const archive = await JSZip.loadAsync(fileBuffer);
  const contentFile = archive.file("content.xml");
  if (!contentFile) return "";

  const xml = await contentFile.async("string");
  return collectXmlTagText(xml, ["text:p", "text:h"]).join("\n");
};

const extractEpubText = async (fileBuffer) => {
  const archive = await JSZip.loadAsync(fileBuffer);
  const contentFiles = Object.keys(archive.files)
    .filter((name) => /\.(xhtml|html|htm)$/i.test(name))
    .sort();
  const sections = await Promise.all(
    contentFiles.map(async (name) => {
      const html = await archive.file(name).async("string");
      return stripMarkup(html).trim();
    })
  );

  return sections.filter(Boolean).join("\n\n");
};

const extractRtfText = (value = "") => {
  return String(value)
    .replace(/\\par[d]?\b/g, "\n")
    .replace(/\\tab\b/g, "\t")
    .replace(/\\'[0-9a-f]{2}/gi, (match) =>
      Buffer.from(match.slice(2), "hex").toString("latin1")
    )
    .replace(/\\[a-z]+-?\d*\s?/gi, "")
    .replace(/[{}]/g, "")
    .trim();
};

const extractPdfText = async (fileBuffer) => {
  const loadingTask = getDocument({
    data: new Uint8Array(fileBuffer),
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const document = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      });

      let lastY;
      let pageText = "";

      content.items.forEach((item) => {
        const currentY = item.transform?.[5];

        if (lastY === undefined || currentY === lastY) {
          pageText += item.str;
        } else {
          pageText += `\n${item.str}`;
        }

        lastY = currentY;
      });

      pages.push(pageText);
    }
  } finally {
    await document.destroy();
  }

  return pages.join("\n\n");
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const authenticatedUser = await protectApiRoute(request, response, {
    route: "read-file",
    minuteLimit: 20,
    windowLimit: Math.max(1, DOCUMENT_WINDOW_LIMIT),
    windowHours: Math.max(1, DOCUMENT_WINDOW_HOURS),
  });
  if (!authenticatedUser) return;

  try {
    const { fileBase64, filename, mimeType } = request.body || {};

    if (!fileBase64) {
      return response.status(400).json({
        error: "File is required.",
      });
    }

    const cleanBase64 = extractBase64(fileBase64);

    if (
      !cleanBase64 ||
      cleanBase64.length % 4 === 1 ||
      !/^[a-z0-9+/]*={0,2}$/i.test(cleanBase64)
    ) {
      return response.status(400).json({
        error: "The uploaded file data is invalid. Select the file again.",
        errorCode: "invalid_file_data",
      });
    }

    const fileBuffer = Buffer.from(cleanBase64, "base64");

    if (fileBuffer.length === 0) {
      return response.status(400).json({
        error: "The uploaded file is empty.",
        errorCode: "empty_file",
      });
    }

    if (fileBuffer.length > MAX_FILE_BYTES) {
      return response.status(413).json({
        error: "This document is larger than 3 MB. Upload a smaller file.",
        errorCode: "file_too_large",
      });
    }

    const lowerFilename = String(filename || "").toLowerCase();
    const type = String(mimeType || "").toLowerCase();
    const extension = getFileExtension(lowerFilename);

    let text = "";

    if (
      type.includes("text/") ||
      type.includes("application/json") ||
      type.includes("application/xml") ||
      PLAIN_TEXT_EXTENSIONS.has(extension)
    ) {
      text = fileBuffer.toString("utf-8");
      if (extension === ".html" || extension === ".htm") {
        text = stripMarkup(text);
      } else if (extension === ".rtf") {
        text = extractRtfText(text);
      } else if (extension === ".json") {
        try {
          text = JSON.stringify(JSON.parse(text), null, 2);
        } catch {
          // Keep malformed JSON readable as plain text.
        }
      }
    } else if (
      type.includes("application/pdf") ||
      extension === ".pdf"
    ) {
      text = await extractPdfText(fileBuffer);
    } else if (
      type.includes(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) ||
      extension === ".docx"
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
    } else if (
      type.includes(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      ) ||
      extension === ".pptx"
    ) {
      text = await extractPptxText(fileBuffer);
    } else if (
      type.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) ||
      extension === ".xlsx"
    ) {
      text = await extractXlsxText(fileBuffer);
    } else if (
      [
        "application/vnd.oasis.opendocument.text",
        "application/vnd.oasis.opendocument.presentation",
        "application/vnd.oasis.opendocument.spreadsheet",
      ].some((supportedType) => type.includes(supportedType)) ||
      [".odt", ".odp", ".ods"].includes(extension)
    ) {
      text = await extractOpenDocumentText(fileBuffer);
    } else if (type.includes("application/epub+zip") || extension === ".epub") {
      text = await extractEpubText(fileBuffer);
    } else if ([".doc", ".ppt", ".xls"].includes(extension)) {
      return response.status(400).json({
        error:
          "This is a legacy Microsoft Office file. Convert it to DOCX, PPTX, or XLSX and upload it again.",
        errorCode: "legacy_office_format",
      });
    } else {
      return response.status(400).json({
        error:
          "This file format cannot be read yet. Upload PDF, DOCX, PPTX, XLSX, OpenDocument, EPUB, or a text-based file.",
        errorCode: "unsupported_file_format",
      });
    }

    const cleanedText = text.replace(/\s+\n/g, "\n").trim();

    if (!cleanedText) {
      const isPdf =
        type.includes("application/pdf") || extension === ".pdf";

      return response.status(422).json({
        error: isPdf
          ? "This PDF contains no selectable text. It may be scanned or image-only, and OCR is not supported yet."
          : "This document does not contain readable text.",
        errorCode: isPdf ? "scanned_pdf" : "empty_document",
      });
    }

    const wasTruncated = cleanedText.length > MAX_EXTRACTED_TEXT_LENGTH;

    return response.status(200).json({
      filename: filename || "uploaded-file",
      text: cleanedText.slice(0, MAX_EXTRACTED_TEXT_LENGTH),
      wasTruncated,
    });
  } catch (error) {
    console.error("File reading API error:", error);
    const errorMessage = String(error?.message || "").toLowerCase();

    if (
      errorMessage.includes("password") ||
      errorMessage.includes("encrypted")
    ) {
      return response.status(422).json({
        error:
          "This document is password-protected. Remove the password and upload it again.",
        errorCode: "password_protected_document",
      });
    }

    if (
      errorMessage.includes("invalid pdf") ||
      errorMessage.includes("formaterror") ||
      errorMessage.includes("invalid zip") ||
      errorMessage.includes("central directory") ||
      errorMessage.includes("corrupt")
    ) {
      return response.status(422).json({
        error:
          "This document appears to be damaged or invalid. Open it locally, save a fresh copy, and upload it again.",
        errorCode: "invalid_document",
      });
    }

    return response.status(500).json({
      error:
        "OrbitalAI could not read this document. Try saving a fresh copy or converting it to PDF, DOCX, PPTX, XLSX, or TXT.",
      errorCode: "file_read_failed",
    });
  }
}
