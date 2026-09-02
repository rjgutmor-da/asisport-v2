import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Users, FileSpreadsheet, X, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEstadisticas } from '../features/estadisticas/hooks/useEstadisticas';
import { sugerirAlumnosAsisport, listarAlumnosAsisport } from '../services/alumnos';
import { useDebounce } from '../hooks/useDebounce';

import MultiSelectFilter from '../components/ui/MultiSelectFilter';
import TabBar from '../components/dashboard/TabBar';
import DesktopNavbar from '../components/layout/DesktopNavbar';

const Estadisticas = () => {
    const navigate = useNavigate();
    const {
        loading,
        metrics,
        tableData,
        alumnoSeleccionado,
        dateRangeText,
        gestiones,
        canchas,
        entrenadores,
        horarios,
        canchasDisponibles,
        entrenadoresDisponibles,
        handleEntrenadoresChange,
        handleCanchasChange,
        selectedGestionId, setSelectedGestionId,
        dateRangeOption, setDateRangeOption,
        selectedEntrenadores, setSelectedEntrenadores,
        selectedCanchas, setSelectedCanchas,
        selectedHorarios, setSelectedHorarios,
        selectedDias, setSelectedDias,
        selectedAlumnoId, setSelectedAlumnoId,
        loadDetalleForExport
    } = useEstadisticas();

    const [exportLoading, setExportLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedFields, setSelectedFields] = useState(['nombreCompleto', 'telefono', 'fecha_nacimiento']);
    const [alumnoSearchTerm, setAlumnoSearchTerm] = useState('');
    const [showAlumnoResults, setShowAlumnoResults] = useState(false);
    const [alumnoSuggestions, setAlumnoSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const debouncedAlumnoSearch = useDebounce(alumnoSearchTerm, 300);

    // Consulta de sugerencias de alumnos ultrarrápida (mínimo 2 caracteres)
    useEffect(() => {
        const term = debouncedAlumnoSearch.trim();
        if (term.length >= 2 && !selectedAlumnoId) {
            const controller = new AbortController();
            let active = true;
            setLoadingSuggestions(true);
            sugerirAlumnosAsisport(term, {
                canchaIds: selectedCanchas,
                horarioIds: selectedHorarios,
                entrenadorIds: selectedEntrenadores
            }, { signal: controller.signal })
                .then(res => { if (active) setAlumnoSuggestions(res || []); })
                .catch(() => { if (active) setAlumnoSuggestions([]); })
                .finally(() => { if (active) setLoadingSuggestions(false); });
            return () => {
                active = false;
                controller.abort();
            };
        } else {
            setAlumnoSuggestions([]);
            setLoadingSuggestions(false);
        }
        return undefined;
    }, [debouncedAlumnoSearch, selectedAlumnoId, selectedCanchas, selectedHorarios, selectedEntrenadores]);

    const availableFields = [
        { id: 'nombreCompleto', label: 'Nombre Completo' },
        { id: 'telefono', label: 'Teléfono' },
        { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento' },
        { id: 'carnet_identidad', label: 'Carnet de Identidad' },
        { id: 'colegio', label: 'Colegio' },
        { id: 'direccion', label: 'Dirección' },
        { id: 'estado', label: 'Estado' },
        { id: 'es_arquero', label: 'Es Arquero' },
        { id: 'cancha', label: 'Grupo' },
        { id: 'horario', label: 'Horario' },
        { id: 'entrenador', label: 'Entrenador Asignado' },
        { id: 'nombre_padre', label: 'Nombre del Padre' },
        { id: 'telefono_padre', label: 'Teléfono Padre' },
        { id: 'nombre_madre', label: 'Nombre de la Madre' },
        { id: 'telefono_madre', label: 'Teléfono Madre' },
        { id: 'tipo', label: 'Tipo' },
        { id: 'mensualidad', label: 'Mensualidad' }
    ];

    const toggleField = (id) => {
        if (selectedFields.includes(id)) {
            if (selectedFields.length > 1) {
                setSelectedFields(selectedFields.filter(f => f !== id));
            }
        } else {
            setSelectedFields([...selectedFields, id]);
        }
    };

    const toggleDia = (dia) => {
        if (selectedDias.includes(dia)) {
            setSelectedDias(selectedDias.filter(d => d !== dia));
        } else {
            setSelectedDias([...selectedDias, dia]);
        }
    };

    const formatAlumnoFecha = (fecha) => {
        const dateObj = new Date(fecha + 'T12:00:00');
        const dia = dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
        const mes = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
        const formatPart = (value) => value.charAt(0).toUpperCase() + value.slice(1);

        return `${formatPart(dia)} ${dateObj.getDate()} ${formatPart(mes)}`;
    };

    const handleSelectAlumno = (alumno) => {
        setSelectedAlumnoId(alumno.id);
        setAlumnoSearchTerm(`${alumno.nombres} ${alumno.apellidos}`);
        setShowAlumnoResults(false);
    };

    const handleClearAlumno = () => {
        setAlumnoSearchTerm('');
        setSelectedAlumnoId(null);
        setAlumnoSuggestions([]);
        setShowAlumnoResults(false);
    };

    // Exportar a Excel mediante datos ya consolidados y seguros desde la RPC
    const handleExport = async () => {
        if (tableData.length === 0) return;

        setExportLoading(true);
        try {
            const detalle = await loadDetalleForExport();
            if (!detalle || detalle.length === 0) {
                setExportLoading(false);
                return;
            }

            const dates = [...new Set(detalle.map(r => r.fecha))].sort();

            const dateHeaders = dates.map(fecha => {
                const d = new Date(fecha + 'T12:00:00');
                return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            });

            const grouped = {};
            detalle.forEach(curr => {
                const alumnoId = curr.alumno_id;
                if (!grouped[alumnoId]) {
                    grouped[alumnoId] = {
                        id: alumnoId,
                        nombreCompleto: curr.alumno_nombre_completo || 'Desconocido',
                        presentes: 0,
                        licencias: 0,
                        asistenciasPorFecha: {}
                    };
                }
                if (curr.estado === 'Presente') {
                    grouped[alumnoId].presentes++;
                    grouped[alumnoId].asistenciasPorFecha[curr.fecha] = 'P';
                } else if (curr.estado === 'Licencia') {
                    grouped[alumnoId].licencias++;
                    grouped[alumnoId].asistenciasPorFecha[curr.fecha] = 'L';
                } else if (curr.estado === 'Ausente') {
                    grouped[alumnoId].asistenciasPorFecha[curr.fecha] = 'A';
                }
            });

            const students = Object.values(grouped).sort((a, b) =>
                a.nombreCompleto.localeCompare(b.nombreCompleto)
            );

            if (students.length === 0) {
                setExportLoading(false);
                return;
            }

            const nombresGestion = gestiones.find(g => g.id === selectedGestionId)?.anio ?? 'Todas';
            const nombresEntrenadores = selectedEntrenadores.length === 0
                ? 'Todos'
                : selectedEntrenadores
                    .map(id => entrenadores.find(e => e.value === id)?.label ?? id)
                    .join(', ');

            const nombresCanchas = selectedCanchas.length === 0
                ? 'Todas'
                : selectedCanchas
                    .map(id => canchas.find(c => c.value === id)?.label ?? id)
                    .join(', ');

            const filterInfo = [
                ['Reporte de Asistencias — AsiSport'],
                [`Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`],
                [],
                ['Filtros Aplicados'],
                ['Gestión:', nombresGestion],
                ['Período:', dateRangeText],
                ['Entrenadores:', nombresEntrenadores],
                ['Grupos:', nombresCanchas],
                [],
                ['Alumno', 'Presentes', 'Licencias', ...dateHeaders]
            ];

            const dataRows = students.map(item => [
                item.nombreCompleto,
                item.presentes,
                item.licencias,
                ...dates.map(fecha => item.asistenciasPorFecha[fecha] || '')
            ]);

            const allRows = [...filterInfo, ...dataRows];
            const ws = XLSX.utils.aoa_to_sheet(allRows);

            const baseCols = [
                { wch: 35 },
                { wch: 10 },
                { wch: 10 }
            ];
            const dateCols = dates.map(() => ({ wch: 6 }));
            ws['!cols'] = [...baseCols, ...dateCols];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Asistencias");

            const detalleRows = [
                ['Fecha', 'Alumno', 'Carnet', 'Grupo', 'Horario', 'Estado', 'Registrado por', 'Rol'],
                ...detalle.map(registro => [
                    registro.fecha,
                    registro.alumno_nombre_completo,
                    registro.carnet_identidad || '-',
                    registro.cancha_nombre || '-',
                    registro.horario_hora || '-',
                    registro.estado,
                    registro.entrenador_nombre || '-',
                    registro.entrenador_rol === 'Entrenarqueros' ? 'Entrenador de arqueros' : (registro.entrenador_rol || '-')
                ])
            ];
            const detalleWs = XLSX.utils.aoa_to_sheet(detalleRows);
            detalleWs['!cols'] = [{ wch: 14 }, { wch: 35 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 30 }, { wch: 26 }];
            XLSX.utils.book_append_sheet(wb, detalleWs, "Detalle");
            XLSX.writeFile(wb, `Reporte_Asistencias_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Error crítico durante la exportación:", error);
            alert("No se pudo generar el reporte: " + error.message);
        } finally {
            setExportLoading(false);
        }
    };

    // Exportar Reporte Personalizado de Alumnos bajo demanda
    const handleExportAlumnosPersonalizado = async () => {
        try {
            const filtrados = [];
            let pagina = 1;
            let totalResultados = 0;

            do {
                const dataResult = await listarAlumnosAsisport({
                    canchaIds: selectedCanchas,
                    horarioIds: selectedHorarios,
                    entrenadorIds: selectedEntrenadores,
                    activeFilter: 'activos',
                    page: pagina,
                    limit: 50
                });
                const pageItems = dataResult.items || [];
                filtrados.push(...pageItems);
                totalResultados = Number(dataResult.total_resultados || 0);
                if (pageItems.length === 0 && filtrados.length < totalResultados) {
                    throw new Error('La paginación de alumnos terminó antes de alcanzar el total informado.');
                }
                pagina += 1;
            } while (filtrados.length < totalResultados);

            if (filtrados.length === 0) {
                alert("No hay alumnos que coincidan con los filtros seleccionados.");
                return;
            }

            const headers = selectedFields.map(id => availableFields.find(f => f.id === id)?.label || id);

            const dataRows = filtrados.map(a => {
                return selectedFields.map(fieldId => {
                    switch (fieldId) {
                        case 'nombreCompleto': return `${a.nombres} ${a.apellidos}`;
                        case 'telefono':
                            return a.whatsapp_preferido === 'madre'
                                ? (a.telefono_madre || a.telefono_padre || a.telefono_deportista || '-')
                                : (a.telefono_padre || a.telefono_madre || a.telefono_deportista || '-');
                        case 'fecha_nacimiento': return a.fecha_nacimiento ? new Date(a.fecha_nacimiento).toLocaleDateString('es-ES') : '-';
                        case 'cancha': return a.cancha?.nombre || canchas.find(c => c.value === a.cancha_id)?.label || '-';
                        case 'horario': return a.horario?.hora || horarios.find(h => h.value === a.horario_id)?.label || '-';
                        case 'entrenador': return a.profesor_nombre || entrenadores.find(e => e.value === a.profesor_asignado_id)?.label || '-';
                        case 'es_arquero': return a.es_arquero ? 'Sí' : 'No';
                        default: return a[fieldId] || '-';
                    }
                });
            });

            const title = [['REPORTE DE ALUMNOS PERSONALIZADO - ASISPORT']];
            const info = [[`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`], []];

            const ws = XLSX.utils.aoa_to_sheet([...title, ...info, headers, ...dataRows]);
            ws['!cols'] = selectedFields.map(() => ({ wch: 20 }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
            XLSX.writeFile(wb, `Reporte_Alumnos_${new Date().toISOString().split('T')[0]}.xlsx`);
            setShowReportModal(false);
        } catch (err) {
            console.error('Error al exportar alumnos personalizado:', err);
            alert('Error al generar el reporte de alumnos: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <button onClick={() => navigate('/dashboard')} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Estadísticas</h1>
                </div>

                <div className="hidden md:flex items-center gap-6 flex-grow justify-start pl-8">
                    <DesktopNavbar className="text-[18px]" />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 rounded-md border ${showFilters ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary'} md:hidden`}
                    >
                        <Filter size={20} />
                    </button>

                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 px-3 py-1.5 rounded-md text-sm font-bold transition-all"
                        title="Configurar y Exportar Reporte de Alumnos"
                    >
                        <Users size={18} />
                        <span className="hidden md:inline">Reporte Alumnos</span>
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={loading || exportLoading || tableData.length === 0}
                        className="flex items-center gap-2 bg-success/10 text-success border border-success/20 hover:bg-success/20 px-3 py-1.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Exportar Reporte de Asistencias"
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">{exportLoading ? 'Generando...' : 'Reporte Asistencias'}</span>
                    </button>
                </div>
            </header>

            {/* Modal de Reporte Personalizado */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-background/50">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <FileSpreadsheet className="text-primary" size={20} />
                                Configurar Reporte de Alumnos
                            </h3>
                            <button onClick={() => setShowReportModal(false)} className="text-text-secondary hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-text-secondary">
                                Selecciona los campos que deseas incluir en el reporte Excel.
                            </p>

                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                                {availableFields.map(field => (
                                    <button
                                        key={field.id}
                                        onClick={() => toggleField(field.id)}
                                        className={`flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-all ${
                                            selectedFields.includes(field.id)
                                                ? 'bg-primary/20 border-primary text-white shadow-sm'
                                                : 'bg-background border-border text-text-secondary hover:border-text-secondary'
                                        }`}
                                    >
                                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                                            selectedFields.includes(field.id) ? 'bg-primary border-primary' : 'border-border'
                                        }`}>
                                            {selectedFields.includes(field.id) && <X size={10} className="text-white" />}
                                        </div>
                                        <span className="text-xs font-medium">{field.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-background/50 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="px-4 py-2 text-sm font-medium text-white hover:bg-surface rounded-md transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExportAlumnosPersonalizado}
                                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-md hover:bg-orange-600 transition-shadow shadow-lg shadow-primary/20"
                            >
                                Generar Reporte Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
                {/* Filtros Container */}
                <div className={`bg-surface border border-border rounded-lg p-4 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2 mr-4">
                            <Filter size={16} className="text-primary" />
                            <span className="text-xs font-bold text-white uppercase whitespace-nowrap">Días:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(dia => (
                                <button
                                    key={dia}
                                    onClick={() => toggleDia(dia)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                        selectedDias.includes(dia)
                                            ? 'bg-primary border-primary text-white'
                                            : 'bg-background border-border text-text-secondary hover:border-primary/50'
                                    }`}
                                >
                                    {dia}
                                </button>
                            ))}
                            {selectedDias.length > 0 && (
                                <button
                                    onClick={() => setSelectedDias([])}
                                    className="p-1.5 text-text-secondary hover:text-white transition-colors"
                                    title="Limpiar días"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-3 border-t border-border/50 pt-4">
                        {/* 1. Selector de Gestión Deportiva */}
                        <div className="relative">
                            <label className="text-xs text-text-secondary block mb-1">Gestión</label>
                            <select
                                value={selectedGestionId || ''}
                                onChange={(e) => setSelectedGestionId(e.target.value || null)}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-white text-sm focus:border-primary outline-none transition-colors hover:border-primary/50"
                            >
                                <option value="">Todas las gestiones</option>
                                {gestiones.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.anio} {g.estado === 'activa' ? '(Activa)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 2. Rango de Fechas */}
                        <div className="relative">
                            <label className="text-xs text-text-secondary block mb-1">Rango de Fechas</label>
                            <select
                                value={dateRangeOption}
                                onChange={(e) => setDateRangeOption(e.target.value)}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-white text-sm focus:border-primary outline-none transition-colors hover:border-primary/50"
                            >
                                <option value="hoy">Hoy</option>
                                <option value="ayer">Ayer</option>
                                <option value="esta_semana">Esta Semana</option>
                                <option value="semana_anterior">Semana Anterior</option>
                                <option value="este_mes">Mes en Curso</option>
                                <option value="mes_anterior">Mes Anterior</option>
                            </select>
                        </div>

                        {/* 3. Entrenador (Multi-select) */}
                        <MultiSelectFilter
                            label="Entrenador"
                            options={entrenadoresDisponibles}
                            allOptions={entrenadores}
                            selectedValues={selectedEntrenadores}
                            onChange={handleEntrenadoresChange}
                            placeholder="Todos"
                        />

                        {/* 4. Grupo (Multi-select, anteriormente Cancha) */}
                        <MultiSelectFilter
                            label="Grupo"
                            options={canchasDisponibles}
                            allOptions={canchas}
                            selectedValues={selectedCanchas}
                            onChange={handleCanchasChange}
                            placeholder="Todos"
                        />
                    </div>
                </div>

                {/* Buscador de Alumno Ultrarrápido con RPC puntual */}
                <div className="bg-surface border border-border rounded-lg overflow-visible">
                    <div className="p-4 border-b border-border">
                        <label className="text-xs text-text-secondary block mb-1">Buscar alumno</label>
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                            <input
                                type="text"
                                value={alumnoSearchTerm}
                                onChange={(e) => {
                                    setAlumnoSearchTerm(e.target.value);
                                    setSelectedAlumnoId(null);
                                    setShowAlumnoResults(true);
                                }}
                                onFocus={() => setShowAlumnoResults(true)}
                                placeholder="Escribe al menos 2 caracteres..."
                                className="w-full bg-background border border-border rounded-md pl-10 pr-10 py-2 text-white text-sm focus:border-primary outline-none transition-colors hover:border-primary/50"
                            />
                            {(alumnoSearchTerm || selectedAlumnoId) && (
                                <button
                                    type="button"
                                    onClick={handleClearAlumno}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                                    title="Limpiar alumno"
                                >
                                    <X size={16} />
                                </button>
                            )}

                            {showAlumnoResults && alumnoSearchTerm && !selectedAlumnoId && (
                                <div className="absolute z-40 mt-1 w-full bg-surface border border-border rounded-md shadow-lg max-h-64 overflow-auto">
                                    {alumnoSearchTerm.trim().length === 1 && (
                                        <div className="px-3 py-3 text-sm text-text-secondary">
                                            Escribe al menos 2 caracteres
                                        </div>
                                    )}
                                    {loadingSuggestions && (
                                        <div className="px-3 py-3 text-sm text-text-secondary">
                                            Buscando alumnos...
                                        </div>
                                    )}
                                    {!loadingSuggestions && alumnoSuggestions.map(alumno => (
                                        <button
                                            key={alumno.id}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSelectAlumno(alumno)}
                                            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-primary/10 transition-colors flex items-center justify-between"
                                        >
                                            <span>{alumno.nombres} {alumno.apellidos}</span>
                                            {alumno.cancha_nombre && (
                                                <span className="text-xs text-text-secondary">{alumno.cancha_nombre}</span>
                                            )}
                                        </button>
                                    ))}
                                    {!loadingSuggestions && alumnoSearchTerm.trim().length >= 2 && alumnoSuggestions.length === 0 && (
                                        <div className="px-3 py-3 text-sm text-text-secondary">
                                            No hay alumnos con esos filtros
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {alumnoSeleccionado && (
                        <div className="bg-background border-t border-border text-white">
                            <div className="bg-primary px-4 py-3 text-center">
                                <h3 className="text-xl md:text-2xl font-black leading-tight">
                                    {alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}
                                </h3>
                                <p className="text-xs font-bold text-black/70 mt-1">{dateRangeText}</p>
                            </div>

                            <div className="grid grid-cols-2 border-b border-border bg-surface">
                                <div className="p-4 border-r border-border">
                                    <div className="text-[11px] font-black uppercase text-success">Presentes</div>
                                    <div className="mt-1 text-4xl font-black leading-none">{alumnoSeleccionado.presentes}</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-[11px] font-black uppercase text-warning">Licencias</div>
                                    <div className="mt-1 text-4xl font-black leading-none">{alumnoSeleccionado.licencias}</div>
                                </div>
                            </div>

                            {(!alumnoSeleccionado.registros || alumnoSeleccionado.registros.length === 0) ? (
                                <div className="p-6 text-center text-text-secondary">
                                    No hay asistencias o licencias para este alumno con los filtros seleccionados.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-px bg-border p-px">
                                    {alumnoSeleccionado.registros.map((registro, index) => (
                                        <div
                                            key={`${registro.fecha}-${registro.estado}-${index}`}
                                            className={`min-h-[58px] px-3 py-2 flex items-center justify-between gap-2 ${
                                                registro.estado === 'Licencia'
                                                    ? 'bg-warning/10 border-l-4 border-warning'
                                                    : 'bg-surface border-l-4 border-success'
                                            }`}
                                        >
                                            <span className="text-base md:text-lg font-black leading-tight">{formatAlumnoFecha(registro.fecha)}</span>
                                            <span className={`text-[10px] font-black uppercase rounded-sm px-2 py-1 ${
                                                registro.estado === 'Licencia'
                                                    ? 'bg-warning/20 text-warning'
                                                    : 'bg-success/15 text-success'
                                            }`}>
                                                {registro.estado === 'Licencia' ? 'Lic.' : 'Pres.'}
                                            </span>
                                            <div className="text-right text-[10px] font-bold text-text-secondary">
                                                {registro.entrenador_nombre && (
                                                    <div>{registro.entrenador_nombre}</div>
                                                )}
                                                {registro.entrenador_rol === 'Entrenarqueros' && (
                                                    <span className="text-arquero">Entrenador de arqueros</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* KPIs Principales */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-surface border border-border rounded-lg p-4 flex flex-col justify-between">
                                <div>
                                    <div className="text-xs text-text-secondary uppercase font-bold">Total Alumnos</div>
                                    <div className="text-3xl font-black text-white mt-1">{metrics.total_alumnos ?? metrics.total}</div>
                                </div>
                                <div className="text-[11px] text-text-secondary mt-1">
                                    {metrics.total} {metrics.total === 1 ? 'registro evaluado' : 'registros evaluados'}
                                </div>
                            </div>
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <div className="text-xs text-success uppercase font-bold">Presentes</div>
                                <div className="text-3xl font-black text-success mt-1">{metrics.presentes}</div>
                            </div>
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <div className="text-xs text-warning uppercase font-bold">Licencias</div>
                                <div className="text-3xl font-black text-warning mt-1">{metrics.licencias}</div>
                            </div>
                            <div className="bg-surface border border-border rounded-lg p-4">
                                <div className="text-xs text-primary uppercase font-bold">% Asistencia</div>
                                <div className="text-3xl font-black text-primary mt-1">{metrics.porcentaje_asistencia}%</div>
                            </div>
                        </div>

                        {/* Tabla de Resumen Diario */}
                        <div className="bg-surface border border-border rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <h3 className="text-white font-bold">Resumen por Día</h3>
                                <p className="text-xs text-text-secondary mt-1">{dateRangeText}</p>
                            </div>

                            {tableData.length === 0 ? (
                                <div className="p-8 text-center text-text-secondary">
                                    No hay datos para el rango seleccionado
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-background/50">
                                                <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase">Día</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-success uppercase">Presentes</th>
                                                <th className="px-4 py-3 text-center text-xs font-bold text-warning uppercase">Licencias</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.map((row, index) => (
                                                <tr key={row.fecha} className={`border-t border-border/50 ${index % 2 === 0 ? '' : 'bg-background/20'}`}>
                                                    <td className="px-4 py-3 text-white text-sm font-medium">{row.fechaDisplay}</td>
                                                    <td className="px-4 py-3 text-text-secondary text-sm capitalize">{row.diaDisplay}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-block bg-success/10 text-success px-2 py-1 rounded text-sm font-bold">
                                                            {row.presentes}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="inline-block bg-warning/10 text-warning px-2 py-1 rounded text-sm font-bold">
                                                            {row.licencias}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <TabBar />
        </div>
    );
};

export default Estadisticas;
