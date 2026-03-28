import { useTheme } from "@/app/providers/ThemeProvider";
import { Toggle } from "./Toggle";

type ThemeToggleProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
};

export function ThemeToggle({
  label = "Mode sombre",
  size = "md",
}: ThemeToggleProps) {
  const { isDark, setTheme } = useTheme();

  return (
    <Toggle
      checked={isDark}
      onChange={(checked) => setTheme(checked ? "dark" : "light")}
      label={label}
      size={size}
    />
  );
}
