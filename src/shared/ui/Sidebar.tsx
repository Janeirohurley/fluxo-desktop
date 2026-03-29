import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { NavItem } from '../types/types';
import { useSidebar } from '../hooks/useSidebar';


interface SidebarProps {
  navItems: NavItem[];
  title: string;
  level?: number; // profondeur pour les enfants
}

export function Sidebar({ navItems, title, level = 0 }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useSidebar();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const isItemActive = (item: NavItem): boolean => {
    if (location.pathname.startsWith(item.to as string)) return true;
    if (item.children) return item.children.some(child => isItemActive(child));
    return false;
  };

  const renderNavItem = (item: NavItem, currentLevel: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus[item.to as string];
    const isActive = location.pathname === item.to; // active seulement si correspond exactement
    const parentActive = isItemActive(item); // pour mettre en avant parent si enfant actif

    const paddingLeft = 10 + currentLevel * 20;

    return (
      <div key={item.to} className="relative group/item">
        <motion.button
          onClick={() => hasChildren ? toggleMenu(item.to as string) : navigate({ to: item.to })}
          whileHover={{ x: 2 }}
          className={`
            flex items-center gap-3 rounded transition-all
            ${sidebarCollapsed ? 'w-10 h-10 justify-center p-0' : 'w-full px-3 py-2'}
            ${parentActive ? 'bg-blue-50 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
          `}
          style={sidebarCollapsed ? {} : { paddingLeft }}
        >
        
          <motion.div
            initial={false}
            animate={{ scale: sidebarCollapsed ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <Icon size={18 - currentLevel} className="shrink-0" />
          </motion.div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className={`font-medium block truncate flex-1 min-w-0 text-start ${
                currentLevel === 0 ? 'text-sm' : 
                currentLevel === 1 ? 'text-xs' : 
                'text-[11px]'
              }`}
            >
              {item.label}
            </motion.span>
          )}
          {hasChildren && !sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </motion.div>
          )}
        </motion.button>

        {!sidebarCollapsed && (
          <div className="pointer-events-none absolute left-full top-0 ml-2 z-50 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
            <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs text-left px-2.5 py-1.5 rounded-md shadow-md whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis">
              {item.label}
            </div>
          </div>
        )}

        {/* Ligne verticale pour représenter la hiérarchie */}
        {currentLevel > 0 && (
          <div
            className="absolute left-1.5 top-0 h-full border-l border-gray-300 dark:border-gray-600"
            style={{ marginLeft: paddingLeft - 13 }}
          />
        )}

        {/* Bordure en bas si actif */}
        {isActive && (
          <div className="absolute left-1.5 right-0 bottom-0 h-px bg-blue-600 rounded" style={{ marginLeft: paddingLeft - 12 }} />
        )}

        {/* Enfants */}
        {hasChildren && isOpen && !sidebarCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col"
          >

            {item.children!.map(child => renderNavItem(child, currentLevel + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
        transition-all duration-300 z-40
        ${sidebarCollapsed ? 'w-20' : 'w-60'}
      `}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!sidebarCollapsed && <h2 className="font-bold text-lg">{title}</h2>}
        <motion.button
          onClick={toggleSidebar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-1 ml-2 bor hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <motion.div
            initial={false}
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeft size={20} />
          </motion.div>
        </motion.button>
      </div>

      <nav className={`p-2 space-y-1 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
        {navItems.map(item => renderNavItem(item, level))}
      </nav>
    </motion.aside>
  );
}
