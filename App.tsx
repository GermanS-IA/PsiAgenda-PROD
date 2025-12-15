import React, { useEffect, useRef, useState } from 'react';
import { ViewMode, Appointment } from './types';
import * as scheduleService from './services/scheduleService';

import AppointmentModal from './components/AppointmentModal';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import UserManual from './components/UserManual';
import GeminiQuery from './components/GeminiQuery';

const getTodayStr = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const App: React.FC = () => {
  // ✅ Default: Agenda Diaria (LIST) — NO calendario
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  // ✅ Edit: single / series
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // ✅ Manual no abre solo
  const [showManual, setShowManual] = useState(false);

  // ✅ Backup banner
  const [backupNeeded, setBackupNeeded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const data = scheduleService.getAppointments();
    setAppointments(data);
  };

  const refreshBackupFlag = () => {
    try {
      setBackupNeeded(scheduleService.isBackupNeeded());
    } catch {
      setBackupNeeded(false);
    }
  };

  useEffect(() => {
    // Mantiene tu lógica: si ya estaba inicializado, no regenera
    try {
      const init = scheduleService.generateTestData();
      setAppointments(init);
    } catch {
      loadData();
    }
    refreshBackupFlag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========= Actions =========
  const handleNew = () => {
    setEditingAppt(null);
    setEditMode('single');
    setIsModalOpen(true);
  };

  const handleEdit = (appt: Appointment, mode: 'single' | 'series' = 'single') => {
    setEditingAppt(appt);
    setEditMode(mode);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = (appt: Appointment) => {
    if (editingAppt) {
      if (editMode === 'series' && editingAppt.PARENT_ID) {
        // ✅ Editar este y todos los siguientes
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
        // ✅ Editar solo este
        scheduleService.updateAppointment({ ...editingAppt, ...appt });
      }
    } else {
      scheduleService.saveAppointment(appt);
    }

    setIsModalOpen(false);
    setEditMode('single');
    loadData();
    refreshBackupFlag();
  };

  const handleDelete = (id: string, deleteSeries: boolean, parentId?: string) => {
    if (deleteSeries && parentId) {
      scheduleService.deleteRecurringSeries(parentId);
    } else {
      scheduleService.deleteAppointment(id);
    }
    loadData();
    refreshBackupFlag();
  };

  const handleBackup = () => {
    scheduleService.exportToJSON();
    refreshBackupFlag();
  };

  const handleExportExcel = () => {
    scheduleService.exportToCSV();
    refreshBackupFlag();
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ok = window.confirm(
      'ATENCIÓN: Al restaurar un respaldo, se reemplazarán tus datos actuales por los del archivo. ¿Deseás continuar?'
    );

    if (ok) {
      try {
        await scheduleService.importFromJSON(file);
        loadData();
        refreshBackupFlag();
        alert('Respaldo restaurado con éxito.');
      } catch {
        alert('Error al restaurar. Asegurate de usar un JSON exportado por PsiAgenda.');
      }
    }

    e.target.value = '';
  };

  // ========= Derived =========
  const filteredAppointments = scheduleService.getAppointmentsByDate(selectedDate);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* IA arriba */}
      <GeminiQuery appointments={appointments} />

      {/* input restore oculto */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <div className="max-w-5xl mx-auto px-4 pb-28">
        {/* Banner backup */}
        {backupNeeded && (
          <div className="mt-4 bg-amber-950/30 border border-amber-500/30 text-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <span className="text-amber-300 text-lg">⚠️</span>
              </div>
              <div>
                <div className="font-bold">Copia de Seguridad Necesaria</div>
                <div className="text-sm text-amber-200/80">Hace más de 7 días que no guardas tus datos.</div>
              </div>
            </div>
            <button
              onClick={handleBackup}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold"
            >
              Respaldar Ahora
            </button>
          </div>
        )}

        {/* Header acciones */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight">Mi Agenda</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestoreClick}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold"
            >
              Restaurar
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold"
            >
              Excel
            </button>
            <button
              onClick={handleBackup}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-sm font-extrabold"
            >
              Respaldar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => setViewMode(ViewMode.LIST)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
              viewMode === ViewMode.LIST
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            📅 Agenda Diaria
          </button>

          <button
            onClick={() => setViewMode(ViewMode.CALENDAR)}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${
              viewMode === ViewMode.CALENDAR
                ? 'bg-indigo-600 text-white'
                : 'bg-transparent text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            🗓️ Calendario Mensual
          </button>
        </div>

        {/* Contenido */}
        <div className="mt-4">
          {viewMode === ViewMode.CALENDAR ? (
            <CalendarView
              appointments={appointments}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onViewChange={setViewMode}
            />
          ) : (
            <ListView
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              filteredAppointments={filteredAppointments}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {/* Botón flotante + */}
      <button
        onClick={handleNew}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl flex items-center justify-center text-white text-3xl font-black"
        title="Nuevo turno"
      >
        +
      </button>

      {/* Barra inferior */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-900/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={handleBackup}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold"
            >
              Backup JSON
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold"
            >
              Exportar Excel
            </button>
            <button
              onClick={handleRestoreClick}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold"
            >
              Restaurar
            </button>
          </div>

          <button
            onClick={() => setShowManual(true)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-semibold"
          >
            Manual
          </button>
        </div>
      </div>

      {/* Modal turno (usa tu componente real: isOpen) */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAppointment}
        initialDate={selectedDate}
        editingAppointment={editingAppt}
      />

      {/* Manual modal */}
      {showManual && <UserManual onClose={() => setShowManual(false)} />}
    </div>
  );
};

export default App;
