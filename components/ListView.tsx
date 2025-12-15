import React, { useState } from 'react';
import { Appointment } from '../types';

interface ListViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  filteredAppointments: Appointment[];
  onEdit: (appt: Appointment) => void;
  onDelete: (id: string, deleteSeries: boolean, parentId?: string) => void;
}

const ListView: React.FC<ListViewProps> = ({
  selectedDate,
  onDateChange,
  filteredAppointments,
  onEdit,
  onDelete,
}) => {
  const [deleteModalAppt, setDeleteModalAppt] = useState<Appointment | null>(null);

  const formatDateTitle = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleTrashClick = (appt: Appointment) => {
    setDeleteModalAppt(appt);
  };

  const confirmDelete = (deleteSeries: boolean) => {
    if (deleteModalAppt) {
      onDelete(deleteModalAppt.ID_TURNO, deleteSeries, deleteModalAppt.PARENT_ID);
      setDeleteModalAppt(null);
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 pb-24 relative">
        {/* Encabezado con fecha y selector */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white capitalize leading-tight">
              {formatDateTitle(selectedDate)}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              {filteredAppointments.length}{' '}
              {filteredAppointments.length === 1 ? 'paciente' : 'pacientes'} agendados
            </p>
          </div>

          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(
