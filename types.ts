export interface Appointment {
  ID_TURNO: string;
  PACIENTE: string;
  TELEFONO: string;
  EMAIL: string;
  FECHA_INICIO: string; // YYYY-MM-DD
  HORA_INICIO: string; // HH:mm
  RECURRENCIA: boolean;
  FRECUENCIA?: 'semanal' | 'quincenal'; // New field
  PARENT_ID?: string; // To link recurrent appointments
  NOTAS?: string; // New field for psychologist notes
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum ViewMode {
  LIST = 'LIST',
  CALENDAR = 'CALENDAR'
}