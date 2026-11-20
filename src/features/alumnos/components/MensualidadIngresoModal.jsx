import { useEffect, useRef, useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { supabase } from '../../../lib/supabaseClient';

const moneda = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });

function finDeCiclo(inicio) {
    if (!inicio) return '';
    const [anio, mes, dia] = inicio.split('-').map(Number);
    const ultimoDiaSiguiente = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
    return new Date(Date.UTC(anio, mes, Math.min(dia, ultimoDiaSiguiente) - 1))
        .toISOString().slice(0, 10);
}

export default function MensualidadIngresoModal({ alumno, editable, onCerrar }) {
    const dialogo = useRef(null);
    const [ingreso, setIngreso] = useState(null);
    const [inicio, setInicio] = useState('');
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        dialogo.current.showModal();
    }, []);

    useEffect(() => {
        const controlador = new AbortController();
        async function cargar() {
            const { data, error: fallo } = await supabase.from('mensualidades_ingreso')
                .select('cuenta_id,fecha_ingreso,ciclo_inicio,ciclo_fin,monto,motivo')
                .eq('alumno_id', alumno.id)
                .abortSignal(controlador.signal)
                .maybeSingle();
            if (controlador.signal.aborted) return;
            setIngreso(data);
            setInicio(data?.ciclo_inicio || '');
            setError(fallo ? 'No se pudo consultar el resultado de la mensualidad.' : '');
            setCargando(false);
        }
        void cargar();
        return () => controlador.abort();
    }, [alumno.id, intento]);

    async function guardar(evento) {
        evento.preventDefault();
        if (!editable || !ingreso?.cuenta_id || guardando) return;
        setGuardando(true);
        setError('');
        try {
            const { error: fallo } = await supabase.rpc('rpc_editar_ciclo_mensualidad_ingreso', {
                p_alumno: alumno.id,
                p_cuenta: ingreso.cuenta_id,
                p_inicio: inicio
            });
            if (fallo) {
                setError(fallo.message);
                return;
            }
            onCerrar();
        } finally {
            setGuardando(false);
        }
    }

    const permiteGuardar = editable && Boolean(ingreso?.cuenta_id);
    return (
        <dialog
            ref={dialogo}
            aria-labelledby="mensualidad-ingreso-titulo"
            className="w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-surface p-6 text-white backdrop:bg-black/70"
            onCancel={evento => { evento.preventDefault(); if (!guardando) onCerrar(); }}
        >
            <form onSubmit={guardar} className="space-y-4">
                <h2 id="mensualidad-ingreso-titulo" className="text-xl font-semibold">Mensualidad de ingreso</h2>
                <p>{alumno.nombres} {alumno.apellidos}</p>
                {cargando && <p role="status">Consultando la mensualidad…</p>}
                {!cargando && ingreso?.motivo === 'sin_tarifa' && <p>La ficha no tiene tarifa de mensualidad.</p>}
                {!cargando && ingreso?.motivo === 'tarifa_cero' && <p>La tarifa de la ficha no tiene un importe positivo.</p>}
                {!cargando && !error && !ingreso?.motivo && !ingreso?.cuenta_id &&
                    <p>El alumno quedó activo. No hay un borrador de ingreso disponible.</p>}
                {ingreso?.cuenta_id && (
                    <>
                        <p>El borrador quedó guardado en Finanzas → Notas Automáticas.</p>
                        {editable && (
                            <>
                                <p className="font-medium">{moneda.format(ingreso.monto)}</p>
                                <Input label="Inicio del ciclo" type="date" value={inicio}
                                    min={ingreso.fecha_ingreso} onChange={evento => setInicio(evento.target.value)}
                                    required disabled={guardando} />
                                <p className="text-sm text-text-secondary">
                                    Fin del ciclo {inicio === ingreso.ciclo_inicio ? ingreso.ciclo_fin : finDeCiclo(inicio)}
                                </p>
                            </>
                        )}
                    </>
                )}
                {error && <p role="alert" className="text-error">{error}</p>}
                <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onCerrar} disabled={guardando}>Cerrar</Button>
                    {error && !ingreso && <Button type="button" onClick={() => {
                        setCargando(true);
                        setError('');
                        setIntento(valor => valor + 1);
                    }}>Volver a consultar</Button>}
                    {permiteGuardar && <Button type="submit" isLoading={guardando}
                        disabled={guardando || !inicio || inicio === ingreso.ciclo_inicio}>Guardar fecha</Button>}
                </div>
            </form>
        </dialog>
    );
}
