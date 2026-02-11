
import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

const StatCard = ({ label, value, subtext, trend, icon: Icon, color = "primary" }) => {
    // Colores base para variantes
    const colors = {
        primary: "text-primary bg-primary/10 border-primary/20",
        success: "text-success bg-success/10 border-success/20",
        warning: "text-warning bg-warning/10 border-warning/20",
        error: "text-error bg-error/10 border-error/20",
        info: "text-blue-400 bg-blue-400/10 border-blue-400/20"
    };

    const activeColor = colors[color] || colors.primary;

    return (
        <div className="bg-surface border border-border p-4 rounded-lg flex items-start justify-between shadow-sm hover:border-primary/30 transition-colors">
            <div>
                <p className="text-text-secondary text-xs font-bold uppercase tracking-wider mb-1">
                    {label}
                </p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-black text-white">
                        {value}
                    </h3>
                    {trend && (
                        <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-success' : trend < 0 ? 'text-error' : 'text-text-secondary'}`}>
                            {trend > 0 ? <ArrowUp size={12} /> : trend < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
                            {Math.abs(trend)}%
                        </span>
                    )}
                </div>
                {subtext && (
                    <p className="text-xs text-text-secondary mt-1">
                        {subtext}
                    </p>
                )}
            </div>

            {Icon && (
                <div className={`p-2 rounded-md ${activeColor}`}>
                    <Icon size={20} />
                </div>
            )}
        </div>
    );
};

export default StatCard;
