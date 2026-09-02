import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Users, Cake, UserPlus, Settings, BarChart3, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { can } from '../../config/roles';

const TabBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/dashboard', icon: Home, label: 'Inicio', permission: 'asisport.access' },
        { path: '/asistencia', icon: ClipboardCheck, label: 'Asist.', permission: 'asisport.access' },
        { path: '/alumnos', icon: Users, label: 'Alumnos', permission: 'asisport.access' },
        { path: '/alumnos/registro', icon: UserPlus, label: 'Reg.', permission: 'asisport.access' },
        { path: '/alumnos/cumpleanos', icon: Cake, label: 'Cumple', permission: 'asisport.access' },
        { path: '/estadisticas', icon: BarChart3, label: 'Stats', permission: 'asisport.viewStatistics' },
    ];


    const filteredNavItems = navItems.filter(item => {
        if (role === 'Medico' && (item.path === '/asistencia' || item.path === '/alumnos/registro')) {
            return false;
        }
        return can(role, /** @type {import('../../config/roles').Permission} */ (item.permission));
    });

    if (location.pathname === '/asistencia') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border h-[60px] pb-2 pt-2 px-4 flex justify-between items-center z-50 md:hidden overflow-x-auto">
            {filteredNavItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center gap-1 min-w-[50px] ${active ? 'text-primary' : 'text-text-secondary hover:text-white'} transition-colors`}
                    >
                        <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                        <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default TabBar;
