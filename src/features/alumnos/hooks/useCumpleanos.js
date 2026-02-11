
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

    const { today, yesterday, tomorrow } = useMemo(() => {
        const now = new Date();
        // Reset hours to compare only dates
        now.setHours(0, 0, 0, 0);

        const currentMonth = now.getMonth();
        const currentDate = now.getDate();

        // Helper to check if a date matches today (ignoring year)
        const isSameDay = (dateStr, targetMonth, targetDate) => {
            if (!dateStr) return false;
            // Adjust for timezone offset if necessary, but usually date string yyyy-mm-dd is enough
            // Using standard parsing for "YYYY-MM-DD"
            const [y, m, d] = dateStr.split('-').map(Number);
            // Month is 0-indexed in JS Date, but 1-indexed in string
            return (m - 1) === targetMonth && d === targetDate;
        };

        const todayList = [];
        const yesterdayList = [];
        const tomorrowList = [];

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

        alumnos.forEach(alumno => {
            if (isSameDay(alumno.fecha_nacimiento, currentMonth, currentDate)) {
                todayList.push(alumno);
            } else if (isSameDay(alumno.fecha_nacimiento, yMonth, yDay)) {
                yesterdayList.push(alumno);
            } else if (isSameDay(alumno.fecha_nacimiento, tMonth, tDay)) {
                tomorrowList.push(alumno);
            }
        });

        return {
            today: todayList,
            yesterday: yesterdayList,
            tomorrow: tomorrowList
        };
    }, [alumnos]);

    return {
        loading,
        today,
        yesterday,
        tomorrow,
        refetch: loadData
    };
};
