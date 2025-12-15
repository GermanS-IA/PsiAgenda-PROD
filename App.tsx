import React, { useEffect, useState, useRef } from 'react';
import { Appointment, ViewMode } from './types';
import * as scheduleService from './services/scheduleService';

import AppointmentModal from './components/AppointmentModal';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import UserManual from './components/UserManual';
import GeminiQuery from './components/GeminiQuery';

const App: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  // ✅ Edición: single / series
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // ✅ Manual (PDF) NO se abre solo
  const [isManualOpen, setIsManualOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ======================
  // DATA LOAD
  // ======================
  const loadData = () => {
    const data = scheduleService.getAppointments();
    setAppointments(data);
  };

  useEffect(() => {
    const data = scheduleService.generateTestData();
    setAppointments(data);
  }, []);

  // ======================
  // HANDLERS
  // ======================
  const handleNewAppointment = () => {
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
        // Editar este y todos los siguientes
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
        // Editar solo este turno
        scheduleService.updateAppointment({ ...editingAppt, ...appt });
      }
    } else {
      scheduleService.saveAppointment(appt);
    }

    setEditMode('single');
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = (id: string, deleteSeries: boolean, parentId?: string) => {
    if (deleteSeries && parentId) {
      scheduleService.deleteRecurringSeries(parentId);
    } else {
      scheduleService.deleteAppointment(id);
    }
    loadData();
  };

  // ======================
  // BACKUP / RESTORE
  // ======================
  const handleExportJSON = () => {
    scheduleService.exportToJSON();
  };

  const handleExportCSV = () => {
    scheduleService.exportToCSV();
  };

  const handleImportJSON = async (file: File) => {
    await scheduleService.importFromJSON(file);
    loadData();
  };

  // ======================
  // FILTERED
  // ======================
  const filteredAppointments = scheduleService.getAppointmentsByDate(selectedDate);

  // ======================
  // RENDER
  // ======================
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col">
      {/* IA ASISTENTE */}
      <GeminiQuery appointments={appointments} />

      {/* Hidden file input for restore */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleImportJSON(e.target.files[0]);
          }
        }}
      />

      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold">PsiAgenda</h1>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'calendar' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Calendario
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Lista
            </button>

            <button
              onClick={handleNewAppointment}
              className="px-3 py-1 rounded text-sm bg-green-600 hover:bg-green-700"
            >
              + Turno
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-4">
        {viewMode === 'calendar' ? (
          <CalendarView selectedDate={selectedDate} onDateSelect={setSelectedDate} appointments={appointments} />
        ) : (
          <ListView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            filteredAppointments={filteredAppointments}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* FOOTER / BACKUP */}
      <footer className="border-t border-slate-700 p-4 flex justify-center gap-3 text-sm">
        <button onClick={handleExportJSON} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
          Backup JSON
        </button>

        <button onClick={handleExportCSV} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
          Exportar Excel
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
          Restaurar
        </button>

        {/* ✅ Manual ahora es un botón, no se abre solo */}
        <button onClick={() => setIsManualOpen(true)} className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600">
          Manual
        </button>
      </footer>

      {/* MODAL TURNO */}
      {isModalOpen && (
        <AppointmentModal
          appointment={editingAppt}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAppointment}
        />
      )}

      {/* ✅ MODAL MANUAL (PDF) */}
      {isManualOpen && <UserManual onClose={() => setIsManualOpen(false)} />}
    </div>
  );
};

export default App;
