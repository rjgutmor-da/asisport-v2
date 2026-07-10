import React, { useState } from 'react';
import { Download } from 'lucide-react';
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
 * Calcula la edad a partir de la fecha de nacimiento.
 */
const calcularEdad = (fechaNac) => {
    if (!fechaNac) return '—';
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }
    return edad + ' años';
};

/**
 * Formatea los síntomas de esfuerzo JSONB para el PDF.
 */
const formatSintomas = (sintomas) => {
    if (!sintomas) return 'No refiere';
    const parts = [];
    if (sintomas.palpitaciones) parts.push('Palpitaciones anómalas');
    if (sintomas.dolor_pecho) parts.push('Dolor/presión en el pecho');
    if (sintomas.sincope) parts.push('Síncope (desmayos)');
    if (sintomas.disnea) parts.push('Disnea desproporcionada');
    if (sintomas.detalle?.trim()) parts.push(sintomas.detalle.trim());
    return parts.length > 0 ? parts.join(', ') : 'No refiere';
};

/**
 * Genera y descarga el PDF en modo claro y con branding naranja AsiSport.
 */
const exportarPDF = async (alumno, ficha, ev) => {
    const escuela = await getEscuelaInfo();

    const logoHtml = escuela?.logo_url
        ? `<img src="${escuela.logo_url}" alt="Logo" style="height:55px;object-fit:contain;" crossorigin="anonymous" />`
        : `<img src="/icon-512.png" alt="Logo" style="height:55px;object-fit:contain;" />`;

    const aptitudColor = {
        'Apto': '#00B85C',
        'Apto con restricciones': '#FF9F0A',
        'No apto': '#FF3B30',
    }[ev.aptitud_deportiva] || '#666666';

    const imc = ev.peso_kg && ev.talla_cm
        ? (ev.peso_kg / Math.pow(ev.talla_cm / 100, 2)).toFixed(1)
        : null;

    const nombreMedico = ev.medico
        ? `Dr./Dra. ${ev.medico.nombres} ${ev.medico.apellidos}${ev.medico.matricula_medica ? ' · Mat. ' + ev.medico.matricula_medica : ''}`
        : 'Médico del Plantel';

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Evaluación Médica - ${alumno.nombres} ${alumno.apellidos}</title>
        <style>
            * { box-sizing: border-box; }
            body { 
                margin: 0; 
                padding: 30px; 
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                background: #FFFFFF; 
                color: #1F2937; 
                line-height: 1.4;
            }
            @media print { 
                body { padding: 0; } 
                @page { size: letter; margin: 15mm; }
                .section-title,
                .card,
                .info-table,
                .grid-cols-2,
                .grid-cols-4 {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
            }
            .section-title {
                background: #F0F6FF; 
                border-left: 4px solid #1E3A8A; 
                padding: 6px 12px; 
                margin-top: 20px;
                margin-bottom: 12px; 
                font-weight: bold; 
                font-size: 13px; 
                color: #1E3A8A; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .grid-cols-4 {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
            }
            .grid-cols-2 {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .card {
                border: 1px solid #E5E7EB; 
                border-radius: 6px; 
                padding: 8px 10px; 
                background: #F9FAFB;
            }
            .card-label {
                color: #6B7280; 
                font-size: 9px; 
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .card-value {
                color: #111827; 
                font-weight: bold; 
                font-size: 13px;
                margin-top: 2px;
            }
            .info-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                margin-bottom: 12px;
            }
            .info-table td {
                padding: 6px 8px;
                border-bottom: 1px solid #F3F4F6;
            }
            .info-table td.label {
                color: #6B7280;
                font-weight: 600;
                width: 35%;
            }
            .info-table td.value {
                color: #111827;
                font-weight: 500;
            }
        </style>
    </head>
    <body>
        <!-- Encabezado con Branding AsiSport Naranja -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:15px;border-bottom:3px solid #1E3A8A;">
            <div style="display:flex;align-items:center;gap:15px;">
                ${logoHtml}
                <div>
                    <div style="font-size:20px;font-weight:800;color:#111827;">EVALUACIÓN MÉDICA DE APTITUD FÍSICA</div>
                    <div style="color:#6B7280;font-size:11px;margin-top:2px;">
                        Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>
            ${alumno.foto_url ? `<img src="${alumno.foto_url}" alt="Foto ${alumno.nombres}" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:2px solid #1E3A8A;" crossorigin="anonymous" />` : ''}
        </div>

        <!-- 1. Datos Generales -->
        <div class="section-title">1. Datos Generales</div>
        <div class="grid-cols-2" style="margin-bottom:12px;">
            <table class="info-table">
                <tr>
                    <td class="label">Jugador:</td>
                    <td class="value" style="font-weight:bold;">${alumno.nombres} ${alumno.apellidos}</td>
                </tr>
                <tr>
                    <td class="label">C.I. / Documento:</td>
                    <td class="value">${alumno.carnet_identidad || '—'}</td>
                </tr>
                <tr>
                    <td class="label">F. Nacimiento:</td>
                    <td class="value">${formatFecha(alumno.fecha_nacimiento)}</td>
                </tr>
                <tr>
                    <td class="label">Edad:</td>
                    <td class="value">${calcularEdad(alumno.fecha_nacimiento)}</td>
                </tr>
            </table>
            <table class="info-table">
                <tr>
                    <td class="label">Deporte:</td>
                    <td class="value" style="font-weight:bold;color:#1E3A8A;">${ev.deporte || 'Fútbol'}</td>
                </tr>
                <tr>
                    <td class="label">Club / Escuela:</td>
                    <td class="value">${escuela?.nombre || '—'}</td>
                </tr>
                <tr>
                    <td class="label">Grupo / Categoría:</td>
                    <td class="value">${alumno.cancha?.nombre || '—'}</td>
                </tr>
                <tr>
                    <td class="label">Horario:</td>
                    <td class="value">${alumno.horario?.hora || '—'}</td>
                </tr>
                <tr>
                    <td class="label">Fecha Revisión:</td>
                    <td class="value">${formatFecha(ev.fecha_evaluacion)}</td>
                </tr>
            </table>
        </div>

        <!-- 2. Antecedentes Médicos (Anamnesis Dirigida) -->
        <div class="section-title">2. Antecedentes Médicos (Anamnesis)</div>
        <table class="info-table" style="margin-bottom:15px;">
            <tr>
                <td class="label">Antecedentes Personales:</td>
                <td class="value">${ficha?.antecedentes_personales || 'No refiere patologías crónicas de base.'}</td>
            </tr>
            <tr>
                <td class="label">Alergias:</td>
                <td class="value">${ficha?.alergias || 'No refiere.'}</td>
            </tr>
            <tr>
                <td class="label">Cirugías Previas:</td>
                <td class="value">${ficha?.cirugias_previas || 'No refiere.'}</td>
            </tr>
            <tr>
                <td class="label">Muerte Súbita Familiar:</td>
                <td class="value" style="${ficha?.antecedentes_familiares?.tiene ? 'color:#FF3B30;font-weight:bold;' : ''}">
                    ${ficha?.antecedentes_familiares?.tiene ? `Sí: ${ficha.antecedentes_familiares.detalle}` : 'No refiere antecedentes familiares críticos.'}
                </td>
            </tr>
            <tr>
                <td class="label">Síntomas de Esfuerzo:</td>
                <td class="value" style="${Object.entries(ficha?.sintomas_esfuerzo || {}).some(([k, v]) => k !== 'detalle' && v) ? 'color:#FF9F0A;font-weight:bold;' : ''}">
                    ${formatSintomas(ficha?.sintomas_esfuerzo)}
                </td>
            </tr>
            <tr>
                <td class="label">Historial de Trauma Craneal:</td>
                <td class="value" style="${ficha?.trauma_craneal?.tiene ? 'color:#007AFF;font-weight:bold;' : ''}">
                    ${ficha?.trauma_craneal?.tiene ? `Sí: ${ficha.trauma_craneal.detalle}` : 'No refiere conmociones ni traumas previos.'}
                </td>
            </tr>
            <tr>
                <td class="label">Club y Equipo:</td>
                <td class="value">${ficha?.club_anterior || '—'}</td>
            </tr>
        </table>

        <!-- 3. Signos Vitales y Antropometría -->
        <div class="section-title">3. Signos Vitales y Antropometría</div>
        <div class="grid-cols-4" style="margin-bottom:12px;">
            <div class="card">
                <div class="card-label">Presión arterial</div>
                <div class="card-value">${ev.presion_arterial || '— mmHg'}</div>
            </div>
            <div class="card">
                <div class="card-label">Frec. cardíaca</div>
                <div class="card-value">${ev.frecuencia_cardiaca ? ev.frecuencia_cardiaca + ' lpm' : '— lpm'}</div>
            </div>
            <div class="card">
                <div class="card-label">Frec. respiratoria</div>
                <div class="card-value">${ev.frecuencia_respiratoria ? ev.frecuencia_respiratoria + ' rpm' : '— rpm'}</div>
            </div>
            <div class="card" style="border-color:#1E3A8A;background:#F0F6FF;">
                <div class="card-label" style="color:#1E3A8A;">Sat. Oxígeno SpO₂</div>
                <div class="card-value" style="color:#1E3A8A;">${ev.saturacion_oxigeno ? ev.saturacion_oxigeno + '%' : '— %'}</div>
            </div>
            <div class="card">
                <div class="card-label">Peso</div>
                <div class="card-value">${ev.peso_kg ? ev.peso_kg + ' kg' : '— kg'}</div>
            </div>
            <div class="card">
                <div class="card-label">Talla</div>
                <div class="card-value">${ev.talla_cm ? ev.talla_cm + ' cm' : '— cm'}</div>
            </div>
            <div class="card">
                <div class="card-label">IMC</div>
                <div class="card-value">${imc ? imc + ' kg/m²' : '—'}</div>
            </div>
            <div class="card">
                <div class="card-label">Pulsos periféricos</div>
                <div class="card-value" style="font-size:11px;">${ev.pulsos_perifericos || '—'}</div>
            </div>
        </div>

        <!-- 4. Evaluación Física por Sistemas -->
        <div class="section-title">4. Exploración Clínica por Sistemas</div>
        <div class="grid-cols-2" style="margin-bottom:15px;gap:15px;">
            <div style="border:1px solid #E5E7EB;border-radius:6px;padding:10px;font-size:11px;background:#FAFAFA;">
                <p style="margin:0 0 6px 0;font-weight:bold;color:#1E3A8A;text-transform:uppercase;font-size:10px;">Sistema Cardiovascular</p>
                <p style="margin:3px 0;">• Auscultación supino: <strong>${ev.eval_cardiovascular?.auscultacion_supino || 'Normal'}</strong></p>
                <p style="margin:3px 0;">• Auscultación bipedestación: <strong>${ev.eval_cardiovascular?.auscultacion_bipedestacion || 'Normal'}</strong></p>
                <p style="margin:3px 0;">• Soplos detectados: <strong style="color:${ev.eval_cardiovascular?.soplos ? '#FF3B30' : '#00B85C'};">${ev.eval_cardiovascular?.soplos ? 'Sí' : 'No'}</strong></p>
                ${ev.eval_cardiovascular?.observaciones ? `<p style="margin:3px 0;color:#555;">• Obs: ${ev.eval_cardiovascular.observaciones}</p>` : ''}
            </div>
            <div style="border:1px solid #E5E7EB;border-radius:6px;padding:10px;font-size:11px;background:#FAFAFA;">
                <p style="margin:0 0 6px 0;font-weight:bold;color:#1E3A8A;text-transform:uppercase;font-size:10px;">Sistema Respiratorio</p>
                <p style="margin:3px 0;">• Auscultación pulmonar: <strong>${ev.eval_respiratorio?.auscultacion || 'Normal'}</strong></p>
                ${ev.eval_respiratorio?.hallazgos ? `<p style="margin:3px 0;color:#555;">• Hallazgos: ${ev.eval_respiratorio.hallazgos}</p>` : ''}
            </div>
            <div style="border:1px solid #E5E7EB;border-radius:6px;padding:10px;font-size:11px;background:#FAFAFA;grid-column: span 2;">
                <p style="margin:0 0 6px 0;font-weight:bold;color:#1E3A8A;text-transform:uppercase;font-size:10px;">Sistema Músculo-esquelético y Articular</p>
                <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                    <span>• Estabilidad ligamentosa: <strong>${ev.eval_musculoesqueletico?.estabilidad_ligamentosa || 'Normal'}</strong></span>
                    <span>• Test de Adams (columna): <strong>${ev.eval_musculoesqueletico?.test_adams || 'Normal'}</strong></span>
                    <span>• Tibial anterior (Osgood-Schlatter): <strong>${ev.eval_musculoesqueletico?.osgood_schlatter || 'Negativo'}</strong></span>
                </div>
                ${ev.eval_musculoesqueletico?.observaciones ? `<p style="margin:6px 0 0 0;color:#555;">• Observaciones: ${ev.eval_musculoesqueletico.observaciones}</p>` : ''}
            </div>
        </div>

        <!-- 5. Evaluación Funcional -->
        <div class="section-title">5. Evaluación Funcional (Consultorio)</div>
        <div class="grid-cols-4" style="margin-bottom:15px;font-size:11px;">
            <div class="card" style="text-align:center;">
                <div class="card-label">Marcha</div>
                <div class="card-value" style="font-size:12px;color:${ev.eval_funcional?.marcha === 'Normal' ? '#00B85C' : '#FF3B30'};">${ev.eval_funcional?.marcha || 'Normal'}</div>
            </div>
            <div class="card" style="text-align:center;">
                <div class="card-label">Equilibrio</div>
                <div class="card-value" style="font-size:12px;color:${ev.eval_funcional?.equilibrio === 'Adecuado' ? '#00B85C' : '#FF3B30'};">${ev.eval_funcional?.equilibrio || 'Adecuado'}</div>
            </div>
            <div class="card" style="text-align:center;">
                <div class="card-label">Fuerza general</div>
                <div class="card-value" style="font-size:12px;color:${ev.eval_funcional?.fuerza === 'Adecuada' ? '#00B85C' : '#FF3B30'};">${ev.eval_funcional?.fuerza || 'Adecuada'}</div>
            </div>
            <div class="card" style="text-align:center;">
                <div class="card-label">Dolor al movimiento</div>
                <div class="card-value" style="font-size:12px;color:${ev.eval_funcional?.dolor_movimiento ? '#FF9F0A' : '#00B85C'};">
                    ${ev.eval_funcional?.dolor_movimiento ? `Sí (${ev.eval_funcional.dolor_zona || 'zona indet.'})` : 'No'}
                </div>
            </div>
        </div>

        <!-- 6. Aptitud Deportiva -->
        <div class="section-title">6. Dictamen de Aptitud Deportiva</div>
        <div style="border:2px solid ${aptitudColor};border-radius:8px;padding:12px 15px;background:#FAFAFA;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;">
            <div>
                <span style="font-size:11px;color:#6B7280;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Dictamen del Médico Evaluador</span>
                <div style="font-size:20px;font-weight:800;color:${aptitudColor};margin-top:2px;">${ev.aptitud_deportiva.toUpperCase()}</div>
            </div>
            <div style="font-size:12px;color:#4B5563;text-align:right;">
                <div>Evaluador: <strong>${nombreMedico}</strong></div>
            </div>
        </div>

        ${ev.aptitud_deportiva === 'Apto con restricciones' && ev.restricciones_aptitud ? `
        <div style="border:1px solid #FF9F0A;border-radius:6px;padding:10px 12px;background:#FFFBEB;margin-bottom:15px;font-size:12px;">
            <strong style="color:#B45309;text-transform:uppercase;font-size:10px;letter-spacing:0.5px;">Restricciones / Condiciones Médicas:</strong>
            <p style="margin:4px 0 0 0;color:#1F2937;line-height:1.4;">${ev.restricciones_aptitud}</p>
        </div>
        ` : ''}

        ${ev.observaciones ? `
        <div style="font-size:12px;margin-bottom:15px;">
            <strong>Observaciones y Recomendaciones adicionales:</strong>
            <p style="margin:4px 0 0 0;color:#4B5563;line-height:1.4;">${ev.observaciones}</p>
        </div>
        ` : ''}

        ${ev.proxima_revision ? `
        <div style="font-size:12px;color:#B45309;font-weight:bold;margin-bottom:20px;">
            📅 Próxima revisión sugerida: ${formatFecha(ev.proxima_revision)}
        </div>
        ` : ''}

        <!-- Firmas y Cierre -->
        <div style="margin-top:40px;border-top:1px solid #E5E7EB;padding-top:15px;display:flex;justify-content:space-between;font-size:11px;color:#6B7280;">
            <div>
                Este documento es una certificación médica de aptitud física emitida para el ciclo deportivo actual.<br/>
                La veracidad de los datos clínicos y del dictamen corresponden al profesional firmante.
            </div>
            <div style="text-align:right;">
                <strong>${nombreMedico}</strong><br/>
                Médico Evaluador Autorizado
            </div>
        </div>
    </body>
    </html>`;

    const ventana = window.open('', '_blank', 'width=900,height=750');
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    setTimeout(() => ventana.print(), 800);
};

/**
 * Botón directo para exportar el PDF de una evaluación específica.
 */
const ExportarFichaMedica = ({ alumno, ficha, evaluaciones }) => {
    const [loading, setLoading] = useState(false);

    const handlePDF = async () => {
        if (!evaluaciones || evaluaciones.length === 0) return;
        setLoading(true);
        try {
            await exportarPDF(alumno, ficha, evaluaciones[0]);
        } finally {
            setLoading(null);
        }
    };

    return (
        <button
            onClick={handlePDF}
            className="flex items-center gap-1.5 text-xs text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded transition-all duration-200 font-bold"
            disabled={loading}
        >
            <Download size={13} />
            {loading ? 'Generando PDF...' : 'Exportar PDF'}
        </button>
    );
};

export default ExportarFichaMedica;
