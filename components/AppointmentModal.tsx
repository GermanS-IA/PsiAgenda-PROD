import React, { useState, useEffect } from 'react';
import { Appointment } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appt: Appointment) => void;
  initialDate: string;
  editingAppointment?: Appointment | null;
}

const AppointmentModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialDate, editingAppointment }) => {
  const [formData, setFormData] = useState<Partial<Appointment>>({
    PACIENTE: '',
    TELEFONO: '',
    EMAIL: '',
    FECHA_INICIO: initialDate,
    HORA_INICIO: '09:00',
    RECURRENCIA: false,
    FRECUENCIA: undefined,
    NOTAS: ''
  });

  useEffect(() => {
    if (editingAppointment) {
      setFormData(editingAppointment);
    } else {
      setFormData({
        PACIENTE: '',
        TELEFONO: '',
        EMAIL: '',
        FECHA_INICIO: initialDate,
        HORA_INICIO: '09:00',
        RECURRENCIA: false,
        FRECUENCIA: undefined,
        NOTAS: ''
      });
    }
  }, [editingAppointment, initialDate, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecurrenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'none') {
        setFormData(prev => ({ ...prev, RECURRENCIA: false, FRECUENCIA: undefined }));
    } else {
        setFormData(prev => ({ 
            ...prev, 
            RECURRENCIA: true, 
            FRECUENCIA: val as 'semanal' | 'quincenal' 
        }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.PACIENTE && formData.FECHA_INICIO && formData.HORA_INICIO) {
       onSave(formData as Appointment);
       onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all border border-slate-100 dark:border-slate-700">
        <div className="bg-indigo-600 dark:bg-indigo-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-white text-xl font-semibold tracking-tight">
            {editingAppointment ? 'Editar Sesión' : 'Nueva Sesión'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Patient Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Paciente</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                type="text"
                name="PACIENTE"
                required
                className="pl-10 w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400"
                value={formData.PACIENTE}
                onChange={handleChange}
                placeholder="Nombre del paciente"
                />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Solo se permiten letras.</p>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Teléfono</label>
              <input
                type="tel"
                name="TELEFONO"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400"
                value={formData.TELEFONO}
                onChange={handleChange}
                placeholder="Solo números"
              />
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Solo se permiten números.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Email</label>
              <input
                type="text"
                name="EMAIL"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-400"
                value={formData.EMAIL}
                onChange={handleChange}
                placeholder="ejemplo@mail.com"
              />
               <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Formato de mail válido.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {/* Native Date Input with cursor-pointer */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Fecha</label>
              <input
                type="date"
                required
                name="FECHA_INICIO"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer"
                value={formData.FECHA_INICIO}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Hora</label>
              <input
                type="time"
                required
                name="HORA_INICIO"
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                value={formData.HORA_INICIO}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Notas Clínicas / Observaciones</label>
            <textarea
                name="NOTAS"
                rows={3}
                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm placeholder:text-slate-400"
                value={formData.NOTAS}
                onChange={handleChange}
                placeholder="Escribe notas sobre la sesión..."
            />
          </div>

          {!editingAppointment && (
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
               <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-1">Repetición</label>
               <select
                 className="w-full p-2 border border-indigo-200 dark:border-indigo-700 rounded bg-white dark:bg-slate-700 text-indigo-900 dark:text-indigo-200 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
                 value={formData.RECURRENCIA ? (formData.FRECUENCIA || 'semanal') : 'none'}
                 onChange={handleRecurrenceChange}
               >
                   <option value="none">Solo este turno (No repetir)</option>
                   <option value="semanal">Semanal (Mismo día y hora por 6 meses)</option>
                   <option value="quincenal">Quincenal (Cada 15 días por 6 meses)</option>
               </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              Guardar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;