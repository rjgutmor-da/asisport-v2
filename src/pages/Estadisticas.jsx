
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Users, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useEstadisticas } from '../features/estadisticas/hooks/useEstadisticas';
import StatCard from '../features/estadisticas/components/StatCard';
import MultiSelectFilter from '../components/ui/MultiSelectFilter';
import TabBar from '../components/dashboard/TabBar';

const Estadisticas = () => {
    const navigate = useNavigate();
    const {
        loading,
        metrics,
        tableData,
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
        alumnos
    } = useEstadisticas();

    const [showFilters, setShowFilters] = React.useState(false);
    const [showReportModal, setShowReportModal] = React.useState(false);
    const [selectedFields, setSelectedFields] = React.useState(['nombreCompleto', 'telefono', 'fecha_nacimiento']);

    const availableFields = [
        { id: 'nombreCompleto', label: 'Nombre Completo' },
        { id: 'telefono', label: 'Teléfono' },
        { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento' },
        { id: 'carnet_identidad', label: 'Carnet de Identidad' },
        { id: 'colegio', label: 'Colegio' },
        { id: 'direccion', label: 'Dirección' },
        { id: 'estado', label: 'Estado' },
        { id: 'es_arquero', label: 'Es Arquero' },
        { id: 'cancha', label: 'Cancha' },
        { id: 'horario', label: 'Horario' },
        { id: 'entrenador', label: 'Entrenador Asignado' },
        { id: 'nombre_padre', label: 'Nombre del Padre' },
        { id: 'telefono_padre', label: 'Teléfono Padre' },
        { id: 'nombre_madre', label: 'Nombre de la Madre' },
        { id: 'telefono_madre', label: 'Teléfono Madre' }
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

    // Exportar a Excel con formato detallado por fechas
    const handleExport = () => {
        if (!exportData || !exportData.students || exportData.students.length === 0) return;

        const { students, dates } = exportData;

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
            ['Canchas:', nombresCanchas],
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
    };


    // Exportar Reporte Personalizado de Alumnos
    const handleExportAlumnosPersonalizado = () => {
        if (!alumnos || alumnos.length === 0) return;

        let filtrados = alumnos;
        const currentYear = new Date().getFullYear();

        if (selectedEntrenadores.length > 0) filtrados = filtrados.filter(a => selectedEntrenadores.includes(a.profesor_asignado_id));
        if (selectedCategorias.length > 0) {
            filtrados = filtrados.filter(a => {
                const sub = currentYear - new Date(a.fecha_nacimiento).getFullYear();
                return selectedCategorias.includes(`Sub-${sub}`);
            });
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
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Estadísticas</h1>
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
                        disabled={loading || !exportData.students || exportData.students.length === 0}
                        className="flex items-center gap-2 bg-success/10 text-success border border-success/20 hover:bg-success/20 px-3 py-1.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Exportar Reporte de Asistencias"
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">Reporte Asistencias</span>
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
                    <div className="flex items-center gap-2 mb-2">
                        <Filter size={16} className="text-primary" />
                        <h3 className="text-sm font-bold text-white uppercase">Filtros Avanzados</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {/* 1. Rango de Fechas */}
                        <div className="space-y-1">
                            <label className="text-xs text-text-secondary">Rango de Fechas</label>
                            <select
                                value={dateRangeOption}
                                onChange={(e) => setDateRangeOption(e.target.value)}
                                className="w-full bg-background border border-border rounded-md px-3 py-2 text-white text-sm focus:border-primary outline-none"
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

                        {/* 3. Categoría (Multi-select) */}
                        <MultiSelectFilter
                            label="Categoría (Sub)"
                            options={availableCategorias}
                            selectedValues={selectedCategorias}
                            onChange={setSelectedCategorias}
                            placeholder="Todas"
                        />

                        {/* 4. Horario (Multi-select) */}
                        <MultiSelectFilter
                            label="Horario"
                            options={horarios}
                            selectedValues={selectedHorarios}
                            onChange={setSelectedHorarios}
                            placeholder="Todos"
                        />

                        {/* 5. Cancha (Multi-select) */}
                        <MultiSelectFilter
                            label="Cancha"
                            options={canchas}
                            selectedValues={selectedCanchas}
                            onChange={setSelectedCanchas}
                            placeholder="Todas"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* Tarjetas de Métricas (Solo Presentes y Licencias) */}
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard
                                label="Presentes"
                                value={metrics.presentes}
                                icon={Users}
                                color="success"
                            />
                            <StatCard
                                label="Licencias"
                                value={metrics.licencias}
                                icon={Users}
                                color="warning"
                            />
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

            {/* Tab Bar (Solo Mobile) */}
            <TabBar />
        </div>
    );
};

export default Estadisticas;
