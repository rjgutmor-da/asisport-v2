import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    crearAdvertenciaDuplicado,
    MENSAJE_ERROR_VERIFICACION_DUPLICADO,
    verificarAlumnoDuplicado
} from '../../../services/alumnos';

export const normalizarIdentidadLocal = (valor = '') => valor
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizarCarnetLocal = (valor = '') => valor
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const useAlumnoDuplicado = ({
    nombres,
    apellidos,
    carnetIdentidad,
    alumnoId = null,
    enabled = true
}) => {
    const [advertenciaDuplicado, setAdvertenciaDuplicado] = useState(null);
    const [errorVerificacionDuplicado, setErrorVerificacionDuplicado] = useState('');
    const [verificandoDuplicado, setVerificandoDuplicado] = useState(false);
    const solicitudActualRef = useRef(0);

    const identidad = useMemo(() => ({
        nombres: nombres?.trim() || '',
        apellidos: apellidos?.trim() || '',
        carnetIdentidad: carnetIdentidad?.trim() || ''
    }), [nombres, apellidos, carnetIdentidad]);

    const tieneIdentidadVerificable = Boolean(
        (identidad.nombres && identidad.apellidos) || identidad.carnetIdentidad
    );

    const verificarAhora = useCallback(async () => {
        const numeroSolicitud = ++solicitudActualRef.current;

        if (!enabled || !tieneIdentidadVerificable) {
            setAdvertenciaDuplicado(null);
            setErrorVerificacionDuplicado('');
            setVerificandoDuplicado(false);
            return { duplicado: false, archivado: false, motivo: null };
        }

        setVerificandoDuplicado(true);
        setErrorVerificacionDuplicado('');

        try {
            const resultado = await verificarAlumnoDuplicado({
                ...identidad,
                alumnoId
            });

            if (numeroSolicitud !== solicitudActualRef.current) return resultado;

            setAdvertenciaDuplicado(
                resultado.duplicado
                    ? crearAdvertenciaDuplicado(resultado.archivado, resultado.motivo)
                    : null
            );
            return resultado;
        } catch (error) {
            if (numeroSolicitud === solicitudActualRef.current) {
                setAdvertenciaDuplicado(null);
                setErrorVerificacionDuplicado(MENSAJE_ERROR_VERIFICACION_DUPLICADO);
            }
            throw error;
        } finally {
            if (numeroSolicitud === solicitudActualRef.current) {
                setVerificandoDuplicado(false);
            }
        }
    }, [alumnoId, enabled, identidad, tieneIdentidadVerificable]);

    useEffect(() => {
        if (!enabled || !tieneIdentidadVerificable) {
            solicitudActualRef.current += 1;
            setAdvertenciaDuplicado(null);
            setErrorVerificacionDuplicado('');
            setVerificandoDuplicado(false);
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            verificarAhora().catch(() => {
                // El estado visible ya se actualiza dentro de verificarAhora.
            });
        }, 500);

        return () => {
            window.clearTimeout(timeoutId);
            solicitudActualRef.current += 1;
        };
    }, [enabled, tieneIdentidadVerificable, verificarAhora]);

    const mostrarAdvertenciaDesdeResultado = useCallback((advertencia) => {
        setErrorVerificacionDuplicado('');
        setAdvertenciaDuplicado(advertencia);
    }, []);

    const limpiarValidacionDuplicado = useCallback(() => {
        solicitudActualRef.current += 1;
        setAdvertenciaDuplicado(null);
        setErrorVerificacionDuplicado('');
        setVerificandoDuplicado(false);
    }, []);

    return {
        advertenciaDuplicado,
        errorVerificacionDuplicado,
        verificandoDuplicado,
        verificarAhora,
        mostrarAdvertenciaDesdeResultado,
        limpiarValidacionDuplicado
    };
};
