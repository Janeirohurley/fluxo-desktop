import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  getStoredThemePreference,
  getSystemThemePreference,
  setStoredThemePreference,
  type ThemePreference,
} from "@/shared/lib/theme-preference";

type ThemeContextValue = {
  theme: ThemePreference;
  isDark: boolean;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [userThemePreference, setUserThemePreference] = useState<ThemePreference | null>(() =>
    getStoredThemePreference(),
  );
  const [systemThemePreference, setSystemThemePreference] = useState<ThemePreference>(() =>
    getSystemThemePreference(),
  );

  const theme = userThemePreference ?? systemThemePreference;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemThemePreference(event.matches ? "dark" : "light");
    };

    setSystemThemePreference(mediaQuery.matches ? "dark" : "light");
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme: (nextTheme) => {
        setUserThemePreference(nextTheme);
        setStoredThemePreference(nextTheme);
      },
      toggleTheme: () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setUserThemePreference(nextTheme);
        setStoredThemePreference(nextTheme);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
