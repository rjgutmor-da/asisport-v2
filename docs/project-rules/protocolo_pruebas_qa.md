## 6. Protocolo de Pruebas y Calidad (QA)

Este apartado define **cómo el agente debe validar que su trabajo funciona correctamente** antes de considerar una funcionalidad como terminada.

El objetivo NO es testing exhaustivo (esto es un MVP), sino **asegurar que lo crítico funciona en condiciones reales**.

---

## Principio Fundamental de QA

> **"Si no funciona en la grupo con sol y prisa, no está terminado."**

No importa cuán elegante sea el código si falla cuando el entrenador más lo necesita: en la grupo, con prisa, bajo el sol, con manos sudadas.

Todo testing debe simular **condiciones de uso real**, no condiciones de laboratorio.

---

## Prioridades de Testing (en orden)

### 1. 🎯 Usabilidad Básica (CRÍTICO)
**¿Funciona en la grupo?**
- ¿Se ve bien en móvil bajo luz solar directa? (contraste, colores)
- ¿Los botones son fáciles de tocar? (tamaño, espaciado)
- ¿Los mensajes son claros? (sin jerga técnica)
- ¿El flujo es intuitivo? (sin manual de usuario)

**Por qué es #1:** Si el entrenador no puede usarlo en contexto real, el resto no importa.

---

### 2. ⚡ Flujos Críticos de Negocio (MUY IMPORTANTE)
**¿Las acciones principales funcionan?**
- Registrar alumno
- Tomar asistencia
- Convocar a partido
- Aprobar alumno (admin)

**Por qué es #2:** Estos son los 4 flujos que justifican la existencia de AsiSport.

---

### 3. 🚀 Performance (IMPORTANTE)
**¿Funciona con internet lento?**
- Carga inicial < 3 segundos (con 3G)
- Acciones frecuentes < 1 segundo
- Feedback visual mientras carga (spinners, skeletons)
- Manejo de errores de conexión

**Por qué es #3:** Las grupos no siempre tienen WiFi rápido.

---

### 4. 🔒 Seguridad y Permisos (IMPORTANTE)
**¿Los datos están protegidos?**
- Entrenadores solo ven sus alumnos
- Escuelas están aisladas
- No se puede acceder sin login
- Validaciones en backend (no solo frontend)

**Por qué es #4:** Es un MVP de uso interno, pero datos de menores requieren cuidado.

---

### 5. 💾 Integridad de Datos (DESEABLE)
**¿Los datos son confiables?**
- Validaciones funcionan (campos obligatorios, formatos)
- Datos guardados aparecen correctamente
- No se pierden datos en operaciones normales

**Por qué es #5:** Importante, pero se puede corregir después si falla (los datos están en BD).

---

## Enfoque de Testing: Híbrido

AsiSport usa una estrategia **híbrida** de testing:

### Tests Automatizados (Backend y Lógica)
**Para qué:**
- Validaciones críticas de negocio (Reglas del Paso 4)
- Lógica de cálculo (ej: contar asistencias de últimos 7 días)
- Autenticación y permisos
- Integridad de datos

**Herramientas:**
- Vitest (tests unitarios)
- Playwright (tests E2E básicos)

**Cuándo ejecutar:**
- Después de implementar lógica crítica
- Antes de considerar una funcionalidad "terminada"

---

### Tests Manuales (UX y Usabilidad)
**Para qué:**
- Validar que se ve bien en móvil
- Verificar colores y contraste bajo luz solar
- Comprobar que las interacciones son intuitivas
- Probar flujos completos de usuario

**Herramientas:**
- Browser tool de Antigravity
- Dispositivo móvil real (preferido)
- DevTools de Chrome (modo responsive)

**Cuándo ejecutar:**
- Después de implementar cada funcionalidad
- Al finalizar un módulo completo
- Antes de considerar "terminado"

---

## Criterio de "Terminado" (Definition of Done)

Una funcionalidad está **terminada** cuando cumple estos 3 niveles:

### ✅ Nivel 1: Funciona sin errores
- Los campos se pueden llenar
- Los botones responden a clicks
- Las acciones se ejecutan (guardar, eliminar, etc.)
- No hay errores en consola de navegador
- No hay errores en logs de Supabase

---

