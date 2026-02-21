
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Users, FileSpreadsheet } from 'lucide-react';
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
        selectedCategorias, setSelectedCategorias
    } = useEstadisticas();

    const [showFilters, setShowFilters] = React.useState(false);

    // Exportar a Excel con formato detallado por fechas
    const handleExport = () => {
        if (!exportData || !exportData.students || exportData.students.length === 0) return;

        const { students, dates } = exportData;

        // Formatear cabeceras de fechas (DD/MM)
        const dateHeaders = dates.map(fecha => {
            const d = new Date(fecha + 'T12:00:00');
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        });

        // Crear datos con encabezados de filtros
        const filterInfo = [
            ['Reporte de Asistencias - AsiSport'],
            [`Período: ${dateRangeText} | Canchas: ${selectedCanchas.length === 0 ? 'Todas' : selectedCanchas.length} | Horarios: ${selectedHorarios.length === 0 ? 'Todos' : selectedHorarios.length} | Entrenadores: ${selectedEntrenadores.length === 0 ? 'Todos' : selectedEntrenadores.length} | Categorías: ${selectedCategorias.length === 0 ? 'Todas' : selectedCategorias.join(', ')}`],
            [], // Fila vacía
            ['Alumno', 'Presentes', 'Licencias', ...dateHeaders] // Encabezados con fechas
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
                    <button
                        onClick={handleExport}
                        disabled={loading || !exportData.students || exportData.students.length === 0}
                        className="flex items-center gap-2 bg-success/10 text-success border border-success/20 hover:bg-success/20 px-3 py-1.5 rounded-md text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileSpreadsheet size={18} />
                        <span className="hidden md:inline">Exportar Excel</span>
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

                {/* Filtros Container */}
                <div className={`bg-surface border border-border rounded-lg p-4 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Filter size={16} className="text-primary" />
                        <h3 className="text-sm font-bold text-white uppercase">Filtros Avanzados</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {/* Rango de Fechas */}
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
                                <option value="mes_anterior">Mes Anterior</option>
                                <option value="todo">Histórico Completo</option>
                            </select>
                        </div>

                        {/* Entrenador (Multi-select) */}
                        <MultiSelectFilter
                            label="Entrenador"
                            options={entrenadores}
                            selectedValues={selectedEntrenadores}
                            onChange={setSelectedEntrenadores}
                            placeholder="Todos"
                        />

                        {/* Cancha (Multi-select) */}
                        <MultiSelectFilter
                            label="Cancha"
                            options={canchas}
                            selectedValues={selectedCanchas}
                            onChange={setSelectedCanchas}
                            placeholder="Todas"
                        />

                        {/* Horario (Multi-select) */}
                        <MultiSelectFilter
                            label="Horario"
                            options={horarios}
                            selectedValues={selectedHorarios}
                            onChange={setSelectedHorarios}
                            placeholder="Todos"
                        />

                        {/* Categoría (Multi-select) */}
                        <MultiSelectFilter
                            label="Categoría (Sub)"
                            options={availableCategorias}
                            selectedValues={selectedCategorias}
                            onChange={setSelectedCategorias}
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
