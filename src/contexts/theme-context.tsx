"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";
type FontFamily = "serif" | "sans" | "genshin" | "rail" | "zenless";
type ThemeColor = "tsinghua" | "blue-purple";
export type VectorStyle = "arrow-bold" | "bold-no-arrow";

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  font: FontFamily;
  setFont: (font: FontFamily) => void;
  vectorStyle: VectorStyle;
  setVectorStyle: (style: VectorStyle) => void;
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
  hydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [font, setFont] = useState<FontFamily>("serif");
  const [vectorStyle, setVectorStyle] = useState<VectorStyle>("arrow-bold");
  const [color, setColor] = useState<ThemeColor>("tsinghua");
  const [hydrated, setHydrated] = useState(false);

  // 初始化加载
  useEffect(() => {
    const savedMode = localStorage.getItem("theme-mode") as ThemeMode;
    const savedFont = localStorage.getItem("theme-font") as FontFamily;
    const savedVectorStyle = localStorage.getItem(
      "theme-vector-style",
    ) as VectorStyle;
    const savedColor = localStorage.getItem("theme-color") as ThemeColor;

    if (savedMode) setMode(savedMode);
    if (savedFont) setFont(savedFont);
    if (savedVectorStyle) setVectorStyle(savedVectorStyle);
    if (savedColor) setColor(savedColor);

    setHydrated(true);
  }, []);

  // 应用样式到 HTML 根元素
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const root = document.documentElement;

    // 深色模式处理
    root.classList.remove("light", "dark");
    if (mode === "system") {
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      root.classList.add(systemDark ? "dark" : "light");
    } else {
      root.classList.add(mode);
    }
    localStorage.setItem("theme-mode", mode);

    // 字体处理 (通过 data-attribute)
    root.setAttribute("data-font", font);
    localStorage.setItem("theme-font", font);

    // 数学向量样式处理 (通过 data-attribute)
    root.setAttribute("data-vector-style", vectorStyle);
    localStorage.setItem("theme-vector-style", vectorStyle);

    // 主题色处理 (通过 data-attribute)
    root.setAttribute("data-theme-color", color);
    localStorage.setItem("theme-color", color);
  }, [hydrated, mode, font, vectorStyle, color]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        font,
        setFont,
        vectorStyle,
        setVectorStyle,
        color,
        setColor,
        hydrated,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
