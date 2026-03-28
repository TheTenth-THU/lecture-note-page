import MarkdownIt from "markdown-it";
import markdownItMultimdTable from "markdown-it-multimd-table";

const txRenderer = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
}).use(markdownItMultimdTable, {
  multiline: true,
  rowspan: true,
  headerless: true,
  multibody: true,
  autolabel: true,
});

function isFenceStart(line: string): boolean {
  return /^\s*```+/.test(line);
}

function parseFenceLanguage(line: string): string {
  const match = line.match(/^\s*```+\s*([^\s`]*)/);
  return (match?.[1] || "").toLowerCase();
}

function isFenceEnd(line: string): boolean {
  return /^\s*```+\s*$/.test(line);
}

function isLikelyTableLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  if (/^\[[^\]]+\]$/.test(trimmed)) {
    return true;
  }

  return trimmed.includes("|");
}

function hasOddTrailingBackslashes(value: string): boolean {
  let count = 0;
  for (let i = value.length - 1; i >= 0 && value[i] === "\\"; i -= 1) {
    count += 1;
  }
  return count % 2 === 1;
}

function renderTxBlockOrFallback(
  blockLines: string[],
  fallbackLines: string[],
): string[] {
  const source = blockLines.join("\n").trim();
  if (!source) {
    return fallbackLines;
  }

  try {
    const rendered = txRenderer.render(source).trimEnd();
    if (!rendered.includes("<table")) {
      return fallbackLines;
    }

    return rendered.split("\n");
  } catch (error) {
    console.warn(
      "[txRenderer] Failed to render tx table block, falling back to source:\n渲染 tx 表格块失败，回退到原始内容：\n",
      error,
    );
    return fallbackLines;
  }
}

function transformTxBlocks(markdown: string): string {
  const lines = markdown.split("\n");
  const output: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (isFenceStart(line)) {
      const language = parseFenceLanguage(line);

      if (language !== "tx") {
        output.push(line);
        i += 1;
        while (i < lines.length) {
          output.push(lines[i]);
          if (isFenceEnd(lines[i])) {
            i += 1;
            break;
          }
          i += 1;
        }
        continue;
      }

      const startFence = line;
      const blockLines: string[] = [];
      i += 1;

      while (i < lines.length && !isFenceEnd(lines[i])) {
        blockLines.push(lines[i]);
        i += 1;
      }

      const fallbackLines = [...blockLines];
      if (i < lines.length && isFenceEnd(lines[i])) {
        i += 1;
      } else {
        // Fence is not closed, keep the original content to avoid content loss.
        output.push(startFence, ...blockLines);
        break;
      }

      output.push(...renderTxBlockOrFallback(blockLines, fallbackLines));
      continue;
    }

    output.push(line);
    i += 1;
  }

  return output.join("\n");
}

function transformTxMarkers(markdown: string): string {
  const lines = markdown.split("\n");
  const output: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() !== "-tx-") {
      output.push(line);
      i += 1;
      continue;
    }

    const blockLines: string[] = [];
    let seenTableLine = false;
    let cursor = i + 1;

    while (cursor < lines.length) {
      const current = lines[cursor];
      const previous =
        blockLines.length > 0 ? blockLines[blockLines.length - 1] : "";
      const currentTrimmed = current.trim();

      if (currentTrimmed === "") {
        const next = lines[cursor + 1];
        if (
          next === undefined ||
          (!isLikelyTableLine(next) &&
            !hasOddTrailingBackslashes(previous.trimEnd()))
        ) {
          break;
        }
        blockLines.push(current);
        cursor += 1;
        continue;
      }

      if (
        isLikelyTableLine(current) ||
        hasOddTrailingBackslashes(previous.trimEnd())
      ) {
        if (isLikelyTableLine(current)) {
          seenTableLine = true;
        }
        blockLines.push(current);
        cursor += 1;
        continue;
      }

      break;
    }

    if (!seenTableLine || blockLines.length === 0) {
      output.push(line);
      i += 1;
      continue;
    }

    output.push(...renderTxBlockOrFallback(blockLines, [line, ...blockLines]));
    i = cursor;
  }

  return output.join("\n");
}

export default function transformExtendedTableSyntax(markdown: string): string {
  const transformedTxBlocks = transformTxBlocks(markdown);
  return transformTxMarkers(transformedTxBlocks);
}
