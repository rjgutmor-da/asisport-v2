
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getAlumnos } from '../../../services/alumnos';
import { useToast } from '../../../components/ui/Toast';

export const useCumpleanos = () => {
    const { addToast } = useToast();
    const [alumnos, setAlumnos] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAlumnos();
            setAlumnos(data);
        } catch (error) {
            console.error(error);
            addToast('Error al cargar los alumnos', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const { today, yesterday, tomorrow, upcoming } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const currentMonth = now.getMonth();
        const currentDate = now.getDate();

        // Helper to check if a date matches today (ignoring year)
        const isSameDay = (dateStr, targetMonth, targetDate) => {
            if (!dateStr) return false;
            const [y, m, d] = dateStr.split('-').map(Number);
            return (m - 1) === targetMonth && d === targetDate;
        };

        const todayList = [];
        const yesterdayList = [];
        const tomorrowList = [];
        const upcomingList = [];

        // Calculate Yesterday
        const yDate = new Date(now);
        yDate.setDate(now.getDate() - 1);
        const yMonth = yDate.getMonth();
        const yDay = yDate.getDate();

        // Calculate Tomorrow
        const tDate = new Date(now);
        tDate.setDate(now.getDate() + 1);
        const tMonth = tDate.getMonth();
        const tDay = tDate.getDate();

        // Para "Próximos", definimos un rango (ej: los siguientes 30 días después de mañana)
        const upcomingStart = new Date(tDate);
        upcomingStart.setDate(tDate.getDate() + 1);
        
        const upcomingEnd = new Date(now);
        upcomingEnd.setDate(now.getDate() + 7);

        alumnos.forEach(alumno => {
            if (isSameDay(alumno.fecha_nacimiento, currentMonth, currentDate)) {
                todayList.push(alumno);
            } else if (isSameDay(alumno.fecha_nacimiento, yMonth, yDay)) {
                yesterdayList.push(alumno);
            } else if (isSameDay(alumno.fecha_nacimiento, tMonth, tDay)) {
                tomorrowList.push(alumno);
            } else if (alumno.fecha_nacimiento) {
                // Lógica para ver si cae en el rango de próximos 30 días
                const [y, m, d] = alumno.fecha_nacimiento.split('-').map(Number);
                const bdayThisYear = new Date(now.getFullYear(), m - 1, d);
                const bdayNextYear = new Date(now.getFullYear() + 1, m - 1, d);
                
                // Usamos el que sea más próximo en el futuro
                const nextBday = bdayThisYear >= upcomingStart ? bdayThisYear : bdayNextYear;
                
                if (nextBday >= upcomingStart && nextBday <= upcomingEnd) {
                    upcomingList.push({
                        ...alumno,
                        daysUntil: Math.ceil((nextBday - now) / (1000 * 60 * 60 * 24))
                    });
                }
            }
        });

        // Ordenar próximos por cercanía
        upcomingList.sort((a, b) => a.daysUntil - b.daysUntil);

        return {
            today: todayList,
            yesterday: yesterdayList,
            tomorrow: tomorrowList,
            upcoming: upcomingList
        };
    }, [alumnos]);

    return {
        loading,
        today,
        yesterday,
        tomorrow,
        upcoming,
        refetch: loadData
    };
};
