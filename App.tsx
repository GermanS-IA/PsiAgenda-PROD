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
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);

  // Backup State
  const [backupNeeded, setBackupNeeded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual State
  const [showManual, setShowManual] = useState(false);

  const checkBackupStatus = () => {
    setBackupNeeded(scheduleService.isBackupNeeded());
  };

  useEffect(() => {
    // Cargar datos guardados (localStorage)
    const data = scheduleService.getAppointments();
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

  const filterByDate = (date: string) => {
    const filtered = appointments
      .filter(a => a.FECHA_INICIO === date)
      .sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));
    setFilteredAppointments(filtered);
  };

  const handleSaveAppointment = (appt: Appointment) => {
    scheduleService.saveAppointment(appt);
    loadData();
    checkBackupStatus();
  };

  // EDIT FLOW (solo este / este y siguientes)
  const [editChoiceAppt, setEditChoiceAppt] = useState<Appointment | null>(null);
  const [editSeriesMode, setEditSeriesMode] = useState<'single' | 'series'>('single');

  const startEdit = (appt: Appointment) => {
    if (appt.RECURRENCIA && appt.PARENT_ID) {
      setEditChoiceAppt(appt);
      return;
    }
    setEditSeriesMode('single');
    setEditingAppt(appt);
    setIsModalOpen(true);
  };

  const chooseEditSingle = () => {
    if (!editChoiceAppt) return;
    setEditSeriesMode('single');
    setEditingAppt(editChoiceAppt);
    setIsModalOpen(true);
    setEditChoiceAppt(null);
  };

  const chooseEditSeries = () => {
    if (!editChoiceAppt) return;
    setEditSeriesMode('series');
    setEditingAppt(editChoiceAppt);
    setIsModalOpen(true);
    setEditChoiceAppt(null);
  };

  const cancelEditChoice = () => {
    setEditChoiceAppt(null);
  };

  const handleUpdateAppointment = (appt: Appointment) => {
    if (editSeriesMode === 'series' && appt.RECURRENCIA && appt.PARENT_ID) {
      scheduleService.updateRecurringSeries(appt.PARENT_ID, appt.FECHA_INICIO, appt.HORA_INICIO, appt);
    } else {
      scheduleService.updateAppointment(appt);
    }

    setEditSeriesMode('single');
    loadData();
    checkBackupStatus();
  };

  const handleDeleteAppointment = (id: string, deleteSeries: boolean, parentId?: string) => {
    if (deleteSeries && parentId) {
      scheduleService.deleteRecurringSeries(parentId);
    } else {
      scheduleService.deleteAppointment(id);
    }
    loadData();
    checkBackupStatus();
  };

  const openNewModal = () => {
    setEditingAppt(null);
    setIsModalOpen(true);
  };

  // ✅ RESPALDAR (JSON): ahora descarga SIEMPRE
  const handleExportJSON = () => {
    const json = scheduleService.exportToJSON();

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `PsiAgenda_Respaldo_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    // Ya lo marca el service, pero lo dejamos por seguridad
    scheduleService.markBackupDone();
    setBackupNeeded(false);
  };

  // ✅ EXCEL: en realidad es CSV (Excel lo abre perfecto)
  const handleExportCSV = () => {
  const data = scheduleService.getAppointments();
  if (!data.length) {
    alert("No hay turnos para exportar.");
    return;
  }

  const headers = [
    'Paciente',
    'Teléfono',
    'Email',
    'Fecha',
    'Hora',
    'Recurrente',
    'Frecuencia',
    'Notas'
  ];

  const formatDate = (iso: string) => {
    // iso: YYYY-MM-DD -> DD/MM/YYYY
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return `"${s.replace(/"/g, '""')}"`;
  };

  // ✅ separador ; (Excel ES lo toma bien como columnas)
  const sep = ';';

  const rows = data.map(a => [
    escape(a.PACIENTE),
    escape(a.TELEFONO),
    escape(a.EMAIL),
    escape(formatDate(a.FECHA_INICIO)),
    escape(a.HORA_INICIO),
    escape(a.RECURRENCIA ? 'Sí' : 'No'),
    escape(a.FRECUENCIA ?? ''),
    escape(a.NOTAS ?? ''),
  ].join(sep));

  // ✅ BOM para que Excel respete acentos/ñ
  const csv = "\uFEFF" + [headers.join(sep), ...rows].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `PsiAgenda_Excel_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
};


  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  // ✅ RESTAURAR: ahora usa importFromJSON(string) como corresponde
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      "ATENCIÓN: Al importar un respaldo, se reemplazarán todos los datos actuales por los del archivo. ¿Deseas continuar?"
    );

    if (confirmed) {
      try {
        const text = await file.text();
        scheduleService.importFromJSON(text);

        alert("Respaldo restaurado con éxito.");
        loadData();
        setBackupNeeded(false);
      } catch (error) {
        alert("Error al leer el archivo. Asegúrate de que sea un JSON válido generado por esta app.");
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
        accept=".json"
        className="hidden"
      />

      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">

        {/* Backup Warning Banner */}
        {backupNeeded && (
          <div className="bg-amber-900/40 border border-amber-700/50 rounded-xl p-4 flex justify-between items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-200">Copia de Seguridad Necesaria</p>
                <p className="text-sm text-amber-300/80">Hace más de 7 días que no guardas tus datos.</p>
              </div>
            </div>
            <button
              onClick={handleExportJSON}
              className="bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap"
            >
              Respaldar Ahora
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Mi Agenda</h1>
            <button
              onClick={() => setShowManual(true)}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 hover:text-indigo-200 transition-colors"
              title="Manual de usuario"
            >
              ?
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreClick}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Restaurar
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Excel
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/40 rounded-lg text-sm font-semibold text-emerald-200 hover:bg-emerald-600/30 transition-colors"
            >
              Respaldar
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800/70 border border-slate-700 rounded-xl overflow-hidden mb-4">
          <button
            onClick={() => setViewMode(ViewMode.LIST)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              viewMode === ViewMode.LIST ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3a.75.75 0 011.5 0v1.5H19.5A2.25 2.25 0 0121.75 6.75v12A2.25 2.25 0 0119.5 21H4.5A2.25 2.25 0 012.25 18.75v-12A2.25 2.25 0 014.5 4.5H6V3a.75.75 0 01.75-.75zM3.75 9v9.75c0 .414.336.75.75.75h15a.75.75 0 00.75-.75V9h-16.5z" clipRule="evenodd" />
              </svg>
              Agenda Diaria
            </span>
          </button>
          <button
            onClick={() => setViewMode(ViewMode.CALENDAR)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              viewMode === ViewMode.CALENDAR ? 'bg-indigo-600/20 text-indigo-200' : 'text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <span className="inline-flex items-center gap-2 justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3a.75.75 0 011.5 0v1.5H19.5A2.25 2.25 0 0121.75 6.75v12A2.25 2.25 0 0119.5 21H4.5A2.25 2.25 0 012.25 18.75v-12A2.25 2.25 0 014.5 4.5H6V3a.75.75 0 01.75-.75zM3.75 9v9.75c0 .414.336.75.75.75h15a.75.75 0 00.75-.75V9h-16.5z" clipRule="evenodd" />
              </svg>
              Calendario Mensual
            </span>
          </button>
        </div>

        {/* Views */}
        {viewMode === ViewMode.CALENDAR ? (
          <CalendarView appointments={appointments} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
        ) : (
          <ListView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            filteredAppointments={filteredAppointments}
            onEdit={startEdit}
            onDelete={handleDeleteAppointment}
          />
        )}

        {/* Floating Action Button */}
        <button
          onClick={openNewModal}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl flex items-center justify-center transition-colors z-40"
          title="Nuevo turno"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </main>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAppt(null);
          setEditSeriesMode('single');
        }}
        onSave={(appt) => {
          if (editingAppt) {
            handleUpdateAppointment(appt);
          } else {
            handleSaveAppointment(appt);
          }
        }}
        initialDate={selectedDate}
        editingAppointment={editingAppt}
      />

      {/* Manual Modal */}
      {showManual && <UserManual onClose={() => setShowManual(false)} />}

      {/* Edit Choice Modal (solo aparece si es recurrente) */}
      {editChoiceAppt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-700">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4 text-indigo-300">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">¿Editar turno?</h3>
              <p className="text-slate-300 text-sm mb-6">
                Estás por editar un turno recurrente. ¿Querés editar solo este turno o este y todos los siguientes?
              </p>

              <div className="w-full flex flex-col gap-2">
                <button
                  onClick={chooseEditSingle}
                  className="w-full py-2.5 bg-slate-700 border border-slate-600 text-slate-100 font-semibold rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Editar solo este turno
                </button>

                <button
                  onClick={chooseEditSeries}
                  className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Editar este y todos los siguientes
                </button>

                <button
                  onClick={cancelEditChoice}
                  className="mt-2 text-sm text-slate-400 hover:text-slate-200 underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
