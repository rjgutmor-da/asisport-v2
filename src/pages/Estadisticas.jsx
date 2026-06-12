
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Users, FileSpreadsheet, X, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEstadisticas } from '../features/estadisticas/hooks/useEstadisticas';

import MultiSelectFilter from '../components/ui/MultiSelectFilter';
import TabBar from '../components/dashboard/TabBar';
import DesktopNavbar from '../components/layout/DesktopNavbar';
import { supabase } from '../lib/supabaseClient';
import { obtenerEscuelaId } from '../lib/rpcHelper';

const Estadisticas = () => {
    const navigate = useNavigate();
    const {
        loading,
        loadingDetalle,
        metrics,
        tableData,
        asistenciasDetalle,
        exportData,
        dateRangeText,
        canchas,
        horarios,
        entrenadores,
        availableCategorias,
        dateRangeOption, setDateRangeOption,
        selectedEntrenadores, setSelectedEntrenadores,
        selectedCanchas, setSelectedCanchas,
        selectedHorarios, setSelectedHorarios,
        selectedCategorias, setSelectedCategorias,
        selectedDias, setSelectedDias,
        alumnos,
        loadDetalleForExport
    } = useEstadisticas();

    const [exportLoading, setExportLoading] = React.useState(false);

    const [showFilters, setShowFilters] = React.useState(false);
    const [showReportModal, setShowReportModal] = React.useState(false);
    const [selectedFields, setSelectedFields] = React.useState(['nombreCompleto', 'telefono', 'fecha_nacimiento']);
    const [alumnoSearchTerm, setAlumnoSearchTerm] = React.useState('');
    const [selectedAlumnoId, setSelectedAlumnoId] = React.useState(null);
    const [showAlumnoResults, setShowAlumnoResults] = React.useState(false);

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

    const normalizeText = (value = '') => value
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

    const formatAlumnoFecha = (fecha) => {
        const dateObj = new Date(fecha + 'T12:00:00');
        const dia = dateObj.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
        const mes = dateObj.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
        const formatPart = (value) => value.charAt(0).toUpperCase() + value.slice(1);

        return `${formatPart(dia)} ${dateObj.getDate()} ${formatPart(mes)}`;
    };

    const alumnoMatchesFilters = React.useCallback((alumno) => {
        if (!alumno) return false;
        if (selectedEntrenadores.length > 0 && !selectedEntrenadores.includes(alumno.profesor_asignado_id)) return false;
        if (selectedCanchas.length > 0 && !selectedCanchas.includes(alumno.cancha_id)) return false;
        if (selectedHorarios.length > 0 && !selectedHorarios.includes(alumno.horario_id)) return false;
        if (selectedCategorias.length > 0 && !selectedCategorias.includes(`Sub-${alumno.sub}`)) return false;
        return true;
    }, [selectedEntrenadores, selectedCanchas, selectedHorarios, selectedCategorias]);

    const alumnosParaBuscador = React.useMemo(() => {
        const term = normalizeText(alumnoSearchTerm);
        return (alumnos || [])
            .filter(alumnoMatchesFilters)
            .filter(alumno => {
                if (!term) return true;
                const fullName = `${alumno.nombres || ''} ${alumno.apellidos || ''}`;
                return normalizeText(fullName).includes(term);
            })
            .sort((a, b) => `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`));
    }, [alumnos, alumnoMatchesFilters, alumnoSearchTerm]);

    const selectedAlumno = React.useMemo(
        () => (alumnos || []).find(alumno => alumno.id === selectedAlumnoId) || null,
        [alumnos, selectedAlumnoId]
    );

    React.useEffect(() => {
        if (selectedAlumno && !alumnoMatchesFilters(selectedAlumno)) {
            setSelectedAlumnoId(null);
            setAlumnoSearchTerm('');
        }
    }, [selectedAlumno, alumnoMatchesFilters]);

    React.useEffect(() => {
        if (selectedAlumnoId && !asistenciasDetalle && !loadingDetalle) {
            loadDetalleForExport();
        }
    }, [selectedAlumnoId, asistenciasDetalle, loadingDetalle, loadDetalleForExport]);

    const selectedAlumnoResumen = React.useMemo(() => {
        if (!selectedAlumno || !asistenciasDetalle) {
            return { presentes: 0, licencias: 0, registros: [] };
        }

        const registros = asistenciasDetalle
            .filter(asistencia => asistencia.alumno_id === selectedAlumno.id)
            .filter(asistencia => {
                if (selectedEntrenadores.length > 0) {
                    const matchRegistro = asistencia.entrenador_id && selectedEntrenadores.includes(asistencia.entrenador_id);
                    const matchAlumno = selectedAlumno.profesor_asignado_id && selectedEntrenadores.includes(selectedAlumno.profesor_asignado_id);
                    if (!matchRegistro && !matchAlumno) return false;
                }

                if (selectedCanchas.length > 0 && !selectedCanchas.includes(selectedAlumno.cancha_id)) return false;
                if (selectedHorarios.length > 0 && !selectedHorarios.includes(selectedAlumno.horario_id)) return false;
                if (selectedCategorias.length > 0 && !selectedCategorias.includes(`Sub-${selectedAlumno.sub}`)) return false;

                if (selectedDias.length > 0) {
                    const dateObj = new Date(asistencia.fecha + 'T12:00:00');
                    const diaNombre = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                    if (!selectedDias.map(d => d.toLowerCase()).includes(diaNombre.toLowerCase())) return false;
                }

                return asistencia.estado === 'Presente' || asistencia.estado === 'Licencia';
            })
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .map(asistencia => {
                return {
                    ...asistencia,
                    fechaDisplay: formatAlumnoFecha(asistencia.fecha)
                };
            });

        return {
            presentes: registros.filter(item => item.estado === 'Presente').length,
            licencias: registros.filter(item => item.estado === 'Licencia').length,
            registros
        };
    }, [
        selectedAlumno,
        asistenciasDetalle,
        selectedEntrenadores,
        selectedCanchas,
        selectedHorarios,
        selectedCategorias,
        selectedDias
    ]);

    const handleSelectAlumno = (alumno) => {
        setSelectedAlumnoId(alumno.id);
        setAlumnoSearchTerm(`${alumno.nombres} ${alumno.apellidos}`);
        setShowAlumnoResults(false);
    };

    // Exportar a Excel con formato detallado por fechas
    const handleExport = async () => {
        if (tableData.length === 0) return;

        setExportLoading(true);
        try {
            // Cargar datos individuales bajo demanda
            const detalle = await loadDetalleForExport();
            if (!detalle || detalle.length === 0) {
                setExportLoading(false);
                return;
            }

            // Reconstruir exportData con detalle
            // Recuperamos TODOS los alumnos de la escuela (incluyendo archivados) para tener sus nombres
            const escuelaId = await obtenerEscuelaId();
            const { data: allAlumnos, error: alumnosError } = await supabase
                .from('v_alumnos')
                .select('id, nombres, apellidos, profesor_asignado_id, cancha_id, horario_id, sub, archivado, estado')
                .eq('escuela_id', escuelaId);

            if (alumnosError) console.error("Error cargando alumnos para exportación:", alumnosError);

            // Combinamos los alumnos de la caché con los descargados para máxima seguridad
            const combinedAlumnos = [...(alumnos || []), ...(allAlumnos || [])];
            const alumnosMap = new Map(combinedAlumnos.map(a => [a.id, a]));
            
            console.log(`Exportando ${detalle.length} registros para ${alumnosMap.size} alumnos...`);

            // Obtener la lista única de alumnos y filtrar los alumnos activos que coinciden con los filtros aplicados
            const uniqueAlumnos = Array.from(alumnosMap.values());
            const matchingAlumnos = uniqueAlumnos.filter(alumno => {
                if (alumno.archivado) return false;
                if (alumno.estado === 'ELIMINADO SISTEMA') return false;

                // Filtro por Entrenador
                if (selectedEntrenadores.length > 0 && !selectedEntrenadores.includes(alumno.profesor_asignado_id)) {
                    return false;
                }
                // Filtro por Cancha/Grupo
                if (selectedCanchas.length > 0 && !selectedCanchas.includes(alumno.cancha_id)) {
                    return false;
                }
                // Filtro por Horario
                if (selectedHorarios.length > 0 && !selectedHorarios.includes(alumno.horario_id)) {
                    return false;
                }
                // Filtro por Categoría
                if (selectedCategorias.length > 0) {
                    const subLabel = `Sub-${alumno.sub}`;
                    if (!selectedCategorias.includes(subLabel)) {
                        return false;
                    }
                }
                return true;
            });

            // Filtrar las asistencias de acuerdo a los filtros aplicados
            const filteredDetalle = detalle.filter(a => {
                const alumno = alumnosMap.get(a.alumno_id);
                if (!alumno) return false;

                // Filtro por Entrenador (Doble check: registro histórico o asignación actual)
                if (selectedEntrenadores.length > 0) {
                    const matchRegistro = a.entrenador_id && selectedEntrenadores.includes(a.entrenador_id);
                    const matchAlumno = alumno.profesor_asignado_id && selectedEntrenadores.includes(alumno.profesor_asignado_id);
                    if (!matchRegistro && !matchAlumno) return false;
                }

                if (selectedCanchas.length > 0 && !selectedCanchas.includes(alumno.cancha_id)) return false;
                if (selectedHorarios.length > 0 && !selectedHorarios.includes(alumno.horario_id)) return false;
                
                if (selectedCategorias.length > 0) {
                    const subLabel = `Sub-${alumno.sub}`;
                    if (!selectedCategorias.includes(subLabel)) return false;
                }

                if (selectedDias.length > 0) {
                    const dateObj = new Date(a.fecha + 'T12:00:00');
                    const diaNombre = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                    if (!selectedDias.map(d => d.toLowerCase()).includes(diaNombre.toLowerCase())) return false;
                }

                return true;
            });

            // Inicializar grouped con todos los alumnos que coinciden para asegurar que aparezcan
            const grouped = {};
            matchingAlumnos.forEach(alumno => {
                grouped[alumno.id] = {
                    nombreCompleto: `${alumno.nombres} ${alumno.apellidos}`,
                    apellidos: alumno.apellidos || '',
                    nombres: alumno.nombres || '',
                    presentes: 0,
                    licencias: 0,
                    asistenciasPorFecha: {}
                };
            });

            // Rellenar con los registros de asistencia existentes
            filteredDetalle.forEach(curr => {
                const alumnoId = curr.alumno_id;
                if (!grouped[alumnoId]) {
                    const alumno = alumnosMap.get(alumnoId);
                    const nombreFormateado = alumno 
                        ? `${alumno.nombres} ${alumno.apellidos}` 
                        : 'Desconocido';
                    
                    grouped[alumnoId] = {
                        nombreCompleto: nombreFormateado,
                        apellidos: alumno?.apellidos || '',
                        nombres: alumno?.nombres || '',
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
            
            const students = Object.values(grouped).sort((a, b) => {
                // Ordenar por nombre completo (A-Z) tal como solicitó el usuario
                return a.nombreCompleto.localeCompare(b.nombreCompleto);
            });
            
            if (students.length === 0) { setExportLoading(false); return; }

            const dates = [...new Set(filteredDetalle.map(r => r.fecha))].sort();

            // Formatear cabeceras de fechas (DD/MM)
            const dateHeaders = dates.map(fecha => {
                const d = new Date(fecha + 'T12:00:00');
                return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
            });

            // Resolver nombres de los filtros aplicados
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

            const nombresHorarios = selectedHorarios.length === 0
                ? 'Todos'
                : selectedHorarios
                    .map(id => horarios.find(h => h.value === id)?.label ?? id)
                    .join(', ');

            const nombresCategorias = selectedCategorias.length === 0
                ? 'Todas'
                : selectedCategorias.join(', ');

            // Crear encabezado del reporte con filtros detallados
            const filterInfo = [
                ['Reporte de Asistencias — AsiSport'],
                [`Generado: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`],
                [],
                ['Filtros Aplicados'],
                ['Período:', dateRangeText],
                ['Entrenadores:', nombresEntrenadores],
                ['Grupos:', nombresCanchas],
                ['Horarios:', nombresHorarios],
                ['Categorías:', nombresCategorias],
                [], // Fila vacía separador
                ['Alumno', 'Presentes', 'Licencias', ...dateHeaders]
            ];

            // Agregar datos de alumnos con su detalle diario
            const dataRows = students.map(item => [
                item.nombreCompleto,
                item.presentes,
                item.licencias,
                ...dates.map(fecha => item.asistenciasPorFecha[fecha] || '')
            ]);

            const allRows = [...filterInfo, ...dataRows];

            const ws = XLSX.utils.aoa_to_sheet(allRows);

            // Ajustar anchos de columna dinámicamente
            const baseCols = [
                { wch: 35 }, // Alumno
                { wch: 10 }, // Presentes
                { wch: 10 }  // Licencias
            ];

            // Agregar anchos para cada columna de fecha
            const dateCols = dates.map(() => ({ wch: 6 }));
            ws['!cols'] = [...baseCols, ...dateCols];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
            XLSX.writeFile(wb, `Reporte_Asistencias_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Error crítico durante la exportación:", error);
            alert("No se pudo generar el reporte: " + error.message);
        } finally {
            setExportLoading(false);
        }
    };


    // Exportar Reporte Personalizado de Alumnos
    const handleExportAlumnosPersonalizado = () => {
        if (!alumnos || alumnos.length === 0) return;

        let filtrados = alumnos;
        if (selectedEntrenadores.length > 0) filtrados = filtrados.filter(a => selectedEntrenadores.includes(a.profesor_asignado_id));
        if (selectedCategorias.length > 0) {
            filtrados = filtrados.filter(a => selectedCategorias.includes(`Sub-${a.sub}`));
        }
        if (selectedHorarios.length > 0) filtrados = filtrados.filter(a => selectedHorarios.includes(a.horario_id));
        if (selectedCanchas.length > 0) filtrados = filtrados.filter(a => selectedCanchas.includes(a.cancha_id));

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
                    case 'cancha': return canchas.find(c => c.value === a.cancha_id)?.label || '-';
                    case 'horario': return horarios.find(h => h.value === a.horario_id)?.label || '-';
                    case 'entrenador': return entrenadores.find(e => e.value === a.profesor_asignado_id)?.label || '-';
                    case 'es_arquero': return a.es_arquero ? 'Sí' : 'No';
                    default: return a[fieldId] || '-';
                }
            });
        });

        const title = [['REPORTE DE ALUMNOS PERSONALIZADO - ASISPORT']];
        const info = [[`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`], []];

        const ws = XLSX.utils.aoa_to_sheet([...title, ...info, headers, ...dataRows]);
        
        // Ajustar anchos
        ws['!cols'] = selectedFields.map(() => ({ wch: 20 }));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
        XLSX.writeFile(wb, `Reporte_Alumnos_${new Date().toISOString().split('T')[0]}.xlsx`);
        setShowReportModal(false);
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

                {/* Menú de navegación superior para escritorio */}
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
                    
                    {/* Botón Reporte Alumnos Personalizado */}
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
                                Selecciona los campos que deseas incluir en el reporte Excel. Los marcados en naranja son obligatorios o recomendados.
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
                                            ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20'
                                            : 'bg-background border-border text-text-secondary hover:border-text-secondary'
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

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 border-t border-border/50 pt-4">
                        {/* 1. Rango de Fechas */}
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
                                <option value="este_mes">Este Mes</option>
                                <option value="mes_anterior">Mes Anterior</option>
                                <option value="todo">Histórico Completo</option>
                            </select>
                        </div>

                        {/* 2. Entrenador (Multi-select) */}
                        <MultiSelectFilter
                            label="Entrenador"
                            options={entrenadores}
                            selectedValues={selectedEntrenadores}
                            onChange={setSelectedEntrenadores}
                            placeholder="Todos"
                        />

                        {/* 3. Grupo (Multi-select, anteriormente Cancha) */}
                        <MultiSelectFilter
                            label="Grupo"
                            options={canchas}
                            selectedValues={selectedCanchas}
                            onChange={setSelectedCanchas}
                            placeholder="Todos"
                        />

                        {/* 4. Categoría (Multi-select) */}
                        <MultiSelectFilter
                            label="Categoría (Sub)"
                            options={availableCategorias}
                            selectedValues={selectedCategorias}
                            onChange={setSelectedCategorias}
                            placeholder="Todas"
                        />

                        {/* 5. Horario (Multi-select) */}
                        <MultiSelectFilter
                            label="Horario"
                            options={horarios}
                            selectedValues={selectedHorarios}
                            onChange={setSelectedHorarios}
                            placeholder="Todos"
                        />
                    </div>
                </div>

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
                                placeholder="Nombre o apellido del alumno"
                                className="w-full bg-background border border-border rounded-md pl-10 pr-10 py-2 text-white text-sm focus:border-primary outline-none transition-colors hover:border-primary/50"
                            />
                            {(alumnoSearchTerm || selectedAlumnoId) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAlumnoSearchTerm('');
                                        setSelectedAlumnoId(null);
                                        setShowAlumnoResults(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white transition-colors"
                                    title="Limpiar alumno"
                                >
                                    <X size={16} />
                                </button>
                            )}

                            {showAlumnoResults && alumnoSearchTerm && !selectedAlumnoId && (
                                <div className="absolute z-40 mt-1 w-full bg-surface border border-border rounded-md shadow-lg max-h-64 overflow-auto">
                                    {alumnosParaBuscador.slice(0, 10).map(alumno => (
                                        <button
                                            key={alumno.id}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleSelectAlumno(alumno)}
                                            className="w-full px-3 py-2 text-left text-sm text-white hover:bg-primary/10 transition-colors"
                                        >
                                            {alumno.nombres} {alumno.apellidos}
                                        </button>
                                    ))}
                                    {alumnosParaBuscador.length === 0 && (
                                        <div className="px-3 py-3 text-sm text-text-secondary">
                                            No hay alumnos con esos filtros
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedAlumno && (
                        <div className="bg-background border-t border-border text-white">
                            <div className="bg-primary px-4 py-3 text-center">
                                <h3 className="text-xl md:text-2xl font-black leading-tight">
                                    {selectedAlumno.nombres} {selectedAlumno.apellidos}
                                </h3>
                                <p className="text-xs font-bold text-black/70 mt-1">{dateRangeText}</p>
                            </div>

                            <div className="grid grid-cols-2 border-b border-border bg-surface">
                                <div className="p-4 border-r border-border">
                                    <div className="text-[11px] font-black uppercase text-success">Presentes</div>
                                    <div className="mt-1 text-4xl font-black leading-none">{selectedAlumnoResumen.presentes}</div>
                                </div>
                                <div className="p-4">
                                    <div className="text-[11px] font-black uppercase text-warning">Licencias</div>
                                    <div className="mt-1 text-4xl font-black leading-none">{selectedAlumnoResumen.licencias}</div>
                                </div>
                            </div>

                            {loadingDetalle && !asistenciasDetalle ? (
                                <div className="p-6 text-center text-text-secondary">Cargando asistencias...</div>
                            ) : selectedAlumnoResumen.registros.length === 0 ? (
                                <div className="p-6 text-center text-text-secondary">
                                    No hay asistencias o licencias para este alumno con los filtros seleccionados.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-px bg-border p-px">
                                    {selectedAlumnoResumen.registros.map((registro, index) => (
                                        <div
                                            key={`${registro.fecha}-${registro.estado}-${index}`}
                                            className={`min-h-[58px] px-3 py-2 flex items-center justify-between gap-2 ${
                                                registro.estado === 'Licencia'
                                                    ? 'bg-warning/10 border-l-4 border-warning'
                                                    : 'bg-surface border-l-4 border-success'
                                            }`}
                                        >
                                            <span className="text-base md:text-lg font-black leading-tight">{registro.fechaDisplay}</span>
                                            <span className={`text-[10px] font-black uppercase rounded-sm px-2 py-1 ${
                                                registro.estado === 'Licencia'
                                                    ? 'bg-warning/20 text-warning'
                                                    : 'bg-success/15 text-success'
                                            }`}>
                                                {registro.estado === 'Licencia' ? 'Lic.' : 'Pres.'}
                                            </span>
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
                        {/* Resumen Diario */}

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

            {/* Tab Bar (Solo Mobile) */}
            <TabBar />
        </div>
    );
};

export default Estadisticas;
