import React from 'react';

const ModuleCard = ({ icon, label, onClick, disabled = false, size = 'default', badge }) => {
    const sizeClasses = {
        default: badge ? 'min-h-[200px] px-xl pb-xl pt-10' : 'min-h-[200px] p-xl',
        compact: badge ? 'min-h-[160px] px-md pb-md pt-10' : 'min-h-[160px] p-md',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                relative bg-surface
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
            {badge && (
                <span className="absolute top-2 right-2 rounded-full bg-primary px-2 py-1 text-xs font-bold leading-4 text-background whitespace-nowrap">
                    {badge}
                </span>
            )}
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
