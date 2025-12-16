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

  // ✅ NUEVO: modo de edición para soportar "solo este" / "serie"
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // Backup
  const [backupNeeded, setBackupNeeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual (arranca cerrado, no se abre solo)
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
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

  // ✅ MODIFICADO: soporta edición de serie (este + siguientes)
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

  // ✅ MODIFICADO: recibe mode desde ListView (single/series)
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
      {/* IA arriba */}
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
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-bold text-amber-200">Copia de Seguridad Necesaria</p>
                <p className="text-amber-300/80 text-sm">
                  Hace más de 7 días que no guardas tus datos.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg transition-colors shadow-md"
            >
              Respaldar Ahora
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white">PsiAgenda</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(ViewMode.CALENDAR)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === ViewMode.CALENDAR
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Calendario
            </button>
            <button
              onClick={() => setViewMode(ViewMode.LIST)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                viewMode === ViewMode.LIST
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Lista
            </button>

            <button
              onClick={openNewModal}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              + Turno
            </button>
          </div>
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
