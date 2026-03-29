import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
    sidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (v: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            sidebarCollapsed: false,

            toggleSidebar: () => {
                set((state) => ({
                    sidebarCollapsed: !state.sidebarCollapsed
                }));
            },

            setSidebarCollapsed: (v) => {
                set({ sidebarCollapsed: v });
            },
        }),
        {
            name: "sidebar-storage", // Nom de la clé dans le localStorage
        }
    )
);

// Alias pratique pour l'importation
export const useSidebar = useSidebarStore;