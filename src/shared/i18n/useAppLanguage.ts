import { useTranslation } from "react-i18next";
import { type AppLanguage, supportedLanguages } from "./config";

export function useAppLanguage() {
  const { i18n } = useTranslation();
  const language = supportedLanguages.includes(i18n.resolvedLanguage as AppLanguage)
    ? (i18n.resolvedLanguage as AppLanguage)
    : "fr";

  return {
    language,
    supportedLanguages,
    changeLanguage: async (nextLanguage: AppLanguage) => {
      await i18n.changeLanguage(nextLanguage);
    },
  };
}
