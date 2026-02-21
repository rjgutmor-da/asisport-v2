import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Loader2, Archive } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useAlumno } from '../../features/alumnos/hooks/useAlumno';
import { archivarAlumno } from '../../services/alumnos';

const DetalleAlumno = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user } = useAuth();

    const {
        alumno,
        loading,
        editing,
        saving,
        formData,
        maestros: { canchas, horarios },
        setEditing,
        handleChange,
        saveChanges,
        cancelEditing,
        handleAprobar
    } = useAlumno(id);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
        );
    }

    if (!alumno) {
        return (
            <div className="min-h-screen bg-background p-4">
                <div className="text-center py-12">
                    <p className="text-white text-xl">Alumno no encontrado</p>
                    <button
                        onClick={() => navigate('/alumnos')}
                        className="mt-4 text-primary hover:underline"
                    >
                        Volver a la lista
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/alumnos', { replace: true })} className="text-white hover:text-primary transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">
                        {alumno.nombres} {alumno.apellidos}
                    </h1>
                </div>

                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-orange-600 transition-colors"
                    >
                        <Edit2 size={18} />
                        Editar
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={cancelEditing}
                            className="flex items-center gap-2 px-4 py-2 bg-surface text-white border border-border rounded-md hover:border-primary transition-colors"
                        >
                            <X size={18} />
                            Cancelar
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                )}
            </header>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {/* Foto y Badges */}
                <div className="bg-surface border border-border rounded-md p-6 flex items-center gap-6">
                    {/* Foto */}
                    <div className="flex-shrink-0">
                        {alumno.foto_url ? (
                            <img
                                src={alumno.foto_url}
                                alt={`${alumno.nombres} ${alumno.apellidos}`}
                                className="w-32 h-32 rounded-md border-2 border-primary object-cover"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-md border-2 border-primary bg-background flex items-center justify-center">
                                <span className="text-4xl font-bold text-primary">
                                    {alumno.nombres[0]}{alumno.apellidos[0]}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Info y Badges */}
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {alumno.nombres} {alumno.apellidos}
                        </h2>

                        <div className="flex gap-2 mb-4">
                            {alumno.estado === 'Pendiente' && (
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-warning/20 text-warning text-sm font-bold rounded">
                                        Pendiente
                                    </span>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(`¿Aprobar al alumno ${alumno.nombres}?`)) {
                                                await handleAprobar();
                                            }
                                        }}
                                        className="px-3 py-1 bg-success text-white text-xs font-bold rounded hover:bg-green-700 transition-colors uppercase"
                                    >
                                        Aprobar Ahora
                                    </button>
                                </div>
                            )}
                            {alumno.estado === 'Aprobado' && (
                                <span className="px-3 py-1 bg-success/20 text-success text-sm font-bold rounded">
                                    Aprobado
                                </span>
                            )}
                            {alumno.es_arquero && (
                                <span className="px-3 py-1 bg-arquero/20 text-arquero text-sm font-bold rounded">
                                    Arquero
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-text-secondary">Asistencias Totales</p>
                                <p className="text-white font-semibold text-lg">{alumno.asistencias_count}</p>
                            </div>
                            <div>
                                <p className="text-text-secondary">Entrenadores</p>
                                <p className="text-white font-semibold text-lg">{alumno.alumnos_entrenadores?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulario de Datos */}
                <div className="bg-surface border border-border rounded-md p-6 space-y-6">
                    {/* Datos Personales */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
                            Datos Personales
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombres *"
                                name="nombres"
                                value={formData.nombres || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                            <Input
                                label="Apellidos *"
                                name="apellidos"
                                value={formData.apellidos || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Fecha de Nacimiento *"
                                name="fecha_nacimiento"
                                type="date"
                                value={formData.fecha_nacimiento || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                            <Input
                                label="Carnet de Identidad"
                                name="carnet_identidad"
                                value={formData.carnet_identidad || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="es_arquero"
                                name="es_arquero"
                                checked={formData.es_arquero || false}
                                onChange={handleChange}
                                disabled={!editing}
                                className="w-5 h-5 rounded border-border bg-surface text-primary focus:ring-primary"
                            />
                            <label htmlFor="es_arquero" className="text-sm font-medium text-white cursor-pointer select-none">
                                Es Arquero
                            </label>
                        </div>
                    </section>

                    {/* Representantes Legales */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
                            Representantes Legales
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre del Padre"
                                name="nombre_padre"
                                value={formData.nombre_padre || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                            <Input
                                label="Teléfono Padre"
                                name="telefono_padre"
                                type="tel"
                                value={formData.telefono_padre || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre de la Madre"
                                name="nombre_madre"
                                value={formData.nombre_madre || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                            <Input
                                label="Teléfono Madre"
                                name="telefono_madre"
                                type="tel"
                                value={formData.telefono_madre || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                        </div>
                    </section>

                    {/* Información de Entrenamiento */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
                            Información de Entrenamiento
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Cancha de Entrenamiento *"
                                name="cancha_id"
                                value={formData.cancha_id || ''}
                                options={canchas}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                            <Select
                                label="Horario de Entrenamiento *"
                                name="horario_id"
                                value={formData.horario_id || ''}
                                options={horarios}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                        </div>

                        <Input
                            label="Teléfono del Deportista"
                            name="telefono_deportista"
                            type="tel"
                            value={formData.telefono_deportista || ''}
                            onChange={handleChange}
                            disabled={!editing}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Colegio"
                                name="colegio"
                                value={formData.colegio || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                            <Input
                                label="Dirección"
                                name="direccion"
                                value={formData.direccion || ''}
                                onChange={handleChange}
                                disabled={!editing}
                            />
                        </div>
                    </section>

                    {/* Entrenadores Asignados */}
                    {alumno.alumnos_entrenadores && alumno.alumnos_entrenadores.length > 0 && (
                        <section className="space-y-4">
                            <h3 className="text-lg font-semibold text-primary border-b border-border pb-2">
                                Entrenadores Asignados
                            </h3>
                            <div className="space-y-2">
                                {alumno.alumnos_entrenadores.map((ae, index) => (
                                    <div key={index} className="flex items-center gap-2 text-white">
                                        <span className="w-2 h-2 bg-primary rounded-full"></span>
                                        <span>{ae.usuario?.nombres} {ae.usuario?.apellidos}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Botón de Archivar (solo Admin/SuperAdmin) */}
                {(user?.rol === 'SuperAdministrador' || user?.rol === 'Administrador') && (
                    <div className="bg-surface border border-error/30 rounded-md p-6">
                        <h3 className="text-lg font-semibold text-error mb-2">Zona de Peligro</h3>
                        <p className="text-text-secondary text-sm mb-4">
                            Archivar un alumno lo eliminará de las listas activas, pero sus datos y asistencias se conservarán.
                        </p>
                        <button
                            onClick={async () => {
                                if (!window.confirm(`¿Estás seguro de archivar a ${alumno.nombres} ${alumno.apellidos}? El alumno dejará de aparecer en listas activas.`)) {
                                    return;
                                }
                                try {
                                    await archivarAlumno(id);
                                    addToast('Alumno archivado correctamente', 'success');
                                    navigate('/alumnos');
                                } catch (error) {
                                    addToast(error.message, 'error');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                            <Archive size={18} />
                            Archivar Alumno
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DetalleAlumno;
