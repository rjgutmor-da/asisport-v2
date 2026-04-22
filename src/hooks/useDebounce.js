import { useState, useEffect } from 'react';

/**
 * Hook para debouncing de valores.
 * @param {any} value - Valor a debouncear
 * @param {number} delay - Retraso en ms
 * @returns {any} - Valor debounced
 */
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};
