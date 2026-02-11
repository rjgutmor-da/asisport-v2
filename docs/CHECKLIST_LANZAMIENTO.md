# 🚀 Checklist de Lanzamiento - Primer Cliente (B2B)

Este documento detalla los pasos técnicos y operativos para dar de alta a una nueva escuela en la plataforma AsiSport (versión MVP).

---

## 1. Preparación de Datos (El "Modo Dios")

### A. Crear la Escuela
Como aún no tenemos un panel de Superadmin, esto se hace directo en la base de datos:
1.  **Entrar a Supabase** > Table Editor > `escuelas`.
2.  **Insertar Fila**:
    -   `nombre`: "Nombre de la Escuela"
    -   `slug`: "nombre-escuela" (sin espacios, minúsculas)
    -   `activo`: TRUE
3.  **Copiar el UUID**: Guardar el `id` generado. Lo necesitarás para todo lo demás.

### B. Configuración de Entorno (Solo MVP)
Para este primer cliente, la aplicación debe "apuntar" a su escuela.
1.  **Actualizar .env**:
    ```env
    VITE_ESCUELA_ID=uuid-de-la-nueva-escuela
    ```
2.  **Redesplegar Frontend**: Si la app está en Vercel/Netlify, asegurar que la variable de entorno se actualice en el despliegue.

---

## 2. Alta de Usuarios (Staff)

### A. Crear Cuentas (Auth)
Para cada miembro del equipo (Dueño, Admins, Entrenadores):
1.  **Supabase** > Authentication > Users > **Invite User**.
2.  Ingresar el correo electrónico del usuario.

### B. Asignar Roles y Escuela
Una vez creado el usuario en Auth, ir a la tabla `public.usuarios`:
1.  Buscar el registro recién creado (por correo o ID).
2.  **Editar Fila**:
    -   `escuela_id`: Pegar el UUID de la escuela creada en el paso 1.
    -   `rol`: Seleccionar 'Superadmin', 'Administrador' o 'Entrenador'.
    -   `nombres` y `apellidos`: Completar si se tiene la información.

---

## 3. Importación Masiva de Alumnos (Opcional)

Si el cliente entrega una lista en Excel:

### A. Preparar el Archivo
1.  **Columnas Obligatorias** (Encabezados exactos):
    -   `nombres`
    -   `apellidos`
    -   `fecha_nacimiento` (Formato YYYY-MM-DD)
    -   `escuela_id` (Pegar el UUID en todas las filas)
2.  **Limpieza**: Eliminar columnas extrañas.
3.  **Exportar**: Guardar como archivo **CSV (Delimitado por comas)**.

### B. Subir a Supabase
1.  **Supabase** > Table Editor > `alumnos`.
2.  Click en **Insert** > **Import Data from CSV**.
3.  Arrastrar el archivo y verificar el mapeo de columnas.
4.  Confirmar importación.

---

## 4. Entrega al Cliente

### Paquete de Bienvenida
Enviar un correo/mensaje al Dueño con:
1.  **URL de Acceso**: (Ej: `https://app.asisport.com`)
2.  **Credenciales**: Usuario y Contraseña temporal.
3.  **Guía de Usuario**: Adjuntar el PDF o enlace a la documentación.

### Verificación Final
- [ ] El Dueño puede iniciar sesión.
- [ ] El Dueño ve el nombre de su escuela.
- [ ] El Dueño ve la lista de alumnos cargada (si aplica).
