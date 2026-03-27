import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import FileInput from '../../components/ui/FileInput';
import { useRegistroAlumno } from '../../features/alumnos/hooks/useRegistroAlumno';
import { useAuth } from '../../context/AuthContext';

const RegistroAlumno = () => {
    const navigate = useNavigate();
    const { isCoach } = useAuth();

    const {
        loadingMaestros,
        submitting,
        formData,
        errors,
        maestros: { canchas, horarios, entrenadores, sucursales },
        handleChange,
        setPhotoFile,
        handleSubmit
    } = useRegistroAlumno(() => {
        // Al éxito, navegar a la lista
        navigate('/alumnos');
    });

    if (loadingMaestros) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            {/* Header */}
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="text-white hover:text-primary transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white">Registro de Alumnos</h1>
            </header>

            <main className="max-w-2xl mx-auto p-4 md:p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Sección: Datos del Alumno */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                            Datos del Alumno
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombres *"
                                name="nombres"
                                value={formData.nombres}
                                onChange={handleChange}
                                error={errors.nombres}
                                placeholder="Ej: Juan Carlos"
                            />
                            <Input
                                label="Apellidos *"
                                name="apellidos"
                                value={formData.apellidos}
                                onChange={handleChange}
                                error={errors.apellidos}
                                placeholder="Ej: Pérez Gómez"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Fecha de Nacimiento *"
                                name="fecha_nacimiento"
                                type="date"
                                value={formData.fecha_nacimiento}
                                onChange={handleChange}
                                error={errors.fecha_nacimiento}
                            />
                            <Input
                                label="Carnet de Identidad"
                                name="carnet_identidad"
                                value={formData.carnet_identidad}
                                onChange={handleChange}
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FileInput
                                label="Foto del Alumno"
                                name="foto"
                                onChange={setPhotoFile}
                                error={errors.foto}
                            />
                            <div className="flex items-center space-x-2 h-full pt-8">
                                <input
                                    type="checkbox"
                                    id="es_arquero"
                                    name="es_arquero"
                                    checked={formData.es_arquero}
                                    onChange={handleChange}
                                    className="w-5 h-5 rounded border-border bg-surface text-primary focus:ring-primary"
                                />
                                <label htmlFor="es_arquero" className="text-sm font-medium text-white cursor-pointer select-none">
                                    Es Arquero
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Sección: Representantes */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                            Representantes Legales
                        </h2>
                        {errors.representante && (
                            <div className="p-3 rounded-md bg-error/10 border border-error text-error text-sm font-medium">
                                {errors.representante}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre del Padre *"
                                name="nombre_padre"
                                value={formData.nombre_padre}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                            />
                            <Input
                                label="Teléfono Padre (Opcional)"
                                name="telefono_padre"
                                value={formData.telefono_padre}
                                onChange={handleChange}
                                placeholder="+591..."
                                type="tel"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Nombre de la Madre *"
                                name="nombre_madre"
                                value={formData.nombre_madre}
                                onChange={handleChange}
                                placeholder="Nombre completo"
                            />
                            <Input
                                label="Teléfono Madre (Opcional)"
                                name="telefono_madre"
                                value={formData.telefono_madre}
                                onChange={handleChange}
                                placeholder="+591..."
                                type="tel"
                            />
                        </div>

                        <div className="mt-4 pt-2 border-t border-border/50">
                            <p className="text-sm font-medium text-text-secondary mb-3">
                                ¿Qué número se usará para contacto por WhatsApp?
                            </p>
                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="whatsapp_preferido"
                                        value="padre"
                                        checked={formData.whatsapp_preferido === 'padre'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary"
                                    />
                                    <span className="text-sm text-white">Padre</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="whatsapp_preferido"
                                        value="madre"
                                        checked={formData.whatsapp_preferido === 'madre'}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-primary bg-surface border-border focus:ring-primary"
                                    />
                                    <span className="text-sm text-white">Madre</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* Sección: Información Adicional */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold text-primary border-b border-border pb-2">
                            Información Adicional
                        </h2>

                        {/* Colegio y Dirección primero */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Colegio"
                                name="colegio"
                                value={formData.colegio}
                                onChange={handleChange}
                                placeholder="Opcional"
                            />
                            <Input
                                label="Dirección del Domicilio"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                placeholder="Ej: Av. Principal #123, Zona Norte"
                            />
                        </div>

                        {/* Sucursal como filtro de canchas */}
                        {sucursales.length > 0 && (
                            <div className="grid grid-cols-1 gap-4">
                                <Select
                                    label="Sucursal"
                                    name="sucursal_id"
                                    value={formData.sucursal_id}
                                    options={[{ value: '', label: 'Todas las sucursales' }, ...sucursales]}
                                    onChange={handleChange}
                                    error={errors.sucursal_id}
                                />
                                <p className="text-xs text-text-secondary -mt-2">
                                    Selecciona una sucursal para filtrar las canchas y profesores disponibles
                                </p>
                            </div>
                        )}

                        {/* Cancha y Horario filtrados por Sucursal */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Cancha de Entrenamiento *"
                                name="cancha_id"
                                value={formData.cancha_id}
                                options={canchas}
                                onChange={handleChange}
                                error={errors.cancha_id}
                            />
                            <Select
                                label="Horario de Entrenamiento *"
                                name="horario_id"
                                value={formData.horario_id}
                                options={horarios}
                                onChange={handleChange}
                                error={errors.horario_id}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Select
                                label="Profesor Asignado *"
                                name="profesor_asignado_id"
                                value={formData.profesor_asignado_id}
                                options={entrenadores}
                                onChange={handleChange}
                                error={errors.profesor_asignado_id}
                                disabled={isCoach}
                            />
                        </div>
                    </section>

                    {/* Botón Guardar */}
                    <div className="pt-4 pb-8">
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full md:w-auto md:min-w-[200px] text-lg py-6"
                            isLoading={submitting}
                            disabled={submitting}
                        >
                            {submitting ? 'Guardando...' : 'Guardar Alumno'}
                        </Button>
                    </div>

                </form>
            </main>
        </div>
    );
};

export default RegistroAlumno;
