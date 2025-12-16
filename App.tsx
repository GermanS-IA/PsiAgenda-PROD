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
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');
  const [isManualOpen, setIsManualOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const data = scheduleService.getAppointments();
    setAppointments(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAppointments = appointments
    .filter((a) => a.FECHA_INICIO === selectedDate)
    .sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));

  const handleAddNew = () => {
    setEditingAppt(null);
    setEditMode('single');
    setIsModalOpen(true);
  };

  const handleEdit = (appt: Appointment, mode: 'single' | 'series' = 'single') => {
    setEditingAppt(appt);
    setEditMode(mode);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, deleteSeries: boolean, parentId?: string) => {
    if (deleteSeries && parentId) {
      scheduleService.deleteRecurringSeries(parentId);
    } else {
      scheduleService.deleteAppointment(id);
    }
    loadData();
  };

  const handleSaveAppointment = (appt: Appointment) => {
    try {
      if (editingAppt) {
        const merged = { ...editingAppt, ...appt };

        if (editMode === 'series' && editingAppt.RECURRENCIA && editingAppt.PARENT_ID) {
          const { ID_TURNO, FECHA_INICIO, ...rest } = merged;

          scheduleService.updateRecurringSeries(
            editingAppt.PARENT_ID,
            editingAppt.FECHA_INICIO,
            editingAppt.HORA_INICIO,
            rest
          );
        } else {
          scheduleService.updateAppointment(merged);
        }
      } else {
        scheduleService.saveAppointment(appt);
      }
    } finally {
      setIsModalOpen(false);
      setEditingAppt(null);
      setEditMode('single');
      loadData();
    }
  };

  const handleBackupJSON = () => {
    const jsonData = scheduleService.exportToJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `psiagenda_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    scheduleService.markBackupDone();
  };

  const handleRestore = () => {
    fileInputRef.current?.click();
  };

  const onRestoreFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      scheduleService.importFromJSON(text);
      loadData();
    } catch (err) {
      alert('Archivo inválido para restaurar.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <GeminiQuery appointments={appointments} />

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Mi Agenda</h1>
            <button
              onClick={() => setIsManualOpen(true)}
              className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-300 flex items-center justify-center"
              title="Manual"
            >
              ?
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRestore}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
            >
              Restaurar
            </button>
            <button
              onClick={handleBackupJSON}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
            >
              Respaldar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold ${
              viewMode === 'list' ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Agenda Diaria
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold ${
              viewMode === 'calendar' ? 'bg-indigo-600' : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Calendario Mensual
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <CalendarView
            appointments={appointments}
            selectedDate={selectedDate}
            onDateSelect={(d) => {
              setSelectedDate(d);
              setViewMode('list');
            }}
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

        {/* Floating Add */}
        <button
          onClick={handleAddNew}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-lg flex items-center justify-center text-2xl font-bold"
          title="Nuevo turno"
        >
          +
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={onRestoreFileSelected}
          className="hidden"
        />
      </div>

      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingAppt(null);
            setEditMode('single');
          }}
          onSave={handleSaveAppointment}
          editingAppointment={editingAppt}
          selectedDate={selectedDate}
        />
      )}

      {isManualOpen && <UserManual onClose={() => setIsManualOpen(false)} />}
    </div>
  );
};

export default App;