### ✅ Nivel 2: Validaciones funcionan
- Campos obligatorios se validan correctamente
- Formatos se validan (foto cuadrada, fechas, teléfonos)
- Mensajes de error son claros y amigables
- No se pueden guardar datos inválidos
- Backend valida lo mismo que frontend (seguridad)

---

### ✅ Nivel 3: UX es correcta
- Se ve bien en móvil (colores, tamaño, espaciado)
- Legible bajo luz solar (contraste alto verificado)
- Mensajes siguen el tono de comunicación (Paso 5.2)
- Feedback claro en todas las acciones (loading, success, error)
- Flujo es intuitivo (un entrenador nuevo lo entiende)

---

**Regla de oro:** Si no cumple los 3 niveles, **no está terminado**.

---

## Frecuencia de Testing

### Por Funcionalidad Completa

El agente debe seguir este ciclo:

```
1. Implementar funcionalidad completa
   ↓
2. Escribir tests automatizados (si aplica)
   ↓
3. Ejecutar tests automatizados
   ↓
4. Probar manualmente (browser tool)
   ↓
5. Verificar criterio de "terminado"
   ↓
6. ¿Cumple los 3 niveles?
   ├─ Sí → Funcionalidad terminada ✅
   └─ No → Iterar y arreglar
```

**Ejemplo:**
- ✅ Implementar "Registro de Alumnos" completo (formulario + validaciones + guardado)
- ✅ Probar todo el flujo
- ✅ Pasar a "Lista de Alumnos"
- ❌ NO hacer la mitad del registro, la mitad de la lista, y probar al final

---

### Al Finalizar un Módulo

Después de terminar todas las funcionalidades de un módulo, **probar el flujo completo end-to-end**:

**Ejemplo - Módulo "Gestión de Alumnos":**
1. Registrar un alumno nuevo
2. Ver que aparece en la lista
3. Editar ese alumno
4. Verificar que los cambios se guardaron
5. Archivar ese alumno
6. Verificar que ya no aparece en lista activa
7. Restaurar ese alumno
8. Verificar que volvió a aparecer

**Objetivo:** Asegurar que todas las piezas funcionan juntas, no solo individualmente.

---

## Escenarios de Prueba: Happy + Sad Path

Para cada funcionalidad, probar **dos tipos de escenarios**:

### Happy Path (Camino Feliz) ✅
**Todo funciona como se espera:**

Ejemplo - Registro de Alumno:
1. Llenar todos los campos correctamente
2. Foto cuadrada válida
3. Al menos un representante legal completo
4. Click en "Guardar Alumno"
5. **Verificar:** Mensaje de éxito aparece
6. **Verificar:** Alumno aparece en lista con estado "Pendiente"
7. **Verificar:** Datos guardados coinciden con lo ingresado

---

### Sad Path (Camino Triste) ❌
**Algo sale mal, debe fallar correctamente:**

Ejemplo - Registro de Alumno:

**Caso 1: Campos obligatorios vacíos**
1. Intentar guardar sin llenar "Nombres"
2. **Verificar:** Muestra error "Por favor, completa el nombre del alumno"
3. **Verificar:** No se guarda en la BD
4. **Verificar:** Formulario permanece abierto con datos ingresados

**Caso 2: Foto no cuadrada**
1. Intentar subir foto rectangular (800x600)
2. **Verificar:** Muestra error "La foto debe tener formato cuadrado"
3. **Verificar:** No se sube la foto
4. **Verificar:** Resto del formulario intacto

**Caso 3: Sin representante legal**
1. Llenar nombre, apellido, fecha
2. Dejar vacíos padre Y madre
3. Intentar guardar
4. **Verificar:** Muestra error "Debe registrar al menos un representante legal completo"

**Caso 4: Error de conexión**
1. Llenar formulario correctamente
2. Desconectar internet
3. Hacer click en "Guardar Alumno"
4. **Verificar:** Muestra error "No pudimos conectar. Revisa tu internet y vuelve a intentar."
5. **Verificar:** No se pierde lo que el usuario escribió
6. Reconectar internet
7. Intentar guardar nuevamente
8. **Verificar:** Ahora sí se guarda

---

## Checklist de Pruebas por Funcionalidad

### Registro de Alumnos

