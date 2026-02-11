
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Validates that the user is authenticated and optionally has a specific role.
 * @param {Array} allowedRoles - List of allowed roles. If undefined, only auth is required.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, role, loading, escuelaId } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-white">Cargando...</div>;
    }

    if (!user) {
        // Redirigir a login preservando el origen
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Protección: usuario sin escuela asignada
    if (!escuelaId) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <div className="bg-surface border border-border rounded-lg p-8 max-w-md text-center space-y-4">
                    <div className="text-4xl">⚠️</div>
                    <h2 className="text-xl font-bold text-white">Sin Escuela Asignada</h2>
                    <p className="text-text-secondary">
                        Tu cuenta no tiene una escuela asociada. Contacta al administrador
                        del sistema para que te asigne a una escuela.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!role || !allowedRoles.includes(role)) {
            // Usuario autenticado pero sin permisos para esta ruta
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
