import { Appointment } from '../types';

// Simulating Google Sheets interaction using LocalStorage
const STORAGE_KEY = 'agenda_medica_data';
const BACKUP_DATE_KEY = 'agenda_medica_last_backup';
const INITIALIZED_KEY = 'agenda_medica_initialized';

export const getAppointments = (): Appointment[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAppointment = (appointment: Appointment): Appointment[] => {
  const currentAppointments = getAppointments();
  const newAppointments = [...currentAppointments];

  // Logic: Recurrence (6 months)
  if (appointment.RECURRENCIA && appointment.FRECUENCIA) {
    const startDate = new Date(`${appointment.FECHA_INICIO}T${appointment.HORA_INICIO}`);
    const sixMonthsLater = new Date(startDate);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    let currentDate = new Date(startDate);

    // Determine days to add based on frequency
    const daysToAdd = appointment.FRECUENCIA === 'quincenal' ? 14 : 7;

    // Generate a unique Group ID for this recurrence series
    const parentId = crypto.randomUUID();

    while (currentDate <= sixMonthsLater) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');

      const newAppt: Appointment = {
        ...appointment,
        ID_TURNO: crypto.randomUUID(),
        PARENT_ID: parentId,
        FECHA_INICIO: `${year}-${month}-${day}`,
      };

      newAppointments.push(newAppt);

      currentDate.setDate(currentDate.getDate() + daysToAdd);
    }
  } else {
    // Single appointment
    newAppointments.push({
      ...appointment,
      ID_TURNO: crypto.randomUUID(),
      PARENT_ID: crypto.randomUUID(),
    });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newAppointments));
  return newAppointments;
};

export const updateAppointment = (updatedAppt: Appointment): Appointment[] => {
  const currentAppointments = getAppointments();
  const index = currentAppointments.findIndex(a => a.ID_TURNO === updatedAppt.ID_TURNO);
  if (index !== -1) {
    currentAppointments[index] = updatedAppt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentAppointments));
  }
  return currentAppointments;
};

/**
 * ✅ EDITAR "ESTE Y TODOS LOS SIGUIENTES" de una serie recurrente.
 * parentId = serie
 * fromDate/fromTime = desde qué ocurrencia se aplica (incluida)
 * patch = campos a aplicar (ej: PACIENTE, HORA_INICIO, NOTAS, etc.)
 */
export const updateRecurringSeries = (
  parentId: string,
  fromDate: string,
  fromTime: string,
  patch: Partial<Appointment>
): Appointment[] => {

  const toDate = (d: string) => {
    const [day, month, year] = d.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const fromDateObj = toDate(fromDate);

  const currentAppointments = getAppointments();

  const updated = currentAppointments.map((a) => {

    const isSameSeries =
      a.ID_TURNO === parentId || a.PARENT_ID === parentId;

    if (!isSameSeries) return a;

    const apptDate = toDate(a.FECHA_INICIO);

    const isAfterDate = apptDate > fromDateObj;
    const isSameDateAndAfterTime =
      apptDate.getTime() === fromDateObj.getTime() &&
      a.HORA_INICIO >= fromTime;

    if (isAfterDate || isSameDateAndAfterTime) {
      return {
        ...a,
        ...patch,
      };
    }

    return a;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};



export const deleteAppointment = (id: string): Appointment[] => {
  const currentAppointments = getAppointments();
  const filtered = currentAppointments.filter(a => a.ID_TURNO !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};

export const deleteRecurringSeries = (parentId: string): Appointment[] => {
  const currentAppointments = getAppointments();
  // Filter out ALL appointments that share the same PARENT_ID
  const filtered = currentAppointments.filter(a => a.PARENT_ID !== parentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};

export const updateRecurringSeries = (
  parentId: string,
  fromDate: string,
  fromTime: string,
  patch: Partial<Appointment>
): Appointment[] => {
  const currentAppointments = getAppointments();

  // Seguridad: no permitimos cambiar ids/parent/recurrencia por accidente
  const {
    ID_TURNO,
    PARENT_ID,
    FECHA_INICIO,
    RECURRENCIA,
    FRECUENCIA,
    ...safePatch
  } = patch as any;

  const updated = currentAppointments.map((a) => {
    if (a.PARENT_ID !== parentId) return a;

    // editar "este y todos los siguientes"
    const isAfterDate = a.FECHA_INICIO > fromDate;
    const isSameDateAndAfterTime = a.FECHA_INICIO === fromDate && a.HORA_INICIO >= fromTime;

    if (isAfterDate || isSameDateAndAfterTime) {
      return { ...a, ...safePatch };
    }

    return a;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};


export const getAppointmentsByDate = (date: string): Appointment[] => {
  const all = getAppointments();
  return all
    .filter(a => a.FECHA_INICIO === date)
    .sort((a, b) => a.HORA_INICIO.localeCompare(b.HORA_INICIO));
};

// --- TEST DATA GENERATOR ---
export const generateTestData = (): Appointment[] => {
  // Check if we already initialized the app before
  const isInitialized = localStorage.getItem(INITIALIZED_KEY);

  // If already initialized, strictly return current data (even if empty)
  // This ensures test data is NEVER regenerated after the user deletes it.
  if (isInitialized) {
    return getAppointments();
  }

  const firstNames = ["María", "Juan", "Ana", "Carlos", "Lucía", "Pedro", "Sofía", "Miguel", "Laura", "Diego", "Valentina", "Martín"];
  const lastNames = ["García", "Rodríguez", "Martínez", "López", "González", "Pérez", "Sánchez", "Romero", "Díaz", "Fernández"];
  const motives = ["Ansiedad generalizada", "Primera consulta", "Seguimiento quincenal", "Terapia de pareja", "Evaluación cognitiva", "Depresión leve", "Stress laboral", "Duelo", "Orientación vocacional", ""];

  const newAppointments: Appointment[] = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    // Random date within next 7 days
    const date = new Date(today);
    date.setDate(today.getDate() + Math.floor(Math.random() * 7));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Random hour 09:00 to 18:00
    const hour = Math.floor(Math.random() * (18 - 9 + 1)) + 9;
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;

    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

    newAppointments.push({
      ID_TURNO: crypto.randomUUID(),
      PARENT_ID: crypto.randomUUID(),
      PACIENTE: name,
      TELEFONO: `11${Math.floor(Math.random() * 90000000) + 10000000}`,
      EMAIL: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      FECHA_INICIO: dateStr,
      HORA_INICIO: hourStr,
      RECURRENCIA: false,
      NOTAS: motives[Math.floor(Math.random() * motives.length)],
    });
  }

  const currentData = getAppointments();
  const mergedData = [...currentData, ...newAppointments];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedData));
  localStorage.setItem(INITIALIZED_KEY, 'true'); // Mark as initialized so this never runs again

  return mergedData;
};

// --- BACKUP & RESTORE SYSTEM ---

// Helper function to handle sharing or downloading
const shareOrDownload = async (blob: Blob, filename: string, title: string) => {
  const file = new File([blob], filename, { type: blob.type });

  // Try Web Share API Level 2 (Files) -> Great for Mobile
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title,
        text: 'Respaldo de PsiAgenda',
      });
      // If share was successful, we consider it backed up
      localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
      return;
    } catch (error) {
      console.log("Share API cancelled or failed, falling back to download.");
    }
  }

  // Fallback: Classic Download -> Great for Desktop
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Update last backup date
  localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
};