#### Tests Automatizados
```javascript
// Archivo: /src/features/alumnos/__tests__/alumnoValidations.test.js

describe('Validaciones de Alumno', () => {
  test('Rechaza alumno sin nombres', () => {
    const alumno = { apellidos: 'Pérez', fecha_nacimiento: '2010-01-01' };
    expect(validarAlumno(alumno)).toHaveError('nombres');
  });
  
  test('Rechaza foto no cuadrada', () => {
    const foto = { width: 800, height: 600 };
    expect(validarFoto(foto)).toBe(false);
  });
  
  test('Acepta foto cuadrada de cualquier tamaño', () => {
    const foto1 = { width: 400, height: 400 };
    const foto2 = { width: 1000, height: 1000 };
    expect(validarFoto(foto1)).toBe(true);
    expect(validarFoto(foto2)).toBe(true);
  });
  
  test('Requiere al menos un representante legal completo', () => {
    const sinRepresentante = { nombres: 'Juan' };
    const padreIncompleto = { nombres: 'Juan', nombre_padre: 'Pedro' }; // falta teléfono
    const padreCompleto = { nombres: 'Juan', nombre_padre: 'Pedro', telefono_padre: '+591771234' };
    
    expect(validarRepresentante(sinRepresentante)).toBe(false);
    expect(validarRepresentante(padreIncompleto)).toBe(false);
    expect(validarRepresentante(padreCompleto)).toBe(true);
  });
});
```

#### Tests Manuales (Browser)

**Happy Path:**
1. Abrir página "Registro de Alumnos"
2. Llenar formulario completo:
   - Nombres: "Juan Carlos"
   - Apellidos: "Pérez Gómez"
   - Fecha Nacimiento: "15/03/2010"
   - CI: "12345678"
   - Nombre Padre: "Pedro Pérez"
   - Teléfono Padre: "+591 77123456"
   - Grupo: "Grupo Norte"
   - Horario: "17:00"
   - Foto: Subir imagen cuadrada 400x400
   - Es Arquero: No marcar
3. Click en "Guardar Alumno"
4. **Verificar:** Mensaje "¡Listo! Juan Carlos Pérez Gómez registrado correctamente ✓"
5. **Verificar:** Redirige a lista de alumnos
6. **Verificar:** Juan Carlos aparece con badge "Pendiente"

**Sad Path:**
1. Intentar guardar sin nombres → Ver error correcto
2. Intentar guardar sin representante → Ver error correcto
3. Subir foto rectangular → Ver error correcto
4. Desconectar internet, intentar guardar → Ver error de conexión

**UX/Usabilidad:**
1. Abrir en móvil (375px width - iPhone SE)
2. **Verificar:** Todos los campos son legibles
3. **Verificar:** Botones son fáciles de tocar (44x44px mínimo)
4. **Verificar:** Mensajes son amigables (no técnicos)
5. **Verificar:** Loading spinner aparece al guardar
6. **Verificar:** Colores siguen paleta del Paso 5

---

### Tomar Asistencia

#### Tests Automatizados
```javascript
// Archivo: /src/features/asistencias/__tests__/asistenciaValidations.test.js

describe('Validaciones de Asistencia', () => {
  test('Rechaza fecha futura', () => {
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);
    expect(validarFechaAsistencia(mañana)).toBe(false);
  });
  
  test('Acepta fecha de hoy', () => {
    const hoy = new Date();
    expect(validarFechaAsistencia(hoy)).toBe(true);
  });
  
  test('Rechaza segunda asistencia normal en mismo día', async () => {
    const alumno = { id: 1 };
    const fecha = '2026-02-02';
    await registrarAsistencia(alumno.id, fecha, 'Presente', 'normal');
    
    const resultado = await registrarAsistencia(alumno.id, fecha, 'Presente', 'normal');
    expect(resultado.error).toBe('Ya existe un registro de asistencia para este alumno en esta fecha.');
  });
  
  test('Permite asistencia de arquero si alumno es arquero', async () => {
    const arquero = { id: 2, es_arquero: true };
    const fecha = '2026-02-02';
    await registrarAsistencia(arquero.id, fecha, 'Presente', 'normal');
    
    const resultado = await registrarAsistencia(arquero.id, fecha, 'Presente', 'arquero');
    expect(resultado.error).toBeUndefined();
  });
  
  test('Rechaza asistencia de arquero si alumno NO es arquero', async () => {
    const noArquero = { id: 3, es_arquero: false };
    const fecha = '2026-02-02';
    
    const resultado = await registrarAsistencia(noArquero.id, fecha, 'Presente', 'arquero');
    expect(resultado.error).toBe('Este alumno no está marcado como arquero.');
  });
});
```

