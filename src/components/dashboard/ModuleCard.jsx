import React from 'react';

const ModuleCard = ({ icon, label, onClick, disabled = false, size = 'default' }) => {
    const sizeClasses = {
        default: 'min-h-[200px] p-xl',
        compact: 'min-h-[160px] p-md',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                bg-surface 
                border-regular border-border 
                rounded-md 
                ${sizeClasses[size]}
                flex flex-col items-center justify-center gap-sm
                transition-fast
                w-full
                ${disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-primary active:scale-[0.98] hover:-translate-y-[2px] hover:shadow-md cursor-pointer'
                }
            `}
        >
            <div className="text-white">
                {icon}
            </div>
            <span className="text-lg font-semibold text-white text-heading text-center text-balance leading-tight">
                {label}
            </span>
        </button>
    );
};

export default ModuleCard;
