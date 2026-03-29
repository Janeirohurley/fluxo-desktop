/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AcademicCalendar from "./Calendar";

const CalendarDropdown = () => {
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Handle date selection
    const handleDateSelect = async (date: Date) => {
        setSelectedDate(date);
        setLoading(true);
        
        try {
            // TODO: Remplacer par un vrai appel API
            // const response = await fetch(`/api/events?date=${date.toISOString().split('T')[0]}`);
            // const eventsData = await response.json();
            
            // Mock data pour la démonstration
            const mockEvents = [
                { title: 'Cours de Mathématiques', type: 'course', color: 'bg-blue-500' },
                { title: 'Examen Final', type: 'exam', color: 'bg-red-500' }
            ];
            
            // Simuler un délai d'API
            await new Promise(resolve => setTimeout(resolve, 500));
            setEvents(mockEvents);
        } catch (error) {
            console.error('Erreur lors de la récupération des événements:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
                setSelectedDate(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Trigger Button */}
            <button 
                onClick={() => setOpen(!open)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Ouvrir le calendrier"
            >
                <Calendar className="w-5 h-5 text-white" />
            </button>

            {/* Dropdown Calendar */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 z-50"
                    >
                        <div className="flex gap-4">
                            {/* Calendar */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                                <AcademicCalendar 
                                    compact={false}
                                    onDateSelect={handleDateSelect}
                                />
                            </div>
                            
                            {/* Event Details Popup - À côté à gauche */}
                            <AnimatePresence>
                                {selectedDate && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 min-w-80 max-h-80 overflow-y-auto"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                                {selectedDate.toLocaleDateString('fr-FR', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedDate(null)}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
                                            >
                                                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                        </div>
                                        
                                        {loading ? (
                                            <div className="text-center py-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                                            </div>
                                        ) : events.length > 0 ? (
                                            <div className="space-y-2">
                                                {events.map((event, index) => (
                                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                        <div className={`w-3 h-3 rounded-full ${event.color || 'bg-blue-500'}`}></div>
                                                        <div>
                                                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{event.title}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{event.type}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-2">
                                                Aucun événement pour cette date
                                            </p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CalendarDropdown;