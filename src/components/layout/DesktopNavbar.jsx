import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSaasportUrl } from '../../lib/navegacion';

/**
 * DesktopNavbar — Componente de navegación superior para PC.
 * Muestra las opciones principales: Inicio, Asistencia, Alumnos, Cumpleaños y SaaSport (para administradores).
 * 
 * @param {string} className - Clases de Tailwind para aplicar a los botones (principalmente tamaño de fuente).
 * @param {string} gap - Clases de espaciado entre los elementos del menú.
 */
const DesktopNavbar = ({ className = "text-[18px]", gap = "gap-6" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useAuth();

    // Determina si una ruta está activa para resaltar el elemento del menú
    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/dashboard';
        }
        if (path === '/alumnos') {
            // Activo en cualquier subruta de alumnos, excepto en cumpleaños
            return location.pathname.startsWith('/alumnos') && !location.pathname.includes('/cumpleanos');
        }
        return location.pathname.startsWith(path);
    };

    const linkStyle = (path) => {
        const active = isActive(path);
        return `${className} transition-colors font-medium ${
            active 
                ? 'text-white font-bold' 
                : 'text-text-secondary hover:text-primary'
        }`;
    };

    return (
        <nav className={`hidden md:flex items-center ${gap}`}>
            <button 
                onClick={() => navigate('/dashboard')} 
                className={linkStyle('/dashboard')}
            >
                Inicio
            </button>
            <button 
                onClick={() => navigate('/asistencia')} 
                className={linkStyle('/asistencia')}
            >
                Asistencia
            </button>
            <button 
                onClick={() => navigate('/alumnos')} 
                className={linkStyle('/alumnos')}
            >
                Alumnos
            </button>
            <button 
                onClick={() => navigate('/alumnos/cumpleanos')} 
                className={linkStyle('/alumnos/cumpleanos')}
            >
                Cumpleaños
            </button>
            {(role === 'SuperAdministrador' || role === 'Administrador') && (
                <a 
                    href={getSaasportUrl()} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-text-secondary hover:text-primary transition-colors font-medium ${className}`}
                >
                    SaaSport
                </a>
            )}
        </nav>
    );
};

export default DesktopNavbar;
