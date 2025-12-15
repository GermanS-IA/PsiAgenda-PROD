import { Appointment } from '../types';

// ⚠️ IMPORTANTE:
// Para que esto funcione, tenés que definir la variable de entorno
// VITE_GEMINI_API_KEY con tu API key de Google AI Studio.
// En Vercel: Project Settings → Environment Variables → VITE_GEMINI_API_KEY

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper para mostrar fechas de forma natural a la IA
const formatDateForAI = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const askScheduleQuery = async (
  query: string,
  appointments: Appointment[]
): Promise<string> => {
  try {
    if (!API_KEY) {
      return 'Falta configurar la API key de Gemini (VITE_GEMINI_API_KEY).';
    }

    // Datos de contexto para la IA
    const contextData = JSON.stringify(
      appointments.map((a) => ({
        paciente: a.PACIENTE,
        fecha: formatDateForAI(a.FECHA_INICIO),
        hora: a.HORA_INICIO,
        recurrente: a.RECURRENCIA,
        notas: a.NOTAS || '',
      }))
    );

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

    const fullPrompt = `${systemPrompt}\n\nPregunta del psicólogo: ${query}`;

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
        API_KEY,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: fullPrompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error('Error HTTP de Gemini:', response.status, await response.text());
      return 'Error al conectar con la IA (HTTP ' + response.status + ').';
    }

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .join(' ')
        .trim() || 'No pude procesar la respuesta.';

    return text;
  } catch (error) {
    console.error('Error querying Gemini:', error);
    return 'Error de conexión con IA.';
  }
};
