import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { obtenerEscuelaId } from '../../../lib/rpcHelper';

/**
 * Obtiene el logo y nombre de la escuela desde Supabase.
 */
const getEscuelaInfo = async () => {
    const escuelaId = await obtenerEscuelaId();
    const { data } = await supabase
        .from('escuelas')
        .select('nombre, logo_url')
        .eq('id', escuelaId)
        .single();
    return data;
};

/**
 * Formatea una fecha ISO a texto legible en español.
 */
const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    return new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
};

/**
 * Genera y descarga el PDF de la ficha médica completa del alumno.
 * Incluye el logo de la escuela, antecedentes y todas las evaluaciones.
 */
const exportarPDF = async (alumno, ficha, evaluaciones) => {
    const escuela = await getEscuelaInfo();

    // Construir el HTML del PDF usando estilos inline
    const logoHtml = escuela?.logo_url
        ? `<img src="${escuela.logo_url}" alt="Logo" style="height:60px;object-fit:contain;" crossorigin="anonymous" />`
        : `<div style="width:60px;height:60px;background:#FF6B35;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:20px;">${(escuela?.nombre || 'E')[0]}</div>`;

    const aptitudColor = {
        'Apto': '#00D26A',
        'Apto con restricciones': '#FFB020',
        'No apto': '#FF3B30',
    };

    const evaluacionesHtml = evaluaciones.map(ev => {
        const imc = ev.peso_kg && ev.talla_cm
            ? (ev.peso_kg / Math.pow(ev.talla_cm / 100, 2)).toFixed(1)
            : null;
        const color = aptitudColor[ev.aptitud_deportiva] || '#A0A0A0';
        const nombreMedico = ev.medico
            ? `Dr./Dra. ${ev.medico.nombres} ${ev.medico.apellidos}${ev.medico.matricula_medica ? ' · Mat. ' + ev.medico.matricula_medica : ''}`
            : '';

        return `
        <div style="margin-bottom:20px;border:1px solid #2D2D2D;border-radius:8px;overflow:hidden;page-break-inside:avoid;">
            <div style="background:#1A1A1A;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                <div>
                    <span style="color:#FFFFFF;font-weight:600;font-size:14px;">${formatFecha(ev.fecha_evaluacion)}</span>
                    ${nombreMedico ? `<span style="color:#A0A0A0;font-size:12px;margin-left:12px;">${nombreMedico}</span>` : ''}
                </div>
                <span style="background:${color}20;color:${color};border:1px solid ${color}50;border-radius:999px;padding:3px 12px;font-size:12px;font-weight:600;">${ev.aptitud_deportiva}</span>
            </div>
            <div style="padding:14px 16px;background:#0A0A0A;">
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
                    ${[
                        ['Presión arterial', ev.presion_arterial ? ev.presion_arterial + ' mmHg' : null],
                        ['Frec. cardíaca', ev.frecuencia_cardiaca ? ev.frecuencia_cardiaca + ' lpm' : null],
                        ['Frec. respiratoria', ev.frecuencia_respiratoria ? ev.frecuencia_respiratoria + ' rpm' : null],
                        ['Sat. oxígeno', ev.saturacion_oxigeno ? ev.saturacion_oxigeno + '%' : null],
                        ['Peso', ev.peso_kg ? ev.peso_kg + ' kg' : null],
                        ['Talla', ev.talla_cm ? ev.talla_cm + ' cm' : null],
                        ...(imc ? [['IMC', imc + ' kg/m²']] : []),
                    ].filter(([, v]) => v).map(([label, val]) => `
                        <div style="background:#1A1A1A;border:1px solid #2D2D2D;border-radius:6px;padding:8px;">
                            <div style="color:#A0A0A0;font-size:10px;">${label}</div>
                            <div style="color:#FFFFFF;font-weight:600;font-size:13px;">${val}</div>
                        </div>
                    `).join('')}
                </div>
                ${ev.estado_general ? `<p style="margin:4px 0;font-size:12px;color:#A0A0A0;">Estado general: <strong style="color:#FFFFFF;">${ev.estado_general}</strong></p>` : ''}
                ${ev.examen_fisico ? `<p style="margin:4px 0;font-size:12px;color:#A0A0A0;">Examen físico: <span style="color:#FFFFFF;">${ev.examen_fisico}</span></p>` : ''}
                ${ev.observaciones ? `<p style="margin:4px 0;font-size:12px;color:#A0A0A0;">Observaciones: <span style="color:#FFFFFF;">${ev.observaciones}</span></p>` : ''}
                ${ev.proxima_revision ? `<p style="margin:8px 0 0;font-size:12px;color:#FFB020;font-weight:600;">📅 Próxima revisión: ${formatFecha(ev.proxima_revision)}</p>` : ''}
            </div>
        </div>`;
    }).join('');

    const ultimaAptitud = evaluaciones[0]?.aptitud_deportiva;
    const colorUltima = aptitudColor[ultimaAptitud] || '#A0A0A0';

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Ficha Médica - ${alumno.nombres} ${alumno.apellidos}</title>
        <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 24px; font-family: 'Segoe UI', Arial, sans-serif; background: #0A0A0A; color: #FFFFFF; }
            @media print { body { padding: 0; } @page { margin: 15mm; } }
        </style>
    </head>
    <body>
        <!-- Encabezado -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #FF6B35;">
            <div style="display:flex;align-items:center;gap:16px;">
                ${logoHtml}
                <div>
                    <div style="color:#A0A0A0;font-size:12px;">${escuela?.nombre || 'Escuela'}</div>
                    <div style="font-size:22px;font-weight:700;color:#FFFFFF;">${alumno.nombres} ${alumno.apellidos}</div>
                    <div style="color:#A0A0A0;font-size:13px;">
                        Ficha Médica · Generada el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>
            ${ultimaAptitud ? `<span style="background:${colorUltima}20;color:${colorUltima};border:1px solid ${colorUltima}50;border-radius:8px;padding:8px 16px;font-size:14px;font-weight:700;">${ultimaAptitud}</span>` : ''}
        </div>

        <!-- Antecedentes -->
        ${ficha ? `
        <div style="margin-bottom:24px;border:1px solid #2D2D2D;border-radius:8px;overflow:hidden;">
            <div style="background:#1A1A1A;padding:12px 16px;border-bottom:1px solid #2D2D2D;">
                <span style="color:#FF6B35;font-weight:600;font-size:14px;">🛡 Antecedentes Médicos</span>
            </div>
            <div style="padding:14px 16px;background:#0A0A0A;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                ${[
                    ['Antecedentes personales', ficha.antecedentes_personales],
                    ['Alergias', ficha.alergias],
                    ['Cirugías previas', ficha.cirugias_previas],
                    ['Club / equipo anterior', ficha.club_anterior],
                ].filter(([, v]) => v).map(([label, val]) => `
                    <div>
                        <div style="color:#A0A0A0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
                        <div style="color:#FFFFFF;font-size:13px;margin-top:2px;">${val}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Evaluaciones -->
        <div style="margin-bottom:16px;">
            <h3 style="color:#FF6B35;font-size:14px;font-weight:600;margin-bottom:12px;">📊 Historial de Evaluaciones</h3>
            ${evaluacionesHtml}
        </div>
    </body>
    </html>`;

    // Abrir en nueva ventana para imprimir/guardar como PDF
    const ventana = window.open('', '_blank', 'width=900,height=700');
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 800);
};

/**
 * Exporta la lista de aptitudes de todos los alumnos en Excel (CSV).
 * Cada fila: Alumno, Última evaluación, Aptitud, Médico, Próxima revisión
 */
const exportarExcel = async (alumno, evaluaciones) => {
    if (!evaluaciones.length) return;

    const ultima = evaluaciones[0];
    const rows = evaluaciones.map(ev => {
        const nombreMedico = ev.medico ? `${ev.medico.nombres} ${ev.medico.apellidos}` : '';
        const matricula = ev.medico?.matricula_medica || '';
        return [
            `${alumno.apellidos}, ${alumno.nombres}`,
            ev.fecha_evaluacion,
            ev.aptitud_deportiva,
            ev.presion_arterial || '',
            ev.frecuencia_cardiaca || '',
            ev.frecuencia_respiratoria || '',
            ev.saturacion_oxigeno || '',
            ev.peso_kg || '',
            ev.talla_cm || '',
            ev.estado_general || '',
            ev.observaciones?.replace(/\n/g, ' ') || '',
            ev.proxima_revision || '',
            nombreMedico,
            matricula,
        ];
    });

    const headers = [
        'Alumno', 'Fecha evaluación', 'Aptitud deportiva',
        'Presión arterial', 'Frec. cardíaca (lpm)', 'Frec. respiratoria (rpm)',
        'Sat. oxígeno (%)', 'Peso (kg)', 'Talla (cm)', 'Estado general',
        'Observaciones', 'Próxima revisión', 'Médico evaluador', 'Matrícula médico',
    ];

    const csvContent = [headers, ...rows]
        .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ficha-medica_${alumno.apellidos}_${alumno.nombres}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Botón desplegable de exportación (PDF + Excel/CSV).
 */
const ExportarFichaMedica = ({ alumno, ficha, evaluaciones }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(null);

    const handlePDF = async () => {
        setLoading('pdf');
        setOpen(false);
        try {
            await exportarPDF(alumno, ficha, evaluaciones);
        } finally {
            setLoading(null);
        }
    };

    const handleExcel = async () => {
        setLoading('excel');
        setOpen(false);
        try {
            await exportarExcel(alumno, evaluaciones);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(p => !p)}
                className="flex items-center gap-1.5 text-sm text-text-secondary border border-border hover:border-primary hover:text-white px-3 py-1.5 rounded transition-colors"
                disabled={!!loading}
            >
                <Download size={14} />
                {loading === 'pdf' ? 'Generando PDF...' : loading === 'excel' ? 'Descargando...' : 'Exportar'}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 bg-surface border border-border rounded-md shadow-lg overflow-hidden min-w-[180px]">
                        <button
                            onClick={handlePDF}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
                        >
                            <FileText size={15} className="text-error" />
                            Exportar PDF
                        </button>
                        <div className="h-px bg-border" />
                        <button
                            onClick={handleExcel}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors"
                        >
                            <FileSpreadsheet size={15} className="text-success" />
                            Exportar Excel / CSV
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ExportarFichaMedica;
