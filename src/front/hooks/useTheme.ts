import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("appTheme");
    return (savedTheme === "light" ? "light" : "dark") as Theme;
  });

  useEffect(() => {
    // Apply theme class to body
    const body = document.body;
    if (theme === "light") {
      body.classList.add("light-theme");
      body.classList.remove("dark-theme");
    } else {
      body.classList.add("dark-theme");
      body.classList.remove("light-theme");
    }
  }, [theme]);

  const setThemeAndSave = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("appTheme", newTheme);
  };

  return { theme, setTheme: setThemeAndSave };
};
