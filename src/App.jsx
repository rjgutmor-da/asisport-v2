import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RegistroAlumno from './pages/alumnos/RegistroAlumno'
import ListaAlumnos from './pages/alumnos/ListaAlumnos'
import DetalleAlumno from './pages/alumnos/DetalleAlumno'
import AlumnosArchivados from './pages/alumnos/AlumnosArchivados'
import Cumpleanos from './pages/alumnos/Cumpleanos'
import Estadisticas from './pages/Estadisticas'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import Configuraciones from './pages/admin/Configuraciones'
import PanelEscuela from './pages/admin/PanelEscuela'
import Asistencia from './pages/Asistencia'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />

                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/asistencia" element={
                            <ProtectedRoute>
                                <Asistencia />
                            </ProtectedRoute>
                        } />

                        <Route path="/alumnos/registro" element={
                            <ProtectedRoute>
                                <RegistroAlumno />
                            </ProtectedRoute>
                        } />

                        <Route path="/alumnos/:id" element={
                            <ProtectedRoute>
                                <DetalleAlumno />
                            </ProtectedRoute>
                        } />

                        <Route path="/alumnos" element={
                            <ProtectedRoute>
                                <ListaAlumnos />
                            </ProtectedRoute>
                        } />

                        <Route path="/alumnos/archivados" element={
                            <ProtectedRoute>
                                <AlumnosArchivados />
                            </ProtectedRoute>
                        } />

                        <Route path="/alumnos/cumpleanos" element={
                            <ProtectedRoute>
                                <Cumpleanos />
                            </ProtectedRoute>
                        } />

                        <Route path="/estadisticas" element={
                            <ProtectedRoute>
                                <Estadisticas />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin/configuraciones" element={
                            <ProtectedRoute allowedRoles={['SuperAdministrador', 'Administrador', 'Dueño']}>
                                <Configuraciones />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin/usuarios" element={
                            <ProtectedRoute allowedRoles={['Dueño']}>
                                <AdminUsuarios />
                            </ProtectedRoute>
                        } />

                        <Route path="/admin/escuela" element={
                            <ProtectedRoute allowedRoles={['SuperAdministrador']}>
                                <PanelEscuela />
                            </ProtectedRoute>
                        } />

                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
            </ToastProvider>
        </AuthProvider>
    )
}

export default App
