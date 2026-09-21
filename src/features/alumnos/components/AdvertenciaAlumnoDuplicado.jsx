import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const AdvertenciaAlumnoDuplicado = ({ advertencia, error, verificando = false }) => {
    if (!advertencia && !error && !verificando) return null;

    if (verificando && !advertencia && !error) {
        return (
            <div className="flex items-center gap-2 text-sm text-text-secondary" aria-live="polite">
                <Loader2 size={16} className="animate-spin" />
                Verificando si el alumno ya existe…
            </div>
        );
    }

    const esArchivado = Boolean(advertencia?.archivado);
    const titulo = error
        ? 'No pudimos verificar al alumno'
        : esArchivado
            ? 'Este alumno tiene un registro archivado'
            : 'Este alumno ya está registrado';
    const descripcion = error
        || (esArchivado
            ? 'Solicita al administrador que revise su restauración para conservar sus asistencias y movimientos financieros.'
            : 'Existe un registro con el mismo nombre completo o carnet en esta escuela, aunque la fecha de nacimiento sea diferente. Revisa el registro existente o solicita ayuda al administrador.');

    return (
        <div
            className="rounded-md border border-warning/60 bg-warning/10 p-4 text-warning"
            role="alert"
            aria-live="assertive"
        >
            <div className="flex items-start gap-3">
                <AlertTriangle size={22} className="mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-bold">{titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/90">{descripcion}</p>
                </div>
            </div>
        </div>
    );
};

export default AdvertenciaAlumnoDuplicado;
