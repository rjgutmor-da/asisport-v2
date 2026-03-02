import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { getSucursales, createSucursal, updateSucursal, deleteSucursal } from '../../services/sucursales';

const GestorSucursales = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);

    // Formulario
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', direccion: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadSucursales();
    }, []);

    const loadSucursales = async () => {
        try {
            const data = await getSucursales();
            setSucursales(data || []);
        } catch (error) {
            console.error(error);
            addToast('Error al cargar sucursales', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nombre.trim()) return;
        setIsSubmitting(true);
        try {
            if (isEditing) {
                await updateSucursal(currentId, {
                    nombre: formData.nombre.trim(),
                    direccion: formData.direccion.trim()
                });
                addToast('Sucursal actualizada', 'success');
            } else {
                await createSucursal(formData.nombre.trim(), formData.direccion.trim());
                addToast('Sucursal creada', 'success');
            }

            setFormData({ nombre: '', direccion: '' });
            setIsEditing(false);
            setCurrentId(null);
            loadSucursales();
        } catch (error) {
            console.error(error);
            addToast('Error al guardar sucursal', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (sucursal) => {
        setIsEditing(true);
        setCurrentId(sucursal.id);
        setFormData({ nombre: sucursal.nombre, direccion: sucursal.direccion || '' });
    };

    const handleDelete = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de eliminar la sucursal "${nombre}"? Los alumnos y usuarios asociados quedarán sin sucursal asignada.`)) {
            return;
        }
        try {
            await deleteSucursal(id);
            addToast('Sucursal eliminada', 'success');
            loadSucursales();
        } catch (error) {
            console.error(error);
            addToast('Error al eliminar sucursal', 'error');
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ nombre: '', direccion: '' });
    };

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando sucursales...</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                <button onClick={() => navigate('/admin/escuela')} className="text-white hover:text-primary transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 /> Gestión de Sucursales
                </h1>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">
                {/* Panel de Formulario */}
                <div className="bg-surface border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        {isEditing ? <Edit2 size={20} /> : <Plus size={20} />}
                        {isEditing ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                    placeholder="Ej: Sede Norte"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Dirección (Opcional)</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    value={formData.direccion}
                                    onChange={handleInputChange}
                                    className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                    placeholder="Ej: Av. Principal #123"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 border border-border text-white rounded hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.nombre.trim()}
                                className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar Sucursal')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista de Sucursales */}
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-background/50 border-b border-border">
                            <tr>
                                <th className="p-4 font-bold text-text-secondary">Nombre</th>
                                <th className="p-4 font-bold text-text-secondary">Dirección</th>
                                <th className="p-4 font-bold text-text-secondary text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sucursales.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-text-secondary">
                                        No hay sucursales registradas. Agrega una arriba.
                                    </td>
                                </tr>
                            ) : (
                                sucursales.map((sucursal) => (
                                    <tr key={sucursal.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-medium text-white">{sucursal.nombre}</td>
                                        <td className="p-4 text-text-secondary text-sm">{sucursal.direccion || '-'}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(sucursal)}
                                                    className="p-2 text-text-secondary hover:text-white transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(sucursal.id, sucursal.nombre)}
                                                    className="p-2 text-error/70 hover:text-error transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default GestorSucursales;
