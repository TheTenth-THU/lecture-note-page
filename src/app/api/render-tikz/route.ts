import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  encodeQuickLatexForm,
  parseQuickLatexResponse,
  parseTikzSource,
} from "@/lib/tikz";

const DEFAULT_RENDER_ENDPOINT = "https://www.quicklatex.com/latex3.f";
const DEFAULT_RENDER_HOST = "quicklatex.com";
const DEFAULT_TIMEOUT_MS = 45_000;

export async function POST(request: NextRequest) {
  let source = "";

  try {
    const body = (await request.json()) as { source?: string };
    source = body.source?.trim() || "";
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (!source) {
    return NextResponse.json(
      { error: "TikZ source `source` is required." },
      { status: 400 },
    );
  }

  const { env } = getCloudflareContext();
  const renderEndpoint = env.TIKZ_RENDER_ENDPOINT || DEFAULT_RENDER_ENDPOINT;
  const renderHost = env.TIKZ_RENDER_HOST || DEFAULT_RENDER_HOST;
  const timeoutMs = Number.parseInt(env.TIKZ_RENDER_TIMEOUT_MS || "", 10);
  const parsedTimeoutMs = Number.isFinite(timeoutMs) ? timeoutMs : DEFAULT_TIMEOUT_MS;
  const { body, preamble } = parseTikzSource(source);

  if (!body) {
    return NextResponse.json(
      { error: "TikZ source body is empty after preprocessing." },
      { status: 400 },
    );
  }

  const formBody = encodeQuickLatexForm({
    formula: body,
    preamble,
    fsize: "17px",
    fcolor: "000000",
    mode: "0",
    out: "1",
    remhost: renderHost,
    errors: "1",
  });

  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), parsedTimeoutMs);

  try {
    const response = await fetch(renderEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: formBody,
      signal: abortController.signal,
    });

    const raw = await response.text();
    const parsed = parseQuickLatexResponse(raw);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: parsed.ok ? "TikZ 渲染服务请求失败。" : parsed.error,
        },
        { status: 502 },
      );
    }

    if (!parsed.ok) {
      return NextResponse.json(
        {
          error: parsed.error,
          imageUrl: parsed.imageUrl,
        },
        { status: 422 },
      );
    }

    return NextResponse.json(parsed, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const isAbortError =
      error instanceof Error && error.name === "AbortError";

    return NextResponse.json(
      {
        error:
          isAbortError ?
            "TikZ 渲染超时，请稍后重试。"
          : "TikZ 渲染服务暂时不可用。",
      },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeoutHandle);
  }
}