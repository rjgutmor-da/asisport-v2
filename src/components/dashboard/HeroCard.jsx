import React from 'react';

const HeroCard = ({ icon, label, onClick, className = '' }) => {
    return (
        <button
            onClick={onClick}
            className={`
                w-full
                bg-surface 
                border-thick border-primary 
                rounded-md 
                p-xl 
                flex flex-col items-center justify-center gap-md
                active:scale-[0.98]
                hover:-translate-y-[2px]
                hover:shadow-lg
                transition-all duration-300 ease-in-out
                cursor-pointer
                ${className}
            `}
        >
            <div className="text-white">
                {icon}
            </div>
            <span className="text-2xl font-bold text-white">
                {label}
            </span>
        </button>
    );
};

export default HeroCard;
