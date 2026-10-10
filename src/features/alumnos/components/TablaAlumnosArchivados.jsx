import React from 'react';
import { RotateCcw } from 'lucide-react';
import { formatearFechaArchivo, formatearFechaHoraDetallada, obtenerNombreUsuarioArchivador } from '../utils/alumnosArchivadosUtils';

/**
 * Tabla para mostrar el listado de alumnos archivados,
 * incluyendo la fecha de archivo y el usuario que realizó la acción.
 */
const TablaAlumnosArchivados = ({
    alumnos = [],
    searchTerm = '',
    onRestaurar,
    onSelectAlumno
}) => {
    const alumnosFiltrados = alumnos.filter(alumno => {
        const fullSearch = `${alumno.nombres || ''} ${alumno.apellidos || ''}`.toLowerCase();
        return fullSearch.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-surface border-b border-border">
                        <th className="text-left text-text-secondary font-semibold px-4 py-3">Nombre</th>
                        <th className="text-left text-text-secondary font-semibold px-4 py-3 hidden sm:table-cell">Cancha</th>
                        <th className="text-left text-text-secondary font-semibold px-4 py-3 hidden md:table-cell">Fecha de Archivo</th>
                        <th className="text-left text-text-secondary font-semibold px-4 py-3 hidden md:table-cell">Archivado por</th>
                        <th className="text-left text-text-secondary font-semibold px-4 py-3 hidden lg:table-cell">Asistencias</th>
                        <th className="text-center text-text-secondary font-semibold px-4 py-3">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {alumnosFiltrados.map((alumno) => {
                        const usuarioArchivador = obtenerNombreUsuarioArchivador(alumno);
                        const fechaArchivo = formatearFechaArchivo(alumno.archivado_at);
                        const fechaDetalle = formatearFechaHoraDetallada(alumno.archivado_at);

                        return (
                            <tr
                                key={alumno.id}
                                className="border-b border-border/50 hover:bg-surface/50 transition-colors cursor-pointer"
                                onClick={() => onSelectAlumno?.(alumno.id)}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {/* Foto o iniciales */}
                                        {alumno.foto_url ? (
                                            <img
                                                src={alumno.foto_url}
                                                alt={`${alumno.nombres} ${alumno.apellidos}`}
                                                className="w-8 h-8 rounded-full object-cover border border-border flex-shrink-0"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-primary">
                                                    {(alumno.nombres?.[0] || '')}{(alumno.apellidos?.[0] || '')}
                                                </span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-white font-medium truncate">
                                                {alumno.nombres} {alumno.apellidos}
                                            </p>
                                            {/* Info adicional visible solo en móvil */}
                                            <p className="text-text-secondary text-xs sm:hidden">
                                                {alumno.cancha?.nombre || 'Sin cancha'}
                                                {fechaArchivo !== '—' ? ` • ${fechaArchivo}` : ''}
                                                {usuarioArchivador !== '—' ? ` • Por: ${usuarioArchivador}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-text-secondary hidden sm:table-cell">
                                    {alumno.cancha?.nombre || '—'}
                                </td>
                                <td 
                                    className="px-4 py-3 text-text-secondary hidden md:table-cell whitespace-nowrap"
                                    title={fechaDetalle !== '—' ? `Fecha y hora: ${fechaDetalle}` : undefined}
                                >
                                    {fechaArchivo}
                                </td>
                                <td 
                                    className="px-4 py-3 text-text-secondary hidden md:table-cell truncate max-w-[180px]"
                                    title={usuarioArchivador !== '—' ? usuarioArchivador : undefined}
                                >
                                    {usuarioArchivador}
                                </td>
                                <td className="px-4 py-3 text-text-secondary hidden lg:table-cell">
                                    {alumno.asistencias_count || 0}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRestaurar?.(alumno.id, `${alumno.nombres} ${alumno.apellidos}`);
                                        }}
                                        className="inline-flex items-center gap-1.5 bg-success text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-green-600 transition-colors"
                                    >
                                        <RotateCcw size={14} />
                                        Restaurar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default TablaAlumnosArchivados;
