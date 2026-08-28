## 4. Reglas de Lógica de Negocio (Líneas Rojas)

Este apartado define **las reglas que no se pueden romper bajo ninguna circunstancia**.

Estas son las validaciones críticas que garantizan la integridad de los datos y el correcto funcionamiento del negocio.

Toda funcionalidad implementada debe respetar estas reglas. Si el agente AI detecta que una solicitud viola alguna de estas reglas, **debe advertirlo explícitamente** antes de proceder.

---

## Principio Fundamental

> **La "fuente de la verdad" es sagrada.**  
> Los datos en AsiSport deben ser confiables para que los entrenadores puedan tener conversaciones objetivas con los padres.

Cualquier validación que comprometa la confiabilidad de los datos **debe ser tratada como crítica**.

---

## Reglas por Categoría

### 1. Autenticación y Seguridad

#### Regla #1: Autenticación Obligatoria
**Descripción:**  
Ninguna acción del sistema puede ejecutarse sin autenticación válida.

**Validación:**
- Todas las operaciones deben verificar que existe una sesión activa de Supabase
- Si la sesión expiró o no existe, redirigir al login
- No se permite ninguna operación sobre datos sin usuario autenticado

**Mensaje de error:**
> "Sesión expirada. Por favor, inicia sesión nuevamente."

---

#### Regla #17: Aislamiento por Escuela
**Descripción:**  
Cada escuela es un ecosistema completamente aislado. Los usuarios no pueden acceder a datos de otras escuelas.

**Validación:**
- Cada usuario pertenece a UNA sola escuela de forma permanente
- Un usuario NO puede cambiar de escuela
- Un usuario NO puede ver datos de otras escuelas
- Si una persona trabaja en múltiples escuelas, debe tener cuentas separadas (una por escuela)
- Solo el Super Administrador puede crear, habilitar o deshabilitar usuarios de su escuela

**Implementación técnica:**
```javascript
// Todas las consultas deben filtrar por escuela del usuario
const { data } = await supabase
  .from('alumnos')
  .select('*')
  .eq('escuela_id', user.escuela_id); // OBLIGATORIO
```

**Mensaje de error:**
> "No tienes permiso para acceder a datos de otra escuela."

---

### 2. Gestión de Alumnos

#### Regla #7: Campos Obligatorios de Alumnos
**Descripción:**  
Los siguientes campos son obligatorios al crear un alumno:

**Siempre obligatorios:**
- Nombres
- Apellidos
- Fecha de Nacimiento
- Cancha de entrenamiento (selección de lista predefinida)
- Hora de entrenamiento (selección de lista predefinida)
- Entrenadores asignados (mínimo 1, máximo 3)

