import { LucideIcon } from "lucide-react";

/**
 * Item de navigation pour les menus
 */
export interface NavItem {
    label: string;
    to?: string;
    icon: LucideIcon;
    children?: NavItem[];
}
