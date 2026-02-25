"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type FontFamily = "serif" | "sans" | "genshin" | "rail" | "zenless";
type ThemeColor = "tsinghua" | "blue-purple";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  font: FontFamily;
  setFont: (font: FontFamily) => void;
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [font, setFont] = useState<FontFamily>("serif");
  const [color, setColor] = useState<ThemeColor>("tsinghua");

  // 初始化加载
  useEffect(() => {
    const savedMode = localStorage.getItem("theme-mode") as ThemeMode;
    const savedFont = localStorage.getItem("theme-font") as FontFamily;
    const savedColor = localStorage.getItem("theme-color") as ThemeColor;

    if (savedMode) setMode(savedMode);
    if (savedFont) setFont(savedFont);
    if (savedColor) setColor(savedColor);
  }, []);

  // 应用样式到 HTML 根元素
  useEffect(() => {
    const root = document.documentElement;

    // 深色模式处理
    root.classList.remove("light", "dark");
    if (mode === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.add(mode);
    }
    localStorage.setItem("theme-mode", mode);

    // 字体处理 (通过 data-attribute)
    root.setAttribute("data-font", font);
    localStorage.setItem("theme-font", font);

    // 主题色处理 (通过 data-attribute)
    root.setAttribute("data-theme-color", color);
    localStorage.setItem("theme-color", color);

  }, [mode, font, color]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, font, setFont, color, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}