#### Tests Manuales (Browser)

**Happy Path:**
1. Abrir página "Asistencia"
2. Seleccionar fecha de hoy
3. Ver lista de alumnos del grupo
4. Marcar "Juan Carlos" como "Presente"
5. Marcar "María López" como "Ausente"
6. Marcar "Pedro Gómez" (arquero) como "Presente"
7. Click en "Guardar Asistencias"
8. **Verificar:** Mensaje "¡Listo! Asistencias registradas ✓"
9. **Verificar:** Contador de asistencias de Juan se incrementó en 1

**Sad Path:**
1. Intentar registrar asistencia para fecha futura → Ver error
2. Intentar registrar asistencia dos veces para mismo alumno/día → Ver error
3. Intentar marcar asistencia de arquero para alumno que no es arquero → Ver error

**UX/Usabilidad:**
1. **Verificar:** Lista de alumnos se carga en < 2 segundos
2. **Verificar:** Checkboxes/botones de estado son grandes (fáciles de tocar)
3. **Verificar:** Estados tienen colores claros:
   - Verde = Presente
   - Rojo = Ausente
   - Ámbar = Licencia
4. **Verificar:** Badge "Arq" visible para arqueros

---

### Convocatoria a Partido

#### Tests Automatizados
```javascript
// Archivo: /src/features/convocatorias/__tests__/convocatoriaValidations.test.js

describe('Validaciones de Convocatoria', () => {
  test('Calcula correctamente asistencias de últimos 7 días', () => {
    const asistencias = [
      { fecha: '2026-02-01', estado: 'Presente' },
      { fecha: '2026-01-31', estado: 'Presente' },
      { fecha: '2026-01-30', estado: 'Presente' },
      { fecha: '2026-01-20', estado: 'Presente' }, // Hace 13 días - NO cuenta
    ];
    
    const hoy = new Date('2026-02-02');
    const cuenta = contarAsistenciasUltimos7Dias(asistencias, hoy);
    expect(cuenta).toBe(3); // Solo las primeras 3
  });
  
  test('Cuenta Presente y Licencia, NO Ausente', () => {
    const asistencias = [
      { fecha: '2026-02-01', estado: 'Presente' },
      { fecha: '2026-01-31', estado: 'Licencia' },
      { fecha: '2026-01-30', estado: 'Ausente' },
      { fecha: '2026-01-29', estado: 'Presente' },
    ];
    
    const hoy = new Date('2026-02-02');
    const cuenta = contarAsistenciasUltimos7Dias(asistencias, hoy);
    expect(cuenta).toBe(3); // No cuenta Ausente
  });
  
  test('Suma asistencias de ambas tablas (normal + arquero)', () => {
    const asistenciasNormales = [
      { fecha: '2026-02-01', estado: 'Presente' },
    ];
    const asistenciasArquero = [
      { fecha: '2026-01-31', estado: 'Presente' },
      { fecha: '2026-01-30', estado: 'Presente' },
    ];
    
    const hoy = new Date('2026-02-02');
    const cuenta = contarAsistenciasTotales(asistenciasNormales, asistenciasArquero, hoy);
    expect(cuenta).toBe(3);
  });
});
```

#### Tests Manuales (Browser)

**Happy Path:**
1. Abrir página "Convocatoria"
2. Ver lista de alumnos con contador de asistencias
3. Marcar 3 alumnos que tienen 3+ asistencias
4. Click en "Guardar Convocatoria"
5. **Verificar:** Mensaje "¡Listo! Convocatoria guardada ✓"

**Sad Path:**
1. Intentar convocar alumno con solo 1 asistencia
2. **Verificar:** Aparece advertencia: "[Nombre] tiene solo 1 asistencia en los últimos 7 días (se requieren 3). ¿Deseas convocarlo de todas formas?"
3. Click en "Sí, convocar"
4. **Verificar:** Se convoca de todas formas (permitido)
5. Intentar convocar alumno en estado "Pendiente"
6. **Verificar:** Aparece advertencia: "Este alumno aún no está aprobado por administración. ¿Deseas convocarlo de todas formas?"

