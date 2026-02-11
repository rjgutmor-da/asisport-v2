# ✅ Checklist de Lanzamiento - AsiSport v2

## 🎯 PASO 1: Preparar Producción (1-2 horas)

### Hosting
- [ ] Crear cuenta en Vercel (https://vercel.com) o Netlify (https://netlify.com)
- [ ] Conectar repositorio Git
- [ ] Configurar proyecto

### Variables de Entorno
Configurar en el panel de hosting:
- [ ] `VITE_SUPABASE_URL` = Tu URL de Supabase
- [ ] `VITE_SUPABASE_ANON_KEY` = Tu Anon Key de Supabase

> **Nota:** La escuela se obtiene automáticamente del usuario autenticado (RPC `current_user_escuela_id`). No se necesita configurar manualmente.

### Build
- [ ] Ejecutar localmente: `npm run build`
- [ ] Verificar que no hay errores
- [ ] Desplegar en hosting

### Dominio (Opcional)
- [ ] Configurar dominio personalizado
- [ ] Configurar SSL/HTTPS (automático en Vercel/Netlify)

---

## 🏫 PASO 2: Configurar Escuela (30-45 minutos)

### Crear Escuela en Supabase
1. [ ] Ir a Supabase → Table Editor → `escuelas`
2. [ ] Click en "Insert" → "Insert row"
3. [ ] Completar:
   - `nombre`: "Nombre de la Escuela del Cliente"
   - `slug`: "nombre-escuela-cliente" (sin espacios, minúsculas)
   - `activo`: TRUE
4. [ ] Guardar y **COPIAR EL UUID** generado
5. [ ] Actualizar `VITE_ESCUELA_ID` en el hosting con este UUID

### Configurar Canchas
1. [ ] Ir a Supabase → Table Editor → `canchas`
2. [ ] Insertar cada cancha:
   - `nombre`: "Cancha 1" (o nombre real)
   - `escuela_id`: UUID de la escuela
   - `activo`: TRUE
3. [ ] Repetir para todas las canchas

### Configurar Horarios
1. [ ] Ir a Supabase → Table Editor → `horarios`
2. [ ] Insertar cada horario:
   - `hora_inicio`: "16:00:00" (formato HH:MM:SS)
   - `hora_fin`: "17:30:00"
   - `escuela_id`: UUID de la escuela
   - `activo`: TRUE
3. [ ] Repetir para todos los horarios

---

## 👤 PASO 3: Crear SuperAdministrador (15 minutos)

### Opción A: Usando Script (Recomendado)
1. [ ] Abrir terminal en la carpeta del proyecto
2. [ ] Ejecutar: `node crear_superadmin.js`
3. [ ] Seguir las instrucciones del script
4. [ ] Anotar las credenciales generadas

### Opción B: Manual
1. [ ] Ir a Supabase → Authentication → Users
2. [ ] Click en "Invite User"
3. [ ] Ingresar correo del SuperAdmin
4. [ ] Ir a Table Editor → `usuarios`
5. [ ] Buscar el usuario recién creado
6. [ ] Editar y completar:
   - `escuela_id`: UUID de la escuela
   - `rol`: "SuperAdministrador"
   - `nombres`: Nombre del admin
   - `apellidos`: Apellidos del admin
   - `whatsapp`: Número de teléfono (obligatorio)
7. [ ] Guardar

### Verificar
- [ ] El SuperAdmin puede iniciar sesión en la aplicación
- [ ] Ve el nombre de su escuela
- [ ] Tiene acceso al panel de administración

---

## 👥 PASO 4: Crear Usuarios del Staff (10 min por usuario)

### Desde la Aplicación (Recomendado)
1. [ ] Iniciar sesión como SuperAdmin
2. [ ] Ir a "Administración" → "Gestión de Usuarios"
3. [ ] Click en "Crear Nuevo Usuario"
4. [ ] Para cada entrenador/admin:
   - Completar nombre, apellidos, correo
   - Agregar WhatsApp (obligatorio)
   - Seleccionar rol (Entrenador o Administrador)
5. [ ] Guardar
6. [ ] Anotar credenciales para enviar al usuario

### Verificar
- [ ] Cada usuario puede iniciar sesión
- [ ] Cada usuario ve su rol correcto
- [ ] Los entrenadores tienen acceso limitado (no ven admin)

---

## 📚 PASO 5: Importar Alumnos (Opcional - 30-60 minutos)

### Si el cliente tiene lista existente:

#### Preparar CSV
1. [ ] Solicitar lista de alumnos al cliente
2. [ ] Crear archivo CSV con columnas:
   - `nombres` (obligatorio)
   - `apellidos` (obligatorio)
   - `fecha_nacimiento` (obligatorio, formato YYYY-MM-DD)
   - `escuela_id` (obligatorio, UUID de la escuela)
   - `ci` (opcional)
   - `telefono` (opcional)
   - `direccion` (opcional)
3. [ ] Verificar que todas las filas tienen `escuela_id`

#### Importar en Supabase
1. [ ] Ir a Supabase → Table Editor → `alumnos`
2. [ ] Click en "Insert" → "Import data from spreadsheet"
3. [ ] Arrastrar archivo CSV
4. [ ] Verificar mapeo de columnas
5. [ ] Click en "Import"
6. [ ] Verificar que se importaron correctamente

#### Asignar Entrenadores (Importante)
1. [ ] Para cada alumno importado, editar:
   - `estado`: "Pendiente" (hasta completar datos)
   - Asignar entrenadores en tabla `alumnos_entrenadores`
2. [ ] O usar la UI para completar datos faltantes

### Si NO hay lista existente:
- [ ] El cliente registrará alumnos manualmente desde la aplicación
- [ ] Capacitar en el proceso de registro

---

## 🎓 PASO 6: Capacitación del Cliente (1-2 horas)

### Preparar Material
- [ ] Convertir `GUIA_USUARIO.md` a PDF
- [ ] Preparar credenciales de todos los usuarios
- [ ] Preparar URL de la aplicación

### Sesión de Capacitación
- [ ] **Login:** Mostrar cómo iniciar sesión
- [ ] **Dashboard:** Explicar las secciones principales
- [ ] **Registro de Alumno:**
  - Completar formulario
  - Tomar/subir foto
  - Agregar representantes
  - Asignar entrenadores, cancha, horario
- [ ] **Asistencia:**
  - Seleccionar fecha
  - Usar filtros (cancha, horario)
  - Marcar Presente/Licencia/Ausente
  - Enviar asistencias
- [ ] **Lista de Alumnos:**
  - Buscar alumnos
  - Ver detalles
  - Usar WhatsApp integrado
- [ ] **Cumpleaños:**
  - Ver cumpleaños del día
  - Enviar felicitaciones por WhatsApp
- [ ] **Estadísticas:**
  - Aplicar filtros
  - Exportar a Excel
- [ ] **Administración (solo SuperAdmin/Admin):**
  - Crear usuarios
  - Gestionar canchas/horarios
  - Aprobar alumnos

### Entregar
- [ ] Enviar PDF de Guía de Usuario
- [ ] Enviar credenciales por correo seguro
- [ ] Enviar URL de la aplicación
- [ ] Dejar canal de soporte abierto

---

## 🧪 PASO 7: Período de Prueba (1-2 semanas)

### Semana 1
- [ ] Cliente usa la aplicación diariamente
- [ ] Monitorear uso y errores
- [ ] Responder dudas rápidamente
- [ ] Recopilar feedback inicial

### Semana 2
- [ ] Verificar que todas las funciones se usan
- [ ] Ajustar configuraciones según necesidad
- [ ] Resolver problemas menores
- [ ] Recopilar feedback final

### Métricas a Monitorear
- [ ] Número de alumnos registrados
- [ ] Número de asistencias tomadas
- [ ] Número de exportaciones de Excel
- [ ] Uso de WhatsApp integrado
- [ ] Errores reportados

---

## 🎉 PASO 8: Cierre y Siguientes Pasos

### Cierre del Lanzamiento
- [ ] Reunión de cierre con el cliente
- [ ] Recopilar satisfacción general
- [ ] Documentar lecciones aprendidas
- [ ] Celebrar el lanzamiento exitoso 🎊

### Planificar Fase 2 (Opcional)
- [ ] Revisar feedback del cliente
- [ ] Priorizar nuevas funcionalidades:
  - ⚽ Convocatorias a partidos
  - 📦 Archivo de alumnos
  - 🔔 Notificaciones automáticas
  - 📈 Reportes avanzados
- [ ] Estimar tiempos de desarrollo
- [ ] Agendar próxima fase

---

## 📞 Soporte Post-Lanzamiento

### Canales de Soporte
- [ ] Definir canal de comunicación (WhatsApp, Email, etc.)
- [ ] Establecer horarios de soporte
- [ ] Definir SLA de respuesta

### Recursos Disponibles
- [ ] `GUIA_USUARIO.md` - Manual completo
- [ ] `RESUMEN_EJECUTIVO.md` - Resumen del proyecto
- [ ] `docs/ESTADO_ACTUAL_Y_PROXIMOS_PASOS.md` - Documentación técnica
- [ ] Scripts de utilidad en la raíz del proyecto

---

## ✅ Verificación Final

Antes de considerar el lanzamiento completo, verificar:

### Funcionalidades
- [ ] Login funciona correctamente
- [ ] Registro de alumnos funciona
- [ ] Carga de fotos funciona
- [ ] Asistencias se guardan correctamente
- [ ] Filtros funcionan en todas las páginas
- [ ] Exportación a Excel funciona
- [ ] WhatsApp integrado funciona
- [ ] Cumpleaños se muestran correctamente
- [ ] Panel de admin funciona (solo para admins)

### Seguridad
- [ ] Solo usuarios autenticados pueden acceder
- [ ] Cada usuario ve solo su escuela
- [ ] Entrenadores ven solo sus alumnos
- [ ] Roles se respetan correctamente

### Rendimiento
- [ ] La aplicación carga rápido
- [ ] Las imágenes se comprimen correctamente
- [ ] No hay errores en consola
- [ ] Funciona bien en móvil

### Documentación
- [ ] Cliente tiene la guía de usuario
- [ ] Cliente tiene las credenciales
- [ ] Cliente sabe cómo contactar soporte

---

## 🎯 Resumen de Tiempos

| Paso | Tiempo Estimado |
|------|-----------------|
| 1. Preparar Producción | 1-2 horas |
| 2. Configurar Escuela | 30-45 minutos |
| 3. Crear SuperAdmin | 15 minutos |
| 4. Crear Staff | 10 min × usuarios |
| 5. Importar Alumnos | 30-60 minutos (opcional) |
| 6. Capacitación | 1-2 horas |
| 7. Período de Prueba | 1-2 semanas |
| **TOTAL** | **~1 día de trabajo + 2 semanas de seguimiento** |

---

**¡Éxito con el lanzamiento! 🚀**

---

**Última Actualización:** 10 de Febrero, 2026  
**Versión:** 1.0
