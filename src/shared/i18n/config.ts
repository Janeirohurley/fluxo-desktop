import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import frAuth from "./resources/fr/auth.json";
import frCommon from "./resources/fr/common.json";
import frDashboard from "./resources/fr/dashboard.json";
import frShell from "./resources/fr/shell.json";
import frUpdater from "./resources/fr/updater.json";
import enAuth from "./resources/en/auth.json";
import enCommon from "./resources/en/common.json";
import enDashboard from "./resources/en/dashboard.json";
import enShell from "./resources/en/shell.json";
import enUpdater from "./resources/en/updater.json";

export const supportedLanguages = ["fr", "en"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const appLanguageStorageKey = "fluxo_language";

const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    dashboard: frDashboard,
    shell: frShell,
    updater: frUpdater,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    shell: enShell,
    updater: enUpdater,
  },
} as const;

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: "fr",
      supportedLngs: supportedLanguages,
      defaultNS: "common",
      ns: ["common", "auth", "dashboard", "shell", "updater"],
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: appLanguageStorageKey,
      },
    });
}

export { i18n };