**Validación:**
- El sistema debe validar que estos campos no estén vacíos antes de guardar
- Las listas de Cancha y Horario son específicas de cada escuela (Regla #18)

**Mensaje de error:**
> "Faltan campos obligatorios: [lista de campos faltantes]"









---

#### Regla #8: Validación de Representante Legal
**Descripción:**  
Debe existir al menos UN representante legal completo (Padre o Madre con nombre + teléfono).

**Validación:**
- Si hay "Nombre del Padre" → "Teléfono Padre" es obligatorio
- Si hay "Nombre de la Madre" → "Teléfono Madre" es obligatorio
- Al menos uno de los dos (Padre o Madre) debe estar completo

**Lógica de validación:**
```javascript
const tieneRepresentante = 
  (nombrePadre && telefonoPadre) || (nombreMadre && telefonoMadre);

if (!tieneRepresentante) {
  // Error: debe haber al menos un representante completo
}
```

**Mensaje de error:**
> "Debe registrar al menos un representante legal completo (Padre o Madre con nombre y teléfono)."

---

#### Regla #9: Carnet de Identidad para Aprobación
**Descripción:**  
El Carnet de Identidad es obligatorio para que un administrador pueda aprobar el registro del alumno.

**Validación:**
- Un alumno puede crearse sin CI (queda en estado "Pendiente")
- Para pasar a estado "Aprobado", el CI es OBLIGATORIO

**Mensaje de error al intentar aprobar sin CI:**
> "No se puede aprobar el alumno sin Carnet de Identidad."

---

#### Regla #10: Foto en Formato Cuadrado
**Descripción:**  
Las fotos de alumnos deben ser cuadradas (proporción 1:1).

**Validación:**
- El sistema debe aceptar fotos cuadradas de cualquier tamaño
- Redimensionarlas automáticamente a 400x400 píxeles (tamaño máximo)
- Rechazar fotos que no sean cuadradas

**Implementación sugerida:**
- Validar que `ancho === alto`
- Redimensionar a 400x400 antes de guardar en Storage
- Comprimir si es necesario para optimizar carga

**Mensaje de error:**
> "La foto debe tener formato cuadrado (misma altura y anchura)."

---

#### Regla #11: Estados de Inscripción
**Descripción:**  
Un alumno puede tener dos estados de inscripción: "Pendiente" o "Aprobado".

**Comportamiento:**
- **Estado Pendiente:**
  - Puede recibir registros de asistencia normalmente
  - Puede ser convocado a partidos (con advertencia)
  - Debe mostrar una señal visual clara y fácilmente identificable (badge, color, ícono)

- **Estado Aprobado:**
  - Funcionamiento normal sin advertencias

**Validación al convocar a un alumno Pendiente:**
```javascript
if (alumno.estado === 'Pendiente') {
  mostrarAdvertencia(
    'Este alumno aún no está aprobado por administración. ¿Deseas convocarlo igual?'
  );
}
```

**Señales visuales requeridas:**
- Badge o etiqueta "Pendiente" visible en:
  - Listas de alumnos
  - Tarjetas de alumno
  - Formularios de convocatoria

---

#### Regla #12: Validación para Aprobar Alumnos
**Descripción:**  
Un alumno solo puede pasar de "Pendiente" a "Aprobado" si tiene TODOS los campos obligatorios completos.

**Campos requeridos para aprobación:**
- Nombres, Apellidos, Fecha de Nacimiento
- Carnet de Identidad
- Al menos un representante legal completo (Padre o Madre con nombre + teléfono)
- Cancha de entrenamiento, Hora de entrenamiento
- Al menos un Entrenador asignado
- Foto en formato cuadrado (400x400)

**Validación:**
```javascript
function puedeAprobar(alumno) {
  return alumno.nombres &&
         alumno.apellidos &&
         alumno.fecha_nacimiento &&
         alumno.carnet_identidad &&
         tieneRepresentanteLegal(alumno) &&
         alumno.cancha_id &&
         alumno.horario_id &&
         alumno.entrenadores.length >= 1 &&
         alumno.foto_url;
}
```

**Mensaje de error si falta algo:**
> "No se puede aprobar. Faltan los siguientes datos: [lista específica de campos faltantes]"

---

#### Regla #15: Asignación de Entrenadores
**Descripción:**  
Un alumno puede tener entre 1 y 3 entrenadores asignados.

**Validación:**
- **Mínimo:** 1 entrenador
- **Máximo:** 3 entrenadores
- Cuando un entrenador registra un alumno, él mismo es asignado automáticamente
- Todos los entrenadores asignados tienen los mismos permisos sobre ese alumno

**Al intentar agregar un cuarto entrenador:**
```javascript
if (alumno.entrenadores.length >= 3) {
  mostrarDialogo(
    'Ya tiene 3 entrenadores asignados (máximo permitido). ¿Deseas reemplazar a alguno?',
    listaEntrenadoresActuales
  );
}
```

**Al intentar remover el último entrenador:**
```javascript
if (alumno.entrenadores.length === 1) {
  error('No se puede remover el único entrenador asignado. Debe haber al menos 1.');
}
```

**Mensaje de error:**
> "Máximo 3 entrenadores permitidos."  
> "Debe haber al menos 1 entrenador asignado."

---

#### Regla #21: Grupos de Entrenamiento
**Descripción:**  
Un grupo se define por la combinación de: Horario + Cancha + Entrenadores asignados.

**Comportamiento:**
- Un entrenador puede estar asignado a múltiples grupos (diferentes horarios/canchas)
- Un grupo puede tener múltiples entrenadores (entre 1 y 3)
- Los alumnos pertenecen a un grupo según su Cancha y Horario de entrenamiento asignados

**Implicación técnica:**
- El "grupo" es implícito, determinado por `cancha_id + horario_id`
- No existe una tabla separada de "grupos" en esta fase del MVP

---

### 3. Permisos por Rol

#### Regla #2: Restricción de Asistencias por Entrenador
**Descripción:**  
Un entrenador solo puede registrar asistencias de alumnos que están asignados a él.

**Validación:**
```javascript
// Verificar que el alumno esté asignado a este entrenador
const alumnoAsignado = alumno.entrenadores.includes(entrenador.id);

if (!alumnoAsignado) {
  error('No puedes registrar asistencia de un alumno que no está asignado a ti.');
}
```

**Mensaje de error:**
> "No tienes permiso para registrar asistencia de este alumno."

---

#### Regla #13: Edición y Eliminación por Entrenador
**Descripción:**  
Un entrenador puede editar o eliminar un alumno SOLO si se cumplen TODAS estas condiciones:

**Condiciones:**
1. El alumno está en estado "Pendiente"
2. El alumno tiene menos de 5 asistencias (sumando tablas: asistencias_normales + asistencias_arqueros)
3. El alumno está asignado a ese entrenador

**Validación:**
```javascript
function puedeEditarOEliminar(entrenador, alumno) {
  const totalAsistencias = 
    alumno.asistencias_normales.length + 
    alumno.asistencias_arqueros.length;
  
  return alumno.estado === 'Pendiente' &&
         totalAsistencias < 5 &&
         alumno.entrenadores.includes(entrenador.id);
}
```

**Si NO cumple:**
- Solo un Administrador o Super Administrador puede editar/eliminar

**Mensaje de error:**
> "No puedes editar/eliminar este alumno. Solo los administradores pueden modificar alumnos Aprobados o con 5+ asistencias."

---

#### Regla #14: Visibilidad de Alumnos por Entrenador
**Descripción:**  
Control de qué alumnos puede ver un entrenador.

**Permisos:**
- ✅ **Ver y gestionar** (asistencias, convocatorias): Solo alumnos asignados a él
- ✅ **Ver (solo lectura)**: Todos los alumnos de su misma escuela
- ❌ **NO puede ver**: Alumnos de otras escuelas

**Implementación técnica:**
```javascript
// Para gestionar (editar, tomar asistencia)
.eq('escuela_id', user.escuela_id)
.contains('entrenadores', [user.id])

// Para solo visualizar
.eq('escuela_id', user.escuela_id)
```

---

### 4. Asistencias

#### Regla #3: No Fechas Futuras
**Descripción:**  
No se pueden registrar asistencias con fechas futuras (solo hoy o fechas pasadas).

**Validación:**
```javascript
const fechaAsistencia = new Date(fecha);
const hoy = new Date();
hoy.setHours(23, 59, 59, 999); // Fin del día de hoy

if (fechaAsistencia > hoy) {
  error('No se pueden registrar asistencias con fechas futuras.');
}
```

**Mensaje de error:**
> "No se pueden registrar asistencias para fechas futuras. Solo hoy o fechas pasadas."

---

#### Regla #5: Límite de Asistencias por Día
**Descripción:**  
Cada alumno puede tener máximo 1 registro de asistencia por día en la tabla `asistencias_normales`.

Los alumnos con `es_arquero = true` pueden registrar además hasta 1 asistencia adicional por día en la tabla `asistencias_arqueros`.

**Validación:**
```javascript
// Para asistencia normal
const yaRegistroHoy = await verificarAsistenciaExistente(
  alumno_id, 
  fecha, 
  'asistencias_normales'
);

if (yaRegistroHoy) {
  error('Ya existe un registro de asistencia para este alumno en esta fecha.');
}

// Para asistencia de arquero
if (!alumno.es_arquero) {
  error('Solo los alumnos marcados como arqueros pueden registrar asistencias en horario de arqueros.');
}

const yaRegistroArqueroHoy = await verificarAsistenciaExistente(
  alumno_id,
  fecha,
  'asistencias_arqueros'
);

if (yaRegistroArqueroHoy) {
  error('Este arquero ya tiene registrada su asistencia de arquero para hoy.');
}
```

**Estructura de datos:**
- Tabla: `asistencias_normales`
  - alumno_id
  - fecha
  - estado (Presente, Licencia, Ausente)
  - entrenador_id (quien registró)

- Tabla: `asistencias_arqueros`
  - alumno_id
  - fecha
  - estado (Presente, Licencia, Ausente)
  - entrenador_id (quien registró)

**Para el cálculo de convocatoria:**
```javascript
// Se suman las asistencias de AMBAS tablas
const totalAsistencias = [
  ...asistenciasNormales,
  ...asistenciasArqueros
];
```

**Mensaje de error:**
> "Ya existe un registro de asistencia para este alumno en esta fecha."  
> "Solo los alumnos marcados como arqueros pueden registrar asistencias en horario de arqueros."

---

#### Regla #6: Restricción de Tabla Asistencias Arqueros
**Descripción:**  
Solo los alumnos con `es_arquero = true` pueden tener registros en la tabla `asistencias_arqueros`.

**Validación:**
```javascript
if (!alumno.es_arquero && tabla === 'asistencias_arqueros') {
  error('Este alumno no está marcado como arquero.');
}
```

**Implementación en base de datos:**
- Considerar agregar un CHECK constraint en PostgreSQL:
```sql
ALTER TABLE asistencias_arqueros
ADD CONSTRAINT solo_arqueros 
CHECK (
  EXISTS (
    SELECT 1 FROM alumnos 
    WHERE alumnos.id = asistencias_arqueros.alumno_id 
    AND alumnos.es_arquero = true
  )
);
```

**Mensaje de error:**
> "Este alumno no está marcado como arquero y no puede tener asistencias de arquero."

---

### 5. Convocatorias a Partidos

#### Regla #4: Criterio de Convocabilidad
**Descripción:**  
Para ser convocable a un partido, un alumno debe tener al menos 3 registros de "Presente" o "Licencia" en los últimos 7 días (contando desde hoy hacia atrás).

**Cálculo:**
```javascript
function esConvocable(alumno) {
  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  
  // Sumar asistencias de ambas tablas
  const asistenciasRecientes = [
    ...alumno.asistencias_normales,
    ...alumno.asistencias_arqueros
  ].filter(a => {
    const fechaAsistencia = new Date(a.fecha);
    return fechaAsistencia >= hace7Dias &&
           (a.estado === 'Presente' || a.estado === 'Licencia');
  });
  
  return asistenciasRecientes.length >= 3;
}
```

**Si NO cumple el criterio:**
- El sistema muestra una advertencia
- Permite al entrenador convocarlo de todas formas (decisión final del entrenador)

**Advertencia a mostrar:**
```javascript
if (!esConvocable(alumno)) {
  mostrarAdvertencia(
    `${alumno.nombres} ${alumno.apellidos} tiene solo ${asistenciasRecientes.length} asistencias en los últimos 7 días (se requieren 3). ¿Deseas convocarlo de todas formas?`
  );
}
```

**Estados de asistencia:**
- ✅ **Presente** → cuenta para convocatoria
- ✅ **Licencia** → cuenta para convocatoria
- ❌ **Ausente** → NO cuenta para convocatoria

---

### 6. Eliminación y Archivo

#### Regla #16: Archivo de Alumnos Eliminados
**Descripción:**  
Cuando se elimina un alumno, sus datos se mueven a una tabla de archivo (no se borran físicamente).

**Comportamiento:**
- El alumno ya no aparece en listados activos
- Sus datos históricos (incluyendo asistencias) se preservan completamente
- Puede ser restaurado posteriormente con todos sus datos
- Los entrenadores pueden ver sus propios alumnos archivados
- Los administradores pueden ver todos los alumnos archivados de la escuela

**Al restaurar un alumno:**
- Vuelve con el mismo estado que tenía antes de ser archivado (Pendiente o Aprobado)
- Todas sus asistencias históricas se mantienen

**Implementación sugerida:**
- Agregar campo `archivado` (boolean) en tabla `alumnos`
- O tabla separada `alumnos_archivados`

**Visibilidad:**
```javascript
// Entrenador ve sus alumnos archivados
.eq('archivado', true)
.eq('escuela_id', user.escuela_id)
.contains('entrenadores', [user.id])

// Administrador ve todos los archivados de la escuela
.eq('archivado', true)
.eq('escuela_id', user.escuela_id)
```

---

### 7. Datos Maestros

#### Regla #18: Canchas y Horarios por Escuela
**Descripción:**  
Las canchas y horarios son específicos de cada escuela.

**Gestión:**
- Cada escuela gestiona su propio catálogo de:
  - Canchas de entrenamiento
  - Horarios disponibles

**Permisos:**
- Solo usuarios con rol de **Administrador** o **Super Administrador** pueden:
  - Crear canchas/horarios
  - Editar canchas/horarios
  - Eliminar canchas/horarios

**Validación:**
```javascript
// Al crear/editar cancha u horario
if (user.rol !== 'Administrador' && user.rol !== 'SuperAdministrador') {
  error('Solo los administradores pueden gestionar canchas y horarios.');
}

// Siempre vincular a la escuela del usuario
.insert({
  nombre: nombreCancha,
  escuela_id: user.escuela_id // OBLIGATORIO
})
```

**Mensaje de error:**
> "Solo los administradores pueden gestionar canchas y horarios."

---

#### Regla #19: Usuarios y Número de WhatsApp
**Descripción:**  
El número de WhatsApp es obligatorio al crear usuarios (entrenadores, administradores, super administradores).

**Validación:**
- Sin número de WhatsApp válido, no se puede crear el usuario
- El número se usa para enviar notificaciones de cumpleaños

**Formato esperado:**
- Número internacional completo (ej: +59177123456)
- Validar formato antes de guardar

**Mensaje de error:**
> "El número de WhatsApp es obligatorio. Ingresa un número válido en formato internacional (ej: +59177123456)."

---

### 8. Notificaciones y Cumpleaños

#### Regla #19 (continuación): Notificaciones de Cumpleaños
**Descripción:**  
El sistema debe enviar notificaciones de cumpleaños vía WhatsApp a las 10:00 AM (zona horaria de la escuela).

**Destinatarios:**
- **Cada entrenador:** Lista de cumpleañeros de sus alumnos asignados ese día
- **Administradores y Super Administrador:** Lista de todos los cumpleañeros de la escuela ese día

**Reglas de inclusión:**
- ✅ Alumnos en estado "Aprobado"
- ✅ Alumnos en estado "Pendiente"
- ❌ Alumnos "Archivados" (NO se notifican)

**Implementación sugerida:**
- Cron job o función programada (Supabase Edge Functions)
- Se ejecuta diariamente a las 10:00 AM
- Filtra alumnos cuyo `fecha_nacimiento` (día y mes) coincida con hoy
- Agrupa por entrenador y envía mensaje personalizado vía API de WhatsApp

**Ejemplo de mensaje:**
```
¡Buenos días! 🎉
Hoy cumplen años:
- Juan Pérez (cumple 12 años)
- María López (cumple 10 años)

¡No olvides felicitarlos!
```

---

### 9. Funcionalidades Deshabilitadas en MVP

#### Regla #22: Condiciones Físicas No Habilitadas
**Descripción:**  
La funcionalidad de "condiciones físicas del niño" NO está habilitada en esta fase de MVP.

**Restricción para el agente AI:**
- NO debe implementar código relacionado con condiciones físicas
- NO debe sugerir funcionalidades de condiciones físicas
- Si el usuario lo solicita, el agente debe responder:

> "La funcionalidad de condiciones físicas no está habilitada en esta fase del MVP según las reglas del proyecto. ¿Deseas que lo documentemos para una fase futura?"

---

## Validaciones Cruzadas (Reglas que se Relacionan)

### Validación al Crear Asistencia
```javascript
async function validarCreacionAsistencia(alumno, fecha, tipo, entrenador) {
  // Regla #1: Usuario autenticado
  if (!entrenador) throw new Error('Sesión expirada');
  
  // Regla #2: Alumno asignado al entrenador
  if (!alumno.entrenadores.includes(entrenador.id)) {
    throw new Error('No tienes permiso para este alumno');
  }
  
  // Regla #17: Mismo ecosistema (escuela)
  if (alumno.escuela_id !== entrenador.escuela_id) {
    throw new Error('Alumno de otra escuela');
  }
  
  // Regla #3: No fechas futuras
  const hoy = new Date();
  if (new Date(fecha) > hoy) {
    throw new Error('No se permiten fechas futuras');
  }
  
  // Regla #5: Límite por día
  const yaRegistrado = await existeAsistencia(alumno.id, fecha, tipo);
  if (yaRegistrado) {
    throw new Error('Ya existe asistencia para esta fecha');
  }
  
  // Regla #6: Solo arqueros en tabla de arqueros
  if (tipo === 'arquero' && !alumno.es_arquero) {
    throw new Error('Solo arqueros pueden registrar aquí');
  }
  
  return true;
}
```

### Validación al Aprobar Alumno
```javascript
async function validarAprobacion(alumno, usuario) {
  // Regla #1: Usuario autenticado
  if (!usuario) throw new Error('Sesión expirada');
  
  // Solo admin puede aprobar
  if (usuario.rol !== 'Administrador' && usuario.rol !== 'SuperAdministrador') {
    throw new Error('Solo administradores pueden aprobar');
  }
  
  // Regla #12: Todos los campos obligatorios
  const camposFaltantes = [];
  
  if (!alumno.nombres) camposFaltantes.push('Nombres');
  if (!alumno.apellidos) camposFaltantes.push('Apellidos');
  if (!alumno.fecha_nacimiento) camposFaltantes.push('Fecha de Nacimiento');
  if (!alumno.carnet_identidad) camposFaltantes.push('Carnet de Identidad');
  if (!alumno.cancha_id) camposFaltantes.push('Cancha');
  if (!alumno.horario_id) camposFaltantes.push('Horario');
  if (!alumno.foto_url) camposFaltantes.push('Foto');
  if (!alumno.entrenadores || alumno.entrenadores.length === 0) {
    camposFaltantes.push('Entrenador asignado');
  }
  
  // Regla #8: Representante legal
  const tieneRepresentante = 
    (alumno.nombre_padre && alumno.telefono_padre) ||
    (alumno.nombre_madre && alumno.telefono_madre);
  
  if (!tieneRepresentante) {
    camposFaltantes.push('Representante legal (Padre o Madre completo)');
  }
  
  if (camposFaltantes.length > 0) {
    throw new Error(
      `No se puede aprobar. Faltan: ${camposFaltantes.join(', ')}`
    );
  }
  
  return true;
}
```

---

## Mensajes de Error Estandarizados

Para mantener consistencia en toda la aplicación, usar estos mensajes exactos:

### Autenticación
- `"Sesión expirada. Por favor, inicia sesión nuevamente."`
- `"No tienes permiso para realizar esta acción."`

### Alumnos
- `"Faltan campos obligatorios: [lista]"`
- `"Debe registrar al menos un representante legal completo."`
- `"La foto debe tener formato cuadrado (misma altura y anchura)."`
- `"No se puede aprobar. Faltan los siguientes datos: [lista]"`

### Asistencias
- `"No se pueden registrar asistencias para fechas futuras."`
- `"Ya existe un registro de asistencia para este alumno en esta fecha."`
- `"Solo los alumnos marcados como arqueros pueden registrar asistencias en horario de arqueros."`

### Convocatorias
- `"[Nombre] tiene solo [N] asistencias en los últimos 7 días (se requieren 3). ¿Deseas convocarlo de todas formas?"`
- `"Este alumno aún no está aprobado por administración. ¿Deseas convocarlo igual?"`

### Permisos
- `"No tienes permiso para registrar asistencia de este alumno."`
- `"No puedes editar/eliminar este alumno. Solo los administradores pueden modificar alumnos Aprobados o con 5+ asistencias."`
- `"Solo los administradores pueden gestionar canchas y horarios."`

### Entrenadores
- `"Máximo 3 entrenadores permitidos."`
- `"Debe haber al menos 1 entrenador asignado."`

### WhatsApp
- `"El número de WhatsApp es obligatorio. Ingresa un número válido en formato internacional."`

---

## Protocolo para el Agente AI

Cuando el agente detecte una violación potencial de estas reglas:

1. **Advertir explícitamente:**
   ```
   ⚠️ ADVERTENCIA: Esta acción violaría la Regla #[X]: [nombre de la regla]
   
   [Explicación del problema]
   
   ¿Deseas que busque una alternativa que respete las reglas del proyecto?
   ```

2. **Proponer alternativa:**
   - Sugerir cómo lograr el objetivo sin violar la regla
   - Referenciar qué otra funcionalidad podría ser más adecuada

3. **Documentar excepciones:**
   - Si el usuario insiste en algo que viola una regla
   - El agente debe documentarlo claramente en el código con comentarios:
   ```javascript
   // EXCEPCIÓN A REGLA #X
   // Solicitado por: [usuario]
   // Fecha: [fecha]
   // Justificación: [razón]
   ```

---

## Regla de Oro Final

> **Si una validación afecta la "fuente de la verdad" de los datos, es una línea roja.**  
> **El agente debe implementar estas validaciones TANTO en frontend (UX) como en backend/base de datos (seguridad).**

Validación en dos niveles:
1. **Frontend (React):** Para experiencia de usuario (mensajes claros, prevención)
2. **Backend (Supabase RLS + Triggers):** Para garantizar integridad (seguridad real)

Nunca confiar solo en validaciones de frontend.