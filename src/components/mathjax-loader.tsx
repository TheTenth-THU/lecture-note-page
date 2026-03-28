"use client";

import { useState, useEffect } from "react";
import { useTheme, type VectorStyle } from "@/contexts/theme-context";

const LOCAL_SCRIPT_SRC = "/scripts/mathjax/tex-mml-chtml-nofont.js";
const CDN_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml-nofont.js";
const LOCAL_FONTS_PATH = "/scripts/mathjax";
const CONFIG_SCRIPT_ID = "mathjax-config-script";
const RUNTIME_SCRIPT_ID = "mathjax-runtime-script";

declare global {
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

function cleanupMathJaxScripts() {
  document.getElementById(CONFIG_SCRIPT_ID)?.remove();
  document.getElementById(RUNTIME_SCRIPT_ID)?.remove();
}

function getVectorMacro(vectorStyle: VectorStyle): [string, number] {
  if (vectorStyle === "bold-no-arrow") {
    return ["{\\boldsymbol{#1}}", 1];
  }

  return ["{\\vec{\\boldsymbol{#1}}}", 1];
}

function getTexMacros(
  vectorStyle: VectorStyle,
): Record<string, string | [string, number]> {
  // 微积分
  return {
    dif: "{\\mathop{}\\!\\mathrm{d}}",
    Dif: "{\\mathop{}\\!\\mathrm{D}}",
    dint: "{\\displaystyle\\int}",
    // 向量
    v: getVectorMacro(vectorStyle),
    vu: ["{\\hat{\\boldsymbol{#1}}}", 1],
    vr: "{\\v{r}}",
    vv: "{\\v{v}}",
    vs: ["{\\v{\\mathcal{#1}}}", 1],
    vsr: ["{\\v{\\mathscr{#1}}}", 1],
    sr: "{\\mathscr{r}}",
    t: ["{\\tilde{#1}}", 1],
    cpq: ["{\\t{#1}}", 1],
    cpv: ["{\\t{\\v{#1}}}", 1],
    bra: ["{\\left\\langle #1 \\right|}", 1],
    ket: ["{\\left| #1 \\right\\rangle}", 1],
    braket: ["{\\left\\langle #1 \\right\\rangle}", 1],
    // 字形
    rmu: ["{\\mathop{}\\!\\mathrm{#1}}", 1],
    I: "{\\mathbb{i}}",
    J: "{\\mathbb{j}}",
    e: "{\\mathrm{e}}",
    // 文本
    mark: ["{\\bbox[5pt, border:1.5px solid]{#1}}", 1],
    Sa: "{\\mathop{\\mathrm{Sa}}}",
    sinc: "{\\mathop{\\mathrm{sinc}}}",
    sgn: "{\\mathop{\\mathrm{sgn}}}",
    // 关系符号
    join: "{\\mathop{\\Join}\\limits}",
    ojoin: "{\\mathop{\\mathrm{⟗}}\\limits}",
    fojoin: "{\\ojoin}",
    lojoin: "{\\mathop{\\mathrm{⟕}}\\limits}",
    rojoin: "{\\mathop{\\mathrm{⟖}}\\limits}",
  };
}

export default function MathJaxLoader() {
  // 默认本地优先，如果失败则切换到 jsDelivr
  const [scriptSrc, setScriptSrc] = useState(LOCAL_SCRIPT_SRC);
  const { font, vectorStyle, hydrated } = useTheme();
  const mathJaxFontName = font === "sans" ? "mathjax-fira" : "mathjax-tex";

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.__activeMathJaxFont__ = undefined;

    // 捕获 MathJax 内部的异步加载失败
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorMsg = event.reason?.message || event.reason?.toString() || "";
      if (errorMsg.includes("MathJax") || errorMsg.includes("Can't load")) {
        console.warn(
          `[MathJaxLoader] MathJax internal dependency failed. Switching to jsDelivr fallback. \nMathJax 内部依赖加载失败，正在切换到 jsDelivr 备用方案。`,
          event.reason,
        );
        event.preventDefault();

        if (scriptSrc !== CDN_SCRIPT_SRC) {
          setScriptSrc(CDN_SCRIPT_SRC);
        }
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
  }, [hydrated, scriptSrc]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;
    const runtimeId = `${scriptSrc}:${mathJaxFontName}:${vectorStyle}:${Date.now()}`;

    window.__activeMathJaxFont__ = undefined;
    window.__mathJaxRuntimeId__ = runtimeId;
    delete window.MathJax;
    cleanupMathJaxScripts();

    const configScript = document.createElement("script");
    configScript.id = CONFIG_SCRIPT_ID;
    configScript.type = "text/javascript";
    const texMacros = getTexMacros(vectorStyle);
    configScript.text = `
      window.MathJax = {
        tex: {
          packages: {'[+]': ['boldsymbol']},
          macros: ${JSON.stringify(texMacros)}
        },
        output: {
          font: '${mathJaxFontName}',
          fontPath: '[fonts]/%%FONT%%-font'
        },
        loader: {
          paths: {
            fonts: '${LOCAL_FONTS_PATH}'
          },
          load: ['[tex]/boldsymbol']
        }
      };
    `;
    document.body.appendChild(configScript);

    const runtimeScript = document.createElement("script");
    runtimeScript.id = RUNTIME_SCRIPT_ID;
    runtimeScript.async = true;
    runtimeScript.src = scriptSrc;
    runtimeScript.onload = async () => {
      const mj = window.MathJax;
      if (!mj?.startup?.promise) {
        console.error(
          "[MathJaxLoader] MathJax startup promise is unavailable. \nMathJax 的启动承诺不可用。",
          {
            scriptSrc,
            mathJaxFontName,
            vectorStyle,
            runtimeId,
          },
        );
        return;
      }

      try {
        await mj.startup.promise;
      } catch (error) {
        if (!cancelled && scriptSrc !== CDN_SCRIPT_SRC) {
          console.warn(
            "[MathJaxLoader] MathJax startup failed. Switching to jsDelivr fallback. \n数学公式库启动失败，正在切换到 jsDelivr 备用方案。",
            error,
          );
          setScriptSrc(CDN_SCRIPT_SRC);
        }
        return;
      }

      if (cancelled || window.__mathJaxRuntimeId__ !== runtimeId) {
        return;
      }

      window.__activeMathJaxFont__ = mathJaxFontName;
      window.dispatchEvent(
        new CustomEvent("mathjax-ready", {
          detail: { fontName: mathJaxFontName, scriptSrc },
        }),
      );
      console.debug("[MathJaxLoader] Runtime ready \n运行时准备就绪 \n", {
        scriptSrc,
        mathJaxFontName,
        vectorStyle,
        runtimeId,
      });
    };
    runtimeScript.onerror = () => {
      if (cancelled) {
        return;
      }

      console.warn(
        `[MathJaxLoader] MathJax load failed (${scriptSrc}). Switching to jsDelivr fallback. \n数学公式库加载失败（${scriptSrc}），正在切换到 jsDelivr 备用方案。`,
      );
      if (scriptSrc !== CDN_SCRIPT_SRC) {
        setScriptSrc(CDN_SCRIPT_SRC);
      }
    };
    document.body.appendChild(runtimeScript);

    return () => {
      cancelled = true;
      if (window.__mathJaxRuntimeId__ === runtimeId) {
        window.__activeMathJaxFont__ = undefined;
        window.__mathJaxRuntimeId__ = undefined;
        delete window.MathJax;
      }
      cleanupMathJaxScripts();
    };
  }, [hydrated, mathJaxFontName, scriptSrc, vectorStyle]);

  return null;
}
