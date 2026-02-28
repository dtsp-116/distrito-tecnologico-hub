"use client";

import { useThemeContext } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-district-border bg-white px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
    >
      <span aria-hidden className="text-base">{isDark ? "☀" : "🌙"}</span>
      <span className="hidden sm:inline">{isDark ? "Tema claro" : "Tema escuro"}</span>
    </button>
  );
}
