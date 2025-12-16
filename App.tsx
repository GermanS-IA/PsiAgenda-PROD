import React, { useEffect, useRef, useState } from 'react';
import { ViewMode, Appointment } from './types';
import * as scheduleService from './services/scheduleService';

import AppointmentModal from './components/AppointmentModal';
import GeminiQuery from './components/GeminiQuery';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import UserManual from './components/UserManual';

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
  const [selectedDate, setSelectedDate] = useState(getTodayStr());

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  // ✅ modo de edición (solo este / este + siguientes)
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // Backup
  const [backupNeeded, setBackupNeeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual
  const [showManual, setShowManual] = useState(false);

  const checkBackupStatus = () => {
    setBackupNeeded(scheduleService.isBackupNeeded());
  };

  const loadData = () => {
    const data = scheduleService.getAppointments();
    setAppointments(data);
    return data;
  };

  useEffect(() => {
    // ✅ IMPORTANTE: primero intentamos cargar lo guardado (localStorage)
    const stored = loadData();

    // Si no hay nada guardado, recién ahí generamos el seed inicial
    if (!stored || stored.length === 0) {
      const seeded = scheduleService.generateTestData();
      setAppointments(seeded);
    }

    checkBackupStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtered = appointments
      .filter((a) => a.FECHA_INICIO === selectedDate)
      .sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));
    setFilteredAppointments(filtered);
  }, [appointments, selectedDate]);

  // ✅ soporta edición de serie (este + siguientes)
  const handleSaveAppointment = (appt: Appointment) => {
    if (editingAppt) {
      if (editMode === 'series' && editingAppt.PARENT_ID) {
        scheduleService.updateRecurringSeries(
          editingAppt.PARENT_ID,
          editingAppt.FECHA_INICIO,
          editingAppt.HORA_INICIO,
          {
            PACIENTE: appt.PACIENTE,
            TELEFONO: appt.TELEFONO,
            EMAIL: appt.EMAIL,
            HORA_INICIO: appt.HORA_INICIO,
            NOTAS: appt.NOTAS,
          }
        );
      } else {
        // ✅ solo este
        scheduleService.updateAppointment({ ...editingAppt, ...appt });
      }
    } else {
      scheduleService.saveAppointment(appt);
    }

    // reset
    setEditMode('single');
    setEditingAppt(null);

    loadData();
    checkBackupStatus();
  };

  const handleDelete = (id: string, deleteSeries: boolean, parentId?: string) => {
    if (deleteSeries && parentId) {
      scheduleService.deleteRecurringSeries(parentId);
    } else {
      scheduleService.deleteAppointment(id);
    }
    loadData();
    checkBackupStatus();
  };

  // ✅ recibe mode desde ListView: 'single' | 'series'
  const handleEdit = (appt: Appointment, mode: 'single' | 'series' = 'single') => {
    setEditingAppt(appt);
    setEditMode(mode);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setEditingAppt(null);
    setEditMode('single');
    setIsModalOpen(true);
  };

  const handleExportJSON = () => {
    scheduleService.exportToJSON();
    setBackupNeeded(false);
  };

  const handleExportCSV = () => {
    scheduleService.exportToCSV();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      'ATENCIÓN: Al importar un respaldo, se reemplazarán todos los datos actuales por los del archivo. ¿Deseas continuar?'
    );

    if (confirmed) {
      try {
        await scheduleService.importFromJSON(file);
        alert('Respaldo restaurado con éxito.');
        loadData();
        setBackupNeeded(false);
      } catch (error) {
        alert('Error al leer el archivo. Asegúrate de que sea un JSON válido generado por esta app.');
      }
    }

    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-200">
      <GeminiQuery appointments={appointments} />

      {/* Hidden File Input for Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex-1">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Mi Agenda
            </h1>

            {backupNeeded && (
              <span className="text-xs font-bold px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Recomendado: hacer backup
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={handleImportClick}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Restaurar
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Excel
            </button>
            <button
              onClick={handleExportJSON}
              className="bg-emerald-600/90 hover:bg-emerald-600 border border-emerald-500/40 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Respaldar
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-2 flex gap-2 mb-6">
          <button
            onClick={() => setViewMode(ViewMode.LIST)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              viewMode === ViewMode.LIST
                ? 'bg-indigo-900/30 text-indigo-400 shadow-sm ring-1 ring-indigo-800'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 4.5A1.5 1.5 0 014.5 3h11A1.5 1.5 0 0117 4.5v11a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 15.5v-11zM6 6a1 1 0 000 2h8a1 1 0 100-2H6zm0 4a1 1 0 000 2h8a1 1 0 100-2H6zm0 4a1 1 0 000 2h5a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            Agenda Diaria
          </button>

          <button
            onClick={() => setViewMode(ViewMode.CALENDAR)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              viewMode === ViewMode.CALENDAR
                ? 'bg-indigo-900/30 text-indigo-400 shadow-sm ring-1 ring-indigo-800'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            Calendario Mensual
          </button>
        </div>

        {/* Views */}
        {viewMode === ViewMode.LIST ? (
          <ListView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            filteredAppointments={filteredAppointments}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <CalendarView
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onViewChange={setViewMode}
          />
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportJSON}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Backup JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Exportar Excel
            </button>
            <button
              onClick={handleImportClick}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Restaurar
            </button>
          </div>

          <button
            onClick={() => setShowManual(true)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Manual
          </button>
        </div>
      </main>

      {/* Floating Action Button */}
      <button
        onClick={openNewModal}
        className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl p-4 shadow-xl transition-all hover:scale-105 active:scale-95 focus:ring-4 focus:ring-indigo-900 z-40 flex items-center gap-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        <span className="font-semibold pr-1 hidden group-hover:inline-block transition-all duration-300">Nuevo</span>
      </button>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditMode('single');
          setEditingAppt(null);
        }}
        onSave={handleSaveAppointment}
        initialDate={selectedDate}
        editingAppointment={editingAppt}
      />

      {showManual && <UserManual onClose={() => setShowManual(false)} />}
    </div>
  );
};

export default App;
