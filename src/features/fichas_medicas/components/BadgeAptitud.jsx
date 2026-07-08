import React from 'react';

/**
 * Badge semántico que muestra la aptitud deportiva con color.
 * Verde = Apto | Ámbar = Apto con restricciones | Rojo = No apto
 */
const BadgeAptitud = ({ aptitud, size = 'md' }) => {
    if (!aptitud) return null;

    const config = {
        'Apto': {
            bg: 'bg-success/15',
            text: 'text-success',
            border: 'border-success/30',
            dot: 'bg-success',
        },
        'Apto con restricciones': {
            bg: 'bg-warning/15',
            text: 'text-warning',
            border: 'border-warning/30',
            dot: 'bg-warning',
        },
        'No apto': {
            bg: 'bg-error/15',
            text: 'text-error',
            border: 'border-error/30',
            dot: 'bg-error',
        },
    };

    const style = config[aptitud] || config['Apto'];
    const textSize = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${style.bg} ${style.text} ${style.border} ${textSize}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
            {aptitud}
        </span>
    );
};

export default BadgeAptitud;
