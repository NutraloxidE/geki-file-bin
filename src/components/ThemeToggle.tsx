"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // 初期状態をOSの設定または既存クラスから判定
    const html = document.documentElement;
    const darkByClass = html.classList.contains("dark");
    const darkByMedia = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(darkByClass || (!darkByClass && darkByMedia));
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className="fixed top-4 right-4 z-50 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full px-4 py-2 shadow hover:bg-gray-300 dark:hover:bg-gray-700 transition"
      aria-label="ダークモード切り替え"
    >
      {isDark ? "🌙 ダーク" : "☀️ ライト"}
    </button>
  );
} 