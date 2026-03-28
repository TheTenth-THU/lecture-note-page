"use client";

import { useEffect, useRef } from "react";

// 定义一个类型，以便在 window 对象上安全地访问 MathJax
declare global {
  interface WindowEventMap {
    "mathjax-ready": CustomEvent<{ fontName: string; scriptSrc: string }>;
  }

  interface Window {
    __activeMathJaxFont__?: string;
    __mathJaxRuntimeId__?: string;
    MathJax?: {
      config?: {
        output?: {
          font?: string;
          fontPath?: string;
        };
      };
      tex?: {
        macros?: Record<string, string | [string, number]>;
      };
      startup?: { promise?: Promise<void> };
      typesetClear?: (elements?: (HTMLElement | Document)[]) => void;
      typeset?: () => void;
      typesetPromise?: (elements?: (HTMLElement | Document)[]) => Promise<void>;
    };
  }
}

export default function MathJaxComponent({
  children,
  fontName,
  renderKey,
}: {
  children: React.ReactNode;
  fontName: string;
  renderKey?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const waitForMathJax = async () => {
      const isRuntimeReady = () => {
        return (
          window.__activeMathJaxFont__ === fontName &&
          !!window.MathJax?.startup?.promise &&
          typeof window.MathJax?.typesetPromise === "function"
        );
      };

      if (isRuntimeReady()) {
        await window.MathJax?.startup?.promise;
        if (isRuntimeReady()) {
          return;
        }
      }

      await new Promise<void>((resolve) => {
        const handleReady = (
          event: CustomEvent<{ fontName: string; scriptSrc: string }>,
        ) => {
          if (cancelled || event.detail.fontName !== fontName) {
            return;
          }

          window.removeEventListener("mathjax-ready", handleReady);
          resolve();
        };

        window.addEventListener("mathjax-ready", handleReady);
      });
    };

    // 调用 MathJax 的 typesetPromise 方法对数学公式进行排版
    const typesetMath = async () => {
      await waitForMathJax();

      const mj = window.MathJax;
      if (!mj) {
        console.error(
          "[MathJaxComponent] MathJax is not loaded. \nMathJax 未加载。\n",
          {
            fontName,
            renderKey,
            activeFont: window.__activeMathJaxFont__,
          },
        );
        return;
      }

      if (cancelled) {
        return;
      }

      // 检查 MathJax 和 typesetPromise 是否存在
      if (mj && mj.typesetPromise) {
        try {
          console.debug(
            "[MathJaxComponent] Typesetting... \nMathJax 排版中... \n",
            {
              fontName,
              renderKey,
              activeFont: window.__activeMathJaxFont__,
            },
          );
          if (typeof mj.typesetClear === "function") {
            mj.typesetClear([container]);
          }
          await mj.typesetPromise([container]);
        } catch (error) {
          if (!cancelled)
            console.error(
              "[MathJaxComponent] MathJax typesetting error: \nMathJax 排版错误：\n",
              error,
            );
        }
      }
    };

    typesetMath();
    return () => {
      cancelled = true;
      const mj = window.MathJax;
      if (mj && typeof mj.typesetClear === "function") {
        mj.typesetClear([container]);
      }
    };
  }, [children, fontName, renderKey]); // 子内容或字体切换时重新排版

  return (
    <>
      <div ref={containerRef}>{children}</div>
      {/* Load MathJax script for rendering mathematical notation */}
    </>
  );
}
