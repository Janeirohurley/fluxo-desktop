import { useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";
import CalendarDropdown from "./CalendarDropdown";
import { type NavItem } from "../types/types";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { ThemeToggle } from "@/shared/ui";

interface AppHeaderProps {
  navItems: NavItem[];
}

export function AppHeader({ navItems }: AppHeaderProps) {
  const location = useLocation();
  const currentNavItem =
    navItems.find((item) => location.pathname.startsWith(item.to as string)) ?? navItems[0];
  const Icon = currentNavItem.icon;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-linear-to-r from-blue-600 to-blue-800 shadow-lg dark:from-blue-900 dark:to-blue-950"
    >
      <div className="flex items-center justify-between px-6 py-2.5">
        <div className="hidden items-center gap-4">
          <Icon className="size-8 rounded-lg bg-white/20 p-2 text-white" />
          <h1 className="text-2xl font-bold text-white">{currentNavItem.label}</h1>
        </div>

        <div className="hidden items-center gap-2 rounded-lg bg-white/10 px-4 py-2 md:flex">
          <Search className="h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-48 bg-transparent text-white outline-none placeholder:text-white/60"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="rounded-lg p-2 transition hover:bg-white/10">
            <Bell className="h-5 w-5 text-white" />
          </button>
          <CalendarDropdown />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
