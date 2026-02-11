import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCog, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { getUsuarios, updateUserRole, toggleUserStatus } from '../../services/usuarios';
import Select from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';

const AdminUsuarios = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { user: currentUser } = useAuth(); // Para no editarse a sí mismo si no quiere

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);

    const rolesOptions = [
        { value: 'Dueño', label: 'Dueño' },
        { value: 'Administrador', label: 'Administrador' },
        { value: 'Entrenador', label: 'Entrenador' },
        { value: 'Entrenarqueros', label: 'Entrenador de Arqueros' }
    ];

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        try {
            const data = await getUsuarios();
            setUsuarios(data);
        } catch (error) {
            console.error(error);
            addToast('Error al cargar usuarios', 'error');
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
            loadUsuarios();
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Error al actualizar rol', 'error');
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await toggleUserStatus(userId, currentStatus);
            addToast(`Usuario ${currentStatus ? 'desactivado' : 'activado'}`, 'success');
            loadUsuarios();
        } catch (error) {
            console.error(error);
            addToast('Error al cambiar estado', 'error');
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-white">Cargando usuarios...</div>;
    }

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-10">
            <header className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b border-border p-4 flex items-center gap-4">
                <button onClick={() => navigate('/dashboard')} className="text-white hover:text-primary transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserCog /> Administración de Usuarios
                </h1>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-6">
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
                                        <select
                                            value={u.rol || ''}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            className="bg-background border border-border text-white text-sm rounded p-2 focus:border-primary outline-none"
                                            disabled={u.id === currentUser?.id} // Evitar auto-quitarse permisos accidentalmente (básico)
                                        >
                                            {rolesOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
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
            </main>
        </div>
    );
};

export default AdminUsuarios;
