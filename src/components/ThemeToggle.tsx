import { useState } from "react";
import { IconMoon, IconSun } from "./icons";
import { cn } from "./ui";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"dark" | "light">(
    () => document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", nextTheme === "light" ? "#f8faf9" : "#09090b");
    setTheme(nextTheme);
    try {
      window.localStorage.setItem("bikoom-theme", nextTheme);
    } catch (error) {
      console.warn("Could not save the color theme preference.", error);
    }
  };

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "rounded-xl p-2.5 text-ink-700 transition hover:bg-ink-100",
        className,
      )}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === "dark" ? (
        <IconSun className="h-5 w-5" />
      ) : (
        <IconMoon className="h-5 w-5" />
      )}
    </button>
  );
}
