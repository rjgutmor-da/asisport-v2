import React from 'react';
import { Check } from 'lucide-react';

/**
 * Componente de fila para registrar asistencia de un alumno.
 * Ahora usa estado local para feedback instantáneo.
 */
const AsistenciaListItem = ({
    alumno,
    localEstado,
    onAsistenciaNormal,
    onEliminarNormal
}) => {
    // Generar iniciales para fallback de foto
    const getInitials = () => {
        const firstInitial = alumno.nombres?.[0] || '';
        const lastInitial = alumno.apellidos?.[0] || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    // Determinar si hay cambios pendientes
    const tieneCambiosPendientes = localEstado !== null && localEstado !== alumno.asistenciaNormal?.estado;

    // Handler para toggle de estado
    const handleClick = (nuevoEstado) => {
        if (localEstado === nuevoEstado) {
            // Si ya está marcado con ese estado, lo desmarcamos
            onEliminarNormal(alumno.id);
        } else {
            onAsistenciaNormal(alumno.id, nuevoEstado);
        }
    };

    return (
        <div className={`
            bg-surface border rounded-md p-3 flex items-center gap-3 transition-all
            ${tieneCambiosPendientes ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'}
        `}>
            {/* Foto */}
            <div className="flex-shrink-0">
                {alumno.foto_url ? (
                    <img
                        src={alumno.foto_url}
                        alt={`${alumno.nombres} ${alumno.apellidos}`}
                        className="w-12 h-12 rounded-md border border-primary object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-md border border-primary bg-background flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                            {getInitials()}
                        </span>
                    </div>
                )}
            </div>

            {/* Nombre y badges */}
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                        {alumno.nombres} {alumno.apellidos}
                    </h3>
                    {alumno.estado === 'Pendiente' && (
                        <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[10px] font-bold rounded flex-shrink-0">
                            P
                        </span>
                    )}
                    {tieneCambiosPendientes && (
                        <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded flex-shrink-0 animate-pulse">
                            ●
                        </span>
                    )}
                </div>
                <p className="text-xs text-text-secondary truncate">
                    Sub {alumno.fecha_nacimiento ? (new Date().getFullYear() - new Date(alumno.fecha_nacimiento).getFullYear()) : '??'} • {alumno.horario?.hora || ''}
                </p>
            </div>

            {/* Botones de estado: Solo Presente y Licencia */}
            <div className="flex gap-2 flex-shrink-0">
                {/* Presente */}
                <button
                    onClick={() => handleClick('Presente')}
                    className={`
                        w-12 h-12 rounded-md flex items-center justify-center transition-all
                        ${localEstado === 'Presente'
                            ? 'bg-success text-white scale-105'
                            : 'bg-success/10 text-success border border-success/30 hover:bg-success/20'
                        }
                    `}
                    title="Presente"
                >
                    <Check size={24} />
                </button>

                {/* Licencia */}
                <button
                    onClick={() => handleClick('Licencia')}
                    className={`
                        w-12 h-12 rounded-md flex items-center justify-center transition-all font-bold text-lg
                        ${localEstado === 'Licencia'
                            ? 'bg-warning text-white scale-105'
                            : 'bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20'
                        }
                    `}
                    title="Licencia"
                >
                    L
                </button>
            </div>
        </div>
    );
};

export default AsistenciaListItem;
