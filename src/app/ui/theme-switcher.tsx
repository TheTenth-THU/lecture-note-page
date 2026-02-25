"use client";

import { useTheme } from "@/contexts/theme-context";
import clsx from "clsx";
import { Button } from "./button";


export function ThemeSwitcher() {
  const { mode, setMode, font, setFont, color, setColor } = useTheme();

  return (
    <div className="rounded-lg bg-primary-b25 space-y-4">
      {/* 模式切换 */}
      <div className="flex justify-start items-baseline gap-4">
        <p className="text-sm font-semibold mb-2">Appearance</p>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((m) => (
            <Button
              key={m}
              onClick={() => setMode(m as any)}
              isActive={mode === m}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* 字体切换 */}
      <div className="flex justify-start items-baseline gap-4">
        <p className="text-sm font-semibold mb-2">Font</p>
        <div className="flex gap-2">
          {["serif", "sans"].map((f) => (
            <Button
              key={f}
              onClick={() => setFont(f as any)}
              isActive={font === f}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* 颜色切换 */}
      <div className="flex justify-start items-center gap-4">
        <p className="text-sm font-semibold mb-2">Theme</p>
        <div className="flex gap-2">
          {["tsinghua", "blue-purple",].map((c) => (
            <Button
              key={c}
              onClick={() => setColor(c as any)}
              isActive={color === c}
              className={clsx("bg-linear-to-br w-9 hover:border-2 hover:rounded-full",
                {
                  "from-[#660974] to-[#C83272]": c === "tsinghua" && mode !== "dark",
                  "from-[#4f075a] to-[#a8054c]": c === "tsinghua" && mode === "dark",
                  "from-[#1e40af] to-[#4d2ebc]": c === "blue-purple" && mode !== "dark",
                  "from-[#2a4dc0] to-[#5733d9]": c === "blue-purple" && mode === "dark",
                }
              )}
              aria-label={`选择${c}色`}>
              <span></span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}