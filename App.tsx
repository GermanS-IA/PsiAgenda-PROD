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

  // ✅ clave: modo de edición (solo este / este + siguientes)
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // Backup State
  const [backupNeeded, setBackupNeeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual State
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    // Seed inicial (lo que ya tenías)
    const data = scheduleService.generateTestData();
    setAppointments(data);
    checkBackupStatus();
  }, []);

  useEffect(() => {
    filterByDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments, selectedDate]);

  const loadData = () => {
    const data = scheduleService.getAppointments();
    setAppointments(data);
  };

  const checkBackupStatus = () => {
    setBackupNeeded(scheduleService.isBackupNeeded());
  };

  const filterByDate = (date: string) => {
    const filtered = appointments
      .filter((a) => a.FECHA_INICIO === date)
      .sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));
    setFilteredAppointments(filtered);
  };

  const handleSaveAppointment = (appt: Appointment) => {
    if (editingAppt) {
      // ✅ si eligió “serie” y el turno tiene PARENT_ID -> edita este y siguientes
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
        // ✅ “solo este”
        scheduleService.updateAppointment({ ...editingAppt, ...appt });
      }
    } else {
      scheduleService.saveAppointment(appt);
    }

    // reset + recarga
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

  // ✅ AHORA recibe modo desde ListView: 'single' | 'series'
  const handleEdit = (appt: Appointment, mode: 'single' | 'series' = 'single') => {
    setEditMode(mode);
    setEditingAppt(appt);
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

    try {
      await scheduleService.importFromJSON(file);
      loadData();
      checkBackupStatus();
    } catch (err) {
      alert('Error al restaurar el backup. Asegurate de seleccionar un .json válido.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans text-slate-200">
      <GeminiQuery appointments={appointments} />

      {/* Hidden File Input for Restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {/* Backup Warning Banner */}
        {backupNeeded && (
          <div className="bg-amber-900/40 border border-amber-600/50 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600/20 rounded-lg text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-amber-100">Copia de Seguridad Necesaria</h3>
                <p className="text-sm text-amber-200/80">Hace más de 7 días que no guardas tus datos.</p>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Respaldar Ahora
            </button>
          </div>
        )}

        {/* Top Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-200">Mi Agenda</h1>
            <button
              onClick={() => setShowManual(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full shadow-sm transition-all"
              title="Ver Manual de Usuario"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 9.75h1.5m-1.5 3h1.5m-6 6.75h9A2.25 2.25 0 0018 17.25V6.75A2.25 2.25 0 0015.75 4.5h-9A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-700"
              title="Restaurar desde backup JSON"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 6a6 6 0 00-6 6H4l3 3 3-3H8a4 4 0 114 4 1 1 0 110 2 6 6 0 000-12z" />
              </svg>
              <span className="hidden sm:inline">Restaurar</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-700"
              title="Exportar a Excel (CSV)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M6.75 2.25A2.25 2.25 0 004.5 4.5v15A2.25 2.25 0 006.75 21h10.5A2.25 2.25 0 0019.5 18.75V8.25L13.5 2.25H6.75zM13.5 3.75V9h5.25" />
              </svg>
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-700 hover:border-emerald-500/50"
              title="Crear copia de seguridad"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span>Respaldar</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-700 mb-6 flex gap-2">
          <button
            onClick={() => {
              setViewMode(ViewMode.LIST);
              setSelectedDate(getTodayStr());
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
              viewMode === ViewMode.LIST
                ? 'bg-indigo-900/30 text-indigo-400 shadow-sm ring-1 ring-indigo-800'
                : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
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
