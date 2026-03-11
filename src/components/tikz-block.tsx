"use client";

import { useEffect, useState } from "react";

interface TikzRenderSuccess {
  ok: true;
  imageUrl: string;
  baseline: number;
  width: number;
  height: number;
}

interface TikzRenderFailure {
  ok: false;
  error: string;
  imageUrl?: string;
}

type TikzRenderResult = TikzRenderSuccess | TikzRenderFailure;

const tikzRenderCache = new Map<string, TikzRenderResult>();
const tikzRenderRequests = new Map<string, Promise<TikzRenderResult>>();

async function requestTikzRender(source: string): Promise<TikzRenderResult> {
  const cached = tikzRenderCache.get(source);
  if (cached) {
    return cached;
  }

  const inflight = tikzRenderRequests.get(source);
  if (inflight) {
    return inflight;
  }

  const requestPromise = fetch("/api/render-tikz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source }),
  })
    .then(async (response) => {
      const payload = (await response.json()) as TikzRenderResult | { error?: string };

      if (!response.ok) {
        const failure: TikzRenderFailure = {
          ok: false,
          error:
            "error" in payload && payload.error ? payload.error : "TikZ 渲染失败。",
        };
        tikzRenderCache.set(source, failure);
        return failure;
      }

      const success = payload as TikzRenderSuccess;
      tikzRenderCache.set(source, success);
      return success;
    })
    .catch((error: unknown) => {
      const failure: TikzRenderFailure = {
        ok: false,
        error:
          error instanceof Error ?
            error.message
          : "TikZ 渲染请求失败。",
      };
      tikzRenderCache.set(source, failure);
      return failure;
    })
    .finally(() => {
      tikzRenderRequests.delete(source);
    });

  tikzRenderRequests.set(source, requestPromise);
  return requestPromise;
}

export default function TikzBlock({ source }: { source: string }) {
  const [result, setResult] = useState<TikzRenderResult | null>(() => {
    return tikzRenderCache.get(source) || null;
  });

  useEffect(() => {
    let cancelled = false;

    requestTikzRender(source).then((nextResult) => {
      if (!cancelled) {
        setResult(nextResult);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [source]);

  return (
    <figure className="tikz-block not-prose">
      <figcaption className="tikz-block__title">TikZ</figcaption>
      <div className="tikz-block__canvas">
        {!result && <p className="tikz-block__status">正在渲染图形…</p>}
        {result?.ok && (
          <img
            src={result.imageUrl}
            alt="Rendered TikZ diagram"
            width={result.width || undefined}
            height={result.height || undefined}
            loading="lazy"
            className="tikz-block__image"
          />
        )}
        {result && !result.ok && (
          <p className="tikz-block__status tikz-block__status--error">
            {result.error}
          </p>
        )}
      </div>
      <details className="tikz-block__source">
        <summary>查看源码</summary>
        <pre>
          <code>{source}</code>
        </pre>
      </details>
    </figure>
  );
}