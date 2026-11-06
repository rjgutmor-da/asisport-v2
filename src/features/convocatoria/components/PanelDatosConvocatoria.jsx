import React from 'react';
import { Trophy, Calendar, Clock, MapPin, MessageCircle, Trash2 } from 'lucide-react';

/**
 * Panel para completar los datos del partido (Torneo, Fecha, Hora y Dirección)
 * antes de enviar la lista de convocados por WhatsApp.
 * Se muestra directamente encima de la tabla cuando hay jugadores seleccionados.
 */
const PanelDatosConvocatoria = ({
    cantidadSeleccionados,
    datosPartido,
    onChangeDato,
    onEnviarWhatsApp,
    onLimpiarSeleccion
}) => {
    if (cantidadSeleccionados === 0) return null;

    return (
        <section className="bg-surface border-2 border-primary/40 rounded-md p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Cabecera del panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/30">
                        {cantidadSeleccionados} {cantidadSeleccionados === 1 ? 'jugador convocado' : 'jugadores convocados'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onLimpiarSeleccion}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-text-secondary hover:text-error hover:bg-error/10 border border-border hover:border-error/30 transition-colors"
                        title="Desmarcar todos los jugadores seleccionados"
                    >
                        <Trash2 size={14} />
                        Desmarcar todos
                    </button>
                    <button
                        type="button"
                        onClick={onEnviarWhatsApp}
                        className="flex items-center gap-2 bg-success text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-green-600 transition-colors shadow-sm"
                    >
                        <MessageCircle size={16} />
                        Enviar por WhatsApp ({cantidadSeleccionados})
                    </button>
                </div>
            </div>

            {/* Campos de datos del encuentro */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
                    <p className="text-xs font-bold text-text-secondary uppercase">
                        Datos del Encuentro para WhatsApp
                    </p>
                    <span className="text-xs text-text-secondary">
                        Encabezado: <strong className="text-white font-semibold">*Lista de Convocados*</strong>
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Torneo */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1">
                            <Trophy size={13} className="text-primary" />
                            Torneo
                        </label>
                        <input
                            type="text"
                            value={datosPartido.torneo}
                            onChange={(e) => onChangeDato('torneo', e.target.value)}
                            placeholder="Ej: Liga Infantil / Amistoso"
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-white text-sm placeholder-text-secondary/60 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Fecha */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1">
                            <Calendar size={13} className="text-primary" />
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={datosPartido.fecha}
                            onChange={(e) => onChangeDato('fecha', e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-white text-sm focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Hora */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1">
                            <Clock size={13} className="text-primary" />
                            Hora
                        </label>
                        <input
                            type="time"
                            value={datosPartido.hora}
                            onChange={(e) => onChangeDato('hora', e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-white text-sm focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary mb-1">
                            <MapPin size={13} className="text-primary" />
                            Dirección
                        </label>
                        <input
                            type="text"
                            value={datosPartido.direccion}
                            onChange={(e) => onChangeDato('direccion', e.target.value)}
                            placeholder="Ej: Cancha Municipal #2"
                            className="w-full px-3 py-2 bg-background border border-border rounded-md text-white text-sm placeholder-text-secondary/60 focus:border-primary focus:outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PanelDatosConvocatoria;
