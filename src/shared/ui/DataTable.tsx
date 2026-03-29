/* eslint-disable no-extra-boolean-cast */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Pin, Download, Loader2, AlertCircle, Inbox, Trash2, Archive, Mail, Copy, Edit, Eye, EyeOff, Plus, GripVertical, Maximize2, Minimize2, PlusCircle, X, FileDown, Files, FileCheck, ArrowDown01 } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as XLSX from 'xlsx';
import { saveTableSettings, getTableSettings, saveTableData } from '@/shared/lib/database';
import { CustomDatePicker } from "./CustomDatePicker";
import { Toggle } from "./Toggle";
import { z } from "zod";
import { DataTableInput } from "./DataTableInput";
import { cn } from "@/shared/lib/cn";
import { notify } from "@/shared/lib/toast";
import { formatRelativeDate } from "@/shared/lib/formatRelativeDate";

// le hooks de selection

function useSelection<T extends string | number>(initial?: Iterable<T>) {
    const [selected, setSelected] = useState<Set<T>>(() => new Set(initial ?? []));

    const toggle = useCallback((id: T) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback((ids: T[]) => {
        setSelected(new Set(ids));
    }, []);

    const clear = useCallback(() => setSelected(new Set()), []);

    const isSelected = useCallback((id: T) => selected.has(id), [selected]);

    const getSelected = useCallback(() => Array.from(selected), [selected]);

    return { selected, toggle, selectAll, clear, isSelected, getSelected, setSelected } as const;
}
// Composant SingleSelect personnalisé
function SingleSelectDropdown({ options, value, onChange, placeholder, title }: {
    options: string[] | { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    title?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectOption = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const getDisplayText = () => {
        if (!value) return placeholder || 'Sélectionner...';
        const option = options.find(opt =>
            typeof opt === 'string' ? opt === value : opt.value === value
        );
        return typeof option === 'string' ? option : option?.label || value;
    };

    return (
        <div className="space-y-2">
            {title && (
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {title}
                </h3>
            )}
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                    <span className={!value ? 'text-gray-500' : ''}>
                        {getDisplayText()}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {options.map((option) => {
                                const optionValue = typeof option === 'string' ? option : option.value;
                                const optionLabel = typeof option === 'string' ? option : option.label;
                                const isSelected = value === optionValue;

                                return (
                                    <div
                                        key={optionValue}
                                        onClick={() => selectOption(optionValue)}
                                        className={`flex items-center px-3 py-2 cursor-pointer transition-colors duration-150 ${isSelected
                                            ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-150 ${isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                            {isSelected && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                        <span className={`text-sm ${isSelected
                                            ? 'text-blue-700 dark:text-blue-300 font-medium'
                                            : 'text-gray-900 dark:text-gray-100'
                                            }`}>
                                            {optionLabel}
                                        </span>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Composant MultiSelect personnalisé
function MultiSelectDropdown({ options, value, onChange, placeholder, title }: {
    options: string[] | { value: string; label: string }[];
    value: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    title?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const getDisplayText = () => {
        if (value.length === 0) return placeholder || 'Sélectionner...';
        if (value.length === 1) {
            const option = options.find(opt =>
                typeof opt === 'string' ? opt === value[0] : opt.value === value[0]
            );
            return typeof option === 'string' ? option : option?.label || value[0];
        }
        return `${value.length} sélectionnés`;
    };

    return (
        <div className="space-y-2">
            {title && (
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {title}
                </h3>
            )}
            <div className="relative" ref={dropdownRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-3 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                    <span className={value.length === 0 ? 'text-gray-500' : ''}>
                        {getDisplayText()}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {options.map((option) => {
                                const optionValue = typeof option === 'string' ? option : option.value;
                                const optionLabel = typeof option === 'string' ? option : option.label;
                                const isSelected = value.includes(optionValue);

                                return (
                                    <div
                                        key={optionValue}
                                        onClick={() => toggleOption(optionValue)}
                                        className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                                    >
                                        <div className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center transition-all duration-150 ${isSelected
                                            ? 'bg-blue-600 border-blue-600'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-900 dark:text-gray-100">
                                            {optionLabel}
                                        </span>
                                    </div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
type SortColumn = {
    column: string;
    direction: 'asc' | 'desc';
};

function buildOrdering(
    sortColumns: SortColumn[]
): string {
    return sortColumns
        .map(s => (s.direction === 'desc' ? `-${s.column}` : s.column))
        .join(',');
}

// Helper function to get nested property value
function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Types génériques
export type DataTableColumn<T> = {
    key: string;
    label: string;
    accessor?: string; // Optional: path to nested property (e.g., "user.profile.profile_name")
    render?: (row: T, setImageModal?: (modal: { src: string; alt: string } | null) => void) => React.ReactNode;
    sortable?: boolean;
    filterable?: boolean;
    searchable?: boolean;
    pinned?: boolean;
    editable?: boolean;
    hidden?: boolean;
    type?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'image' | 'email';
    options?: string[] | { value: string; label: string }[];
};

export interface PaginatedResponse<T> {
    results: T[];
    count: number;
    next: string | null;
    previous: string | null;
    current_page: number;
    total_pages: number;
}

export type DataTableProps<T> = {
    data: PaginatedResponse<T> | T[];
    columns: DataTableColumn<T>[];
    tableId?: string;
    getRowId?: (row: T, index: number) => string | number;
    currentPage: number;
    setCurrentPage: (page: number | ((prev: number) => number)) => void;
    itemsPerPage: number;
    setItemsPerPage?: (items: number) => void;
    renderActions?: (row: T) => React.ReactNode;
    onSearchChange: (value: string) => void;
    isLoading?: boolean;
    error?: string | null;
    onBulkAction?: (action: string, selectedIds: Set<string>) => void;
    onAddRow?: () => void;
    onAddRowAfter?: (afterRow: T) => void;
    onDeleteRow?: (row: T) => void;
    onEditRow?: (row: T) => void;
    onCellEdit?: (rowId: string | number, columnKey: string, newValue: string) => Promise<void> | void;
    onReorder?: (newData: T[]) => void;
    enableDragDrop?: boolean;
    uploadFunction?: (file: File, rowId: string | number) => Promise<string>;
    isPaginated?: boolean;
    onBackendFiltersChange?: (filters: Record<string, string>) => void;
    onBackendOrderingChange?: (ordering: string) => void;
};

/** Composant pour les lignes draggables */
function DraggableRow<T>({
    row,
    children,
    isDragEnabled,
    isSelected,
    isFocused,
    onFocus,
    onContextMenu,
    onClick,
    getRowId,
    onMouseEnter,
    onMouseLeave,
}: {
    row: T;
    children: React.ReactNode;
    isDragEnabled: boolean;
    isSelected: boolean;
    isFocused: boolean;
    onFocus: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onClick: (e: React.MouseEvent<HTMLTableRowElement>) => void;
    getRowId: (row: T) => string | number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(getRowId(row)), disabled: !isDragEnabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <motion.tr
            ref={setNodeRef}
            style={style}
            key={String(getRowId(row))}
            role="row"
            aria-selected={isSelected}
            tabIndex={isFocused ? 0 : -1}
            className={
                `odd:bg-gray-100 hover:bg-gray-50 cursor-pointer dark:odd:bg-gray-900/30 dark:hover:bg-gray-700 relative ${isFocused ? 'ring-1 ring-blue-500' : ''}` +
                (isSelected ? ' bg-gray-100! dark:bg-gray-900!' : '')
            }
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
            transition={{ duration: 0.12 }}
            layout
            onFocus={onFocus}
            onContextMenu={onContextMenu}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Drag handle column */}
            {isDragEnabled && (
                <td
                    {...attributes}
                    {...listeners}
                    className="px-2 py-2 cursor-grab active:cursor-grabbing"
                    role="cell"
                >
                    <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </td>
            )}
            {children}
        </motion.tr>
    );
}



const searchSchema = z
    .string()
    .trim()
    .max(50);


type Props = {
    onSearchChange: (value: string) => void;
    isLoading: boolean;
    onFocusChange?: (isFocused: boolean) => void;
};



function SearchInput({ onSearchChange, isLoading, onFocusChange }: Props) {
    const [value, setValue] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            const result = searchSchema.safeParse(value);

            if (!result.success) return;

            onSearchChange(result.data);
        }, 400);

        return () => clearTimeout(timer);
    }, [value, onSearchChange]);

    return (
        <div className="flex-1 relative min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <DataTableInput
                placeholder="Recherche globale (délai 500ms)..."
                defaultValue={value}
                onValueChange={setValue}
                disabled={isLoading}
                onFocus={() => onFocusChange?.(true)}
                onBlur={() => onFocusChange?.(false)}
                onKeyDown={(e) => {
                    e.stopPropagation();
                }}
                className="w-full pl-10 pr-3 py-2 rounded-md border bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    )
}
/**
 * DataTable - Composant de tableau de données avancé et générique.
 *
 * Un composant React générique pour afficher, filtrer, trier et manipuler des données
 * tabulaires avec de nombreuses fonctionnalités interactives.
 *
 * @template T - Le type des objets de données affichés dans chaque ligne du tableau.
 *
 * @example
 * ```tsx
 * type User = { id: number; name: string; email: string };
 *
 * <DataTable<User>
 *   data={users}
 *   columns={[
 *     { key: 'id', label: 'ID', sortable: true },
 *     { key: 'name', label: 'Nom', searchable: true, editable: true },
 *     { key: 'email', label: 'Email', type: 'email' },
 *   ]}
 *   currentPage={page}
 *   setCurrentPage={setPage}
 *   itemsPerPage={10}
 * />
 * ```
 *
 * ## Attributs obligatoires (REQUIRED)
 *
 * @param {PaginatedResponse<T> | T[]} props.data - **OBLIGATOIRE** - Les données à afficher (tableau simple ou réponse paginée du backend).
 * @param {DataTableColumn<T>[]} props.columns - **OBLIGATOIRE** - Configuration des colonnes du tableau.
 * @param {number} props.currentPage - **OBLIGATOIRE** - Page actuelle de la pagination.
 * @param {(page: number | ((prev: number) => number)) => void} props.setCurrentPage - **OBLIGATOIRE** - Setter pour changer de page.
 * @param {number} props.itemsPerPage - **OBLIGATOIRE** - Nombre d'éléments par page.
 *
 * ## Attributs optionnels
 *
 * @param {string} [props.tableId='default'] - Identifiant unique pour la persistance des paramètres (tri, colonnes, sélection).
 * @param {(row: T, index: number) => string | number} [props.getRowId] - Fonction pour obtenir l'ID unique d'une ligne. Par défaut, utilise `id`, `_id`, `key` ou l'index.
 * @param {(row: T) => React.ReactNode} [props.renderActions] - Fonction de rendu pour les actions personnalisées par ligne.
 * @param {boolean} [props.isLoading=false] - Affiche un indicateur de chargement.
 * @param {string | null} [props.error=null] - Message d'erreur à afficher.
 * @param {(action: string, selectedIds: Set<string>) => void} [props.onBulkAction] - Callback pour les actions en masse.
 * @param {Array<{key: string, label: string, icon?: ReactNode, color?: string, onClick?: Function, title?: string}>} [props.bulkActions] - Définition des actions en masse disponibles.
 * @param {() => void} [props.onAddRow] - Callback pour ajouter une nouvelle ligne.
 * @param {(afterRow: T) => void} [props.onAddRowAfter] - Callback pour ajouter une ligne après une ligne spécifique.
 * @param {(row: T) => void} [props.onDeleteRow] - Callback pour supprimer une ligne.
 * @param {(row: T) => void} [props.onEditRow] - Callback pour modifier une ligne (ouvre un modal d'édition).
 * @param {(rowId: string | number, columnKey: string, newValue: string) => Promise<void> | void} [props.onCellEdit] - Callback pour l'édition inline d'une cellule.
 * @param {(newData: T[]) => void} [props.onReorder] - Callback appelé après réorganisation par drag & drop.
 * @param {boolean} [props.enableDragDrop=false] - Active le drag & drop pour réorganiser les lignes.
 * @param {(file: File, rowId: string | number) => Promise<string>} [props.uploadFunction] - Fonction d'upload pour les colonnes de type image.
 * @param {boolean} [props.isPaginated=false] - Indique si la pagination est gérée côté backend (true) ou côté client (false).
 *
 * ## Fonctionnalités principales
 *
 * - **Tri multi-colonnes** : Cliquez sur les en-têtes pour trier (Shift+clic pour tri multi-colonnes)
 * - **Filtrage par colonne** : Filtres individuels par colonne
 * - **Recherche globale** : Recherche sur toutes les colonnes searchable
 * - **Sélection multiple** : Cases à cocher avec actions en masse
 * - **Édition inline** : Double-clic sur une cellule pour éditer (si `editable: true`)
 * - **Drag & drop** : Réorganisation des lignes par glisser-déposer
 * - **Colonnes épinglées** : Possibilité de fixer des colonnes
 * - **Colonnes masquables** : Afficher/masquer des colonnes dynamiquement
 * - **Redimensionnement** : Ajuster la largeur des colonnes
 * - **Export** : Export en CSV, Excel ou JSON
 * - **Mode plein écran** : Affichage en plein écran du tableau
 * - **Persistance** : Sauvegarde automatique des préférences (tri, colonnes, sélection) via IndexedDB
 * - **Pagination** : Côté client ou côté serveur (via `isPaginated`)
 * - **Menu contextuel** : Clic droit pour actions rapides
 * - **Types de colonnes** : Support de text, number, date, boolean, select, multiselect, image, email
 *
 * ## Configuration des colonnes (DataTableColumn<T>)
 *
 * | Propriété    | Type                                      | Description                                      |
 * |--------------|-------------------------------------------|--------------------------------------------------|
 * | key          | string                                    | **OBLIGATOIRE** - Clé de la propriété dans T     |
 * | label        | string                                    | **OBLIGATOIRE** - Libellé affiché dans l'en-tête |
 * | render       | (row: T) => ReactNode                     | Fonction de rendu personnalisé                   |
 * | sortable     | boolean                                   | Activer le tri sur cette colonne                 |
 * | filterable   | boolean                                   | Activer le filtre sur cette colonne              |
 * | searchable   | boolean                                   | Inclure dans la recherche globale                |
 * | pinned       | boolean                                   | Épingler la colonne à gauche                     |
 * | editable     | boolean                                   | Permettre l'édition inline                       |
 * | hidden       | boolean                                   | Masquer la colonne par défaut                    |
 * | type         | 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'image' | 'email' | Type de données |
 * | options      | string[] | {value: string, label: string}[] | Options pour select/multiselect          |
 *
 * @see DataTableColumn - Configuration d'une colonne
 * @see DataTableProps - Interface des props complète
 * @see PaginatedResponse - Format de réponse paginée du backend
 */
function DataTable<T>({
    data,
    columns,
    tableId = 'default',
    getRowId: getRowIdProp,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    onSearchChange,
    renderActions,
    isLoading = false,
    error = null,
    onBulkAction,
    bulkActions,
    onAddRow,
    onAddRowAfter,
    onDeleteRow,
    onEditRow,
    onCellEdit,
    onReorder,
    enableDragDrop = false,
    uploadFunction,
    isPaginated = false,
    onBackendFiltersChange,
    onBackendOrderingChange
}: DataTableProps<T> & { bulkActions?: Array<{ key: string; label: string; icon?: React.ReactNode; color?: string; onClick?: (selectedIds: Set<string>) => void; title?: string }> }) {


    // Extract data and pagination info
    const actualData = useMemo(() => {
        if (isPaginated && data && typeof data === 'object' && 'results' in data) {
            return (data as PaginatedResponse<T>).results;
        }
        return Array.isArray(data) ? data : [];
    }, [data, isPaginated]);

    const paginationInfo = useMemo(() => {
        if (isPaginated && data && typeof data === 'object' && 'results' in data) {
            const paginatedData = data as PaginatedResponse<T>;
            return {
                count: paginatedData.count,
                totalPages: paginatedData.total_pages,
                currentPage: paginatedData.current_page,
                hasNext: !!paginatedData.next,
                hasPrevious: !!paginatedData.previous,
            };
        }
        return {
            count: Array.isArray(data) ? data.length : 0,
            totalPages: Array.isArray(data) ? Math.ceil(data.length / itemsPerPage) : 0,
            currentPage: currentPage,
            hasNext: false,
            hasPrevious: false,
        };
    }, [data, isPaginated, itemsPerPage, currentPage]);

    // Create stable row ID mapping
    const rowIdMap = useMemo(() => {
        const map = new Map<T, string | number>();
        actualData.forEach((row, index) => {
            let id: string | number;
            if (getRowIdProp) {
                id = getRowIdProp(row, index);
            } else {
                // Fallback: try common ID fields or use index
                if (row && typeof row === 'object') {
                    if ('id' in row && (row as any).id != null) {
                        id = String((row as any).id);
                    } else if ('_id' in row && (row as any)._id != null) {
                        id = String((row as any)._id);
                    } else if ('key' in row && (row as any).key != null) {
                        id = String((row as any).key);
                    } else {
                        id = index;
                    }
                } else {
                    id = index;
                }
            }
            map.set(row, id);
        });
        return map;
    }, [actualData, getRowIdProp]);

    // Helper function to get row ID
    const getRowId = useCallback((row: T): string | number => {
        return rowIdMap.get(row) ?? 0;
    }, [rowIdMap]);

    // Sorting supports multi-column sort: [{ column, direction }]

    const [sortColumns, setSortColumns] = useState<Array<{ column: string; direction: 'asc' | 'desc' }>>([]);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [localPageSize, setLocalPageSize] = useState<number>(itemsPerPage || 10);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const { selected: selectedRowIds, toggle, setSelected } = useSelection<string>();
    const [hide_header_actions, set_hide_header_actions] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Sauvegarder la sélection
    const saveSelection = (selection: Set<string>) => {
        saveTableSettings(tableId, { selectedRows: Array.from(selection) });
    };

    // Charger les paramètres depuis Dexie
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getTableSettings(tableId);
                if (settings) {
                    setColumnOrder(settings.columnOrder.length > 0 ? settings.columnOrder : columns.map(c => c.key));
                    setPinnedColumns(new Set(settings.pinnedColumns));
                    setHiddenColumns(new Set(settings.hiddenColumns));
                    setColumnWidths(settings.columnWidths);
                    setLocalPageSize(settings.pageSize);
                    setSortColumns(settings.sortColumns);
                    setSelected(new Set(settings.selectedRows || []));
                }
                setIsDataLoaded(true);
            } catch (error) {
                console.error('Erreur lors du chargement des paramètres:', error);
                setIsDataLoaded(true);
            }
        };

        loadSettings();
    }, [tableId, columns, itemsPerPage]);

    // Sauvegarder les données quand elles changent
    useEffect(() => {
        if (isDataLoaded && actualData.length > 0) {
            saveTableData(tableId, actualData, (row) => String(getRowId(row)));
        }
    }, [actualData, tableId, getRowId, isDataLoaded]);
    const [detailsRow, setDetailsRow] = useState<T | null>(null);
    const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map(c => c.key));
    const [pinnedColumns, setPinnedColumns] = useState<Set<string>>(new Set());
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() =>
        new Set(columns.filter(c => c.hidden).map(c => c.key))
    );
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

    const [imageModal, setImageModal] = useState<{ src: string; alt: string } | null>(null);
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const [focusedCell, setFocusedCell] = useState<{ rowIdx: number; colIdx: number } | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);

    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const resizeStartX = useRef<number>(0);
    const resizeStartWidth = useRef<number>(0);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: T | null } | null>(null);
    const [editingCell, setEditingCell] = useState<{ rowId: string | number; columnKey: string } | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());
    const editInputRef = useRef<HTMLInputElement>(null);
    const originalValueRef = useRef<string>("");

    // Modales spécialisées
    const [imageEditModal, setImageEditModal] = useState<{ rowId: string | number; columnKey: string; currentValue: string } | null>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [dateEditModal, setDateEditModal] = useState<{ rowId: string | number; columnKey: string; currentValue: string } | null>(null);

    const [selectEditModal, setSelectEditModal] = useState<{ rowId: string | number; columnKey: string; currentValue: string; options: string[] | { value: string; label: string }[]; isMultiple?: boolean } | null>(null);

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [hoveredRowId, setHoveredRowId] = useState<string | number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Modal states
    const [deleteConfirmRow, setDeleteConfirmRow] = useState<T | null>(null);
    const [editModalRow, setEditModalRow] = useState<T | null>(null);
    const [editFormData, setEditFormData] = useState<Record<string, any>>({});
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFileName, setExportFileName] = useState('export');
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'json'>('csv');
    const [exportType, setExportType] = useState<'all' | 'visible' | 'selected'>('all');

    const startEdit = (
        rowId: string | number,
        columnKey: string,
        currentValue: string
    ) => {
        setEditingCell({ rowId, columnKey });
        setEditValue(currentValue);          // valeur visible
        originalValueRef.current = currentValue; // 🔒 snapshot
    };

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            // Clear any active sorting so drag & drop reordering is visible
            setSortColumns([]);

            // Find the actual items being moved using their IDs
            const activeItem = actualData.find(item => String(getRowId(item)) === String(active.id));
            const overItem = actualData.find(item => String(getRowId(item)) === String(over.id));

            if (!activeItem || !overItem) return;

            // Find their positions in the ORIGINAL data array
            const oldIndex = actualData.findIndex(item => String(getRowId(item)) === String(active.id));
            const newIndex = actualData.findIndex(item => String(getRowId(item)) === String(over.id));

            // Reorder the original data array
            const newData = arrayMove(actualData, oldIndex, newIndex);

            // Save reordered data locally
            saveTableData(tableId, newData, (row) => String(getRowId(row)));

            // Notify parent with the reordered full dataset if callback exists
            if (onReorder) {
                onReorder(newData);
            }
        }
    };

    // (virtualization removed)


    const sortedData = useMemo(() => {
        if (isPaginated) return actualData; // Backend handles sorting
        if (!sortColumns || sortColumns.length === 0) return actualData;
        return [...actualData].sort((a, b) => {
            for (const s of sortColumns) {
                const c = s.column;
                const aVal: any = (a as any)[c];
                const bVal: any = (b as any)[c];

                // Handle null/undefined values - always sort them to the end
                if (aVal == null && bVal == null) continue;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                // Detect and handle different data types intelligently

                // 1. Check if values are dates (ISO format: YYYY-MM-DD or full ISO datetime)
                const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
                const aIsDate = typeof aVal === 'string' && dateRegex.test(aVal);
                const bIsDate = typeof bVal === 'string' && dateRegex.test(bVal);

                if (aIsDate && bIsDate) {
                    const aTime = new Date(aVal).getTime();
                    const bTime = new Date(bVal).getTime();
                    if (aTime < bTime) return s.direction === 'asc' ? -1 : 1;
                    if (aTime > bTime) return s.direction === 'asc' ? 1 : -1;
                    continue;
                }

                // 2. Check if values are numeric (including numeric strings)
                const aIsNumeric = typeof aVal === 'number' ||
                    (typeof aVal === 'string' && !isNaN(Number(aVal)) && aVal.trim() !== '');
                const bIsNumeric = typeof bVal === 'number' ||
                    (typeof bVal === 'string' && !isNaN(Number(bVal)) && bVal.trim() !== '');

                if (aIsNumeric && bIsNumeric) {
                    const aNum = typeof aVal === 'number' ? aVal : Number(aVal);
                    const bNum = typeof bVal === 'number' ? bVal : Number(bVal);
                    if (aNum < bNum) return s.direction === 'asc' ? -1 : 1;
                    if (aNum > bNum) return s.direction === 'asc' ? 1 : -1;
                    continue;
                }

                // 3. Handle booleans
                if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                    const aBool = aVal ? 1 : 0;
                    const bBool = bVal ? 1 : 0;
                    if (aBool < bBool) return s.direction === 'asc' ? -1 : 1;
                    if (aBool > bBool) return s.direction === 'asc' ? 1 : -1;
                    continue;
                }

                // 4. Default: string comparison (case-insensitive)
                const aStr = String(aVal).toLowerCase();
                const bStr = String(bVal).toLowerCase();

                // Use localeCompare for proper alphabetical sorting with accents
                const comparison = aStr.localeCompare(bStr, undefined, {
                    numeric: false,
                    sensitivity: 'base'
                });

                if (comparison !== 0) {
                    return s.direction === 'asc' ? comparison : -comparison;
                }
            }
            return 0;
        });
    }, [actualData, sortColumns, isPaginated]);

    // Global search is handled by parent component via API
    const globalSearchFiltered = sortedData;

    // Apply column-specific filters (only for non-paginated data)
    const filteredByColumns = useMemo(() => {
        if (isPaginated) return globalSearchFiltered; // Backend handles filtering
        const keys = Object.keys(columnFilters).filter(k => columnFilters[k]?.length > 0);
        if (keys.length === 0) return globalSearchFiltered;
        return globalSearchFiltered.filter(row => {
            return keys.every(k => String((row as any)[k] ?? '').toLowerCase().includes(columnFilters[k].toLowerCase()));
        });
    }, [globalSearchFiltered, columnFilters, isPaginated]);

    const backendColumnFilters = useMemo(() => {
        return isPaginated ? columnFilters : {};
    }, [columnFilters, isPaginated]);

    useEffect(() => {
        if (!isPaginated) return;
        onBackendFiltersChange?.(backendColumnFilters);
    }, [backendColumnFilters, isPaginated, onBackendFiltersChange]);



    const paginated = useMemo(() => {
        if (isPaginated) return filteredByColumns; // Backend handles pagination
        const start = (currentPage - 1) * localPageSize;
        return filteredByColumns.slice(start, start + localPageSize);
    }, [filteredByColumns, currentPage, localPageSize, isPaginated]);

    const handleSort = (column: string, add = false) => {
        const nextPage = 1;

        setSortColumns(prev => {
            let newSort: SortColumn[];
            const existing = prev.find(p => p.column === column);

            if (!add) {
                // Remplace le tri actuel
                newSort = !existing
                    ? [{ column, direction: 'asc' }]
                    : prev.map(p =>
                        p.column === column
                            ? { ...p, direction: p.direction === 'asc' ? 'desc' : 'asc' }
                            : p
                    );
            } else {
                // Ajoute au multi-sort
                newSort = existing
                    ? prev.map(p =>
                        p.column === column
                            ? { ...p, direction: p.direction === 'asc' ? 'desc' : 'asc' }
                            : p
                    )
                    : [...prev, { column, direction: 'asc' }];
            }

            // Sauvegarde locale
            saveTableSettings(tableId, { sortColumns: newSort });

            // **Notification parent directement ici**
            if (isPaginated) {
                const ordering = buildOrdering(newSort);
                onBackendOrderingChange?.(ordering);

            }

            return newSort;
        });

        // Reset la page dans le state local pour le UI
        setCurrentPage(nextPage);
    };



    // selection helpers (toggle/select-all use the hook API)

    const toggleSelectAllPage = () => {
        const ids = paginated.map(r => String(getRowId(r)));
        const allSelected = ids.length > 0 && ids.every(id => selectedRowIds.has(id));
        setSelected(prev => {
            const next = new Set(prev);
            if (allSelected) ids.forEach(id => next.delete(id)); else ids.forEach(id => next.add(id));
            saveSelection(next);
            return next;
        });
    };

    // Column pin / reorder / hide avec persistance
    const pinColumn = (col: string) => {
        setPinnedColumns(prev => {
            const newPinned = new Set(prev.has(col) ? [...Array.from(prev).filter(c => c !== col)] : [...Array.from(prev), col]);
            saveTableSettings(tableId, { pinnedColumns: Array.from(newPinned) });
            return newPinned;
        });
    };

    const hideColumn = (col: string) => {
        setHiddenColumns(prev => {
            const newHidden = new Set(prev.has(col) ? [...Array.from(prev).filter(c => c !== col)] : [...Array.from(prev), col]);
            saveTableSettings(tableId, { hiddenColumns: Array.from(newHidden) });
            return newHidden;
        });
    };

    const moveColumn = (col: string, dir: 'left' | 'right') => {
        setColumnOrder(prev => {
            const idx = prev.indexOf(col);
            if (idx === -1) return prev;
            const swap = dir === 'left' ? idx - 1 : idx + 1;
            if (swap < 0 || swap >= prev.length) return prev;
            const copy = [...prev];
            [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
            saveTableSettings(tableId, { columnOrder: copy });
            return copy;
        });
    };

    const handlePageSizeChange = (newSize: number) => {
        setLocalPageSize(newSize);
        setCurrentPage(1);
        saveTableSettings(tableId, { pageSize: newSize });
        setItemsPerPage?.(newSize)
    };

    // virtualization removed — simple paginated rendering is used

    // build displayed columns according to pinned + order + hidden

    const displayedColumns = useMemo(() => {
        const visibleColumns = columnOrder.filter(c => !hiddenColumns.has(c) && columns.find(col => col?.key === c));
        const pinned = visibleColumns.filter(c => pinnedColumns.has(c));
        const rest = visibleColumns.filter(c => !pinnedColumns.has(c));
        return [...pinned, ...rest];
    }, [columnOrder, pinnedColumns, hiddenColumns, columns]);

    // rows to render (paginated)

    const rowsToRender = paginated;

    // Column resizing handlers
    const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingColumn(columnKey);
        resizeStartX.current = e.clientX;
        resizeStartWidth.current = columnWidths[columnKey] || 150;
    };

    useEffect(() => {
        if (!resizingColumn) return;

        const handleMouseMove = (e: Event) => {
            const mouseEvent = e as globalThis.MouseEvent;
            const diff = mouseEvent.clientX - resizeStartX.current;
            const newWidth = Math.max(50, resizeStartWidth.current + diff);
            setColumnWidths(prev => {
                const newWidths = { ...prev, [resizingColumn]: newWidth };
                saveTableSettings(tableId, { columnWidths: newWidths });
                return newWidths;
            });
        };

        const handleMouseUp = () => {
            setResizingColumn(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingColumn]);

    // Context menu handlers
    const handleContextMenu = (e: React.MouseEvent, row: T) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            row: row
        });
    };

    // Close context menu and column toggle on click outside or Escape key
    useEffect(() => {
        if (!contextMenu && !showColumnToggle) return;

        const handleClick = (e: Event) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.column-toggle-container')) {
                setContextMenu(null);
                setShowColumnToggle(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setContextMenu(null);
                setShowColumnToggle(false);
            }
        };

        document.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [contextMenu, showColumnToggle]);

    // Focus input when editing starts
    useEffect(() => {
        if (editingCell && editInputRef.current) {
            // Petit délai pour s'assurer que l'input est bien monté dans le DOM
            setTimeout(() => {
                if (editInputRef.current) {
                    editInputRef.current.focus();
                    editInputRef.current.select();
                }
            }, 0);
        }
    }, [editingCell]);

    // Handle cell double click for editing
    const handleCellDoubleClick = (row: T, columnKey: string) => {
        const col = columns.find(c => c.key === columnKey);


        if (col?.editable && onCellEdit) {
            const currentValue = (row as any)[columnKey];
            const rowId = getRowId(row);

            switch (col.type) {
                case 'image':
                    setImageEditModal({ rowId, columnKey, currentValue: String(currentValue ?? "") });
                    break;
                case 'date':
                    setDateEditModal({ rowId, columnKey, currentValue: String(currentValue ?? "") });
                    break;
                case 'boolean':
                    // Pour les boolean, on toggle directement sans modale
                    saveSpecializedEdit(rowId, columnKey, String(!Boolean(currentValue)));
                    break;
                case 'select':
                    if (col.options) {
                        // Extraire la valeur correcte si c'est un objet
                        let valueToUse = currentValue;
                        if (currentValue && typeof currentValue === 'object') {
                            // Essayer de trouver un champ 'id', 'code', ou 'value'
                            valueToUse = currentValue.id || currentValue.code || currentValue.value || String(currentValue);
                        }
                        setSelectEditModal({ rowId, columnKey, currentValue: String(valueToUse ?? ""), options: col.options });
                    }
                    break;
                case 'multiselect':
                    if (col.options) {
                        // Extraire la valeur correcte si c'est un objet ou un tableau d'objets
                        let valueToUse = currentValue;
                        if (Array.isArray(currentValue)) {
                            // Si c'est un tableau d'objets, extraire les IDs/codes
                            valueToUse = currentValue.map(item =>
                                typeof item === 'object' ? (item.id || item.code || item.value || String(item)) : String(item)
                            ).join(',');
                        } else if (currentValue && typeof currentValue === 'object') {
                            valueToUse = currentValue.id || currentValue.code || currentValue.value || String(currentValue);
                        }
                        setSelectEditModal({ rowId, columnKey, currentValue: String(valueToUse ?? ""), options: col.options, isMultiple: true });
                    }
                    break;
                default:
                    startEdit(rowId, columnKey, String(currentValue ?? ""))
            }
        }
    };

    // Save cell edit avec loading
    const saveEdit = async () => {
        if (!editingCell) return;

        const { rowId, columnKey } = editingCell;
        const newValue = editValue.trim();
        const original = originalValueRef.current.trim();
        const cellKey = `${rowId}-${columnKey}`;

        // 🛑 rien n’a changé
        if (newValue === original) {
            setEditingCell(null);
            setEditValue("");
            return;
        }

        setEditingCell(null);
        setEditValue("");

        setLoadingCells(prev => new Set([...prev, cellKey]));

        try {
            await Promise.resolve(onCellEdit?.(rowId, columnKey, newValue));
            notify.success("la mise à jour terminée");
        } catch (error) {
            console.error("Error saving cell:", error);
        } finally {
            setLoadingCells(prev => {
                const next = new Set(prev);
                next.delete(cellKey);
                return next;
            });
        }
    };


    // Save specialized edits
    const saveSpecializedEdit = async (rowId: string | number, columnKey: string, value: string) => {
        if (onCellEdit) {
            const cellKey = `${rowId}-${columnKey}`;
            setLoadingCells(prev => new Set([...prev, cellKey]));

            try {
                await Promise.resolve(onCellEdit(rowId, columnKey, value));
            } catch (error) {
                console.error('Error saving cell:', error);
            } finally {
                setLoadingCells(prev => {
                    const next = new Set(prev);
                    next.delete(cellKey);
                    return next;
                });
            }
        }
    };

    // Cancel cell edit
    const cancelEdit = () => {
        setEditingCell(null);
        setEditValue("");
    };

    // Handle edit input key press
    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    };

    // Toggle fullscreen mode
    const toggleFullScreen = () => {
        if (!isFullScreen && containerRef.current) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
            setIsFullScreen(true);
        } else if (isFullScreen) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            setIsFullScreen(false);
        }
    };

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle keyboard navigation if user is editing a cell or if edit modal is open
            if (editingCell || editModalRow || showExportModal) return;

            if (!focusedCell || !tableRef.current) return;
            const { rowIdx, colIdx } = focusedCell;
            const totalRows = rowsToRender.length;
            const totalCols = displayedColumns.length + 2; // +2 for checkbox and index columns

            let newRowIdx = rowIdx;
            let newColIdx = colIdx;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newRowIdx = Math.max(0, rowIdx - 1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newRowIdx = Math.min(totalRows - 1, rowIdx + 1);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newColIdx = Math.max(0, colIdx - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newColIdx = Math.min(totalCols - 1, colIdx + 1);
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (colIdx === 0 && !isSearchFocused) {
                        // Toggle selection on checkbox column
                        toggle(String(getRowId(rowsToRender[rowIdx])));
                    }
                    break;
                default:
                    return;
            }

            setFocusedCell({ rowIdx: newRowIdx, colIdx: newColIdx });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [focusedCell, rowsToRender, displayedColumns, toggle, getRowId, editingCell, editModalRow, showExportModal, isSearchFocused]);

    // Modal handlers
    const handleDeleteClick = (row: T) => {
        setDeleteConfirmRow(row);
    };

    const confirmDelete = () => {
        if (deleteConfirmRow && onDeleteRow) {
            onDeleteRow(deleteConfirmRow);
        }
        setDeleteConfirmRow(null);
    };

    const handleEditClick = (row: T) => {
        if (onEditRow) {
            // If onEditRow is provided, use it (backward compatibility)
            onEditRow(row);
        } else {
            // Otherwise, open the built-in edit modal
            setEditModalRow(row);
            const formData: Record<string, any> = {};
            columns.forEach(col => {
                formData[col.key] = (row as any)[col.key];
            });
            setEditFormData(formData);
        }
    };

    const saveEditModal = () => {
        if (editModalRow && onCellEdit) {
            // Apply all changes from the form
            Object.entries(editFormData).forEach(([key, value]) => {
                onCellEdit(getRowId(editModalRow), key, String(value));
            });
        }
        setEditModalRow(null);
        setEditFormData({});
    };

    // Export handlers
    const handleExportClick = (type: 'all' | 'visible' | 'selected') => {
        setExportType(type);
        setShowExportModal(true);
    };

    const handleExport = () => {
        let dataToExport: T[];

        if (exportType === 'all') {
            dataToExport = filteredByColumns;
        } else if (exportType === 'visible') {
            dataToExport = paginated;
        } else {
            // selected
            dataToExport = filteredByColumns.filter(row => selectedRowIds.has(String(getRowId(row))));
        }

        // Prepare data with column labels as headers
        const exportData = dataToExport.map(row => {
            const rowData: Record<string, any> = {};
            columns.forEach(col => {
                if (col && col.label) {
                    rowData[col.label] = (row as any)[col.key];
                }
            });
            return rowData;
        });

        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = exportFileName || 'export';
        const fullFileName = `${fileName}_${timestamp}`;

        if (exportFormat === 'csv') {
            // CSV Export
            const headers = columns.filter(col => col && col.label).map(col => col.label);
            const csvRows = [
                headers.join(','),
                ...exportData.map(row =>
                    columns.filter(col => col && col.label).map(col => {
                        const value = row[col.label];
                        // Escape commas and quotes
                        const escaped = String(value ?? '').replace(/"/g, '""');
                        return `"${escaped}"`;
                    }).join(',')
                )
            ];
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fullFileName}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
        } else if (exportFormat === 'excel') {
            // Excel Export
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
            XLSX.writeFile(workbook, `${fullFileName}.xlsx`);
        } else if (exportFormat === 'json') {
            // JSON Export
            const jsonContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fullFileName}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
        }

        setShowExportModal(false);
    };

    // Skeleton loader component
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-3 py-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </td>
            <td className="px-3 py-2">
                <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </td>
            {displayedColumns.map((f) => {
                const width = columnWidths[f];
                return (
                    <td
                        key={f}
                        className="px-3 py-2"
                        style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
                    >
                        <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </td>
                );
            })}
            <td className="px-3 py-2">
                <div className="flex gap-2">
                    <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
            </td>
        </tr>
    );

    return (
        <section
            ref={containerRef}
            className={`
  rounded-lg p-2 border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 w-full max-w-full overflow-auto
  ${resizingColumn ? 'resizing-columns' : ''}
  ${isFullScreen
                    ? 'fixed inset-0 z-50 max-w-none h-screen'
                    : '' // Exemple : 100vh moins 100px
                }
`}
        >
            {/* Error Message */}
            {error && (
                <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedRowIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                {selectedRowIds.size} {selectedRowIds.size === 1 ? 'item' : 'items'} selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Actions dynamiques */}
                            {bulkActions && bulkActions.length > 0
                                ? bulkActions.map(action => (
                                    <button
                                        key={action.key}
                                        onClick={() => action.onClick ? action.onClick(selectedRowIds) : (onBulkAction && onBulkAction(action.key, selectedRowIds))}
                                        className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-2 transition-colors ${action.color || 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                                        title={action.title || action.label}
                                    >
                                        {action.icon}
                                        {action.label}
                                    </button>
                                ))
                                : (
                                    onBulkAction && <>
                                        <button
                                            onClick={() => onBulkAction('delete', selectedRowIds)}
                                            className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2 transition-colors"
                                            title="Delete selected"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => onBulkAction('archive', selectedRowIds)}
                                            className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center gap-2 transition-colors"
                                            title="Archive selected"
                                        >
                                            <Archive className="w-4 h-4" />
                                            Archive
                                        </button>
                                        <button
                                            onClick={() => onBulkAction('email', selectedRowIds)}
                                            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2 transition-colors"
                                            title="Email selected"
                                        >
                                            <Mail className="w-4 h-4" />
                                            Email
                                        </button>
                                    </>
                                )}
                            {/* Bouton Clear toujours affiché */}
                            <button
                                onClick={() => {
                                    setSelected(new Set());
                                    saveSelection(new Set());
                                }}
                                className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-3">
                <SearchInput
                    isLoading={isLoading}
                    onSearchChange={onSearchChange}
                    onFocusChange={setIsSearchFocused}

                />

                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 bg-indigo-600 rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                        disabled={isLoading}
                    >
                        {isFullScreen ? (
                            <Minimize2 className="w-4 h-4 text-white" />
                        ) : (
                            <Maximize2 className="w-4 h-4 text-white" />
                        )}
                    </button>
                    {onAddRow && (
                        <button
                            onClick={onAddRow}
                            className="p-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-3"
                            title="Add new row"
                            disabled={isLoading}
                        >
                            <Plus className="w-4 h-4 text-white" />
                            <span className="text-white text-sm hidden sm:inline">Add</span>
                        </button>
                    )}
                    <label className="text-sm text-gray-400 flex items-center gap-2">
                        Page size
                        <select
                            className="rounded px-2 py-1 bg-white border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            value={localPageSize}
                            disabled={isLoading}
                            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        >
                            <option defaultChecked value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </label>

                    <button
                        onClick={() => handleExportClick('all')}
                        className="p-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export all (filtered data)"
                        disabled={isLoading}
                    >
                        <FileDown className="w-4 h-4 text-white" />
                    </button>

                    <button
                        onClick={() => handleExportClick('visible')}
                        className="p-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export visible (current page)"
                        disabled={isLoading}
                    >
                        <Files className="w-4 h-4 text-white" />
                    </button>

                    <button
                        onClick={() => handleExportClick('selected')}
                        className="p-2 bg-green-600 rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Export selected rows"
                        disabled={isLoading || selectedRowIds.size === 0}
                    >
                        <FileCheck className="w-4 h-4 text-white" />
                    </button>

                    {/* Column visibility toggle */}
                    <div className="relative column-toggle-container">
                        <button
                            onClick={() => setShowColumnToggle(!showColumnToggle)}
                            className="relative p-2 bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title="Gérer les colonnes"
                            disabled={isLoading}
                        >
                            {hiddenColumns.size > 0 ? (
                                <EyeOff className="w-4 h-4 text-white" />
                            ) : (
                                <Eye className="w-4 h-4 text-white" />
                            )}
                            {hiddenColumns.size > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {hiddenColumns.size}
                                </span>
                            )}
                        </button>

                        {showColumnToggle && (
                            <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-62.5 z-50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Colonnes visibles</h3>
                                    <button
                                        onClick={() => setShowColumnToggle(false)}
                                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {columns.map(column => {
                                        const isVisible = !hiddenColumns.has(column.key);
                                        return (
                                            <div key={column.key} className="flex items-center justify-between py-1">
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {column.label}
                                                </span>
                                                <button
                                                    onClick={() => hideColumn(column.key)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isVisible ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isVisible ? 'translate-x-5' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <Toggle
                        checked={hide_header_actions}
                        onChange={set_hide_header_actions}
                        size="md"
                    />
                </div>
            </div>


            <div className={cn(
                "overflow-x-auto overflow-y-auto scrollbar-custom border border-gray-200 dark:border-gray-700 rounded-lg",
                isFullScreen ? "max-h-[calc(100vh-120px)] h-[calc(100vh-120px)]" : "max-h-150 h-150"
            )}>
                <table ref={tableRef} className="w-full table-auto border-collapse bg-white dark:bg-gray-800" role="table" aria-label="Data table">
                    <thead role="rowgroup" className="sticky top-0 z-20">
                        <tr role="row" className="text-left text-xs font-medium text-gray-700 border-b border-gray-200 bg-gray-100 dark:text-gray-300 dark:border-gray-700 dark:bg-gray-800">
                            {enableDragDrop && (
                                <th role="columnheader" className="px-2 py-2 w-8" aria-label="Drag to reorder">
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                </th>
                            )}
                            <th role="columnheader" className="px-3 py-2" aria-label="Row number"><ArrowDown01 /></th>
                            <th role="columnheader" className="px-3 py-2" aria-label="Select all">
                                <label className="inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        onChange={() => toggleSelectAllPage()}
                                        checked={paginated.length > 0 && paginated.every(r => selectedRowIds.has(String(getRowId(r))))}
                                        className="sr-only"
                                    />
                                    <span className="w-4 h-4 inline-flex rounded-md border border-gray-600 dark:bg-gray-800 items-center justify-center">
                                        {/* visual check mark */}
                                        {paginated.length > 0 && paginated.every(r => selectedRowIds.has(String(getRowId(r)))) && (
                                            <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </span>
                                </label>
                            </th>

                            {displayedColumns.map((f) => {
                                const col = columns.find(c => c?.key === f);
                                if (!col || !col.label) return null;
                                const width = columnWidths[f];
                                return (
                                    <th
                                        role="columnheader"
                                        key={f}
                                        className={`px-3 py-2 relative ${pinnedColumns.has(f) ? 'bg-indigo-900/20' : ''}`}
                                        aria-label={col.label}
                                        style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
                                    >
                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={(e) => handleSort(f, e.shiftKey)}
                                                className="flex items-center gap-1 hover:text-white cursor-pointer"
                                            >
                                                {col.label}
                                                {sortColumns.find(s => s.column === f) && (
                                                    sortColumns.find(s => s.column === f)!.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                                )}
                                            </button>
                                            {
                                                !hide_header_actions &&
                                                <div className="flex items-center gap-1">
                                                    <button title="Pin" onClick={() => pinColumn(f)} className="p-1 cursor-pointer">
                                                        <Pin className={`w-4 h-4 ${pinnedColumns.has(f) ? 'text-rose-400' : 'text-gray-400'}`} />
                                                    </button>
                                                    <button title="Hide" onClick={() => hideColumn(f)} className="p-1 cursor-pointer">
                                                        <Eye className="w-4 h-4 text-gray-400" />
                                                    </button>
                                                    <button title="Move left" onClick={() => moveColumn(f, 'left')} className="p-1 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                                                    <button title="Move right" onClick={() => moveColumn(f, 'right')} className="p-1 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                                                </div>
                                            }
                                        </div>
                                        {/* Resize handle */}
                                        <div
                                            className="absolute top-0 right-0 w-2 h-full cursor-col-resize group z-10"
                                            onMouseDown={(e) => handleResizeStart(f, e)}
                                            title="Drag to resize column"
                                        >
                                            <div className="absolute right-0 top-0 w-px h-full bg-gray-300 dark:bg-gray-600 group-hover:w-px group-hover:bg-blue-400 dark:group-hover:bg-blue-400 transition-all" />
                                        </div>
                                    </th>
                                );
                            })}

                            <th role="columnheader" className="px-3 py-2" aria-label="Actions">Actions</th>
                        </tr>

                        {/* column filters row */}
                        <tr role="row" className="text-left text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
                            {enableDragDrop && <th />}
                            <th />
                            <th />
                            {displayedColumns.map((f) => {
                                const col = columns.find(c => c?.key === f);
                                if (!col || !col.label) return null;
                                const width = columnWidths[f];
                                const isSearchable = col.searchable !== false;
                                return (
                                    <th
                                        key={f}
                                        className="px-3 py-2"
                                        style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
                                    >
                                        {(() => {
                                            switch (col.type) {
                                                case "date":
                                                    return (
                                                        <CustomDatePicker
                                                            onChange={(value) => {
                                                                setColumnFilters((prev) => ({
                                                                    ...prev,
                                                                    [f]: value,
                                                                }));
                                                            }}
                                                            value={columnFilters[f] || ""}
                                                            placeholder={`Filter ${col.label}`}
                                                            disabled={isLoading || !isSearchable}
                                                            size="h-7.5"
                                                        />
                                                    );

                                                default:
                                                    return (
                                                        <DataTableInput
                                                            placeholder={`Filter ${col.label}`}
                                                            defaultValue={columnFilters[f] || ""}
                                                            debounceMs={400}
                                                            onValueChange={(value) => {
                                                                setColumnFilters((prev) => ({
                                                                    ...prev,
                                                                    [f]: value,
                                                                }));
                                                            }}
                                                            disabled={isLoading || !isSearchable}
                                                            className="w-full px-2 py-0.5 h-7 rounded text-xs font-normal bg-white border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        />
                                                    );
                                            }
                                        })()}
                                    </th>
                                );
                            })}
                            <th />
                        </tr>
                    </thead>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={rowsToRender.map((row) => String(getRowId(row)))}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody role="rowgroup">
                                {/* Loading State */}
                                {isLoading && (
                                    <>
                                        {Array.from({ length: localPageSize }).map((_, idx) => (
                                            <SkeletonRow key={`skeleton-${idx}`} />
                                        ))}
                                    </>
                                )}

                                {/* Empty State */}
                                {!isLoading && !error && rowsToRender.length === 0 && (
                                    <tr>
                                        <td colSpan={displayedColumns.length + 4} className="px-3 py-16">
                                            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                                <Inbox className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
                                                <h3 className="text-lg font-medium mb-2">No data available</h3>
                                                <p className="text-sm text-center">
                                                    {Object.values(columnFilters).some(v => v)
                                                        ? "No results found for your search criteria"
                                                        : "There are no items to display"}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* Data Rows */}
                                {!isLoading && rowsToRender.map((row, i) => {
                                    const isSelected = selectedRowIds.has(String(getRowId(row)));
                                    const isFocused = focusedCell?.rowIdx === i;
                                    const rowId = getRowId(row);
                                    const isHovered = hoveredRowId === rowId;

                                    return (
                                        <React.Fragment key={String(rowId)}>
                                            <DraggableRow
                                                key={String(rowId)}
                                                row={row}
                                                isDragEnabled={enableDragDrop}
                                                isSelected={isSelected}
                                                isFocused={isFocused}
                                                getRowId={getRowId}
                                                onFocus={() => setFocusedCell({ rowIdx: i, colIdx: 0 })}
                                                onContextMenu={(e) => handleContextMenu(e, row)}
                                                onMouseEnter={() => setHoveredRowId(rowId)}
                                                onMouseLeave={() => setHoveredRowId(null)}
                                                onClick={(e: React.MouseEvent<HTMLTableRowElement>) => {
                                                    const t = e.target as HTMLElement | null;
                                                    if (t && typeof t.closest === 'function' && t.closest('button,a,input,svg,label')) return;
                                                    if (e.ctrlKey || e.metaKey) {
                                                        try {
                                                            const rowId = String(getRowId(row));
                                                            toggle(rowId);
                                                            // Sauvegarder après toggle
                                                            setTimeout(() => {
                                                                const newSelection = selectedRowIds.has(rowId)
                                                                    ? new Set([...selectedRowIds].filter(id => id !== rowId))
                                                                    : new Set([...selectedRowIds, rowId]);
                                                                saveSelection(newSelection);
                                                            }, 0);
                                                            try { (e.currentTarget as HTMLElement).blur(); } catch { /* ignore */ }
                                                        } catch (err) {
                                                            console.error('row ctrl-select failed', err);
                                                        }
                                                    }
                                                }}
                                            >
                                                <td role="cell" className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 dark:border-gray-600 border-gray-200 border-r border-b">{(currentPage - 1) * localPageSize + i + 1}
                                                </td>
                                                <td
                                                    role="cell"
                                                    className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 relative dark:border-gray-600 border-gray-200 border-r border-b"
                                                >
                                                    <label
                                                        className="inline-flex items-center cursor-not-allowed"
                                                        onClick={(e) => e.stopPropagation()}
                                                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    >
                                                        <input
                                                            id={`name-${getRowId(row)}`}
                                                            name={`name-${getRowId(row)}`}
                                                            type="checkbox"
                                                            checked={selectedRowIds.has(String(getRowId(row)))}
                                                            disabled={true}
                                                            onChange={(e) => {
                                                                try {
                                                                    toggle(String(getRowId(row)));
                                                                    try { (e.currentTarget as HTMLInputElement).blur(); } catch { /* ignore */ }
                                                                } catch (err) { console.error('toggle select failed', err); }
                                                            }}
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            onKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            aria-label={`Select row ${getRowId(row)}`}
                                                            className="sr-only"
                                                        />
                                                        <span className="w-4 h-4 inline-flex rounded-md border border-gray-600 dark:bg-gray-800 items-center justify-center">
                                                            {selectedRowIds.has(String(getRowId(row))) && (
                                                                <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            )}
                                                        </span>
                                                    </label>
                                                    {/* Add row button - appears on hover */}
                                                    {isHovered && onAddRowAfter && (
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                            }}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                onAddRowAfter(row);
                                                            }}
                                                            className="absolute top-[30%] -left-2 bg-green-600 hover:bg-green-700 text-white rounded-full p-0.5 shadow-xl transition-all hover:scale-110 z-50"
                                                            title="Duplicate row below"
                                                        >
                                                            <PlusCircle className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </td>
                                                {/* display cells */}
                                                {displayedColumns.map((f, colIdx) => {
                                                    const col = columns.find(c => c?.key === f);
                                                    if (!col || !col.label) return null;
                                                    const cellFocused = focusedCell?.rowIdx === i && focusedCell?.colIdx === colIdx + 2;
                                                    const width = columnWidths[f];
                                                    const isEditing = editingCell?.rowId === getRowId(row) && editingCell?.columnKey === f;
                                                    const isEditable = col.editable && onCellEdit;
                                                    const cellKey = `${getRowId(row)}-${f}`;
                                                    const isLoading = loadingCells.has(cellKey);
                                                    const cellValue = col.accessor ? getNestedValue(row, col.accessor) : (row as any)[f];

                                                    return (
                                                        <td
                                                            role="cell"
                                                            key={f}
                                                            tabIndex={cellFocused ? 0 : -1}
                                                            onFocus={() => setFocusedCell({ rowIdx: i, colIdx: colIdx + 2 })}
                                                            onDoubleClick={() => handleCellDoubleClick(row, f)}
                                                            className={`px-3 py-2 text-sm text-gray-900 dark:text-gray-100 border-gray-200 border-r border-b dark:border-gray-600 ${pinnedColumns.has(f) ? 'bg-indigo-100/40 dark:bg-indigo-900/10' : ''} ${cellFocused ? 'ring-2 ring-inset ring-blue-500' : ''} ${isEditable ? 'cursor-text' : 'truncate'}`}
                                                            title={isEditable ? 'Double-cliquez pour éditer' : String((row as any)[f] ?? '')}
                                                            style={width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
                                                        >
                                                            {isEditing ? (
                                                                <DataTableInput
                                                                    ref={editInputRef}
                                                                    type="text"
                                                                    defaultValue={editValue}
                                                                    onValueChange={setEditValue}
                                                                    onKeyDown={handleEditKeyDown}
                                                                    onBlur={saveEdit}

                                                                    className="w-full h-max px-1 py-0.5 bg-white dark:bg-gray-700 border border-blue-500 rounded text-sm focus:outline-none"
                                                                    style={{ whiteSpace: 'pre-wrap' }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            ) : (
                                                                <div className="relative">

                                                                    {isLoading && (
                                                                        <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded flex items-center justify-center">
                                                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                                        </div>
                                                                    )}
                                                                    {col.type === 'boolean' && isEditable ? (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const currentValue = Boolean(cellValue);
                                                                                saveSpecializedEdit(getRowId(row), f, String(!currentValue));
                                                                            }}
                                                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${Boolean(cellValue) ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                                                                                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            disabled={isLoading}
                                                                        >
                                                                            <span
                                                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${Boolean(cellValue) ? 'translate-x-5' : 'translate-x-1'
                                                                                    }`}
                                                                            />
                                                                        </button>
                                                                    ) : (
                                                                        <span
                                                                            className={`inline-block w-full ${!col.render ? 'truncate' : ''} ${isLoading ? 'opacity-50' : ''}`}
                                                                            style={{ whiteSpace: col.render ? 'normal' : 'pre-wrap' }}
                                                                        >
                                                                            {col.render ? col.render(row, setImageModal) :
                                                                                col.accessor ? String(getNestedValue(row, col.accessor) ?? "-") :
                                                                                    col.type === "date" ? formatRelativeDate(cellValue) :
                                                                                        String(cellValue ?? "-")}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}



                                                <td role="cell" className="px-3 py-2 text-sm flex gap-2 text-gray-900 dark:text-gray-100">
                                                    {renderActions ? renderActions(row) : (
                                                        <>
                                                            {(onEditRow || onCellEdit) && (
                                                                <button
                                                                    className="p-1.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition-colors"
                                                                    title="Edit"
                                                                    onClick={() => handleEditClick(row)}
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            {onDeleteRow && (
                                                                <button
                                                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                                                                    title="Delete"
                                                                    onClick={() => handleDeleteClick(row)}
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                            </DraggableRow>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </SortableContext>
                    </DndContext>
                </table>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className={`text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 ${isLoading ? 'opacity-50' : ''}`}>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span className="whitespace-nowrap">
                        {isPaginated ? (
                            `Showing ${((paginationInfo.currentPage - 1) * itemsPerPage) + 1} - ${Math.min(paginationInfo.currentPage * itemsPerPage, paginationInfo.count)} of ${paginationInfo.count}`
                        ) : (
                            `Showing ${(currentPage - 1) * localPageSize + 1} - ${Math.min(currentPage * localPageSize, filteredByColumns.length)} of ${filteredByColumns.length}`
                        )}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={(isPaginated ? !paginationInfo.hasPrevious : currentPage <= 1) || isLoading}
                        className="px-3 py-1 rounded flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:disabled:opacity-50"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Prev</span>
                    </button>
                    <div className={`text-sm text-gray-700 dark:text-gray-300 ${isLoading ? 'opacity-50' : ''} whitespace-nowrap`}>
                        {isPaginated ? (
                            `Page ${paginationInfo.currentPage} / ${paginationInfo.totalPages}`
                        ) : (
                            `Page ${currentPage} / ${Math.max(1, Math.ceil(filteredByColumns.length / localPageSize))}`
                        )}
                    </div>
                    <button
                        onClick={() => setCurrentPage((p) => isPaginated ? Math.min(paginationInfo.totalPages, p + 1) : Math.min(Math.ceil(filteredByColumns.length / localPageSize), p + 1))}
                        disabled={(isPaginated ? !paginationInfo.hasNext : currentPage >= Math.ceil(filteredByColumns.length / localPageSize)) || isLoading}
                        className="px-3 py-1 rounded flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 dark:disabled:opacity-50"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Details modal */}
            {detailsRow && (
                <div className="
        fixed inset-0 z-50 
        bg-black/40 backdrop-blur-sm 
        flex items-center justify-center
        p-4
        transition
    ">
                    <div className="
            w-full max-w-2xl 
            bg-white dark:bg-gray-900 
            text-gray-900 dark:text-gray-100 
            shadow-2xl rounded-2xl 
            border border-gray-200 dark:border-gray-700
            p-6 
            animate-in fade-in zoom-in duration-200
        ">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">
                                Détails de la ligne
                            </h3>

                            <button
                                onClick={() => setDetailsRow(null)}
                                className="
                        px-3 py-1.5 text-sm font-medium 
                        rounded-lg 
                        bg-red-500 hover:bg-red-600 
                        text-white 
                        transition-colors
                    "
                            >
                                Fermer
                            </button>
                        </div>

                        {/* Content */}
                        <ul className="
                bg-gray-50 dark:bg-gray-800 
                p-4 rounded-xl 
                max-h-[420px] overflow-auto 
                space-y-3
            ">
                            {Object.entries(detailsRow).map(([key, value]) => (
                                <li key={key} className="flex gap-3">
                                    <span className="
                            font-semibold 
                            text-gray-700 dark:text-gray-200 
                            min-w-[130px]
                        ">
                                        {key}
                                    </span>

                                    <span className="
                            text-gray-600 dark:text-gray-300 
                            break-all
                        ">
                                        {String(value)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}


            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[180px] z-50"
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-gray-100"
                        onClick={() => {
                            if (contextMenu.row) {
                                // Copy row data as JSON
                                navigator.clipboard.writeText(JSON.stringify(contextMenu.row, null, 2));
                                alert('Row data copied to clipboard');
                            }
                            setContextMenu(null);
                        }}
                    >
                        <Copy className="w-4 h-4" />
                        Copy
                    </button>
                    <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-gray-100"
                        onClick={() => {
                            if (contextMenu.row) {
                                // Copy only visible cell values
                                const visibleData = displayedColumns.reduce((acc, col) => {
                                    acc[col] = (contextMenu.row as any)[col];
                                    return acc;
                                }, {} as Record<string, any>);
                                navigator.clipboard.writeText(JSON.stringify(visibleData, null, 2));
                                alert('Visible data copied to clipboard');
                            }
                            setContextMenu(null);
                        }}
                    >
                        <Copy className="w-4 h-4" />
                        Copy (Visible Only)
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-gray-100"
                        onClick={() => {
                            if (contextMenu.row) {
                                setDetailsRow(contextMenu.row);
                            }
                            setContextMenu(null);
                        }}
                    >
                        <Eye className="w-4 h-4" />
                        View Details
                    </button>
                    {(onEditRow || onCellEdit) && (
                        <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 text-gray-900 dark:text-gray-100"
                            onClick={() => {
                                if (contextMenu.row) {
                                    handleEditClick(contextMenu.row);
                                }
                                setContextMenu(null);
                            }}
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </button>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                    {onDeleteRow && (
                        <button
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 text-red-600 dark:text-red-400"
                            onClick={() => {
                                if (contextMenu.row) {
                                    handleDeleteClick(contextMenu.row);
                                }
                                setContextMenu(null);
                            }}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmRow && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setDeleteConfirmRow(null)}
                            className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-3 flex justify-center">
                            <AlertCircle className="text-red-500" size={26} />
                        </div>

                        <h2 className="text-xl font-semibold text-center mb-2">
                            Confirmer la suppression
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
                            Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.
                        </p>

                        <div className="mt-4 flex justify-center gap-3">
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                                Supprimer
                            </button>
                            <button
                                onClick={() => setDeleteConfirmRow(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editModalRow && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                        Modifier l'élément
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setEditModalRow(null);
                                            setEditFormData({});
                                        }}
                                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-all duration-200"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                                <div className="space-y-4">
                                    {columns.filter(col => col.editable !== false).map((col) => {
                                        let currentValue = editFormData[col.key] ?? '';

                                        if (Object(currentValue)) {
                                            if (currentValue.id != undefined) {
                                                currentValue = currentValue.id
                                            }
                                        }


                                        return (
                                            <div key={col.key} className="space-y-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {col.label}
                                                </label>

                                                {col.type === 'date' ? (

                                                    <CustomDatePicker
                                                        onChange={(e) => setEditFormData(prev => ({
                                                            ...prev,
                                                            [col.key]: e
                                                        }))}
                                                        value={currentValue}
                                                    />
                                                ) : col.type === 'number' ? (
                                                    <DataTableInput
                                                        type="number"
                                                        defaultValue={currentValue}
                                                        onValueChange={(value) => {
                                                            setEditFormData(prev => ({
                                                                ...prev,
                                                                [col.key]: value
                                                            }))
                                                        }}
                                                    />
                                                ) : col.type === 'email' ? (
                                                    <DataTableInput
                                                        type="email"
                                                        defaultValue={currentValue}
                                                        onValueChange={(value) => {
                                                            setEditFormData(prev => ({
                                                                ...prev,
                                                                [col.key]: value
                                                            }))
                                                        }}
                                                    />
                                                ) : col.type === 'boolean' ? (
                                                    <div className="flex items-center space-x-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditFormData(prev => ({
                                                                ...prev,
                                                                [col.key]: !Boolean(prev[col.key])
                                                            }))}
                                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${Boolean(currentValue) ? 'bg-blue-600 shadow-lg' : 'bg-gray-300 dark:bg-gray-600'
                                                                }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${Boolean(currentValue) ? 'translate-x-5' : 'translate-x-1'
                                                                    }`}
                                                            />
                                                        </button>
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {Boolean(currentValue) ? 'Activé' : 'Désactivé'}
                                                        </span>
                                                    </div>
                                                ) : col.type === 'select' && col.options ? (
                                                    <SingleSelectDropdown
                                                        options={col.options}
                                                        value={String(currentValue)}
                                                        onChange={(value) => setEditFormData(prev => ({
                                                            ...prev,
                                                            [col.key]: value
                                                        }))}
                                                        placeholder="Sélectionner..."

                                                    />
                                                ) : col.type === 'multiselect' && col.options ? (
                                                    <MultiSelectDropdown
                                                        options={col.options}
                                                        value={Array.isArray(currentValue) ? currentValue : String(currentValue).split(',').filter(Boolean)}
                                                        onChange={(values) => setEditFormData(prev => ({
                                                            ...prev,
                                                            [col.key]: values.join(',')
                                                        }))}
                                                        placeholder="Sélectionner les langues..."

                                                    />
                                                ) : col.type === 'image' ? (
                                                    <div className="space-y-3">
                                                        {currentValue && (
                                                            <div className="flex justify-center">
                                                                <img src={String(currentValue)} alt="Aperçu" className="w-16 h-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
                                                            </div>
                                                        )}
                                                        <DataTableInput
                                                            type="url"
                                                            defaultValue={currentValue}
                                                            onValueChange={(value) => {
                                                                setEditFormData(prev => ({
                                                                    ...prev,
                                                                    [col.key]: value
                                                                }))
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <DataTableInput
                                                        type="text"

                                                        defaultValue={currentValue}
                                                        onValueChange={(value) => {
                                                            setEditFormData(prev => ({
                                                                ...prev,
                                                                [col.key]: value
                                                            }))
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => {
                                            setEditModalRow(null);
                                            setEditFormData({});
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={saveEditModal}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 hover:shadow-md"
                                    >
                                        Sauvegarder
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowExportModal(false)}
                            className="absolute top-3 right-3 p-1 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                            <X size={20} />
                        </button>

                        <div className="mb-3 flex justify-center">
                            <Download className="text-blue-500" size={26} />
                        </div>

                        <h2 className="text-xl font-semibold text-center mb-2">
                            Exporter les données
                        </h2>

                        <p className="text-gray-600 dark:text-gray-300 text-center mb-6 text-sm">
                            {exportType === 'all' && `${filteredByColumns.length} lignes (toutes les données filtrées)`}
                            {exportType === 'visible' && `${paginated.length} lignes (page actuelle)`}
                            {exportType === 'selected' && `${selectedRowIds.size} lignes (sélection)`}
                        </p>

                        <div className="space-y-4">
                            {/* File name input */}
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Nom du fichier
                                </label>
                                <DataTableInput
                                    type="text"
                                    defaultValue={exportFileName}
                                    onValueChange={setExportFileName}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    La date sera ajoutée automatiquement
                                </p>
                            </div>

                            {/* Format selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Format d'export
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <input
                                            type="radio"
                                            name="exportFormat"
                                            value="csv"
                                            checked={exportFormat === 'csv'}
                                            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'json')}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">CSV</div>
                                            <div className="text-xs text-gray-500">Format texte compatible Excel</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <input
                                            type="radio"
                                            name="exportFormat"
                                            value="excel"
                                            checked={exportFormat === 'excel'}
                                            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'json')}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">Excel (.xlsx)</div>
                                            <div className="text-xs text-gray-500">Format Excel natif</div>
                                        </div>
                                    </label>

                                    <label className="flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <input
                                            type="radio"
                                            name="exportFormat"
                                            value="json"
                                            checked={exportFormat === 'json'}
                                            onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel' | 'json')}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">JSON</div>
                                            <div className="text-xs text-gray-500">Format de données structurées</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center gap-3">
                            <button
                                onClick={() => setShowExportModal(false)}
                                className="px-4 py-1.5 text-sm h-max bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleExport}
                                className="px-4 py-1.5 h-max text-sm  bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <Download size={14} />
                                Télécharger
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {imageModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setImageModal(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setImageModal(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={imageModal.src}
                            alt={imageModal.alt}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}

            {/* Image Edit Modal */}
            {imageEditModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Modifier l'image</h3>

                        {imageEditModal.currentValue && (
                            <div className="mb-4">
                                <img src={imageEditModal.currentValue} alt="Aperçu" className="w-20 h-20 rounded-lg object-cover mx-auto" />
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setSelectedImageFile(file);
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        setImagePreview(event.target?.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />

                        {/* Aperçu de la nouvelle image */}
                        {imagePreview && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Nouvelle image :</p>
                                <img src={imagePreview} alt="Nouvel aperçu" className="w-32 h-32 rounded-lg object-cover mx-auto border" />
                            </div>
                        )}

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setImageEditModal(null);
                                    setSelectedImageFile(null);
                                    setImagePreview(null);
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={async () => {
                                    if (selectedImageFile && uploadFunction) {
                                        setUploadingImage(true);
                                        try {
                                            const imageUrl = await uploadFunction(selectedImageFile, imageEditModal.rowId);
                                            await saveSpecializedEdit(imageEditModal.rowId, imageEditModal.columnKey, imageUrl);
                                            setImageEditModal(null);
                                            setSelectedImageFile(null);
                                            setImagePreview(null);
                                        } catch (error) {
                                            console.error('Upload error:', error);
                                            alert('Erreur lors de l\'upload de l\'image');
                                        } finally {
                                            setUploadingImage(false);
                                        }
                                    }
                                }}
                                disabled={!selectedImageFile || uploadingImage || !uploadFunction}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploadingImage && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                {uploadingImage ? 'Upload...' : 'Uploader'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Date Edit Modal */}
            {dateEditModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Modifier la date</h3>

                        <input
                            type="date"
                            defaultValue={dateEditModal.currentValue.split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    saveSpecializedEdit(dateEditModal.rowId, dateEditModal.columnKey, e.currentTarget.value);
                                    setDateEditModal(null);
                                }
                            }}
                        />

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setDateEditModal(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={(e) => {
                                    const input = e.currentTarget.parentElement?.previousElementSibling as HTMLInputElement;
                                    if (input) {
                                        saveSpecializedEdit(dateEditModal.rowId, dateEditModal.columnKey, input.value);
                                        setDateEditModal(null);
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Select Edit Modal */}
            {selectEditModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                            {selectEditModal.isMultiple ? 'Sélectionner les valeurs' : 'Sélectionner une valeur'}
                        </h3>

                        <div className="mb-4">
                            {selectEditModal.isMultiple ? (
                                <MultiSelectDropdown
                                    options={selectEditModal.options}
                                    value={String(selectEditModal.currentValue).split(',').filter(Boolean)}
                                    onChange={(values) => {
                                        // Pour multiselect, on met juste à jour la modal sans soumettre
                                        setSelectEditModal(prev => prev ? { ...prev, currentValue: values.join(',') } : null);
                                    }}
                                    placeholder="Sélectionner..."
                                />
                            ) : (
                                <SingleSelectDropdown
                                    options={selectEditModal.options}
                                    value={String(selectEditModal.currentValue)}
                                    onChange={(value) => {
                                        saveSpecializedEdit(selectEditModal.rowId, selectEditModal.columnKey, value);
                                        setSelectEditModal(null);
                                    }}
                                    placeholder="Sélectionner..."
                                />
                            )}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setSelectEditModal(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                            >
                                Annuler
                            </button>
                            {selectEditModal.isMultiple && (
                                <button
                                    onClick={() => {
                                        saveSpecializedEdit(selectEditModal.rowId, selectEditModal.columnKey, selectEditModal.currentValue);
                                        setSelectEditModal(null);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Confirmer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default DataTable;
