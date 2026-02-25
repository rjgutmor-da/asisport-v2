# AsiSport - Gestión de Escuelas Deportivas (MVP)

Bienvenido a **AsiSport**, la solución definitiva para la gestión de asistencias, alumnos y estadísticas de escuelas deportivas. Este proyecto ha sido desarrollado con un enfoque móvil-primero (mobile-first), buscando la máxima eficiencia para entrenadores en campo.

## 🌟 Funcionalidades Principales

### 🔐 Seguridad y Acceso
- **Autenticación con Supabase**: Login seguro para entrenadores y administradores.
- **Control de Acceso**: La información está protegida y filtrada por escuela y entrenador.

### 📋 Gestión de Asistencia
- **Registro Rápido**: Marca asistencias (Presente, Licencia, Ausente) de forma ágil desde el móvil.
- **Filtros Inteligentes**: Filtra por cancha y horario para encontrar rápidamente a tus alumnos.
- **Historial de 7 Días**: Consulta la consistencia de cada alumno en la última semana.
- **Validaciones**: Protección contra registros duplicados o fechas futuras.
- **Acceso Administrativo**: Los Administradores pueden tomar asistencia en nombre de cualquier entrenador, seleccionándolo desde un menú desplegable.

- **WhatsApp Integrado**: Envía mensajes directos a los padres con un solo clic.
- **Asignación Múltiple**: Asigna hasta 2 entrenadores por cada alumno para un seguimiento compartido.
- **Fusión de Duplicados**: Herramienta de combinación inteligente para unir registros de alumnos creados por error, migrando historial de asistencias y datos.
- **Gestión de Fotos**: Edición y actualización de fotos de alumnos en cualquier momento con compresión inteligente.

### 🎂 Cumpleaños
- **Gestión Diaria**: Secciones de cumpleaños Hoy, Ayer y Mañana.
- **Felicitaciones Automáticas**: Botón de WhatsApp con mensaje pre-configurado para felicitar a los alumnos en su día.

### 📊 Estadísticas y Reportes
- **Dashboard de Métricas**: Visualiza rápidamente el total de presentes y licencias.
- **Filtros Avanzados**: Filtrado multi-selección por Entrenador, Cancha, Horario y Categoría (Sub-X).
- **Tabla de Resumen**: Desglose diario de actividad.
- **Exportación a Excel**: Genera reportes detallados por alumno con un solo clic, incluyendo encabezados de los filtros aplicados.

---

## 🛠 Stack Tecnológico

- **Frontend**: React + Vite
- **Estilos**: Vanilla CSS con enfoque Brutalista / Moderno.
- **Iconografía**: Lucide React.
- **Backend / DB**: Supabase (Auth, PostgreSQL, Storage).
- **Lógica de Reportes**: XLSX para generación de Excel.

---

## 🚀 Instalación y Configuración

1.  **Clonar el repositorio**:
    ```bash
    git clone <url-del-repo>
    cd AsiSportv2
    ```

2.  **Instalar dependencias**:
    ```bash
    npm install
    ```

3.  **Configurar Variables de Entorno**:
    Crea un archivo `.env` en la raíz con lo siguiente:
    ```env
    VITE_SUPABASE_URL=tu_url_de_supabase
    VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
    VITE_ESCUELA_ID=id_de_tu_escuela_de_prueba
    ```

4.  **Ejecutar en Desarrollo**:
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

---

## 🧪 Cómo Probar la Aplicación (Modo Manual)

Para asegurar el correcto funcionamiento, sigue estos pasos:

1.  **Login**: Usa las credenciales de administrador proporcionadas.
2.  **Registro de Alumno**: Crea un nuevo alumno en `Registro Alumnos`, asegúrate de completar un representante legal y opcionalmente sube una foto.
3.  **Asistencia**: Ve al módulo `Asistencia`, selecciona la fecha de hoy y marca "Presente" al alumno creado. Haz clic en "Enviar".
4.  **Estadísticas**: Ve a `Estadísticas` y verifica que el alumno aparezca en el conteo total. Prueba exportar el archivo Excel.
5.  **Cumpleaños**: Si registraste al alumno con el cumpleaños de hoy, aparecerá en la sección destacada de `Cumpleaños`.

---

## 🏗 Arquitectura del Proyecto

El proyecto sigue una arquitectura **Monolito Modular**:

-   `src/features/`: Lógica de negocio (Hooks, Componentes específicos).
-   `src/pages/`: Orquestación de vistas principales.
-   `src/services/`: Comunicación centralizada con Supabase.
-   `src/components/`: Componentes UI reutilizables y atómicos.

---

## 📚 Documentación Adicional

Para información más detallada, consulta:

- **[Estado Actual y Próximos Pasos](./docs/ESTADO_ACTUAL_Y_PROXIMOS_PASOS.md)** - Reporte completo del estado del proyecto y roadmap
- **[Estado del MVP](./docs/ESTADO_MVP.md)** - Detalles técnicos de funcionalidades implementadas
- **[Checklist de Lanzamiento](./docs/CHECKLIST_LANZAMIENTO.md)** - Pasos para dar de alta nuevos clientes
- **[Guía de Usuario](./GUIA_USUARIO.md)** - Manual de uso para usuarios finales
- **[Queries de Supabase](./docs/supabase-queries.md)** - Consultas SQL útiles

---

## 🎯 Estado Actual del Proyecto

**Versión:** MVP 1.0  
**Estado:** ✅ **FUNCIONAL - Listo para Producción**

### Módulos Completados (100%)
- ✅ Autenticación y Seguridad
- ✅ Gestión de Alumnos (Registro, Lista, Detalle)
- ✅ Gestión de Asistencias
- ✅ Cumpleaños
- ✅ Estadísticas y Reportes
- ✅ Panel de Administración

### Próximos Pasos
1. 🚀 Desplegar en producción (Vercel/Netlify)
2. 🏫 Configurar primera escuela cliente
3. 👥 Crear usuarios del staff
4. 📊 Período de prueba (1-2 semanas)
5. ⚽ Implementar módulo de Convocatorias (Fase 2)

Para más detalles, consulta [ESTADO_ACTUAL_Y_PROXIMOS_PASOS.md](./docs/ESTADO_ACTUAL_Y_PROXIMOS_PASOS.md)

---

## 🛠 Scripts de Utilidad

El proyecto incluye varios scripts Node.js para tareas administrativas:

```bash
# Crear SuperAdministrador inicial
node crear_superadmin.js

# Sincronizar usuarios de Auth con base de datos
node sincronizar_usuarios.js

# Dar acceso a un usuario específico
node dar_acceso.js

# Resetear base de datos (solo desarrollo)
node reset_database.js
```

---

## 🤝 Soporte y Contribución

Para reportar problemas o solicitar nuevas funcionalidades, contacta al equipo de desarrollo.

---

Este proyecto es propiedad de **AsiSport**. Todos los derechos reservados 2026.
