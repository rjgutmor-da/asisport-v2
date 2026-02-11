import React from 'react';

const Select = ({ label, name, options = [], value, onChange, error, placeholder = "Selecciona una opción" }) => {
    return (
        <div className="flex flex-col gap-1">
            {label && <label htmlFor={name} className="text-sm font-medium text-text-secondary">{label}</label>}
            <div className="relative">
                <select
                    id={name}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`
                        flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm text-white 
                        ring-offset-background placeholder:text-muted-foreground 
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 
                        disabled:cursor-not-allowed disabled:opacity-50
                        ${error ? 'border-error ring-error' : 'border-border'}
                    `}
                >
                    <option value="" disabled className="text-gray-500">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
            {error && <span className="text-xs text-error font-medium">{error}</span>}
        </div>
    );
};

export default Select;
