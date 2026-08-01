import { Fragment, useState } from "react";

const INLINE_PATTERN = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*[^*\n]+\*|_[^_\n]+_)/g;

const renderInline = (text, keyPrefix) =>
  String(text || "")
    .split(INLINE_PATTERN)
    .filter(Boolean)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (
        (part.startsWith("**") && part.endsWith("**")) ||
        (part.startsWith("__") && part.endsWith("__"))
      ) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }

      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={key}
            className="rounded-md border border-blue-200/10 bg-blue-300/[0.07] px-1.5 py-0.5 font-mono text-[0.9em] text-violet-100"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      const linkMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 transition hover:text-violet-200"
          >
            {linkMatch[1]}
          </a>
        );
      }

      if (
        (part.startsWith("*") && part.endsWith("*")) ||
        (part.startsWith("_") && part.endsWith("_"))
      ) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }

      return <Fragment key={key}>{part}</Fragment>;
    });

const splitTableRow = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());

const isTableSeparator = (line) => {
  const cells = splitTableRow(line);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))
  );
};

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-blue-200/[0.12] bg-[#020817]/85 shadow-[0_14px_38px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-blue-100/[0.08] bg-blue-300/[0.035] px-3 py-2 sm:px-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-md border border-blue-200/10 bg-white/[0.035] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition hover:border-violet-300/25 hover:text-white"
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre className="max-w-full overflow-x-auto p-4 text-[13px] leading-6 text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MarkdownBlocks({ text, blockKey }) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const classes =
        level === 1
          ? "mt-6 mb-3 text-2xl font-bold text-white"
          : level === 2
          ? "mt-5 mb-2.5 text-xl font-bold text-white"
          : "mt-4 mb-2 text-base font-semibold text-slate-100";
      const Tag = `h${level}`;
      blocks.push(
        <Tag key={`${blockKey}-heading-${index}`} className={classes}>
          {renderInline(heading[2], `${blockKey}-heading-inline-${index}`)}
        </Tag>
      );
      index += 1;
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*+]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul
          key={`${blockKey}-ul-${index}`}
          className="my-3 list-disc space-y-1.5 pl-6 marker:text-violet-300"
        >
          {items.map((item, itemIndex) => (
            <li key={`${blockKey}-ul-item-${itemIndex}`}>
              {renderInline(item, `${blockKey}-ul-inline-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+[.)]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+[.)]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol
          key={`${blockKey}-ol-${index}`}
          className="my-3 list-decimal space-y-1.5 pl-6 marker:font-semibold marker:text-violet-300"
        >
          {items.map((item, itemIndex) => (
            <li key={`${blockKey}-ol-item-${itemIndex}`}>
              {renderInline(item, `${blockKey}-ol-inline-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim().startsWith(">")) {
      const quote = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].trim().replace(/^>\s?/, ""));
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`${blockKey}-quote-${index}`}
          className="my-4 border-l-2 border-violet-400/50 bg-violet-400/[0.045] px-4 py-3 text-slate-300"
        >
          {renderInline(quote.join(" "), `${blockKey}-quote-inline-${index}`)}
        </blockquote>
      );
      continue;
    }

    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1])
    ) {
      const headers = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push(
        <div
          key={`${blockKey}-table-${index}`}
          className="my-4 max-w-full overflow-x-auto rounded-xl border border-blue-200/[0.12]"
        >
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-blue-300/[0.055] text-slate-100">
              <tr>
                {headers.map((header, cellIndex) => (
                  <th
                    key={`${blockKey}-th-${cellIndex}`}
                    className="border-b border-blue-100/[0.1] px-3 py-2.5 font-semibold"
                  >
                    {renderInline(header, `${blockKey}-th-inline-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${blockKey}-tr-${rowIndex}`} className="border-b border-blue-100/[0.07] last:border-0">
                  {headers.map((_, cellIndex) => (
                    <td
                      key={`${blockKey}-td-${rowIndex}-${cellIndex}`}
                      className="px-3 py-2.5 align-top text-slate-300"
                    >
                      {renderInline(
                        row[cellIndex] || "",
                        `${blockKey}-td-inline-${rowIndex}-${cellIndex}`
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(
        <hr key={`${blockKey}-hr-${index}`} className="my-5 border-blue-100/[0.1]" />
      );
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,4})\s+/.test(lines[index]) &&
      !/^\s*[-*+]\s+/.test(lines[index]) &&
      !/^\s*\d+[.)]\s+/.test(lines[index]) &&
      !lines[index].trim().startsWith(">") &&
      !(
        lines[index].includes("|") &&
        index + 1 < lines.length &&
        isTableSeparator(lines[index + 1])
      )
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`${blockKey}-paragraph-${index}`} className="my-3 first:mt-0 last:mb-0">
        {renderInline(paragraph.join(" "), `${blockKey}-paragraph-inline-${index}`)}
      </p>
    );
  }

  return blocks;
}

function MarkdownContent({ children }) {
  const text = String(children || "");
  const parts = text.split(/```([\w.+-]*)\n?([\s\S]*?)```/g);

  return (
    <div className="break-words text-[15px] font-normal leading-7 text-gray-100">
      {parts.map((part, index) => {
        if (index % 3 === 2) return null;
        if (index % 3 === 1) {
          return (
            <CodeBlock
              key={`code-${index}`}
              language={part}
              code={parts[index + 1] || ""}
            />
          );
        }
        return <MarkdownBlocks key={`text-${index}`} text={part} blockKey={`text-${index}`} />;
      })}
    </div>
  );
}

export default MarkdownContent;
