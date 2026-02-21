import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Users, Search, FilterX, LayoutGrid, List, MessageCircle } from 'lucide-react';
import AlumnoCard from '../../features/alumnos/components/AlumnoCard';
import Select from '../../components/ui/Select';
import { useAlumnos } from '../../features/alumnos/hooks/useAlumnos';
import TabBar from '../../components/dashboard/TabBar';

const ListaAlumnos = () => {
    const navigate = useNavigate();

    const {
        loading,
        alumnos,
        activeFilter,
        searchTerm,
        selectedAlumnos,
        viewMode,
        totalPages,
        currentPage,
        filtrosMaestros: { canchas, horarios, entrenadores, selectedCancha, selectedHorario, selectedEntrenador },
        asistenciaHistory,
        last7Days,
        setViewMode,
        setCurrentPage,
        setSelectedCancha,
        setSelectedHorario,
        setSelectedEntrenador,
        handleFilterChange,
        handleSearchChange,
        handleClearFilters,
        toggleAlumnoSelection,
        handleSelectAll,
        sendBulkWhatsApp,
        aprobarTodos,
        introMessage,
        setIntroMessage
    } = useAlumnos();

    const [isEditingMessage, setIsEditingMessage] = React.useState(false);

    const filteredAndSortedAlumnos = alumnos;

    // Navegación a detalle del alumno
    const handleAlumnoClick = (alumno) => {
        navigate(`/alumnos/${alumno.id}`);
    };

    // Función para calcular el resumen de asistencia (Presente + Licencia)
    const getAsistenciaResumen = (alumnoId) => {
        const history = asistenciaHistory[alumnoId] || {};
        return Object.values(history).filter(estado =>
            estado === 'Presente' || estado === 'Licencia'
        ).length;
    };

    // Loading Skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-background pb-20 md:pb-10">
                {/* Header */}
                <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Lista de Alumnos</h1>
                </header>

                {/* Loading Skeleton */}
                <main className="max-w-6xl mx-auto p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-surface border border-border rounded-md p-md animate-pulse">
                                <div className="flex items-center gap-md">
                                    <div className="w-20 h-20 bg-border rounded-md"></div>
                                    <div className="flex-grow space-y-2">
                                        <div className="h-4 bg-border rounded w-3/4"></div>
                                        <div className="h-3 bg-border rounded w-1/2"></div>
                                        <div className="h-3 bg-border rounded w-2/3"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    // Empty State
    if (!loading && alumnos.length === 0 && activeFilter === 'todos' && !searchTerm && !selectedCancha && !selectedHorario && !selectedEntrenador) {
        return (
            <div className="min-h-screen bg-background pb-20 md:pb-10">
                {/* Header */}
                <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Lista de Alumnos</h1>
                </header>

                {/* Empty State */}
                <main className="max-w-6xl mx-auto p-4 md:p-6">
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <Users size={80} className="text-text-secondary mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">
                            Aún no hay alumnos registrados
                        </h2>
                        <p className="text-text-secondary mb-6">
                            Haz clic en "Registrar Alumno" para comenzar.
                        </p>
                        <button
                            onClick={() => navigate('/alumnos/registro')}
                            className="bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-orange-600 transition-colors"
                        >
                            Registrar Alumno
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // Vista principal con alumnos
    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Lista de Alumnos</h1>
                </div>

                <div className="flex items-center gap-2">
                    {selectedAlumnos.length > 0 && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                            <button
                                onClick={() => setIsEditingMessage(!isEditingMessage)}
                                className={`p-1.5 rounded-md border ${isEditingMessage ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-text-secondary'} hover:border-primary transition-colors`}
                                title="Editar mensaje de convocatoria"
                            >
                                <MessageCircle size={20} />
                            </button>
                            <button
                                onClick={sendBulkWhatsApp}
                                className="flex items-center gap-2 bg-success text-white px-3 py-1.5 rounded-md text-sm font-bold hover:bg-green-600 transition-all"
                            >
                                WhatsApp ({selectedAlumnos.length})
                            </button>
                        </div>
                    )}
                    <div className="bg-surface border border-border rounded-md p-1 flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'}`}
                            title="Vista Lista"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'}`}
                            title="Vista Cuadrícula"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
                {/* Editor de Mensaje de Convocatoria */}
                {isEditingMessage && selectedAlumnos.length > 0 && (
                    <div className="bg-surface border-2 border-primary rounded-md p-4 animate-in zoom-in-95 duration-200">
                        <label className="block text-xs font-bold text-primary uppercase mb-2">Mensaje de Convocatoria</label>
                        <textarea
                            value={introMessage}
                            onChange={(e) => setIntroMessage(e.target.value)}
                            className="w-full bg-background border border-border rounded px-3 py-2 text-white text-sm focus:border-primary outline-none min-h-[80px] resize-none"
                            placeholder="Escribe el mensaje que irá antes de la lista..."
                        />
                        <div className="flex justify-end mt-2">
                            <button
                                onClick={() => setIsEditingMessage(false)}
                                className="text-xs font-bold text-text-secondary hover:text-white transition-colors"
                            >
                                Listo
                            </button>
                        </div>
                    </div>
                )}
                {/* Barra de Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="
                            w-full pl-10 pr-4 py-3
                            bg-surface border border-border
                            rounded-md
                            text-white placeholder-text-secondary
                            focus:border-primary focus:outline-none
                            transition-colors
                        "
                    />
                </div>

                {/* Filtros y Ordenamiento */}
                <div className="flex flex-col space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        {/* Filtros de Estado */}
                        <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
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

                            {activeFilter === 'pendientes' && alumnos.length > 0 && (
                                <button
                                    onClick={async () => {
                                        if (window.confirm(`¿Aprobar los ${alumnos.length} alumnos mostrados?`)) {
                                            await aprobarTodos();
                                        }
                                    }}
                                    className="px-4 py-2 rounded-md font-bold text-sm whitespace-nowrap bg-success text-white hover:bg-green-700 transition-colors"
                                >
                                    Aprobar Resultados
                                </button>
                            )}

                            {/* Limpiar Filtros */}
                            {(activeFilter !== 'todos' || selectedCancha || selectedHorario || selectedEntrenador || searchTerm) && (
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

                    {/* Filtros de Datos (Cancha, Horario, Entrenador) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            placeholder="Cualquier Cancha"
                            options={canchas}
                            value={selectedCancha}
                            onChange={(e) => setSelectedCancha(e.target.value)}
                        />
                        <Select
                            placeholder="Cualquier Horario"
                            options={horarios}
                            value={selectedHorario}
                            onChange={(e) => setSelectedHorario(e.target.value)}
                        />
                        <Select
                            placeholder="Cualquier Entrenador"
                            options={entrenadores}
                            value={selectedEntrenador}
                            onChange={(e) => setSelectedEntrenador(e.target.value)}
                        />
                    </div>
                </div>

                {/* Lista de Alumnos */}
                {alumnos.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-text-secondary">
                            No hay alumnos que coincidan con este filtro.
                        </p>
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        /* Vista Cuadrícula (Cards) */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alumnos.map((alumno) => (
                                <AlumnoCard
                                    key={alumno.id}
                                    alumno={alumno}
                                    onClick={() => handleAlumnoClick(alumno)}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Vista Lista (Excel-style) */
                        <div className="bg-surface border border-border rounded-md overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-background/50 border-b border-border">
                                    <tr>
                                        <th className="p-3 w-10">
                                            <input
                                                type="checkbox"
                                                onChange={() => handleSelectAll(alumnos)}
                                                checked={alumnos.length > 0 && alumnos.every(a => selectedAlumnos.includes(a.id))}
                                                className="rounded border-border text-primary focus:ring-primary bg-background w-4 h-4 cursor-pointer"
                                            />
                                        </th>
                                        <th className="p-3 text-xs font-bold text-text-secondary uppercase">Alumno</th>
                                        <th className="p-3 text-xs font-bold text-text-secondary uppercase text-center w-14">Asist</th>
                                        <th className="p-3 text-xs font-bold text-text-secondary uppercase text-center w-12">Sub</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alumnos.map((alumno) => {
                                        const asistencias = getAsistenciaResumen(alumno.id);
                                        const isIneligible = asistencias < 2;

                                        return (
                                            <tr
                                                key={alumno.id}
                                                className={`
                                                    border-b border-border/50 transition-colors cursor-pointer
                                                    ${isIneligible ? 'opacity-60 grayscale-[0.5]' : 'hover:bg-primary/5'}
                                                `}
                                                onClick={() => !isIneligible && handleAlumnoClick(alumno)}
                                            >
                                                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAlumnos.includes(alumno.id)}
                                                        onChange={() => toggleAlumnoSelection(alumno.id)}
                                                        disabled={isIneligible}
                                                        className={`
                                                            rounded border-border text-primary focus:ring-primary bg-background w-4 h-4 
                                                            ${isIneligible ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}
                                                        `}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        {alumno.foto_url && (
                                                            <img src={alumno.foto_url} alt="" className="w-8 h-8 rounded-full object-cover border border-primary/30" />
                                                        )}
                                                        <span className={`font-medium truncate ${isIneligible ? 'text-text-secondary' : 'text-white'}`}>
                                                            {alumno.nombres}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className={`
                                                        inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                                                        ${asistencias < 2 ? 'bg-border/20 text-text-secondary' : 'bg-primary/10 text-primary'}
                                                    `}>
                                                        {asistencias}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center text-primary font-bold text-sm">
                                                    {new Date().getFullYear() - new Date(alumno.fecha_nacimiento).getFullYear()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
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

            {/* Botón Flotante "+" */}
            <button
                onClick={() => navigate('/alumnos/registro')}
                className="
                    fixed bottom-6 right-6
                    w-14 h-14
                    bg-primary text-white
                    rounded-full
                    shadow-lg
                    flex items-center justify-center
                    hover:bg-orange-600
                    active:scale-95
                    transition-all
                    z-50
                "
                aria-label="Registrar nuevo alumno"
            >
                <Plus size={28} />
            </button>
            <TabBar />
        </div>
    );
};

export default ListaAlumnos;
