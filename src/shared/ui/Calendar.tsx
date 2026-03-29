import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Lock, Calendar} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


/* ---------- Types ---------- */

type ViewMode = "day" | "month" | "year";
type EventType = 'exam' | 'holiday' | 'course' | 'event' | 'break';
type SelectionMode = 'single' | 'multiple' | 'range';

interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    type: EventType;
    color?: string;
}

interface CalendarProps {
    onDateSelect?: (date: Date) => void;
    onDateRangeSelect?: (start: Date, end: Date) => void;
    events?: CalendarEvent[];
    selectionMode?: SelectionMode;
    showWeekends?: boolean;
    compact?: boolean;
}
/* ---------- Date Utilities ---------- */

// Create date from natural format: createDate(2024, 9, 15) = 15 septembre 2024
const createDate = (year: number, month: number, day: number) => new Date(year, month - 1, day);

// Parse date string in ISO format to local date (avoid timezone issues)
const parseISODate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
};

// Format date according to user's locale
const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
    };
    return date.toLocaleDateString(navigator.language, defaultOptions);
};

// Get localized month names
const getLocalizedMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
        const date = new Date(2024, i, 1);
        months.push(date.toLocaleDateString(navigator.language, { month: 'short' }));
    }
    return months;
};

// Get localized day names starting with Monday
const getLocalizedDays = () => {
    const days = [];
    // January 1, 2024 is a Monday, so we start from there
    for (let i = 0; i < 7; i++) {
        const date = new Date(2024, 0, 1 + i); // Start from Monday Jan 1, 2024
        days.push(date.toLocaleDateString(navigator.language, { weekday: 'short' }));
    }
    return days;
};

/* ---------- Localized Constants ---------- */

const days = getLocalizedDays();
const months = getLocalizedMonths();

/* ---------- Mock Data ---------- */

const mockEvents: CalendarEvent[] = [
    { id: '1', date: createDate(2024, 9, 15), title: 'Rentrée des classes', type: 'event', color: 'bg-green-500' },
    { id: '2', date: createDate(2025, 10, 10), title: 'Examen Mathématiques', type: 'exam', color: 'bg-red-500' },
    { id: '3', date: createDate(2025, 10, 25), title: 'Cours de Physique', type: 'course', color: 'bg-blue-500' },
    { id: '4', date: createDate(2025, 11, 1), title: 'Toussaint', type: 'holiday', color: 'bg-orange-500' },
    { id: '5', date: createDate(2025, 12, 20), title: 'Vacances de Noël', type: 'break', color: 'bg-purple-500' },
    { id: '6', date: createDate(2025, 1, 8), title: 'Reprise des cours', type: 'event', color: 'bg-green-500' },
    { id: '7', date: createDate(2025, 2, 14), title: 'Examen Final', type: 'exam', color: 'bg-red-500' },
    { id: '8', date: createDate(2025, 3, 15), title: 'Cours de printemps', type: 'course', color: 'bg-blue-500' },
];

const holidays = [
    { start: createDate(2025, 3, 12), end: createDate(2025, 3, 13) },//
];


/* ---------- Helper Functions ---------- */

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
const isHoliday = (date: Date) => holidays.some(h => date >= h.start && date <= h.end);
const isOutAcademicYear = (date: Date, academicYear: { start: Date; end: Date }) => {
    // Compare only dates, not time to avoid timezone issues
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOnly = new Date(academicYear.start.getFullYear(), academicYear.start.getMonth(), academicYear.start.getDate());
    const endOnly = new Date(academicYear.end.getFullYear(), academicYear.end.getMonth(), academicYear.end.getDate());
    
    const isOut = dateOnly < startOnly || dateOnly > endOnly;
    

    
    return isOut;
};
const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

// const getEventIcon = (type: EventType) => {
//     switch (type) {
//         case 'exam': return <AlertCircle className="w-3 h-3" />;
//         case 'course': return <BookOpen className="w-3 h-3" />;
//         case 'event': return <GraduationCap className="w-3 h-3" />;
//         case 'holiday': return <Coffee className="w-3 h-3" />;
//         case 'break': return <Coffee className="w-3 h-3" />;
//         default: return <Calendar className="w-3 h-3" />;
//     }
// };

