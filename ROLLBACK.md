# 🔄 Plan de Rollback — Refactorización Multi-Tenant

## Contexto

En febrero 2026 se eliminó `VITE_ESCUELA_ID` y se migró a un sistema dinámico
que obtiene la escuela del usuario autenticado vía RPC `current_user_escuela_id`.

Este documento explica cómo revertir los cambios si es necesario.

---

## Archivos modificados

| Archivo | Cambio realizado |
|---|---|
| `src/services/escuelas.js` | RPC en vez de `VITE_ESCUELA_ID` (3 funciones) |
| `src/services/alumnos.js` | RPC en vez de `VITE_ESCUELA_ID` (3 funciones) |
| `src/services/usuarios.js` | RPC en vez de `VITE_ESCUELA_ID` (1 función) |
| `src/context/AuthContext.jsx` | Expone `escuelaId`, lógica robusta de loading |
| `src/components/layout/ProtectedRoute.jsx` | Chequeo de `escuelaId` huérfano |
| `src/pages/Login.jsx` | Eliminado `alert()` bloqueante |
| `.env` | Eliminada línea `VITE_ESCUELA_ID` |
| `CHECKLIST_PASOS_FINALES.md` | Eliminada referencia a `VITE_ESCUELA_ID` |

---

## Pasos para revertir

### 1. Restaurar `.env`

Agregar al final del archivo `.env`:

```
VITE_ESCUELA_ID=91b2a748-f956-41e7-8efe-075257a0889a
```

### 2. Revertir servicios (escuelas.js, alumnos.js, usuarios.js)

En cada función afectada, reemplazar:

```javascript
// ACTUAL (multi-tenant)
const { data: escuelaId, error: rpcError } = await supabase.rpc('current_user_escuela_id');
if (rpcError || !escuelaId) throw new Error('No se pudo obtener la escuela del usuario.');
```

Por:

```javascript
// ROLLBACK (single-tenant)
const escuelaId = import.meta.env.VITE_ESCUELA_ID;
if (!escuelaId) throw new Error('Error de configuración: VITE_ESCUELA_ID no definido');
```

### 3. Revertir AuthContext.jsx

Eliminar `escuelaId` del valor del contexto y la importación de `useRef`.
Revertir la lógica de `onAuthStateChange` al patrón anterior (con `setLoading(true)`).

### 4. Revertir ProtectedRoute.jsx

Eliminar el bloque `if (!escuelaId)` y quitar `escuelaId` del destructuring de `useAuth()`.

### 5. Verificar

```bash
npm run build   # Debe compilar sin errores
npm run dev     # Verificar login → dashboard
```

---

## Riesgos del rollback

- **Volver a single-tenant**: Solo una escuela por despliegue.
- **VITE_ESCUELA_ID expuesta**: Visible en DevTools del navegador.
- **Redeployment requerido**: Cambiar de escuela requiere redesplegar.

---

## Cuándo hacer rollback

- Si el RPC `current_user_escuela_id` falla sistemáticamente.
- Si hay problemas de rendimiento por las llamadas RPC adicionales.
- Si se necesita volver a producción urgentemente y no hay tiempo para debug.
