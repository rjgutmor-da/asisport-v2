import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  ChevronLeft, RefreshCw, Filter, 
  ChevronDown, ArrowUpDown, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegistroActividad = () => {
  const navigate = useNavigate();
  const { user, escuelaId } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [intervaloFechas, setIntervaloFechas] = useState('Este mes');

  const cargarDatos = async () => {
    if (!escuelaId) return;
    setCargando(true);
    
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('escuela_id', escuelaId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRegistros(data);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [escuelaId]);

  const formatTableDate = (iso) => {
    const d = new Date(iso);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background text-text-primary pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Registro de Actividad</h1>
            <p className="text-xs text-text-secondary">Historial de acciones del sistema</p>
          </div>
        </div>
        <button onClick={cargarDatos} className={`p-2 rounded-full ${cargando ? 'animate-spin' : ''}`}>
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Filtros Simple */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['Hoy', 'Este mes', 'Todo'].map(f => (
            <button 
              key={f}
              onClick={() => setIntervaloFechas(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                intervaloFechas === f 
                ? 'bg-primary text-white' 
                : 'bg-surface border border-border text-text-secondary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tabla / Lista */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          {cargando ? (
            <div className="p-12 text-center space-y-3">
              <RefreshCw size={32} className="mx-auto animate-spin text-primary" />
              <p className="text-text-secondary text-sm">Cargando registros...</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="p-12 text-center space-y-3 opacity-50">
              <Activity size={48} className="mx-auto mb-2" />
              <p>No hay actividad registrada aún.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {registros.map((reg) => (
                <div key={reg.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase">
                        {reg.modulo || 'Sistema'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        reg.ip_address === 'AsiSport' 
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {reg.ip_address || 'SaaSport'}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary">
                      {formatTableDate(reg.created_at)}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gray-100 mb-1">{reg.accion}</h3>
                  <p className="text-xs text-text-secondary mb-3 leading-relaxed">
                    {reg.detalle?.descripcion || 'Sin descripción detallada'}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                    <div className="w-5 h-5 rounded-full bg-surface-lighter border border-border flex items-center justify-center text-primary font-bold shadow-sm">
                      {reg.usuario_nombre?.charAt(0) || 'U'}
                    </div>
                    <span className="font-medium">Realizado por <span className="text-text-secondary">{reg.usuario_nombre}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistroActividad;
