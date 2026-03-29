import {type PropsWithChildren } from "react";
import { LayoutDashboard, LucideIcon} from "lucide-react";
import { useAccessSession } from "@/modules/auth/hooks/useAccessSession";

import { Sidebar } from "@/shared/ui/Sidebar";
import { motion } from "framer-motion"
import { useSidebar } from "@/shared/hooks/useSidebar";
import { AppHeader } from "@/shared/ui/AppHeader";

/**
 * Item de navigation pour les menus
 */
export interface NavItem {
  label: string;
  to?: string;
  icon: LucideIcon;
  children?: NavItem[];
}
export function MainShell({ children }: PropsWithChildren) {
  const { data: session } = useAccessSession();
  const { sidebarCollapsed } = useSidebar();

  const navItems: Array<NavItem> = [
    { label: "Tableau de bord", to: "/", icon: LayoutDashboard },
  ]



  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* SIDEBAR GAUCHE */}
      <Sidebar title={session?.company?.name || ""} navItems={navItems} />
      {/* CONTENU PRINCIPAL */}
      <div
        className={`
                    flex-1
                    transition-all duration-300
                    dark:bg-gray-950
                    overflow-hidden
                    
                    ${sidebarCollapsed ? "ml-20" : "ml-60"}
                `}
      >
        <AppHeader
          navItems={navItems}
        />

        <main className="w-full max-w-full mx-auto px-6 py-8 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
