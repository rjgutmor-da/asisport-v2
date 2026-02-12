import React from 'react';
import { MessageCircle } from 'lucide-react';

import { formatWhatsAppPhone } from '../utils/phoneUtils';

/**
 * Componente de tarjeta para mostrar información de un alumno
 * Diseño enfocado en contacto rápido vía WhatsApp
 */
const AlumnoCard = ({ alumno, onClick, variant = 'default', customWhatsAppMessage }) => {
    // Generar iniciales para fallback de foto
    const getInitials = () => {
        const firstInitial = alumno.nombres?.[0] || '';
        const lastInitial = alumno.apellidos?.[0] || '';
        return `${firstInitial}${lastInitial}`.toUpperCase();
    };

    // Obtener información del representante (Padre o Madre)
    // Inteligencia robusta para detectar teléfonos válidos vs nombres
    const getRepresentanteInfo = () => {
        const pNombre = alumno.nombre_padre || alumno.nombre_madre || '';
        const pTelef = alumno.telefono_padre || alumno.telefono_madre || '';

        // Función auxiliar: Un string es teléfono si tiene entre 7 y 15 dígitos
        const isPhone = (str) => {
            if (!str) return false;
            const digits = str.replace(/\D/g, '');
            return digits.length >= 7 && digits.length <= 15;
        };

        // Caso 1: El campo teléfono tiene un número válido (Lo normal)
        if (isPhone(pTelef)) {
            return {
                nombre: (pNombre.split(' ')[0] || 'Tutor'),
                telefono: pTelef
            };
        }

        // Caso 2: El campo nombre tiene el teléfono (Datos invertidos)
        // Esto pasa si telefono NO es válido pero nombre SÍ lo es
        if (isPhone(pNombre)) {
            return {
                nombre: (pTelef.split(' ')[0] || 'Tutor'), // Usamos el "teléfono" (texto) como nombre
                telefono: pNombre // Usamos el "nombre" (números) como teléfono
            };
        }

        // Caso 3: Ninguno parece válido, retornamos lo original
        return {
            nombre: (pNombre.split(' ')[0] || 'Tutor'),
            telefono: pTelef
        };
    };

    const representante = getRepresentanteInfo();

    // Función para enviar mensaje por WhatsApp
    const handleWhatsApp = (e) => {
        e.stopPropagation(); // Evitar navegar al detalle

        const cleanPhone = formatWhatsAppPhone(representante.telefono);

        // Validación final: Si no hay número válido, no hacer nada
        if (!cleanPhone || cleanPhone.length < 7) {
            console.warn('Número de teléfono inválido para WhatsApp:', representante.telefono);
            return;
        }

        const defaultMessage = `Como esta ${representante.nombre}, `;
        const finalMessage = customWhatsAppMessage
            ? customWhatsAppMessage.replace('#nombre', alumno.nombres)
            : defaultMessage;

        const message = encodeURIComponent(finalMessage);
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    };

    return (
        <div
            onClick={onClick}
            className={`
                bg-surface 
                border 
                rounded-md 
                p-md 
                flex items-center gap-md
                transition-fast
                cursor-pointer
                active:scale-[0.99]
                relative
                group
                ${variant === 'highlight'
                    ? 'border-primary/50 bg-primary/10 shadow-[0_0_15px_rgba(255,107,0,0.15)] hover:bg-primary/20 scale-[1.02]'
                    : variant === 'muted'
                        ? 'border-border/50 opacity-75 hover:opacity-100 hover:border-border hover:bg-surface'
                        : 'border-border hover:border-primary hover:bg-primary/5'
                }
            `}
        >
            {/* Foto o Iniciales */}
            <div className="flex-shrink-0">
                {alumno.foto_url ? (
                    <img
                        src={alumno.foto_url}
                        alt={`${alumno.nombres} ${alumno.apellidos}`}
                        className="w-20 h-20 rounded-md border border-primary object-cover"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-md border border-primary bg-surface flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                            {getInitials()}
                        </span>
                    </div>
                )}
            </div>

            {/* Información del Alumno */}
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-2">
                    {/* Nombre Alumno */}
                    <h3 className="text-base font-bold text-white truncate">
                        {alumno.nombres} {alumno.apellidos}
                    </h3>

                    {/* Badge simplificado de Estado/Tipo */}
                    <div className="flex gap-1 flex-shrink-0">
                        {alumno.es_arquero && (
                            <span className="px-1.5 py-0.5 bg-arquero/20 text-arquero text-[10px] font-black rounded uppercase">Arq</span>
                        )}
                        {alumno.estado === 'Pendiente' && (
                            <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[10px] font-black rounded uppercase">P</span>
                        )}
                    </div>
                </div>

                {/* INFO NIVEL 2: Cancha y Sub */}
                <p className="text-xs text-text-secondary font-medium mt-0.5">
                    {alumno.cancha?.nombre || 'Sin Cancha'} • <span className="text-primary">Sub {new Date().getFullYear() - new Date(alumno.fecha_nacimiento).getFullYear()}</span>
                </p>

                {/* INFO NIVEL 3: Tutor y WhatsApp */}
                <div className="mt-2 flex items-center justify-between bg-background/40 p-1.5 rounded-sm border border-border/30">
                    <div className="min-w-0 pr-2">
                        <p className="text-[11px] text-text-secondary leading-tight truncate">
                            Tutor: <span className="text-white font-medium">{representante.nombre || 'N/A'}</span>
                        </p>
                        <p className="text-[11px] text-primary font-bold leading-tight">
                            {representante.telefono || 'Sin tel.'}
                        </p>
                    </div>

                    {representante.telefono && (
                        <button
                            onClick={handleWhatsApp}
                            className="
                                flex-shrink-0
                                w-8 h-8
                                bg-success text-white
                                rounded-full
                                flex items-center justify-center
                                hover:bg-success/80
                                active:scale-90
                                transition-all
                                shadow-sm
                            "
                            title={`WhatsApp a ${representante.nombre}`}
                        >
                            <MessageCircle size={16} fill="currentColor" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlumnoCard;