**UX/Usabilidad:**
1. **Verificar:** Alumnos convocables están claramente diferenciados (visual)
2. **Verificar:** Contador de asistencias visible junto a cada alumno
3. **Verificar:** Advertencias son claras y no bloquean (permiten continuar)

---

### Aprobación de Alumnos (Admin)

#### Tests Automatizados
```javascript
// Archivo: /src/features/alumnos/__tests__/aprobacion.test.js

describe('Aprobación de Alumnos', () => {
  test('No puede aprobar sin CI', () => {
    const alumno = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      fecha_nacimiento: '2010-01-01',
      // CI faltante
      nombre_padre: 'Pedro',
      telefono_padre: '+591771234',
      grupo_id: 1,
      horario_id: 1,
      foto_url: 'http://...',
      entrenadores: [1]
    };
    
    expect(puedeAprobar(alumno)).toBe(false);
  });
  
  test('No puede aprobar sin representante legal', () => {
    const alumno = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      carnet_identidad: '12345678',
      // Sin padre ni madre
    };
    
    expect(puedeAprobar(alumno)).toBe(false);
  });
  
  test('Puede aprobar con todos los campos obligatorios', () => {
    const alumno = {
      nombres: 'Juan',
      apellidos: 'Pérez',
      fecha_nacimiento: '2010-01-01',
      carnet_identidad: '12345678',
      nombre_padre: 'Pedro',
      telefono_padre: '+591771234',
      grupo_id: 1,
      horario_id: 1,
      foto_url: 'http://...',
      entrenadores: [1]
    };
    
    expect(puedeAprobar(alumno)).toBe(true);
  });
});
```

#### Tests Manuales (Browser)

**Happy Path:**
1. Admin abre lista de alumnos pendientes
2. Selecciona "Juan Carlos Pérez" con badge "Pendiente"
3. Verifica que tiene todos los campos llenos
4. Click en "Aprobar Alumno"
5. **Verificar:** Mensaje "¡Listo! Juan Carlos Pérez aprobado ✓"
6. **Verificar:** Badge cambia de "Pendiente" (ámbar) a "Aprobado" (verde)

**Sad Path:**
1. Intentar aprobar alumno sin CI
2. **Verificar:** Error "No se puede aprobar. Faltan los siguientes datos: Carnet de Identidad"
3. Intentar aprobar alumno sin foto
4. **Verificar:** Error lista todos los campos faltantes

---

## Protocolo de Manejo de Bugs

Cuando el agente encuentra un bug durante las pruebas:

### Paso 1: Detener y Documentar
```
🐛 BUG DETECTADO

Funcionalidad: [nombre]
Severidad: [Crítico / Medio / Menor]
Descripción: [qué pasó]
Pasos para reproducir:
1. [paso 1]
2. [paso 2]
3. [resultado incorrecto]

Resultado esperado: [qué debería pasar]
Resultado actual: [qué pasó en realidad]
```

---

### Paso 2: Preguntar al Usuario

El agente debe **preguntar al usuario** qué hacer:

```
Encontré un bug en [funcionalidad]:

[Descripción breve del problema]

¿Qué prefieres que haga?
A) Arreglarlo ahora (detengo las pruebas)
B) Documentarlo y continuar probando (lo arreglo después)
C) Ignorarlo por ahora (no es crítico para el MVP)
```

**Esperar respuesta del usuario antes de continuar.**

---

### Paso 3: Ejecutar Decisión

**Si el usuario elige A (arreglar ahora):**
1. Arreglar el bug
2. Volver a probar esa funcionalidad completa
3. Verificar que se arregló
4. Continuar con las pruebas

**Si el usuario elige B (documentar):**
1. Agregar a archivo `/docs/bugs-pendientes.md`
2. Continuar con las demás pruebas
3. Al final de todas las pruebas, revisar bugs pendientes
4. Arreglarlos en orden de prioridad

**Si el usuario elige C (ignorar):**
1. Agregar a archivo `/docs/bugs-conocidos.md` (para futuras versiones)
2. Continuar con las pruebas

---

## Entorno de Pruebas: Datos de Prueba

### Convención de Datos de Prueba

**Todos los datos de prueba deben estar CLARAMENTE marcados:**

```javascript
// Al crear datos de prueba
const alumnoTest = {
  nombres: 'TEST - Juan',
  apellidos: 'Prueba',
  // ... resto de campos
};

// O usar un campo específico
const alumnoTest = {
  nombres: 'Juan',
  apellidos: 'Pérez',
  es_test: true, // Campo booleano para identificar
  // ... resto de campos
};
```

