import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, FilterX, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import MultiSelectFilter from '../components/ui/MultiSelectFilter';
import TabBar from '../components/dashboard/TabBar';
import DesktopNavbar from '../components/layout/DesktopNavbar';
import PanelDatosConvocatoria from '../features/convocatoria/components/PanelDatosConvocatoria';
import { useConvocatoria } from '../features/convocatoria/hooks/useConvocatoria';
import { useAuth } from '../context/AuthContext';
import { getEscuelaActual } from '../services/escuelas';
import {
    exportarListaBuenaFe,
    obtenerEntrenadoresListaBuenaFe
} from '../features/alumnos/utils/exportarListaBuenaFe';

/**
 * Página dedicada a la gestión de Convocatorias.
 * Permite:
 *  - Filtrar jugadores por Entrenador, Grupo, Categoría (Sub), Horario y búsqueda.
 *  - Seleccionar cualquier jugador haciendo clic en su fila o casilla (mostrando alerta si tiene < 2 asistencias en 7 días).
 *  - Completar Torneo, Fecha, Hora y Dirección antes de enviar la convocatoria por WhatsApp.
 *  - Exportar la Lista de Buena Fe en formato Excel.
 */
const Convocatoria = () => {
    const navigate = useNavigate();
    const { isAdmin, userProfile } = useAuth();
    const esAdmin = isAdmin;

    const {
        loading,
        isFetching,
        alumnos,
        todosLosAlumnosFiltrados,
        listaAlumnosSeleccionados,
        totalPages,
        currentPage,
        activeFilter,
        searchTerm,
        selectedAlumnos,
        cantidadConBajaAsistencia,
        datosPartido,
        hayFiltrosActivos,
        filtrosMaestros: {
            canchas,
            canchasDisponibles,
            entrenadores,
            entrenadoresDisponibles,
            horariosDisponibles,
            subs,
            subsDisponibles,
            selectedCanchas,
            selectedEntrenadores,
            selectedSubs,
            selectedHorarios
        },
        setCurrentPage,
        setSelectedCanchas,
        setSelectedEntrenadores,
        setSelectedSubs,
        setSelectedHorarios,
        getAsistenciaResumen,
        handleFilterChange,
        handleSearchChange,
        handleClearFilters,
        toggleAlumnoSelection,
        handleSelectAll,
        limpiarSeleccion,
        actualizarDatoPartido,
        sendBulkWhatsApp
    } = useConvocatoria();

    // Nombres de meses para las columnas de referencia en la tabla
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const fechaHoy = new Date();
    const mesActualStr = nombresMeses[fechaHoy.getMonth()];
    const fechaHoyAnt = new Date(fechaHoy.getFullYear(), fechaHoy.getMonth() - 1, 1);
    const mesAnteriorStr = nombresMeses[fechaHoyAnt.getMonth()];

    // Verificar si todos los alumnos elegibles (>= 2 asistencias) de la página están marcados
    const alumnosElegiblesPagina = alumnos.filter(a => getAsistenciaResumen(a.id) >= 2);
    const todosElegiblesMarcados = alumnosElegiblesPagina.length > 0
        && alumnosElegiblesPagina.every(a => selectedAlumnos.includes(a.id));

    // Exportar Lista de Buena Fe en Excel
    const handleExportarListaBuenaFe = async () => {
        const hayTiqueados = listaAlumnosSeleccionados.length > 0;
        const alumnosParaReporte = hayTiqueados
            ? listaAlumnosSeleccionados
            : todosLosAlumnosFiltrados;

        if (alumnosParaReporte.length === 0) return;

        try {
            const escuela = await getEscuelaActual();
            const nombresEntrenadores = obtenerEntrenadoresListaBuenaFe({
                alumnos: alumnosParaReporte,
                entrenadores,
                usuarioActual: userProfile
            });

            exportarListaBuenaFe({
                alumnos: alumnosParaReporte,
                nombreEscuela: escuela.nombre,
                nombresEntrenadores,
                selectedCanchas: hayTiqueados ? [] : selectedCanchas,
                canchas
            });
        } catch (error) {
            console.error('Error al generar la Lista de Buena Fe:', error);
            window.alert('No se pudo generar la Lista de Buena Fe. Intenta nuevamente.');
        }
    };

    // Estado de carga inicial
    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-20 md:pb-10">
                <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Convocatoria</h1>
                </header>

                <main className="max-w-6xl mx-auto p-4 md:p-6">
                    <div className="bg-surface border border-border rounded-md p-4 space-y-3 animate-pulse">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-10 bg-border/60 rounded w-full"></div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Cabecera */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border flex flex-col">
                <div
                    className="w-full h-0.5 bg-primary/20 overflow-hidden transition-opacity duration-300"
                    style={{ opacity: isFetching ? 1 : 0 }}
                >
                    <div className="h-full bg-primary animate-progress-bar" />
                </div>

                <div className="w-full p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-white whitespace-nowrap">Convocatoria</h1>
                    </div>

                    {/* Menú de navegación superior para escritorio */}
                    <div className="hidden md:flex items-center gap-6 flex-grow justify-start pl-8">
                        <DesktopNavbar className="text-[18px]" />
                    </div>

                    {/* Acciones de cabecera: Exportar Lista de Buena Fe */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleExportarListaBuenaFe}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-bold transition-colors ${
                                selectedAlumnos.length > 0
                                    ? 'bg-primary/15 text-primary border-primary/40 hover:bg-primary/25'
                                    : 'bg-success/10 text-success border-success/30 hover:bg-success/20'
                            }`}
                            title={
                                selectedAlumnos.length > 0
                                    ? `Exportar ${selectedAlumnos.length} jugador(es) convocado(s) a Excel`
                                    : 'Exportar Lista de Buena Fe (todos los filtrados)'
                            }
                        >
                            <FileSpreadsheet size={16} />
                            <span>
                                Lista Buena Fe
                                {selectedAlumnos.length > 0 && (
                                    <span className="ml-1 text-xs font-bold opacity-90">
                                        ({selectedAlumnos.length})
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
                {/* Fila 1: Filtros Multi-selección */}
                <div className={`grid gap-3 ${esAdmin ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {esAdmin && (
                        <MultiSelectFilter
                            label="Entrenador"
                            placeholder="Todos los Entrenadores"
                            options={entrenadoresDisponibles}
                            allOptions={entrenadores}
                            selectedValues={selectedEntrenadores}
                            onChange={setSelectedEntrenadores}
                        />
                    )}

                    <MultiSelectFilter
                        label="Grupo"
                        placeholder="Todos los Grupos"
                        options={canchasDisponibles}
                        allOptions={canchas}
                        selectedValues={selectedCanchas}
                        onChange={setSelectedCanchas}
                    />

                    <MultiSelectFilter
                        label="Categoría (Sub)"
                        placeholder="Todos los Sub"
                        options={subsDisponibles}
                        allOptions={subs}
                        selectedValues={selectedSubs}
                        onChange={setSelectedSubs}
                    />

                    <MultiSelectFilter
                        label="Horario"
                        placeholder="Todos los Horarios"
                        options={horariosDisponibles}
                        selectedValues={selectedHorarios}
                        onChange={setSelectedHorarios}
                    />
                </div>

                {/* Fila 2: Buscador + Tabs de filtro rápido */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
                    <div className="relative flex-grow w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar jugador por nombre o teléfono..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="
                                w-full pl-10 pr-4 py-2.5
                                bg-surface border border-border
                                rounded-md
                                text-white placeholder-text-secondary
                                focus:border-primary focus:outline-none
                                transition-colors
                            "
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 flex-shrink-0">
                        <button
                            onClick={() => handleFilterChange('todos')}
                            className={`
                                px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-colors
                                ${activeFilter === 'todos'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-text-secondary border border-border hover:border-primary'
                                }
                            `}
                        >
                            Todos
                        </button>
                        {esAdmin && (
                            <button
                                onClick={() => handleFilterChange('pendientes')}
                                className={`
                                    px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-colors
                                    ${activeFilter === 'pendientes'
                                        ? 'bg-primary text-white'
                                        : 'bg-surface text-text-secondary border border-border hover:border-primary'
                                    }
                                `}
                            >
                                Pendientes
                            </button>
                        )}
                        <button
                            onClick={() => handleFilterChange('arqueros')}
                            className={`
                                px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap transition-colors
                                ${activeFilter === 'arqueros'
                                    ? 'bg-primary text-white'
                                    : 'bg-surface text-text-secondary border border-border hover:border-primary'
                                }
                            `}
                        >
                            Arqueros
                        </button>

                        {hayFiltrosActivos && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 rounded-md font-medium text-sm whitespace-nowrap bg-error/10 text-error border border-error/20 hover:bg-error/20 transition-colors flex items-center gap-2"
                            >
                                <FilterX size={16} />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Panel de Torneo, Fecha, Hora y Dirección (aparece arriba de la lista al seleccionar jugadores) */}
                <PanelDatosConvocatoria
                    cantidadSeleccionados={selectedAlumnos.length}
                    cantidadConBajaAsistencia={cantidadConBajaAsistencia}
                    datosPartido={datosPartido}
                    onChangeDato={actualizarDatoPartido}
                    onEnviarWhatsApp={sendBulkWhatsApp}
                    onLimpiarSeleccion={limpiarSeleccion}
                />

                {/* Tabla de selección de jugadores */}
                {alumnos.length === 0 ? (
                    <div className="text-center py-12 bg-surface border border-border rounded-md">
                        <Users size={48} className="text-text-secondary mx-auto mb-3 opacity-60" />
                        <p className="text-text-secondary">
                            No hay jugadores que coincidan con los filtros seleccionados.
                        </p>
                    </div>
                ) : (
                    <div className="bg-surface border border-border rounded-md overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[320px]">
                            <thead className="bg-background/50 border-b border-border">
                                <tr>
                                    <th className="p-2 md:p-3 w-8 md:w-10">
                                        <input
                                            type="checkbox"
                                            onChange={() => handleSelectAll(alumnos)}
                                            checked={todosElegiblesMarcados}
                                            title="Seleccionar todos los jugadores con 2 o más asistencias en esta página"
                                            className="rounded border-border text-primary focus:ring-primary bg-background w-4 h-4 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-2 md:p-3 text-[10px] md:text-xs font-bold text-text-secondary uppercase md:min-w-[200px]">
                                        Jugador
                                    </th>
                                    <th className="p-2 md:p-3 text-[10px] md:text-xs font-bold text-text-secondary uppercase text-center w-16 md:w-24" title="Asistencias en los últimos 7 días">
                                        7D
                                    </th>
                                    <th className="p-2 md:p-3 text-[10px] md:text-xs font-bold text-text-secondary uppercase text-center w-12 md:w-16">
                                        {mesAnteriorStr.substring(0, 3)}
                                    </th>
                                    <th className="p-2 md:p-3 text-[10px] md:text-xs font-bold text-text-secondary uppercase text-center w-12 md:w-16">
                                        {mesActualStr.substring(0, 3)}
                                    </th>
                                    <th className="p-2 md:p-3 text-[10px] md:text-xs font-bold text-text-secondary uppercase text-center w-10 md:w-14">
                                        Sub
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumnos.map((alumno) => {
                                    const asistencias = getAsistenciaResumen(alumno.id);
                                    const bajaAsistencia = asistencias < 2;
                                    const estaSeleccionado = selectedAlumnos.includes(alumno.id);
                                    const subAnio = alumno.sub;

                                    return (
                                        <tr
                                            key={alumno.id}
                                            onClick={() => toggleAlumnoSelection(alumno)}
                                            className={`border-b border-border/50 transition-colors cursor-pointer select-none ${
                                                estaSeleccionado
                                                    ? bajaAsistencia
                                                        ? 'bg-warning/10 hover:bg-warning/15'
                                                        : 'bg-primary/10 hover:bg-primary/15'
                                                    : 'hover:bg-primary/5'
                                            }`}
                                        >
                                            <td className="p-2 md:p-3" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={estaSeleccionado}
                                                    onChange={() => toggleAlumnoSelection(alumno)}
                                                    className="rounded border-border text-primary focus:ring-primary bg-background w-4 h-4 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-2 md:p-3">
                                                <div className="flex items-center gap-2 md:gap-3 max-w-[180px] sm:max-w-[260px] md:max-w-[420px]">
                                                    {alumno.foto_url ? (
                                                        <img
                                                            src={alumno.foto_url}
                                                            alt=""
                                                            className="hidden sm:block w-8 h-8 rounded-full object-cover border border-primary/30 flex-shrink-0"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="hidden sm:flex w-8 h-8 rounded-full bg-primary/20 border border-primary/30 items-center justify-center flex-shrink-0">
                                                            <span className="text-primary text-xs font-bold">
                                                                {alumno.nombres?.[0]}{alumno.apellidos?.[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                        <span className="font-medium text-white text-sm md:text-base truncate block">
                                                            {alumno.nombres} {alumno.apellidos}
                                                        </span>
                                                        {bajaAsistencia && (
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border w-fit ${
                                                                    estaSeleccionado
                                                                        ? 'bg-warning/20 text-warning border-warning/40'
                                                                        : 'bg-warning/10 text-warning/80 border-warning/20'
                                                                }`}
                                                                title="Este jugador tiene menos de 2 asistencias en los últimos 7 días"
                                                            >
                                                                <AlertTriangle size={11} />
                                                                &lt; 2 asist.
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Asistencia en los últimos 7 días */}
                                            <td className="p-2 md:p-3 text-center">
                                                <span
                                                    className={`text-sm md:text-base font-bold ${
                                                        asistencias >= 2
                                                            ? 'text-success'
                                                            : asistencias === 1
                                                                ? 'text-warning'
                                                                : 'text-text-secondary'
                                                    }`}
                                                >
                                                    {asistencias}
                                                </span>
                                            </td>
                                            {/* Asistencia Mes Anterior */}
                                            <td className="p-2 md:p-3 text-center">
                                                <span
                                                    className={`text-sm md:text-base font-bold ${
                                                        alumno.asistencias_mes_anterior >= 1 ? 'text-success' : 'text-text-secondary'
                                                    }`}
                                                >
                                                    {alumno.asistencias_mes_anterior || 0}
                                                </span>
                                            </td>
                                            {/* Asistencia Mes Actual */}
                                            <td className="p-2 md:p-3 text-center">
                                                <span
                                                    className={`text-sm md:text-base font-bold ${
                                                        alumno.asistencias_mes_actual >= 1 ? 'text-success' : 'text-text-secondary'
                                                    }`}
                                                >
                                                    {alumno.asistencias_mes_actual || 0}
                                                </span>
                                            </td>
                                            {/* Sub */}
                                            <td className="p-2 md:p-3 text-center text-primary font-bold text-sm">
                                                {subAnio}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="
                                px-4 py-2 rounded-md font-medium text-sm
                                bg-surface text-white border border-border
                                hover:border-primary
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-colors
                            "
                        >
                            Anterior
                        </button>

                        <div className="flex gap-1">
                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 2 && page <= currentPage + 2)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`
                                                px-3 py-2 rounded-md font-medium text-sm
                                                transition-colors
                                                ${currentPage === page
                                                    ? 'bg-primary text-white'
                                                    : 'bg-surface text-text-secondary border border-border hover:border-primary'
                                                }
                                            `}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (
                                    page === currentPage - 3 ||
                                    page === currentPage + 3
                                ) {
                                    return <span key={page} className="px-2 text-text-secondary">...</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="
                                px-4 py-2 rounded-md font-medium text-sm
                                bg-surface text-white border border-border
                                hover:border-primary
                                disabled:opacity-50 disabled:cursor-not-allowed
                                transition-colors
                            "
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </main>

            {/* Barra de navegación inferior móvil */}
            <TabBar />
        </div>
    );
};

export default Convocatoria;
