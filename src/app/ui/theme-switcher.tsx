"use client";

import { useTheme } from "@/contexts/theme-context";
import clsx from "clsx";
import { Button } from "./button";

export function ThemeSwitcher() {
  const { mode, setMode, font, setFont, color, setColor } = useTheme();

  return (
    <div className="bg-primary-b25 space-y-4 rounded-lg">
      {/* 模式切换 */}
      <div className="flex items-baseline justify-start gap-4">
        <p className="mb-2 text-sm font-semibold">外观</p>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((m) => (
            <Button
              key={m}
              onClick={() => {
                console.log(`Switching theme mode to ${m}`);
                setMode(m as any);
              }}
              isCurrent={mode === m}>
              {m === "light" ?
                "浅色"
              : m === "dark" ?
                "深色"
              : "系统"}
            </Button>
          ))}
        </div>
      </div>

      {/* 字体切换 */}
      <div className="flex items-baseline justify-start gap-4">
        <p className="mb-2 text-sm font-semibold">字体</p>
        <div className="flex gap-2">
          {["serif", "sans", "genshin", "rail"].map((f) => (
            <Button
              key={f}
              onClick={() => {
                console.log(`Switching font to ${f}`);
                setFont(f as any);
              }}
              style={{
                fontFamily: `var(--font-${f})`,
              }}
              isCurrent={font === f}>
              文/Aa
            </Button>
          ))}
        </div>
      </div>

      {/* 颜色切换 */}
      <div className="flex items-center justify-start gap-4">
        <p className="mb-2 text-sm font-semibold">主题</p>
        <div className="flex gap-2">
          {["tsinghua", "blue-purple"].map((c) => (
            <Button
              key={c}
              onClick={() => {
                console.log(`Switching color to ${c}`);
                setColor(c as any);
              }}
              isCurrent={color === c}
              className={clsx(
                "w-9 bg-linear-to-br hover:rounded-full hover:border-2",
                {
                  "from-[#660974] to-[#C83272]":
                    c === "tsinghua" && mode !== "dark",
                  "from-[#4f075a] to-[#a8054c]":
                    c === "tsinghua" && mode === "dark",
                  "from-[#1e40af] to-[#4d2ebc]":
                    c === "blue-purple" && mode !== "dark",
                  "from-[#2a4dc0] to-[#5733d9]":
                    c === "blue-purple" && mode === "dark",
                },
              )}>
              <span></span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
