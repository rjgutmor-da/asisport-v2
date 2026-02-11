
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AttendanceChart = ({ data }) => {
    // Procesar datos para el gráfico: Agrupar por fecha
    // Data esperada en prop: array de asistencias

    // Agrupar por fecha
    const chartData = React.useMemo(() => {
        if (!data || data.length === 0) return [];

        const grouped = data.reduce((acc, curr) => {
            const date = curr.fecha; // YYYY-MM-DD
            if (!acc[date]) {
                acc[date] = { date, presentes: 0, ausentes: 0, licencias: 0 };
            }
            if (curr.estado === 'Presente') acc[date].presentes++;
            else if (curr.estado === 'Ausente') acc[date].ausentes++;
            else if (curr.estado === 'Licencia') acc[date].licencias++;
            return acc;
        }, {});

        // Convertir a array y ordenar por fecha
        return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(item => ({
                ...item,
                shortDate: new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
            }));
    }, [data]);

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-surface/50 rounded-lg border border-border/50">
                <p className="text-text-secondary text-sm">No hay datos para mostrar en el gráfico</p>
            </div>
        );
    }

    return (
        <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-white font-bold mb-4">Evolución de Asistencia</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <XAxis
                            dataKey="shortDate"
                            stroke="#9CA3AF"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.375rem', fontSize: '12px' }}
                            itemStyle={{ color: '#E5E7EB' }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar dataKey="presentes" name="Presentes" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="licencias" name="Licencias" stackId="a" fill="#eab308" />
                        <Bar dataKey="ausentes" name="Ausentes" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AttendanceChart;
