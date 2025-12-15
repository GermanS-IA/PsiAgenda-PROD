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
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 font-medium outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
            />
          </div>
        </div>

        {/* Lista o mensaje vacío */}
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

                  {/* Contenido turno */}
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

                      {/* Botones acción */}
                      <div className="flex gap-1 ml-1 shrink-0">
                        <button
                          onClick={() => onEdit(appt)}
                          className="px-2 py-1 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleTrashClick(appt)}
                          className="px-2 py-1 text-xs sm:text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmación de borrado */}
        {deleteModalAppt && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                  ¿Eliminar turno?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                  Estás a punto de borrar el turno de{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {deleteModalAppt.PACIENTE}
                  </span>
                  .
                  {deleteModalAppt.RECURRENCIA && (
                    <>
                      <br />
                      Este turno es parte de una serie recurrente.
                    </>
                  )}
                </p>

                <div className="w-full flex flex-col gap-2">
                  <button
                    onClick={() => confirmDelete(false)}
                    className="w-full py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Borrar solo este turno
                  </button>

                  {deleteModalAppt.RECURRENCIA && (
                    <button
                      onClick={() => confirmDelete(true)}
                      className="w-full py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Borrar todos los turnos del paciente
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteModalAppt(null)}
                    className="mt-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ListView;
