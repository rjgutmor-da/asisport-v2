import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  ChevronLeft, RefreshCw, Calendar, Activity, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegistroActividad = () => {
  const navigate = useNavigate();
  const { escuelaId } = useAuth();
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);

  const cargarDatos = async () => {
    if (!escuelaId) return;
    setCargando(true);
    
    // Rango de fechas: desde 00:00:00 hasta 23:59:59
    const dInicio = `${fechaDesde}T00:00:00.000Z`;
    const dFin = `${fechaHasta}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('escuela_id', escuelaId)
      .eq('ip_address', 'AsiSport')   // Solo actividades propias de AsiSport
      .gte('created_at', dInicio)
      .lte('created_at', dFin)
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
    return d.toLocaleString('es-BO', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
      {/* Header Premium */}
      <div className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-white/5 rounded-xl border border-white/5 transition-all active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Registro de Actividad</h1>
            <p className="text-[0.7rem] text-slate-500 uppercase font-semibold tracking-wider flex items-center gap-1">
              <Activity size={10} className="text-blue-500" />
              Auditoría Centralizada
            </p>
          </div>
        </div>
        <button 
          onClick={cargarDatos} 
          className={`p-2.5 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-600/20 hover:bg-blue-600/20 transition-all ${cargando ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="p-4 max-w-6xl mx-auto space-y-6">
        {/* Barra de Filtros Estilo Excel */}
        <div className="flex flex-wrap items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-400 uppercase">Rango:</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="bg-[#16161a] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="text-slate-600">—</span>
            <input 
              type="date" 
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="bg-[#16161a] border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <button 
            onClick={cargarDatos}
            className="ml-auto bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
          >
            <Search size={14} /> Aplicar Filtros
          </button>
        </div>

        {/* Tabla Compacta Tipo Excel */}
        <div className="bg-[#111114] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-4 py-3 text-[0.65rem] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Fecha y Hora</th>
                  <th className="text-left px-4 py-3 text-[0.65rem] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Módulo</th>
                  <th className="text-left px-4 py-3 text-[0.65rem] font-black text-slate-500 uppercase tracking-widest border-r border-white/5">Actividad</th>
                  <th className="text-left px-4 py-3 text-[0.65rem] font-black text-slate-500 uppercase tracking-widest">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <RefreshCw size={24} className="mx-auto animate-spin text-blue-500 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Sincronizando auditoría...</p>
                    </td>
                  </tr>
                ) : registros.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center text-slate-500 italic text-sm">
                      No se encontraron registros en este periodo.
                    </td>
                  </tr>
                ) : (
                  registros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-2.5 text-[0.8rem] font-medium text-slate-400 border-r border-white/5 whitespace-nowrap">
                        {formatTableDate(reg.created_at)}
                      </td>
                      <td className="px-4 py-2.5 text-[0.7rem] font-bold text-slate-500 uppercase border-r border-white/5">
                        {reg.modulo || '—'}
                      </td>
                      <td className="px-4 py-2.5 border-r border-white/5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[0.85rem] font-bold text-slate-100">{reg.accion}</span>
                          <span className="text-[0.75rem] text-slate-500 leading-snug">
                            {reg.detalle?.descripcion || reg.detalle?.resumen || 'Sin detalles'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-slate-800 border border-white/10 flex items-center justify-center text-[0.6rem] font-black text-blue-400">
                            {reg.usuario_nombre?.charAt(0) || '?'}
                          </div>
                          <span className="text-[0.8rem] font-semibold text-slate-400">
                            {(reg.usuario_nombre || 'Usuario').split(' ')[0]}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroActividad;
