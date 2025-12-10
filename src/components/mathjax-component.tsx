"use client";

import { useEffect } from "react";

// 定义一个类型，以便在 window 对象上安全地访问 MathJax
declare global {
  interface Window {
    MathJax: {
      tex?: {
        macros?: Record<string, string | [string, number]>;
      };
      typeset: () => void;
      typesetPromise: () => Promise<void>;
    };
  }
}

export default function MathJaxComponent({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    /**
     * 调用 MathJax 的 typesetPromise 方法对数学公式进行排版
     */
    const typesetMath = async () => {
      // 确保 MathJax 对象及其 tex 属性存在
      if (!window.MathJax) {
        console.error("MathJax is not loaded.");
        return;
      }
      // 检查 MathJax 和 typesetPromise 是否存在
      if (window.MathJax && window.MathJax.typesetPromise) {
        try {
          await window.MathJax.typesetPromise();
        } catch (error) {
          console.error("MathJax typesetting error:", error);
        }
      }
    };

    typesetMath();
  }, [children]); // 每当子内容变化时重新排版

  return (<>
    {children}
    {/* Load MathJax script for rendering mathematical notation */}
  </>);
}