**Reglas:**
- ✅ Prefijo "TEST -" en nombres O campo `es_test: true`
- ✅ Usar datos ficticios pero realistas (nombres, teléfonos, fechas)
- ✅ NO usar datos reales de alumnos/padres
- ✅ Fácil de identificar visualmente en listas
- ✅ Fácil de filtrar y eliminar después

---

### Limpieza de Datos de Prueba

**Al finalizar las pruebas:**

```javascript
// Script de limpieza
// Archivo: /scripts/clean-test-data.js

async function limpiarDatosPrueba() {
  // Opción 1: Filtrar por prefijo
  await supabase
    .from('alumnos')
    .delete()
    .ilike('nombres', 'TEST -%');
  
  // Opción 2: Filtrar por campo
  await supabase
    .from('alumnos')
    .delete()
    .eq('es_test', true);
  
  // También limpiar tablas relacionadas
  await supabase
    .from('asistencias_normales')
    .delete()
    .in('alumno_id', alumnosTestIds);
  
  await supabase
    .from('asistencias_arqueros')
    .delete()
    .in('alumno_id', alumnosTestIds);
}
```

**El agente debe preguntar al usuario:**
```
Pruebas finalizadas. ¿Deseas que limpie los datos de prueba?
(Se eliminarán todos los registros con prefijo "TEST -")
```

---

## Checklist General de Funcionalidad Terminada

Antes de considerar una funcionalidad como terminada, verificar:

### ✅ Funcionalidad
- [ ] Happy path funciona sin errores
- [ ] Sad paths manejan errores correctamente
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs de Supabase
- [ ] Datos se guardan correctamente en la BD

### ✅ Validaciones
- [ ] Campos obligatorios se validan
- [ ] Formatos se validan (fechas, fotos, teléfonos)
- [ ] Mensajes de error son claros y amigables (sin jerga técnica)
- [ ] Validaciones están en frontend Y backend (seguridad)
- [ ] No se pueden guardar datos inválidos

### ✅ UX/UI
- [ ] Se ve correctamente en móvil (375px width mínimo)
- [ ] Contraste de colores adecuado (legible bajo sol)
- [ ] Textos siguen el tono de comunicación (Paso 5.2)
- [ ] Botones tienen tamaño mínimo 44x44px
- [ ] Loading spinner aparece en acciones async
- [ ] Mensajes de éxito/error aparecen correctamente
- [ ] Flujo es intuitivo (sin necesidad de explicación)

### ✅ Performance
- [ ] Carga inicial < 3 segundos
- [ ] Acciones frecuentes < 1 segundo
- [ ] Skeleton loaders para listas largas
- [ ] Manejo correcto de errores de conexión

### ✅ Seguridad
- [ ] Solo usuarios autenticados pueden acceder
- [ ] Permisos por rol funcionan (entrenador vs admin)
- [ ] Aislamiento por escuela funciona
- [ ] Validaciones críticas en backend (no solo frontend)

### ✅ Tests
- [ ] Tests automatizados escritos (si aplica)
- [ ] Tests automatizados pasan
- [ ] Tests manuales ejecutados (happy + sad path)
- [ ] Documentación de bugs (si los hay)

---

## Ejemplo Completo: Flujo de Testing de "Registro de Alumnos"

### Fase 1: Implementación
```
[Agente implementa:]
- Formulario de registro con todos los campos
- Validaciones en frontend
- Integración con Supabase
- Mensajes de éxito/error
- Redirección a lista después de guardar
```

### Fase 2: Tests Automatizados
```javascript
// Escribir y ejecutar tests
npm run test src/features/alumnos/__tests__/

✓ Rechaza alumno sin nombres
✓ Rechaza foto no cuadrada
✓ Acepta foto cuadrada de cualquier tamaño
✓ Requiere al menos un representante legal completo
✓ Valida formato de teléfono
```

