import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog, Shield, CheckCircle, XCircle, UserPlus, Plus } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { getUsuarios, updateUserRole, toggleUserStatus, updateUserSucursal, createUserDirectly } from '../../services/usuarios';
import { getSucursales } from '../../services/sucursales';
import Select from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';

const AdminUsuarios = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user: currentUser } = useAuth(); // Para no editarse a sí mismo si no quiere

    const [usuarios, setUsuarios] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para Crear Usuario
    const [isCreating, setIsCreating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nombres: '',
        apellidos: '',
        email: '',
        password: '',
        rol: 'Entrenador',
        sucursal_id: ''
    });

    const rolesOptions = [
        { value: 'Dueño', label: 'Dueño' },
        { value: 'Administrador', label: 'Administrador' },
        { value: 'Entrenador', label: 'Entrenador' },
        { value: 'Entrenarqueros', label: 'Entrenador de Arqueros' }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [usuariosData, sucursalesData] = await Promise.all([
                getUsuarios(),
                getSucursales()
            ]);
            setUsuarios(usuariosData);
            setSucursales(sucursalesData || []);
        } catch (error) {
            console.error(error);
            addToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            // Validar: solo puede haber un Dueño por escuela
            if (newRole === 'Dueño') {
                const dueñoExistente = usuarios.find(u => u.rol === 'Dueño' && u.id !== userId);
                if (dueñoExistente) {
                    addToast(`Ya existe un Dueño: ${dueñoExistente.nombres} ${dueñoExistente.apellidos}. Solo puede haber un Dueño por escuela.`, 'error');
                    return;
                }
            }

            await updateUserRole(userId, newRole);
            addToast('Rol actualizado correctamente', 'success');
            loadData();
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al actualizar rol', 'error');
        }
    };

    const handleSucursalChange = async (userId, sucursalId) => {
        try {
            await updateUserSucursal(userId, sucursalId);
            addToast('Sucursal actualizada correctamente', 'success');
            loadData();
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al actualizar sucursal', 'error');
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await toggleUserStatus(userId, currentStatus);
            addToast(`Usuario ${currentStatus ? 'desactivado' : 'activado'}`, 'success');
            loadData();
        } catch (error) {
            console.error(error);
            addToast('Error al cambiar estado', 'error');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!formData.nombres || !formData.apellidos || !formData.email || !formData.password) {
            addToast('Por favor completa todos los campos obligatorios.', 'error');
            return;
        }

        if (formData.password.length < 6) {
            addToast('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await createUserDirectly(formData);
            addToast(`✓ Usuario ${formData.email} creado correctamente. Ya puede iniciar sesión.`, 'success');
            setFormData({
                nombres: '',
                apellidos: '',
                email: '',
                password: '',
                rol: 'Entrenador',
                sucursal_id: ''
            });
            setIsCreating(false);
            loadData();
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al crear usuario.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando usuarios...</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                <button onClick={() => navigate('/admin/escuela')} className="text-white hover:text-primary transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserCog /> Administración de Usuarios
                </h1>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-6 mt-4">

                {/* Header Actions */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsCreating(!isCreating)}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md font-medium transition-colors"
                    >
                        {isCreating ? <XCircle size={20} /> : <UserPlus size={20} />}
                        {isCreating ? 'Cancelar Registro' : 'Nuevo Usuario'}
                    </button>
                </div>

                {/* Formulario Creación de Usuario */}
                {isCreating && (
                    <div className="bg-surface border border-border rounded-lg p-6 animate-in fade-in slide-in-from-top-4">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <UserPlus size={24} className="text-primary" />
                            Registrar Nuevo Usuario
                        </h2>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Nombres *</label>
                                    <input
                                        type="text"
                                        value={formData.nombres}
                                        onChange={e => setFormData({ ...formData, nombres: e.target.value })}
                                        className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Apellidos *</label>
                                    <input
                                        type="text"
                                        value={formData.apellidos}
                                        onChange={e => setFormData({ ...formData, apellidos: e.target.value })}
                                        className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Email * (Será su inicio de sesión)</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Contraseña *</label>
                                    <input
                                        type="password"
                                        minLength="6"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Rol *</label>
                                    <select
                                        value={formData.rol}
                                        onChange={e => setFormData({ ...formData, rol: e.target.value })}
                                        className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                    >
                                        {rolesOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Sucursal Inicial</label>
                                    <select
                                        value={formData.sucursal_id}
                                        onChange={e => setFormData({ ...formData, sucursal_id: e.target.value })}
                                        className="w-full bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                        disabled={formData.rol === 'Dueño'}
                                    >
                                        <option value="">Todas las sucursales / Ninguna</option>
                                        {sucursales.map(suc => (
                                            <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Registrando...' : 'Registrar Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-background/50 border-b border-border">
                            <tr>
                                <th className="p-4 font-bold text-text-secondary">Usuario</th>
                                <th className="p-4 font-bold text-text-secondary">Rol Actual</th>
                                <th className="p-4 font-bold text-text-secondary text-center">Estado</th>
                                <th className="p-4 font-bold text-text-secondary text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u) => (
                                <tr key={u.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{u.nombres} {u.apellidos}</div>
                                        <div className="text-sm text-text-secondary">{u.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-2">
                                            <select
                                                value={u.rol || ''}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                className="bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                                disabled={u.id === currentUser?.id}
                                            >
                                                {rolesOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>

                                            <select
                                                value={u.sucursal_id || ''}
                                                onChange={(e) => handleSucursalChange(u.id, e.target.value)}
                                                className="bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                                disabled={u.id === currentUser?.id || u.rol === 'Dueño'}
                                            >
                                                <option value="">Todas las sucursales</option>
                                                {sucursales.map(suc => (
                                                    <option key={suc.id} value={suc.id}>{suc.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {u.activo ? (
                                            <span className="inline-flex items-center gap-1 text-success text-sm font-medium">
                                                <CheckCircle size={16} /> Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-error text-sm font-medium">
                                                <XCircle size={16} /> Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {u.id !== currentUser?.id && (
                                            <button
                                                onClick={() => handleToggleStatus(u.id, u.activo)}
                                                className={`
                                                    text-xs px-3 py-1.5 rounded border transition-colors
                                                    ${u.activo
                                                        ? 'border-error/30 text-error hover:bg-error/10'
                                                        : 'border-success/30 text-success hover:bg-success/10'
                                                    }
                                                `}
                                            >
                                                {u.activo ? 'Desactivar' : 'Activar'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main >
        </div >
    );
};

export default AdminUsuarios;
