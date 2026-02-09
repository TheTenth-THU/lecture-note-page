"use client";

import { useTheme } from "@/contexts/theme-context";

export function ThemeSwitcher() {
  const { mode, setMode, font, setFont, color, setColor } = useTheme();

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm space-y-4">
      {/* 模式切换 */}
      <div>
        <h3 className="text-sm font-semibold mb-2">外观</h3>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              className={`px-3 py-1 rounded text-sm ${mode === m ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-700"
                }`}
            >
              {m === "light" ? "浅色" : m === "dark" ? "深色" : "跟随系统"}
            </button>
          ))}
        </div>
      </div>

      {/* 字体切换 */}
      <div>
        <h3 className="text-sm font-semibold mb-2">字体</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFont("serif")}
            className={`px-3 py-1 rounded text-sm font-serif ${font === "serif" ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-700"
              }`}
          >
            衬线体
          </button>
          <button
            onClick={() => setFont("sans")}
            className={`px-3 py-1 rounded text-sm font-sans ${font === "sans" ? "bg-primary text-primary-foreground" : "bg-gray-100 dark:bg-gray-700"
              }`}
          >
            无衬线
          </button>
        </div>
      </div>

      {/* 颜色切换 */}
      <div>
        <h3 className="text-sm font-semibold mb-2">主题色</h3>
        <div className="flex gap-2">
          {["blue", "green", "purple"].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c as any)}
              className={`w-8 h-8 rounded-full border-2 ${color === c ? "border-gray-900 dark:border-white" : "border-transparent"
                }`}
              style={{ backgroundColor: c === "blue" ? "#3b82f6" : c === "green" ? "#22c55e" : "#a855f7" }}
              aria-label={`选择${c}色`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}