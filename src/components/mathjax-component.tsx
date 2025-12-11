"use client";

import { useEffect, useRef } from "react";

// 定义一个类型，以便在 window 对象上安全地访问 MathJax
declare global {
  interface Window {
    MathJax: {
      tex?: {
        macros?: Record<string, string | [string, number]>;
      };
      startup?: { promise: Promise<void> };
      typeset: () => void;
      typesetPromise: (elements?: (HTMLElement | Document)[]) => Promise<void>;
    };
  }
}

export default function MathJaxComponent({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    // 调用 MathJax 的 typesetPromise 方法对数学公式进行排版
    const typesetMath = async () => {
      // 确保 MathJax 对象存在
      const mj = window.MathJax;
      if (!mj || !containerRef.current) {
        console.error("MathJax is not loaded.");
        return;
      }
      if (mj.startup?.promise) await mj.startup.promise;

      // 检查 MathJax 和 typesetPromise 是否存在
      if (mj && mj.typesetPromise) {
        try {
          await mj.typesetPromise([containerRef.current]);
        } catch (error) {
          if (!cancelled)
            console.error("MathJax typesetting error:", error);
        }
      }
    };

    typesetMath();
    return () => { cancelled = true; };
  }, [children]); // 每当子内容变化时重新排版

  return (<>
    <div ref={containerRef}>
      {children}
    </div>
    {/* Load MathJax script for rendering mathematical notation */}
  </>);
}