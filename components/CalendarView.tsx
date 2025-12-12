import React, { useState } from 'react';
import { Appointment, ViewMode } from '../types';

interface CalendarViewProps {
  appointments: Appointment[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onViewChange: (mode: ViewMode) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, selectedDate, onDateSelect, onViewChange }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); 
        return { days, firstDay, year, month };
    };

    const { days, firstDay, year, month } = getDaysInMonth(currentMonth);

    const getDailyAppointments = (day: number) => {
        const checkDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return appointments.filter(a => a.FECHA_INICIO === checkDate);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 pb-20 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                </button>
                <h2 className="font-bold text-lg capitalize text-slate-800 dark:text-white tracking-wide">
                    {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                    <div key={d} className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider">{d}</div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dayAppointments = getDailyAppointments(day);
                    const count = dayAppointments.length;
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isSelected = dateStr === selectedDate;
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    
                    return (
                        <button
                            key={day}
                            onClick={() => {
                                onDateSelect(dateStr);
                                onViewChange(ViewMode.LIST);
                            }}
                            className={`
                                h-12 w-full rounded-xl flex flex-col items-center justify-center text-sm relative transition-all duration-200 border
                                ${isSelected 
                                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500 shadow-md transform scale-105' 
                                    : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                                }
                                ${isToday && !isSelected ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50/50 dark:bg-indigo-900/20' : ''}
                            `}
                        >
                            <span className="z-10">{day}</span>
                            {count > 0 && (
                                <div className="flex gap-0.5 mt-1">
                                    {/* Show dots for first 3 appointments */}
                                    {dayAppointments.slice(0, Math.min(count, 3)).map((_, idx) => (
                                        <span key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500 dark:bg-indigo-400'}`}></span>
                                    ))}
                                    {count > 3 && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500 dark:bg-indigo-400'}`}>+</span>}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarView;