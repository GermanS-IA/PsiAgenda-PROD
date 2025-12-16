import React, { useState, useEffect, useRef } from 'react';
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

  // ✅ NUEVO: si se edita single o serie
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // Backup State
  const [backupNeeded, setBackupNeeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual State
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    const data = scheduleService.generateTestData();
    setAppointments(data);
    checkBackupStatus();
  }, []);

  useEffect(() => {
    filterByDate(selectedDate);
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

  // ✅ EDITA single o serie según editMode
  const handleSaveAppointment = (appt: Appointment) => {
    if (editingAppt) {
      if (
        editMode === 'series' &&
        editingAppt.RECURRENCIA &&
        editingAppt.PARENT_ID
      ) {
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
        scheduleService.updateAppointment({ ...editingAppt, ...appt });
      }
    } else {
      scheduleService.saveAppointment(appt);
    }

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

  // ✅ ahora recibe mode desde ListView
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-200">Mi Agenda</h1>
            <button
              onClick={() => setShowManual(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-full shadow-sm transition-all"
              title="Ver Manual de Usuario"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              onClick={handleImportClick}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-700"
              title="Cargar un archivo de respaldo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="hidden sm:inline">Restaurar</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-green-400 transition-colors bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-700"
              title="Exportar a Excel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12" />
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
            Calendario Mensual
          </button>
        </div>

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
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        initialDate={selectedDate}
        editingAppointment={editingAppt}
      />

      {showManual && <UserManual onClose={() => setShowManual(false)} />}
    </div>
  );
};

export default App;
