# Plan de Implementación: Escuela de Fútbol Planeta FC

Este documento detalla los pasos para configurar e implementar la instancia para el cliente "Planeta FC".

**ESTADO ACTUAL**: En espera de despliegue a producción.

## 0. Prerrequisito: Despliegue en Producción (Vercel)

Antes de entregar cualquier credencial, la aplicación debe estar accesible en internet.

### A. Preparación del Proyecto
1.  Asegúrate de que todo el código esté subido a tu repositorio de GitHub.
2.  (Opcional) Crea un archivo `vercel.json` en la raíz si tienes problemas con las rutas al recargar la página:
    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```

### B. Configuración en Vercel
1.  Entra a [Vercel](https://vercel.com) e inicia sesión.
2.  Haz clic en **"Add New Project"** e importa tu repositorio de GitHub `AsiSportv2`.
3.  En la sección **Environment Variables**, debes agregar las variables de Supabase:
    *   `VITE_SUPABASE_URL`: (Tu URL de Supabase)
    *   `VITE_SUPABASE_ANON_KEY`: (Tu Anon Key de Supabase)
4.  Haz clic en **Deploy**.

*Resultado esperado*: Obtendrás una URL pública (ej: `asisport-v2.vercel.app`) que será la que use el cliente.

---

## 1. Configuración de la Escuela y Usuario Administrador

El sistema requiere que cada usuario pertenezca a una "Escuela".

### A. Crear la Escuela en Base de Datos
Debemos insertar un registro en la tabla `public.escuelas`.

**Opción 1: SQL Editor de Supabase**
Ejecuta el siguiente comando SQL en el Dashboard de Supabase:

```sql
INSERT INTO public.escuelas (nombre, direccion, telefono, email, activo)
VALUES ('Escuela de Fútbol Planeta FC', 'Dirección del Cliente', 'Teléfono del Cliente', 'contacto@planetafc.com', true);
```
*Guarda el ID (UUID) que se genera.*

### B. Crear el Usuario Administrador (Dueño/Director)
Usa el script `crear_usuario_test.js` modificado con el ID de la nueva escuela.

1.  Edita `crear_usuario_test.js`:
    *   `const escuelaId = 'PEGA_AQUI_EL_UUID_DE_PLANETA_FC';`
    *   Usuario: `director@planetafc.com` (o el que el cliente te haya dado)
    *   Password: Una contraseña temporal segura.
2.  Ejecuta: `node crear_usuario_test.js`.

*Entregable*: URL de Vercel + Credenciales de acceso.

## 2. Configuración Operativa (Infraestructura)

**IMPORTANTE**: Antes de importar alumnos, entra con la cuenta de administrador recién creada a la URL de Vercel y configura:

1.  **Canchas**: Define los nombres de las canchas físicas (Menú Configuraciones > Canchas).
2.  **Horarios**: Define los bloques de entrenamiento (Menú Configuraciones > Horarios).

> Sin esto, los alumnos quedarán sin grupo asignado.

## 3. Importación Masiva de Alumnos

Una vez configurada la escuela y sus canchas/horarios.

### A. Preparación del CSV
1.  Toma el Excel del cliente.
2.  Asegura las columnas: `Nombres`, `Apellidos`, `Fecha Nacimiento`.
3.  Guárdalo como `alumnos.csv` en la raíz del proyecto.

### B. Ejecución del Script
1.  Edita `scripts/importar_alumnos.js`:
    *   Actualiza `const ESCUELA_ID` con el UUID de Planeta FC.
    *   (Opcional) Si quieres asignar todos a una cancha/horario por defecto, pon sus IDs en `DEFAULT_CANCHA_ID` y `DEFAULT_HORARIO_ID`.
2.  Ejecuta: `node scripts/importar_alumnos.js`.

## 4. Validación Final
1.  Entra a la app (URL Vercel).
2.  Ve a "Lista de Alumnos".
3.  Verifica que aparezcan los datos importados.