// 1. JSON Export (For Full Restore)
export const exportToJSON = () => {
  const data = getAppointments();
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `PsiAgenda_Respaldo_${dateStr}.json`;

  shareOrDownload(blob, filename, 'Respaldo Completo PsiAgenda');
};

// 2. CSV Export (For Excel viewing)
export const exportToCSV = () => {
  const data = getAppointments();
  if (data.length === 0) {
    alert("No hay turnos para exportar.");
    return;
  }

  // Helper to format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Helper to escape text for CSV (wraps in quotes, handles internal quotes)
  const escape = (text: string | undefined | null) => {
    if (!text) return '""';
    const cleanText = String(text).replace(/"/g, '""'); // Double escape quotes
    return `"${cleanText}"`;
  };

  // Human Readable Headers
  const headers = ['Paciente', 'Teléfono', 'Email', 'Fecha', 'Hora', 'Tipo', 'Notas'];

  // Using Semicolon (;) delimiter which is standard for Excel in Spanish/European regions
  const rows = data.map(appt => [
    escape(appt.PACIENTE),
    escape(appt.TELEFONO),
    escape(appt.EMAIL),
    escape(formatDate(appt.FECHA_INICIO)),
    escape(appt.HORA_INICIO),
    escape(appt.RECURRENCIA ? (appt.FRECUENCIA === 'quincenal' ? 'Quincenal' : 'Semanal') : 'Única vez'),
    escape(appt.NOTAS || ''),
  ].join(';'));

  const csvContent = [headers.join(';'), ...rows].join('\n');
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `PsiAgenda_Reporte_${dateStr}.csv`;

  shareOrDownload(blob, filename, 'Reporte Excel PsiAgenda');
};

// 3. Import Logic
export const importFromJSON = async (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);

        // Simple validation check
        if (!Array.isArray(parsedData)) {
          throw new Error("Formato inválido");
        }

        // Save to local storage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedData));
        localStorage.setItem(BACKUP_DATE_KEY, new Date().toISOString());
        localStorage.setItem(INITIALIZED_KEY, 'true'); // Ensure we don't overwrite import with test data
        resolve(true);
      } catch (error) {
        console.error("Error parsing JSON backup", error);
        reject(false);
      }
    };
    reader.readAsText(file);
  });
};

// 4. Check if backup is needed (e.g., > 7 days)
export const isBackupNeeded = (): boolean => {
  const lastBackup = localStorage.getItem(BACKUP_DATE_KEY);
  if (!lastBackup) return true; // Never backed up

  const lastDate = new Date(lastBackup);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 7; // Alert if older than 7 days
};
