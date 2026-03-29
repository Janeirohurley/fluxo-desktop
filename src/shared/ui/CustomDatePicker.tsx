import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Input } from './input';
import { cn } from '@/shared/lib/cn';

interface CustomDatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  allowManualInput?: boolean;
  disabled?: boolean;
  size?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  placeholder = "Sélectionner une date",
  label,
  required = false,
  className = "",
  disabled = false,
  size="h-10",
  allowManualInput = true
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [selectionPulse, setSelectionPulse] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const selectionTimeoutRef = useRef<number | null>(null);

  const selectedDate = value ? new Date(value) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (selectionTimeoutRef.current) {
        window.clearTimeout(selectionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        const dropdownWidth = 320; // w-80 = 320px
        const dropdownHeight = allowManualInput ? 450 : 400;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = viewportWidth - rect.left;
        const spaceLeft = rect.left;

        // Déterminer si le dropdown doit s'ouvrir au-dessus ou en dessous
        const shouldOpenAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        // Calculer la position verticale
        let top = shouldOpenAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4;

        // S'assurer que le dropdown reste dans le viewport verticalement
        if (top < 8) {
          top = 8;
        } else if (top + dropdownHeight > viewportHeight - 8) {
          top = viewportHeight - dropdownHeight - 8;
        }

        // Calculer la position horizontale
        let left = rect.left;

        // Si pas assez d'espace à droite, aligner à droite de l'input
        if (spaceRight < dropdownWidth && spaceLeft > spaceRight) {
          left = rect.right - dropdownWidth;
        }

        // S'assurer que le dropdown reste dans le viewport horizontalement
        if (left < 8) {
          left = 8;
        } else if (left + dropdownWidth > viewportWidth - 8) {
          left = viewportWidth - dropdownWidth - 8;
        }

        setDropdownPosition({
          top,
          left,
          width: Math.min(rect.width, dropdownWidth)
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
  }, [isOpen, allowManualInput]);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const parseInputDate = (input: string): Date | null => {
    // Support multiple formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
    const cleanInput = input.replace(/[.-]/g, '/');
    const parts = cleanInput.split('/');

    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS Date
      const year = parseInt(parts[2], 10);

      // Validate ranges
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900 && year <= new Date().getFullYear()) {
        const date = new Date(year, month, day);
        // Check if the date is valid (handles invalid dates like 31/02)
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return date;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (value) {
      setInputValue(formatDisplayDate(new Date(value)));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    const formattedDate = formatDate(date);
    onChange(formattedDate);
    setInputValue(formatDisplayDate(date));
    if (selectionTimeoutRef.current) {
      window.clearTimeout(selectionTimeoutRef.current);
    }
    setSelectionPulse(formattedDate);
    selectionTimeoutRef.current = window.setTimeout(() => {
      setSelectionPulse(null);
    }, 180);
    setIsOpen(false);
  };

  const initialise = () => {
    onChange("");
    setInputValue("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Ne pas parser automatiquement pendant la saisie
  };

  const handleInputBlur = () => {
    // Parse only when user finishes typing (on blur)
    const parsedDate = parseInputDate(inputValue);
    if (parsedDate) {
      const isoDate = formatDate(parsedDate);
      onChange(isoDate);
      setInputValue(formatDisplayDate(parsedDate));
      setCurrentDate(parsedDate); // Update calendar to show the input date
    } else if (value) {
      // Revert to last valid value if input is invalid
      setInputValue(formatDisplayDate(new Date(value)));
    } else {
      setInputValue('');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (viewMode !== 'day') return;
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    if (viewMode === 'day') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setFullYear(prev.getFullYear() - 1);
        } else {
          newDate.setFullYear(prev.getFullYear() + 1);
        }
        return newDate;
      });
    } else if (viewMode === 'year') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        if (direction === 'prev') {
          newDate.setFullYear(prev.getFullYear() - 12);
        } else {
          newDate.setFullYear(prev.getFullYear() + 12);
        }
        return newDate;
      });
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className={`relative ${className}`} ref={inputRef}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {allowManualInput ? (
          <div className="relative ">
            <Input
              disabled={disabled}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className={cn("pr-10",size)}
            />
            <div className='absolute border-amber-400 right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex space-x-2'>
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (selectedDate) {
                    setCurrentDate(selectedDate);
                  }
                  setIsOpen(!isOpen);
                }}
                className=""
              >
                <div className='flex space-x-1  cursor-pointer'>
                  <Calendar size={16} />
                </div>

              </button>
              {
                selectedDate &&
                <button
                  type="button"
                  disabled={disabled}
                  onClick={initialise}
                  className=""
                >
                  <div className='flex space-x-1 text-red-400 cursor-pointer'>
                    <X size={16} />
                  </div>

                </button>
              }
            </div>


          </div>
        ) : (
          <div
            className={`
              flex items-center justify-between w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md cursor-pointer
              hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
              ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            `}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className={selectedDate ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}>
              {selectedDate ? formatDisplayDate(selectedDate) : placeholder}
            </span>
            <Calendar size={16} className="text-gray-400" />
          </div>
        )}
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] w-80 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-600 animate-in fade-in zoom-in duration-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            maxWidth: 'calc(100vw - 16px)'
          }}
        >
          {allowManualInput && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 Vous pouvez taper directement: JJ/MM/AAAA (ex: 15/03/1990)
              </p>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigateYear('prev');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft size={16} />
              </button>
              {viewMode === 'day' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateMonth('prev');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setViewMode(prev => prev === 'day' ? 'month' : prev === 'month' ? 'year' : 'day');
              }}
              className="font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors text-gray-900 dark:text-gray-100"
            >
              {viewMode === 'day' && `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {viewMode === 'month' && currentDate.getFullYear()}
              {viewMode === 'year' && `${Math.floor(currentDate.getFullYear() / 12) * 12} - ${Math.floor(currentDate.getFullYear() / 12) * 12 + 11}`}
            </button>

            <div className="flex items-center gap-2">
              {viewMode === 'day' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateMonth('next');
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                >
                  <ChevronRight size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigateYear('next');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            {viewMode === 'day' && (
              <>
                {/* Days of week */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentDate).map((date, index) => (
                    <div key={index} className="aspect-square">
                      {date ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDateSelect(date);
                          }}
                          className={`
                            w-full h-full text-sm rounded transition-all duration-150 ease-out hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95
                            ${isSelected(date)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : isToday(date)
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-900 dark:text-gray-100'
                            }
                            ${selectionPulse === formatDate(date) ? 'animate-in zoom-in-50 duration-150' : ''}
                          `}
                        >
                          {date.getDate()}
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {viewMode === 'month' && (
              <div className="grid grid-cols-3 gap-2">
                {months.map((month, i) => (
                  <button
                    key={month}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentDate(new Date(currentDate.getFullYear(), i, 1));
                      setViewMode('day');
                    }}
                    className={`
                      p-3 rounded-lg transition-colors font-medium text-sm
                      ${i === currentDate.getMonth()
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }
                    `}
                  >
                    {month}
                  </button>
                ))}
              </div>
            )}

            {viewMode === 'year' && (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const startYear = Math.floor(currentDate.getFullYear() / 12) * 12;
                  const year = startYear + i;
                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentDate(new Date(year, currentDate.getMonth(), 1));
                        setViewMode('month');
                      }}
                      className={`
                        p-3 rounded-lg transition-colors font-medium text-sm
                        ${year === currentDate.getFullYear()
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }
                      `}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
