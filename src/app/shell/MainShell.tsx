import { type PropsWithChildren } from "react";
import { Box, CircleDollarSign, FolderTree, LayoutDashboard, LucideIcon, Landmark, ReceiptText, Shapes, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("shell");

  const navItems: Array<NavItem> = [{ label: t("nav.dashboard"), to: "/", icon: LayoutDashboard }];

  if (session?.modules.includes("assets")) {
    navItems.push({ label: t("nav.assets"), to: "/assets", icon: Box });
    navItems.push({ label: t("nav.assetReferences"), to: "/assets/references", icon: FolderTree });
  }

  if (session?.modules.includes("finance")) {
    navItems.push({ label: t("nav.finance"), to: "/finance", icon: CircleDollarSign });
    navItems.push({ label: t("nav.financeJournalEntries"), to: "/finance/journal-entries", icon: Landmark });
    navItems.push({ label: t("nav.financeReconciliations"), to: "/finance/reconciliations", icon: Landmark });
    navItems.push({ label: t("nav.financeReferences"), to: "/finance/references", icon: Landmark });
  }

  if (session?.modules.includes("employees")) {
    navItems.push({ label: t("nav.employees"), to: "/employees", icon: Users });
    navItems.push({ label: t("nav.employeeReferences"), to: "/employees/references", icon: Shapes });
  }

  if (session?.modules.includes("payroll")) {
    navItems.push({ label: t("nav.payroll"), to: "/payroll", icon: ReceiptText });
    navItems.push({ label: t("nav.payrollContracts"), to: "/payroll/contracts", icon: FolderTree });
  }

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
