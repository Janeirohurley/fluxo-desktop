export type ThemePreference = "light" | "dark";

const THEME_PREFERENCE_STORAGE_KEY = "fluxo_theme_preference";

export function getStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function setStoredThemePreference(theme: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, theme);
}

export function getSystemThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
