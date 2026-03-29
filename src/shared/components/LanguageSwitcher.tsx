import { useAppLanguage } from "@/shared/i18n/useAppLanguage";
import { SingleSelectDropdown } from "../ui/SingleSelectDropdown";

export function LanguageSwitcher() {
  const { language, changeLanguage } = useAppLanguage();

  return (
      <SingleSelectDropdown
        onChange={(value) => {
          if (value === "fr" || value === "en") {
            void changeLanguage(value);
          }
        }}
        value={language}
        options={[{
          id: "fr",
          value: "fr",
          label: "Francais"
        },
        {
          id: "en",
          value: "en",
          label: "English"
        }]}

      />
   
  );
}
