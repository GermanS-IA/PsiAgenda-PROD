import React, { useState } from 'react';
import { Appointment } from '../types';

interface ListViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  filteredAppointments: Appointment[];
  onEdit: (appt: Appointment, mode?: 'single' | 'series') => void; // mode opcional para no romper nada
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
  const [editModalAppt, setEditModalAppt] = useState<Appointment | null>(null);

  const formatDateTitle = (dateStr: string) => {
    // Manually parse YYYY-MM-DD to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    // Explicitly request full Spanish format
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

  const handleEditClick = (appt: Appointment) => {
    // Si es recurrente y tiene PARENT_ID => preguntamos
    if (appt.RECURRENCIA && appt.PARENT_ID) {
      setEditModalAppt(appt);
      return;
    }
    // Si no es recurrente (o no tiene parent) => edita solo este
    onEdit(appt, 'single');
  };

  const confirmEdit = (mode: 'single' | 'series') => {
    if (editModalAppt) {
      onEdit(editModalAppt, mode);
      setEditModalAppt(null);
    }
  };

  return (
    <>
      <div className="space-y-4 sm:space-y-6 pb-24 relative">
        {/* Date Header */}
        <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white capitalize leading-tight">
              {formatDateTitle(selectedDate)}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              {filteredAppointments.length}{' '}
              {filteredAppointments.length === 1 ? 'paciente' : 'pacientes'} agendados
            </p>
          </div>

          {/* Native Date Picker */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            />
          </div>
        </div>

        {/* Lista o vacío */}
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-dashed">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              No tienes pacientes para este día.
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              Disfruta de tu tiempo libre.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4">
            {filteredAppointments.map((appt) => (
              <div
                key={appt.ID_TURNO}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="flex flex-row items-stretch">
                  {/* Hora */}
                  <div className="bg-indigo-50/50 dark:bg-slate-700/50 w-16 sm:w-24 flex flex-col items-center justify-center p-2 border-r border-slate-100 dark:border-slate-700 shrink-0">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold text-base sm:text-lg leading-none">
                      {appt.HORA_INICIO}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 p-3 sm:p-4 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 pr-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 flex-wrap leading-snug">
                          <span className="truncate">{appt.PACIENTE}</span>
                          {appt.RECURRENCIA && (
                            <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold whitespace-nowrap">
                              {appt.FRECUENCIA === 'quincenal' ? '15D' : 'SEM'}
                            </span>
                          )}
                        </h3>

                        <div className="mt-1.5 space-y-1">
                          {appt.TELEFONO && (
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                              Tel: {appt.TELEFONO}
                            </div>
                          )}
                          {appt.EMAIL && (
                            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                              Email: {appt.EMAIL}
                            </div>
                          )}
                          {appt.NOTAS && (
                            <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-1.5 sm:p-2 rounded border border-yellow-100 dark:border-yellow-900/30 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                              <p className="italic line-clamp-2">{appt.NOTAS}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-0.5 sm:gap-1 ml-1 shrink-0">
                        <button
                          onClick={() => handleEditClick(appt)}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleTrashClick(appt)}
                          className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EDIT CONFIRMATION MODAL */}
        {editModalAppt && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            onClick={() => setEditModalAppt(null)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  ¿Editar turno?
                </h3>

                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Estás por editar un turno recurrente. ¿Querés editar solo este turno o este y todos los siguientes?
                </p>

                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={() => confirmEdit('single')}
                    className="w-full py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Editar solo este turno
                  </button>

                  <button
                    onClick={() => confirmEdit('series')}
                    className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all"
                  >
                    Editar este y todos los siguientes
                  </button>

                  <button
                    onClick={() => setEditModalAppt(null)}
                    className="mt-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteModalAppt && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteModalAppt(null)}
          >
            <div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 border border-slate-100 dark:border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
