
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Componente de selección múltiple con checkboxes
 * @param {Array} options - [{ value: string, label: string }]
 * @param {Array} selectedValues - Valores actualmente seleccionados
 * @param {Function} onChange - Callback con el nuevo array de valores
 * @param {string} label - Etiqueta del campo
 * @param {string} placeholder - Texto cuando no hay selección (ej. "Todos")
 */
const MultiSelectFilter = ({ options, selectedValues = [], onChange, label, placeholder = 'Todos' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    const handleSelectAll = () => {
        onChange([]); // Vacío = Todos
        setIsOpen(false);
    };

    const displayText = selectedValues.length === 0
        ? placeholder
        : selectedValues.length === 1
            ? options.find(o => o.value === selectedValues[0])?.label || placeholder
            : `${selectedValues.length} seleccionados`;

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="text-xs text-text-secondary block mb-1">{label}</label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-left flex items-center justify-between transition-colors hover:border-primary/50 focus:border-primary outline-none"
            >
                <span className={selectedValues.length === 0 ? 'text-text-secondary' : 'text-white'}>
                    {displayText}
                </span>
                <ChevronDown size={16} className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {/* Opción "Todos" */}
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary/10 transition-colors"
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedValues.length === 0 ? 'bg-primary border-primary' : 'border-border'}`}>
                            {selectedValues.length === 0 && <Check size={12} className="text-white" />}
                        </div>
                        <span className={selectedValues.length === 0 ? 'text-primary font-medium' : 'text-white'}>
                            {placeholder}
                        </span>
                    </button>

                    <div className="border-t border-border" />

                    {/* Opciones individuales */}
                    {options.map(option => {
                        const isSelected = selectedValues.includes(option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleToggle(option.value)}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary/10 transition-colors"
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-border'}`}>
                                    {isSelected && <Check size={12} className="text-white" />}
                                </div>
                                <span className={isSelected ? 'text-primary font-medium' : 'text-white'}>
                                    {option.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MultiSelectFilter;
