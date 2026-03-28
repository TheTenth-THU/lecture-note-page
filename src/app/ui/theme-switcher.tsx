"use client";

import { useTheme } from "@/contexts/theme-context";
import clsx from "clsx";
import { Button } from "./button";

export function ThemeSwitcher() {
  const {
    mode,
    setMode,
    font,
    setFont,
    vectorStyle,
    setVectorStyle,
    color,
    setColor,
  } = useTheme();
  const modeOptions = ["light", "dark", "system"] as const;
  const fontOptions = ["serif", "sans", "genshin", "rail"] as const;
  const colorOptions = ["tsinghua", "blue-purple"] as const;
  const vectorStyleOptions = [
    { key: "arrow-bold", label: "箭头粗体" },
    { key: "bold-no-arrow", label: "粗斜无箭头" },
  ] as const;

  return (
    <div className="bg-primary-b25 space-y-4 rounded-lg">
      {/* 模式切换 */}
      <div className="flex items-baseline justify-start gap-4">
        <p className="mb-2 text-sm font-semibold">外观</p>
        <div className="flex gap-2">
          {modeOptions.map((m) => (
            <Button
              key={m}
              onClick={() => {
                console.debug(
                  `[ThemeSwitcher] Switching theme mode to ${m} \n正在切换主题模式到 ${m}`,
                );
                setMode(m);
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
          {fontOptions.map((f) => (
            <Button
              key={f}
              onClick={() => {
                console.debug(
                  `[ThemeSwitcher] Switching font to ${f} \n正在切换字体到 ${f}`,
                );
                setFont(f);
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

      {/* 向量样式切换 */}
      <div className="flex items-baseline justify-start gap-4">
        <p className="mb-2 text-sm font-semibold">向量</p>
        <div className="flex gap-2">
          {vectorStyleOptions.map((item) => (
            <Button
              key={item.key}
              onClick={() => {
                console.debug(
                  `[ThemeSwitcher] Switching vector style to ${item.key} \n正在切换向量样式到 ${item.key}`,
                );
                setVectorStyle(item.key);
              }}
              isCurrent={vectorStyle === item.key}>
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 颜色切换 */}
      <div className="flex items-center justify-start gap-4">
        <p className="mb-2 text-sm font-semibold">主题</p>
        <div className="flex gap-2">
          {colorOptions.map((c) => (
            <Button
              key={c}
              onClick={() => {
                console.debug(
                  `[ThemeSwitcher] Switching color to ${c} \n正在切换主题颜色到 ${c}`,
                );
                setColor(c);
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
