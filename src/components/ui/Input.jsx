import React, { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className, ...props }, ref) => {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300">
                    {label}
                </label>
            )}
            <input
                className={`
          flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-error ring-error' : 'border-border'}
          ${className || ''}
        `}
                ref={ref}
                {...props}
            />
            {error && (
                <p className="text-sm font-medium text-error">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