### Fase 3: Tests Manuales - Happy Path
```
[Agente usa browser tool:]

1. Abrir http://localhost:5173/alumnos/registro
2. Llenar formulario:
   - Nombres: "TEST - Juan Carlos"
   - Apellidos: "Pérez Gómez"
   - Fecha: "15/03/2010"
   - CI: "12345678"
   - Padre: "Pedro Pérez" / "+591 77123456"
   - Grupo: "Grupo Norte"
   - Horario: "17:00"
   - Foto: subir test-photo-400x400.jpg
3. Click "Guardar Alumno"
4. ✓ Mensaje: "¡Listo! TEST - Juan Carlos Pérez Gómez registrado correctamente ✓"
5. ✓ Redirige a /alumnos
6. ✓ "TEST - Juan Carlos" aparece con badge ámbar "Pendiente"
7. ✓ Datos coinciden con lo ingresado
```

### Fase 4: Tests Manuales - Sad Path
```
[Agente prueba casos de error:]

Caso 1: Sin nombres
1. Dejar campo "Nombres" vacío
2. Intentar guardar
3. ✓ Muestra: "Por favor, completa el nombre del alumno"
4. ✓ No se guarda en BD

Caso 2: Foto no cuadrada
1. Subir foto 800x600
2. ✓ Muestra: "La foto debe tener formato cuadrado"
3. ✓ No se sube la foto

Caso 3: Sin representante
1. Dejar vacíos padre Y madre
2. Intentar guardar
3. ✓ Muestra: "Debe registrar al menos un representante legal completo"

Caso 4: Sin conexión
1. Desconectar internet (DevTools → Network → Offline)
2. Intentar guardar
3. ✓ Muestra: "No pudimos conectar. Revisa tu internet y vuelve a intentar."
4. ✓ Formulario mantiene datos ingresados
```

### Fase 5: Verificación UX
```
[Agente verifica en móvil:]

1. Cambiar a responsive mode (375px - iPhone SE)
2. ✓ Todos los campos legibles
3. ✓ Botones fáciles de tocar (44x44px)
4. ✓ Labels en tono amigable
5. ✓ Colores siguen paleta (naranja, negro, blanco)
6. ✓ Loading spinner aparece al guardar
```

### Fase 6: Reporte Final
```
✅ FUNCIONALIDAD TERMINADA: Registro de Alumnos

Cumple criterio de "terminado":
✓ Nivel 1: Funciona sin errores
✓ Nivel 2: Validaciones funcionan
✓ Nivel 3: UX correcta

Tests ejecutados:
- Automatizados: 5/5 pasaron ✓
- Manuales Happy Path: ✓
- Manuales Sad Path: 4 casos ✓
- Verificación UX: ✓

Bugs encontrados: 0

Datos de prueba creados:
- 1 alumno: "TEST - Juan Carlos Pérez Gómez"
(Pendiente de limpieza)

Estado: LISTO PARA USO ✅
```

---

## Protocolo de Pruebas por Módulo

### Módulo: Gestión de Alumnos

**Funcionalidades:**
1. Registro de alumnos
2. Lista de alumnos
3. Edición de alumnos
4. Aprobación de alumnos (admin)
5. Archivo de alumnos
6. Restauración de alumnos

**Orden de testing:**
1. Probar cada funcionalidad individualmente (según checklist)
2. Probar flujo completo end-to-end:
   ```
   Registrar → Ver en lista → Editar → Aprobar (admin) → 
   Ver cambio de estado → Archivar → Verificar no aparece → 
   Restaurar → Verificar vuelve a aparecer
   ```

**Criterio de módulo terminado:**
- ✅ Todas las funcionalidades individuales terminadas
- ✅ Flujo completo funciona sin interrupciones
- ✅ Integración entre funcionalidades correcta
- ✅ Performance aceptable (< 3s carga inicial)

---

### Módulo: Asistencias

**Funcionalidades:**
1. Tomar asistencia del día
2. Ver historial de asistencias
3. Editar asistencia (solo hoy)
4. Registro de asistencia de arqueros

**Orden de testing:**
1. Probar cada funcionalidad individualmente
2. Probar flujo completo:
   ```
   Tomar asistencias hoy → Verificar en historial → 
   Editar una asistencia → Verificar cambio → 
   Tomar asistencia arquero → Verificar se registra por separado
   ```

**Casos especiales a probar:**
- Alumno normal: 1 asistencia/día máximo
- Alumno arquero: 2 asistencias/día (normal + arquero)
- No permitir fechas futuras
- No duplicar asistencias mismo día

---

### Módulo: Convocatorias

**Funcionalidades:**
1. Ver lista de alumnos con contador de asistencias
2. Filtrar alumnos convocables
3. Crear convocatoria
4. Ver convocatorias activas

