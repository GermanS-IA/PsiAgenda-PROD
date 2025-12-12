import React, { useState } from 'react';
import { askScheduleQuery } from '../services/geminiService';
import { Appointment } from '../types';

interface Props {
  appointments: Appointment[];
}

const GeminiQuery: React.FC<Props> = ({ appointments }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse('');
    
    try {
      const result = await askScheduleQuery(query, appointments);
      setResponse(result);
    } catch (err) {
      setResponse('Error al consultar el asistente.');
    } finally {
      setLoading(false);
    }
  };

  const clearResponse = () => {
      setResponse('');
      setQuery('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm sticky top-0 z-30 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex flex-col gap-2">
           <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM6.97 11.03a.75.75 0 111.06 1.06l-1.06-1.06zm.06-1.06a.75.75 0 111.06 1.06L6.97 9.97z" clipRule="evenodd" />
                </svg>
             </div>
             <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Asistente Virtual IA</h3>
           </div>
           
           <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: ¿Quién viene mañana a las 17hs?"
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg pl-4 pr-12 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all shadow-inner placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 dark:bg-indigo-500 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition disabled:opacity-50 disabled:hover:bg-indigo-600"
                >
                  {loading ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
            </form>
            
            {response && (
              <div className="mt-2 bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 text-sm text-slate-700 dark:text-slate-200 leading-relaxed shadow-sm relative pr-8">
                <p className="whitespace-pre-wrap">{response}</p>
                <button 
                    onClick={clearResponse}
                    className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 p-1 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-full transition-colors"
                    title="Cerrar respuesta"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GeminiQuery;