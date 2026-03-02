"use client";

import { useThemeContext } from "@/context/ThemeContext";
import { ButtonBase } from "@/components/ui/ButtonBase";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext();
  const isDark = theme === "dark";

  return (
    <ButtonBase
      type="button"
      variant="secondary"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      title={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      className="h-10 w-10 px-0"
    >
      <span aria-hidden className="text-base">{isDark ? "☀" : "🌙"}</span>
    </ButtonBase>
  );
}