**Orden de testing:**
1. Probar cada funcionalidad individualmente
2. Probar flujo completo:
   ```
   Ver lista → Verificar contadores correctos → 
   Filtrar convocables → Crear convocatoria → 
   Verificar advertencias (si alumno <3 asistencias o Pendiente) → 
   Guardar → Ver en lista de activas
   ```

**Casos especiales a probar:**
- Cálculo correcto de últimos 7 días
- Suma de asistencias normales + arquero
- Advertencias no bloquean (permiten continuar)
- Solo cuenta Presente y Licencia (no Ausente)

---

## Herramientas y Comandos

### Tests Automatizados

```bash
# Ejecutar todos los tests
npm run test

# Ejecutar tests de un módulo específico
npm run test src/features/alumnos

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ver cobertura de tests
npm run test:coverage
```

---

### Browser Testing

**Abrir app en browser:**
```bash
# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
# URL: http://localhost:5173
```

**Simular móvil en Chrome DevTools:**
1. F12 → Toggle device toolbar (Ctrl+Shift+M)
2. Seleccionar "iPhone SE" (375px) o "iPhone 12 Pro" (390px)
3. Rotar a landscape si es necesario
4. Network → Throttling → "Slow 3G" (para probar performance)

---

### Limpieza de Datos

```bash
# Ejecutar script de limpieza
npm run clean:test-data

# O manualmente desde Supabase Dashboard
# Table Editor → Filter → nombres LIKE 'TEST -%' → Delete
```

---

## Protocolo de Entrega de Módulo

Cuando un módulo completo está terminado:

### 1. Reporte de Tests
```markdown
# Reporte de Tests - Módulo: Gestión de Alumnos

Fecha: 2026-02-02
Agente: Antigravity

## Funcionalidades Completadas
- [x] Registro de alumnos
- [x] Lista de alumnos
- [x] Edición de alumnos
- [x] Aprobación de alumnos
- [x] Archivo de alumnos
- [x] Restauración de alumnos

## Tests Ejecutados
- Tests automatizados: 23/23 pasaron ✓
- Tests manuales: Todos completados ✓
- Flujo end-to-end: ✓

## Bugs Encontrados
- 0 bugs críticos
- 1 bug menor: [descripción] → Documentado en bugs-conocidos.md

## Performance
- Carga inicial: 1.8s (✓ < 3s)
- Lista de 30 alumnos: 0.4s (✓ < 1s)
- Guardar alumno: 0.6s (✓ < 1s)

## UX Verificada
- Móvil (375px): ✓
- Contraste colores: ✓
- Mensajes amigables: ✓
- Flujo intuitivo: ✓

## Estado
✅ MÓDULO TERMINADO Y LISTO PARA USO
```

---

### 2. Limpieza

```
¿Deseas que limpie los datos de prueba?
- 5 alumnos TEST creados
- 15 asistencias TEST creadas
- 2 convocatorias TEST creadas

[Usuario responde Sí/No]
```

---

### 3. Documentación

Actualizar README del proyecto:

```markdown
## Módulos Implementados

### ✅ Gestión de Alumnos (COMPLETO)
- Registro de alumnos
- Lista y visualización
- Edición y aprobación
- Archivo y restauración

**Tests:** 23/23 ✓
**Performance:** < 2s
**Estado:** Listo para uso en producción
```

---

## Regla de Oro Final de QA

> **"Si no lo probaste en móvil bajo el sol, no está probado."**

Todos los tests del mundo no sirven si en la grupo, con el sol de frente, el entrenador no puede leer la pantalla o tocar los botones.

El testing de AsiSport debe siempre **priorizar el contexto de uso real** sobre la perfección técnica.

---

## Próximos Pasos

Con el Paso 6 completado, tienes las **6 piezas fundamentales** para guiar a Antigravity:

1. ✅ **Contexto y Visión** - El "Por Qué"
2. ✅ **Stack Tecnológico** - El "Cómo"
3. ✅ **Arquitectura** - El "Dónde"
4. ✅ **Reglas de Negocio** - Las "Líneas Rojas"
5. ✅ **Guía de Estilo** - La "Personalidad"
6. ✅ **Protocolo de QA** - La "Validación"

**Ahora Antigravity tiene todo lo necesario para construir AsiSport correctamente.** 🚀
