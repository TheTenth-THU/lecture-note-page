'use client';

import Script from 'next/script';
import { useState } from 'react';

export default function MathJaxLoader() {
  // 默认尝试 CDN，如果失败则切换到本地
  const [scriptSrc, setScriptSrc] = useState('https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js');

  const texMacros: Record<string, string | [string, number]> = {
    // 微积分
    dif: "{\\mathop{}\\!\\mathrm{d}}",
    Dif: "{\\mathop{}\\!\\mathrm{D}}",
    dint: "{\\displaystyle\\int}",
    // 向量
    v: ["{\\vec{\\boldsymbol{#1}}}", 1],
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

  return (
    <>
      {/* Configure MathJax */}
      <Script
        id="mathjax-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.MathJax = {
              tex: {
                macros: ${JSON.stringify(texMacros)}
              },
              output: {
                font: 'mathjax-asana'
              },
              loader: { 
                load: ['ui/lazy'] 
              }
            };
          `,
        }}
      />
      
      {/* Load MathJax script with fallback */}
      <Script
        src={scriptSrc}
        strategy="afterInteractive"
        onError={() => {
          console.warn(`MathJax CDN load failed (${scriptSrc}). Switching to local backup.`);
          setScriptSrc('/scripts/mathjax.js');
        }}
      />
    </>
  );
}