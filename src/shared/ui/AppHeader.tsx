import {  MessageCircle } from 'lucide-react';
// Menu utilisateur déroulant
import { useLocation } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Bell, Search } from 'lucide-react';
import CalendarDropdown from './CalendarDropdown';
import { NavItem } from '../types/types';
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { ThemeToggle } from "@/shared/ui";

interface AppHeaderProps {
  navItems: NavItem[]
}

export function AppHeader({ navItems }: AppHeaderProps) {
  const location = useLocation();
  const currentNavItem =
    navItems.find((item) => location.pathname.startsWith(item.to as string)) ||
    navItems[0];
  const Icon = currentNavItem.icon;
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-linear-to-r from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 shadow-lg"
    >
      <div className="px-6 py-2.5 flex items-center justify-between">
        <div className=" items-center gap-4 hidden">
          <Icon className="p-2 size-8 text-white bg-white/20 rounded-lg" />
          <h1 className="text-2xl font-bold text-white">{currentNavItem.label}</h1>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg">
          <Search className="w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent text-white placeholder:text-white/60 outline-none w-48"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-white/10 rounded-lg transition">
            <Bell className="w-5 h-5 text-white" />
          </button>
          <CalendarDropdown />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </motion.header>
  );
}
