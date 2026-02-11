import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    fullWidth = false,
    loading = false,
    disabled = false,
    className = '',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';

    const variants = {
        primary: 'bg-primary text-white hover:bg-orange-600', // Assuming primary is orange/primary color
        secondary: 'bg-surface text-white border border-border hover:bg-neutral-800',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
    };

    const sizes = 'h-10 py-2 px-4';

    return (
        <button
            className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                </span>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;
