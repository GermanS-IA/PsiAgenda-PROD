import { GoogleGenAI } from "@google/genai";
import { Appointment } from '../types';

const getAiClient = () => {
    // Using environment variable as per requirement
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper to convert ISO YYYY-MM-DD to DD/MM/YYYY for natural language context
const formatDateForAI = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

export const askScheduleQuery = async (query: string, appointments: Appointment[]): Promise<string> => {
    try {
        const ai = getAiClient();
        
        // We feed the appointments as context, formatting dates for better understanding
        const contextData = JSON.stringify(appointments.map(a => ({
            paciente: a.PACIENTE,
            fecha: formatDateForAI(a.FECHA_INICIO),
            hora: a.HORA_INICIO,
            recurrente: a.RECURRENCIA,
            notas: a.NOTAS || ''
        })));

        const systemPrompt = `
        Eres un asistente de agenda para psicólogos. Tienes estos datos de turnos: ${contextData}
        Hoy es: ${new Date().toLocaleDateString('es-ES')}
        
        Instrucciones CRÍTICAS:
        1. Responde en MÁXIMO 2 oraciones.
        2. Sé extremadamente directo y breve.
        3. No uses saludos largos ni despedidas.
        4. Si es una lista, usa formato simple.
        5. Las fechas están en formato DD/MM/YYYY.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', 
            contents: query,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.1, 
            }
        });

        return response.text || "No pude procesar la respuesta.";

    } catch (error) {
        console.error("Error querying Gemini:", error);
        return "Error de conexión con IA.";
    }
};