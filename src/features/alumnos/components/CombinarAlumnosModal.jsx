import React, { useState, useMemo } from 'react';
import { X, Merge, Search, ArrowRight, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';

/**
 * Modal para combinar (fusionar) dos alumnos duplicados.
 * 
 * Flujo:
 *  1. El usuario selecciona el alumno ORIGEN (el duplicado que se archivará)
 *  2. El usuario selecciona el alumno DESTINO (el que conservará la información)
 *  3. Se muestra un resumen de la fusión antes de confirmar
 *  4. Al confirmar, se ejecuta la fusión y se cierra el modal
 *
 * @param {boolean} isOpen - Si el modal está visible
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Array} alumnos - Lista completa de alumnos disponibles
 * @param {Function} onCombinar - Función que ejecuta la combinación (destinoId, origenId)
 */
const CombinarAlumnosModal = ({ isOpen, onClose, alumnos, onCombinar }) => {
    // Estado del flujo: 'seleccion' | 'confirmacion' | 'procesando' | 'exito'
    const [paso, setPaso] = useState('seleccion');
    const [origenId, setOrigenId] = useState('');
    const [destinoId, setDestinoId] = useState('');
    const [busquedaOrigen, setBusquedaOrigen] = useState('');
    const [busquedaDestino, setBusquedaDestino] = useState('');
    const [error, setError] = useState('');

    // Filtrar alumnos para búsqueda (excluyendo el ya seleccionado en el otro campo)
    const alumnosFiltradosOrigen = useMemo(() => {
        if (!alumnos) return [];
        return alumnos
            .filter(a => a.id !== destinoId)
            .filter(a => {
                if (!busquedaOrigen.trim()) return true;
                const nombre = `${a.nombres} ${a.apellidos}`.toLowerCase();
                return nombre.includes(busquedaOrigen.toLowerCase());
            });
    }, [alumnos, destinoId, busquedaOrigen]);

    const alumnosFiltradosDestino = useMemo(() => {
        if (!alumnos) return [];
        return alumnos
            .filter(a => a.id !== origenId)
            .filter(a => {
                if (!busquedaDestino.trim()) return true;
                const nombre = `${a.nombres} ${a.apellidos}`.toLowerCase();
                return nombre.includes(busquedaDestino.toLowerCase());
            });
    }, [alumnos, origenId, busquedaDestino]);

    // Obtener datos del alumno por ID
    const getAlumno = (id) => alumnos?.find(a => a.id === id);

    // Renderizar la foto o iniciales de un alumno
    const renderFoto = (alumno, size = 'w-10 h-10') => {
        if (!alumno) return null;
        if (alumno.foto_url) {
            return <img src={alumno.foto_url} alt="" className={`${size} rounded-full object-cover border border-primary/30`} />;
        }
        const initials = `${alumno.nombres?.[0] || ''}${alumno.apellidos?.[0] || ''}`.toUpperCase();
        return (
            <div className={`${size} rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center`}>
                <span className="text-primary font-bold text-xs">{initials}</span>
            </div>
        );
    };

    // Manejar la confirmación de fusión
    const handleConfirmar = async () => {
        if (!origenId || !destinoId) {
            setError('Debes seleccionar ambos alumnos.');
            return;
        }
        setPaso('procesando');
        setError('');

        try {
            await onCombinar(destinoId, origenId);
            setPaso('exito');
        } catch (err) {
            setError(err.message || 'Error al combinar alumnos');
            setPaso('confirmacion');
        }
    };

    // Resetear y cerrar
    const handleClose = () => {
        setPaso('seleccion');
        setOrigenId('');
        setDestinoId('');
        setBusquedaOrigen('');
        setBusquedaDestino('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Fondo oscuro */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Cabecera */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                            <Merge size={20} className="text-warning" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Combinar Alumnos</h2>
                            <p className="text-xs text-text-secondary">Fusionar datos de un alumno duplicado</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-text-secondary hover:text-white hover:bg-border/30 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Contenido */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Paso: Éxito */}
                    {paso === 'exito' && (
                        <div className="text-center py-8 space-y-4">
                            <CheckCircle size={64} className="text-success mx-auto" />
                            <h3 className="text-xl font-bold text-white">¡Alumnos combinados!</h3>
                            <p className="text-text-secondary">
                                Los datos fueron fusionados correctamente. El alumno duplicado fue archivado.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    )}

                    {/* Paso: Procesando */}
                    {paso === 'procesando' && (
                        <div className="text-center py-12 space-y-4">
                            <Loader2 size={48} className="text-primary mx-auto animate-spin" />
                            <p className="text-white font-medium">Combinando alumnos...</p>
                            <p className="text-xs text-text-secondary">Migrando asistencias, entrenadores y datos...</p>
                        </div>
                    )}

                    {/* Paso: Selección */}
                    {paso === 'seleccion' && (
                        <div className="space-y-6">
                            {/* Instrucciones */}
                            <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                <p className="text-warning text-sm font-medium flex items-start gap-2">
                                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                                    <span>
                                        El <strong>alumno duplicado</strong> (origen) será archivado tras la fusión.
                                        El <strong>alumno destino</strong> conserva sus datos con prioridad.
                                    </span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Columna: Alumno Duplicado (Origen) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-error uppercase tracking-wide">
                                        Alumno Duplicado (se archiva)
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre..."
                                            value={busquedaOrigen}
                                            onChange={(e) => setBusquedaOrigen(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-white text-sm placeholder-text-secondary focus:border-error focus:outline-none"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-background/30">
                                        {alumnosFiltradosOrigen.length === 0 ? (
                                            <p className="text-text-secondary text-xs text-center py-4">Sin resultados</p>
                                        ) : (
                                            alumnosFiltradosOrigen.map(a => (
                                                <button
                                                    key={a.id}
                                                    onClick={() => setOrigenId(a.id)}
                                                    className={`w-full flex items-center gap-2 p-2 text-left transition-colors hover:bg-error/10 ${origenId === a.id ? 'bg-error/20 border-l-2 border-error' : ''
                                                        }`}
                                                >
                                                    {renderFoto(a, 'w-8 h-8')}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-white text-sm font-medium truncate">
                                                            {a.nombres} {a.apellidos}
                                                        </p>
                                                        <p className="text-text-secondary text-[10px] truncate">
                                                            {a.cancha?.nombre || 'Sin cancha'}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Columna: Alumno Destino */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-success uppercase tracking-wide">
                                        Alumno Destino (se conserva)
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Buscar por nombre..."
                                            value={busquedaDestino}
                                            onChange={(e) => setBusquedaDestino(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-white text-sm placeholder-text-secondary focus:border-success focus:outline-none"
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-background/30">
                                        {alumnosFiltradosDestino.length === 0 ? (
                                            <p className="text-text-secondary text-xs text-center py-4">Sin resultados</p>
                                        ) : (
                                            alumnosFiltradosDestino.map(a => (
                                                <button
                                                    key={a.id}
                                                    onClick={() => setDestinoId(a.id)}
                                                    className={`w-full flex items-center gap-2 p-2 text-left transition-colors hover:bg-success/10 ${destinoId === a.id ? 'bg-success/20 border-l-2 border-success' : ''
                                                        }`}
                                                >
                                                    {renderFoto(a, 'w-8 h-8')}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-white text-sm font-medium truncate">
                                                            {a.nombres} {a.apellidos}
                                                        </p>
                                                        <p className="text-text-secondary text-[10px] truncate">
                                                            {a.cancha?.nombre || 'Sin cancha'}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Resumen visual de la selección */}
                            {origenId && destinoId && (
                                <div className="flex items-center justify-center gap-4 p-4 bg-background/50 border border-border rounded-lg">
                                    <div className="text-center">
                                        {renderFoto(getAlumno(origenId), 'w-12 h-12')}
                                        <p className="text-error text-xs font-bold mt-1 max-w-[100px] truncate">
                                            {getAlumno(origenId)?.nombres}
                                        </p>
                                        <p className="text-error/60 text-[10px]">Se archiva</p>
                                    </div>
                                    <ArrowRight size={24} className="text-primary" />
                                    <div className="text-center">
                                        {renderFoto(getAlumno(destinoId), 'w-12 h-12')}
                                        <p className="text-success text-xs font-bold mt-1 max-w-[100px] truncate">
                                            {getAlumno(destinoId)?.nombres}
                                        </p>
                                        <p className="text-success/60 text-[10px]">Se conserva</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <p className="text-error text-sm text-center font-medium">{error}</p>
                            )}
                        </div>
                    )}

                    {/* Paso: Confirmación */}
                    {paso === 'confirmacion' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                                <h3 className="text-warning font-bold flex items-center gap-2 mb-2">
                                    <AlertTriangle size={18} />
                                    Confirmar Fusión
                                </h3>
                                <ul className="text-sm text-text-secondary space-y-1 ml-6 list-disc">
                                    <li>Los datos de <strong className="text-white">{getAlumno(destinoId)?.nombres} {getAlumno(destinoId)?.apellidos}</strong> tienen prioridad.</li>
                                    <li>Los campos vacíos se rellenarán con datos de <strong className="text-white">{getAlumno(origenId)?.nombres} {getAlumno(origenId)?.apellidos}</strong>.</li>
                                    <li>Todas las asistencias se migrarán al alumno destino.</li>
                                    <li><strong className="text-error">{getAlumno(origenId)?.nombres} {getAlumno(origenId)?.apellidos}</strong> será archivado.</li>
                                </ul>
                            </div>

                            {error && (
                                <p className="text-error text-sm text-center font-medium">{error}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Pie del modal (botones de acción) */}
                {(paso === 'seleccion' || paso === 'confirmacion') && (
                    <div className="p-4 border-t border-border bg-background/50 flex justify-end gap-3">
                        <button
                            onClick={paso === 'confirmacion' ? () => setPaso('seleccion') : handleClose}
                            className="px-4 py-2 text-text-secondary hover:text-white border border-border rounded-lg hover:border-primary transition-colors"
                        >
                            {paso === 'confirmacion' ? 'Volver' : 'Cancelar'}
                        </button>

                        {paso === 'seleccion' && (
                            <button
                                onClick={() => {
                                    if (!origenId || !destinoId) {
                                        setError('Selecciona ambos alumnos antes de continuar.');
                                        return;
                                    }
                                    setError('');
                                    setPaso('confirmacion');
                                }}
                                disabled={!origenId || !destinoId}
                                className="px-4 py-2 bg-warning text-white font-bold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Merge size={16} />
                                Continuar
                            </button>
                        )}

                        {paso === 'confirmacion' && (
                            <button
                                onClick={handleConfirmar}
                                className="px-4 py-2 bg-error text-white font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <Merge size={16} />
                                Confirmar Fusión
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CombinarAlumnosModal;
