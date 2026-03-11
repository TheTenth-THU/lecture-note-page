const DEFAULT_TIKZ_PREAMBLE = String.raw`\usepackage{tikz}`;

const DOCUMENT_CLASS_PATTERN = /\\documentclass(?:\[[^\]]*\])?\{[^}]+\}\s*/g;
const BEGIN_DOCUMENT_PATTERN = /\\begin\{document\}/i;
const END_DOCUMENT_PATTERN = /\\end\{document\}/i;

export interface ParsedTikzSource {
  originalSource: string;
  body: string;
  preamble: string;
}

function normalizeLineEndings(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

function stripDocumentClass(input: string): string {
  return input.replace(DOCUMENT_CLASS_PATTERN, "").trim();
}

function joinPreambleSections(sections: string[]): string {
  return sections.filter(Boolean).join("\n").trim();
}

function extractFromFullDocument(source: string): ParsedTikzSource | null {
  const beginDocumentMatch = source.match(BEGIN_DOCUMENT_PATTERN);
  const endDocumentMatch = source.match(END_DOCUMENT_PATTERN);

  if (!beginDocumentMatch || !endDocumentMatch) {
    return null;
  }

  const bodyStart = beginDocumentMatch.index! + beginDocumentMatch[0].length;
  const bodyEnd = endDocumentMatch.index!;
  const preamble = stripDocumentClass(source.slice(0, beginDocumentMatch.index));
  const body = source.slice(bodyStart, bodyEnd).trim();

  return {
    originalSource: source,
    preamble: joinPreambleSections([DEFAULT_TIKZ_PREAMBLE, preamble]),
    body,
  };
}

function isPreambleDirective(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }

  return (
    trimmed.startsWith("%") ||
    trimmed.startsWith("\\usepackage") ||
    trimmed.startsWith("\\usetikzlibrary") ||
    trimmed.startsWith("\\usepgflibrary") ||
    trimmed.startsWith("\\newcommand") ||
    trimmed.startsWith("\\renewcommand") ||
    trimmed.startsWith("\\providecommand") ||
    trimmed.startsWith("\\DeclareMathOperator") ||
    trimmed.startsWith("\\tikzset") ||
    trimmed.startsWith("\\pgfplotsset") ||
    trimmed.startsWith("\\def")
  );
}

function extractHeuristically(source: string): ParsedTikzSource {
  const lines = source.split("\n");
  const preambleLines: string[] = [];
  const bodyLines: string[] = [];

  let bodyStarted = false;
  for (const line of lines) {
    if (!bodyStarted && isPreambleDirective(line)) {
      preambleLines.push(line);
      continue;
    }

    bodyStarted = true;
    bodyLines.push(line);
  }

  const preamble = stripDocumentClass(preambleLines.join("\n"));
  const body = bodyLines.join("\n").trim() || source.trim();

  return {
    originalSource: source,
    preamble: joinPreambleSections([DEFAULT_TIKZ_PREAMBLE, preamble]),
    body,
  };
}

export function parseTikzSource(input: string): ParsedTikzSource {
  const source = normalizeLineEndings(input).trim();
  const fromDocument = extractFromFullDocument(source);

  if (fromDocument) {
    return fromDocument;
  }

  return extractHeuristically(source);
}

export interface QuickLatexSuccess {
  ok: true;
  imageUrl: string;
  baseline: number;
  width: number;
  height: number;
}

export interface QuickLatexFailure {
  ok: false;
  error: string;
  imageUrl?: string;
}

export type QuickLatexResponse = QuickLatexSuccess | QuickLatexFailure;

export function encodeQuickLatexForm(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}

export function parseQuickLatexResponse(raw: string): QuickLatexResponse {
  const pattern = /^([-]?\d+)\r?\n(\S+)\s([-]?\d+)\s(\d+)\s(\d+)\r?\n?([\s\S]*)$/;
  const match = raw.match(pattern);

  if (!match) {
    return {
      ok: false,
      error: raw.trim() || "TikZ 渲染服务返回了无法识别的响应。",
    };
  }

  const [, status, imageUrl, baseline, width, height, error] = match;

  if (status === "0") {
    return {
      ok: true,
      imageUrl,
      baseline: Number.parseInt(baseline, 10),
      width: Number.parseInt(width, 10),
      height: Number.parseInt(height, 10),
    };
  }

  return {
    ok: false,
    error: error.trim() || "TikZ 渲染失败。",
    imageUrl,
  };
}