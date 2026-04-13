import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Login from './pages/Login'
import RecuperarContrasena from './pages/RecuperarContrasena'
import ResetPassword from './pages/ResetPassword'
import AuthRedirect from './pages/AuthRedirect'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

// Lazy loading de rutas — cada página se carga solo cuando el usuario navega a ella
const Dashboard = lazy(() => import('./pages/Dashboard'))
const RegistroAlumno = lazy(() => import('./pages/alumnos/RegistroAlumno'))
const ListaAlumnos = lazy(() => import('./pages/alumnos/ListaAlumnos'))
const DetalleAlumno = lazy(() => import('./pages/alumnos/DetalleAlumno'))
const AlumnosArchivados = lazy(() => import('./pages/alumnos/AlumnosArchivados'))
const Cumpleanos = lazy(() => import('./pages/alumnos/Cumpleanos'))
const Estadisticas = lazy(() => import('./pages/Estadisticas'))
const AdminUsuarios = lazy(() => import('./pages/admin/AdminUsuarios'))
const Configuraciones = lazy(() => import('./pages/admin/Configuraciones'))
const PanelEscuela = lazy(() => import('./pages/admin/PanelEscuela'))
const GestorSucursales = lazy(() => import('./pages/admin/GestorSucursales'))
const Asistencia = lazy(() => import('./pages/Asistencia'))

import { useAlumnosRealtime } from './hooks/useAlumnosRealtime'

// Componente de carga reutilizable para Suspense
const PageLoader = () => (
    <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-text-secondary text-sm">Cargando...</p>
        </div>
    </div>
)

function App() {
    useAlumnosRealtime(); // Activar cache invalidation realtime silent

    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <Suspense fallback={<PageLoader />}>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            {/* Receptor SSO desde SaaSport — debe ser público (sin ProtectedRoute) */}
                            <Route path="/auth-redirect" element={<AuthRedirect />} />

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
                                <ProtectedRoute allowedRoles={['SuperAdministrador', 'Administrador', 'Dueño']}>
                                    <Estadisticas />
                                </ProtectedRoute>
                            } />

                            <Route path="/admin/configuraciones" element={
                                <ProtectedRoute allowedRoles={['SuperAdministrador', 'Administrador', 'Dueño']}>
                                    <Configuraciones />
                                </ProtectedRoute>
                            } />

                            <Route path="/admin/usuarios" element={
                                <ProtectedRoute allowedRoles={['SuperAdministrador', 'Dueño']}>
                                    <AdminUsuarios />
                                </ProtectedRoute>
                            } />

                            <Route path="/admin/escuela" element={
                                <ProtectedRoute allowedRoles={['SuperAdministrador', 'Dueño']}>
                                    <PanelEscuela />
                                </ProtectedRoute>
                            } />

                            <Route path="/admin/sucursales" element={
                                <ProtectedRoute allowedRoles={['SuperAdministrador', 'Dueño']}>
                                    <GestorSucursales />
                                </ProtectedRoute>
                            } />

                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Suspense>
                </Router>
            </ToastProvider>
        </AuthProvider>
    )
}

export default App
