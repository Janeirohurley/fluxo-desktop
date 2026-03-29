import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { Input } from './input';

export interface Option {
  id: string;
  label: string;
  value?: string;
}

export interface GroupedOption {
  group: string;
  options: Option[];
}

interface SingleSelectDropdownProps {
  options: Option[] | GroupedOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  required?: boolean;
  isLocalSearch?: boolean;
  onSearchChange?: (searchTerm: string) => void;
  isSearching?: boolean;
}

export function SingleSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  disabled = false,
  className = "",
  label,
  required = false,
  isLocalSearch = true,
  onSearchChange,
  isSearching = false
}: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: ReturnType<typeof setTimeout>;
      return (term: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (!isLocalSearch && onSearchChange) {
            onSearchChange(term);
          }
        }, 500);
      };
    })(),
    [isLocalSearch, onSearchChange]
  );

  const isGrouped = options.length > 0 && 'group' in options[0];
  
  const allOptions = isGrouped 
    ? (options as GroupedOption[]).flatMap(g => g.options)
    : options as Option[];
  
  const selectedOption = allOptions.find(opt => opt.id === value);

  const filteredData = isLocalSearch
    ? (isGrouped
        ? (options as GroupedOption[]).map(group => ({
            group: group.group,
            options: group.options.filter(opt => 
              opt.label.toLowerCase().includes(searchTerm.toLowerCase())
            )
          })).filter(g => g.options.length > 0)
        : (options as Option[]).filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
          ))
    : (isGrouped
        ? (options as GroupedOption[])
        : (options as Option[]));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const dropdownHeight = dropdownRef.current?.offsetHeight || 300;
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        const shouldOpenAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
        
        let left = rect.left;
        const dropdownWidth = rect.width;
        if (left + dropdownWidth > window.innerWidth) {
          left = window.innerWidth - dropdownWidth - 8;
        }
        if (left < 8) {
          left = 8;
        }
        
        setDropdownPosition({
          top: shouldOpenAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
          left: left,
          width: rect.width
        });
      }
    };

    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`
          flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md cursor-pointer
          hover:border-gray-400 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500
          dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isOpen ? 'ring-1 ring-blue-500 border-blue-500' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
          {selectedOption?.label || placeholder}
        </span>

        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-9999 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-600">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                className="pl-9 h-8"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                Recherche en cours...
              </div>
            ) : isGrouped ? (
              (filteredData as GroupedOption[]).length > 0 ? (
                (filteredData as GroupedOption[]).map((group, idx) => (
                  <div key={idx}>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                      {group.group}
                    </div>
                    {group.options.map((option) => (
                      <div
                        key={option.id}
                        className={`
                          px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                          ${value === option.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
                        `}
                        onClick={() => handleSelect(option.id)}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Aucun résultat trouvé
                </div>
              )
            ) : (
              (filteredData as Option[]).length > 0 ? (
                (filteredData as Option[]).map((option) => (
                  <div
                    key={option.id}
                    className={`
                      px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                      ${value === option.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}
                    `}
                    onClick={() => handleSelect(option.id)}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  Aucun résultat trouvé
                </div>
              )
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}