const getEventsForDate = (date: Date, events: CalendarEvent[]) =>
    events.filter(event => event.date.toDateString() === date.toDateString());

/* ---------- Component ---------- */

export default function AcademicCalendar({
    onDateSelect,
    onDateRangeSelect,
    events = mockEvents,
    selectionMode = 'single',
    showWeekends = true,
    compact = false
}: CalendarProps = {}) {

    const academicYear = useMemo(() => {
        return {
            start: parseISODate("2025-09-15T08:00:00Z"),
            end: parseISODate("2026-07-31T23:59:59Z")
        };
    }, []);

    const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

    // Update currentDate when academicYear changes (only if today is outside academic year)
    useEffect(() => {
        if (academicYear) {
            const today = new Date();
            const isOutside = isOutAcademicYear(today, academicYear);
            if (isOutside) {
                // Si aujourd'hui est hors année académique, aller au début de l'année académique
                setCurrentDate(academicYear.start);
            }
            // Sinon, garder la date d'aujourd'hui
        }
    }, [academicYear]);

 
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>("day");
    const [rangeStart, setRangeStart] = useState<Date | null>(null);

    /* ---------- Memoized Calculations ---------- */

    const calendarData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const startDay = (firstDayOfMonth.getDay() + 6) % 7;
        const totalDays = lastDayOfMonth.getDate();
        const startYear = Math.floor(year / 12) * 12;
        const years = Array.from({ length: 12 }, (_, i) => startYear + i);

        return { year, month, firstDayOfMonth, lastDayOfMonth, startDay, totalDays, startYear, years };
    }, [currentDate]);

    /* ---------- Navigation ---------- */

    const navigate = useCallback((direction: "prev" | "next") => {
        const { year, month } = calendarData;
        let nextDate: Date | null = null;

        if (viewMode === "day") {
            nextDate = new Date(year, month + (direction === "next" ? 1 : -1), 1);
        }
        if (viewMode === "month") {
            nextDate = new Date(year + (direction === "next" ? 1 : -1), month, 1);
        }
        if (viewMode === "year") {
            nextDate = new Date(year + (direction === "next" ? 12 : -12), month, 1);
        }

        if (nextDate) {
            setCurrentDate(nextDate);
        }
    }, [calendarData, viewMode]);

    /* ---------- Date Selection Logic ---------- */

    const handleDateClick = useCallback((date: Date) => {
        if (selectionMode === 'single') {
            setSelectedDates([date]);
            onDateSelect?.(date);
        } else if (selectionMode === 'multiple') {
            setSelectedDates(prev => {
                const exists = prev.find(d => d.toDateString() === date.toDateString());
                return exists
                    ? prev.filter(d => d.toDateString() !== date.toDateString())
                    : [...prev, date];
            });
        } else if (selectionMode === 'range') {
            if (!rangeStart) {
                setRangeStart(date);
                setSelectedDates([date]);
            } else {
                const start = rangeStart < date ? rangeStart : date;
                const end = rangeStart < date ? date : rangeStart;
                setSelectedDates([start, end]);
                onDateRangeSelect?.(start, end);
                setRangeStart(null);
            }
        }
    }, [selectionMode, rangeStart, onDateSelect, onDateRangeSelect]);

    /* ---------- Keyboard Navigation ---------- */

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowLeft': navigate('prev'); break;
                case 'ArrowRight': navigate('next'); break;
                case 'Escape': setViewMode('day'); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    const isDateSelected = useCallback((date: Date) => {
        return selectedDates.some(d => d.toDateString() === date.toDateString());
    }, [selectedDates]);

    const isDisabledDate = useCallback((date: Date) => {
        return (!showWeekends && isWeekend(date)) || isHoliday(date) || (academicYear && isOutAcademicYear(date, academicYear));
    }, [showWeekends, academicYear]);

    const { year, month, startYear } = calendarData;

    // Don't render if no academic year is selected
    if (!academicYear) {
        return (
            <div className={`${compact ? 'w-72' : 'w-80'} bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4`}>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Aucune année académique sélectionnée</p>
                    <p className="text-xs mt-1">Veuillez sélectionner une année académique pour afficher le calendrier</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${compact ? 'w-72' : 'w-80'} bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigate("prev")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Mois précédent"
                >
                    <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>

                <button
                    onClick={() =>
                        setViewMode(
                            viewMode === "day"
                                ? "month"
                                : viewMode === "month"
                                    ? "year"
                                    : "day"
                        )
                    }
                    className="font-semibold text-sm capitalize hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1 rounded-lg transition-colors text-gray-900 dark:text-gray-100"
                >
                    {viewMode === "day" && formatDate(currentDate, { month: "long", year: "numeric" })}
                    {viewMode === "month" && year}
                    {viewMode === "year" && `${startYear} - ${startYear + 11}`}
                </button>

                <button
                    onClick={() => navigate("next")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Mois suivant"
                >
                    <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
            </div>

            {/* Legend */}
            {!compact && (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Légende:</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">Examens</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">Cours</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-gray-700 dark:text-gray-300">Vacances</span>
                        </div>
                    </div>
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* ---------- DAY VIEW ---------- */}
                {viewMode === "day" && (
                    <motion.div
                        key="day"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="grid grid-cols-7 text-xs text-center mb-2">
                            {days.map(d => (
                                <div key={d} className="text-gray-600 dark:text-gray-400 font-medium py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: calendarData.startDay }).map((_, i) => (
                                <div key={i} />
                            ))}

                            {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                                const day = i + 1;
                                const date = new Date(year, month, day);
                                const disabled = isDisabledDate(date);
                                const selected = isDateSelected(date);
                                const today = isToday(date);
                                const dayEvents = getEventsForDate(date, events);

                                return (
                                    <div key={day} className="relative">
                                        <button
                                            disabled={disabled as boolean}
                                            onClick={() => !disabled && handleDateClick(date)}
                                            className={`
                                                h-9 w-9 rounded-xl flex items-center justify-center
                                                transition-all relative text-sm font-medium
                                                ${selected
                                                    ? "bg-blue-600 text-white shadow-md"
                                                    : today
                                                        ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500"
                                                        : disabled
                                                            ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                                            : "hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                }
                                            `}
                                        >
                                            {disabled ? <Lock className="w-3 h-3" /> : day}
                                        </button>

                                        {/* Event indicators */}
                                        {dayEvents.length > 0 && (
                                            <div className="absolute top-1 right-0 transform  flex gap-0.5">
                                                {dayEvents.slice(0, 3).map((event, idx) => (
                                                    <div
                                                        key={event.id || idx}
                                                        className={`w-1.5 h-1.5 rounded-full ${event.color || 'bg-gray-400'}`}
                                                        title={event.title}
                                                    />
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" title={`+${dayEvents.length - 3} autres`} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ---------- MONTH VIEW ---------- */}
                {viewMode === "month" && (
                    <motion.div
                        key="month"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-3 gap-3"
                    >
                        {months.map((m, i) => {
                            const nextDate = new Date(year, i, 1);
                            const disabled = academicYear ? isOutAcademicYear(nextDate, academicYear) : false;
                            const isCurrent = i === month;

                            return (
                                <button
                                    key={m}
                                    disabled={disabled}
                                    onClick={() => {
                                        if (!disabled) {
                                            setCurrentDate(nextDate);
                                            setViewMode("day");
                                        }
                                    }}
                                    className={`
                                        p-3 rounded-lg transition-colors font-medium
                                        ${isCurrent
                                            ? "bg-blue-600 text-white"
                                            : disabled
                                                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                                : "hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        }
                                    `}
                                >
                                    {m}
                                </button>
                            );
                        })}
                    </motion.div>
                )}

                {/* ---------- YEAR VIEW ---------- */}
                {viewMode === "year" && (
                    <motion.div
                        key="year"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-3 gap-3"
                    >
                        {calendarData.years.map(y => {
                            const disabled = academicYear ? isOutAcademicYear(new Date(y, 0, 1), academicYear) : false;

                            return (
                                <button
                                    key={y}
                                    disabled={disabled}
                                    onClick={() => {
                                        if (!disabled) {
                                            setCurrentDate(new Date(y, month, 1));
                                            setViewMode("month");
                                        }
                                    }}
                                    className={`
                                        p-3 rounded-lg transition-colors font-medium
                                        ${y === year
                                            ? "bg-blue-600 text-white"
                                            : disabled
                                                ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                                                : "hover:bg-blue-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        }
                                    `}
                                >
                                    {y}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
