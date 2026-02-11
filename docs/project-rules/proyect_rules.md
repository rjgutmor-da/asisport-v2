## 1. Contexto y Visión del Producto

### Nombre del Proyecto

**AsiSport** es el MVP de **SaaSport**.

AsiSport existe para validar aceptación, uso real y valor del problema antes de evolucionar hacia una solución SaaS más amplia (SaaSport).

Toda decisión técnica y funcional debe priorizar **rapidez de aprendizaje y validación**, no escalabilidad prematura.

---

### Problema que Resuelve

AsiSport mejora la comunicación entre:

- Entrenadores
- Administradores de escuelas deportivas
- Padres de los niños

El problema central es la **falta de información clara y objetiva** para que el entrenador pueda conversar con los padres sobre la participación, compromiso y estado del niño.

La plataforma permite:
- Registrar alumnos con nombre y foto
- Tomar asistencias
- Convocar a partidos en base a asistencias
- Registrar cumpleaños
- Registrar y visualizar condiciones físicas del niño

Toda esta información sirve como **soporte objetivo** para la conversación entrenador–padres, la cual ocurre principalmente **fuera del sistema**, usando **WhatsApp**.

AsiSport **no reemplaza WhatsApp**, lo potencia.

---

### Usuario Final

Usuarios principales:
- **Entrenadores**: toman asistencia, consultan información del niño y se comunican con los padres.
- **Administrativos**: registran alumnos y consultan dashboards de asistencia.

Usuarios indirectos:
- **Padres**: reciben información y comunicación, pero no interactúan directamente con la plataforma en esta etapa.

---

### Qué NO es este producto

AsiSport **no es**:
- Un sistema de mensajería propio
- Una red social
- Un ERP escolar
- Una plataforma de análisis avanzado
- Un SaaS completamente configurable y multi-tenant (todavía)

Cualquier funcionalidad que no refuerce la **comunicación entrenador–padres basada en datos simples y claros** debe ser cuestionada.

## 2. Stack Tecnológico y Estándares

Este apartado define **las únicas tecnologías permitidas** y **las reglas de uso obligatorio** para el desarrollo de AsiSport en su etapa MVP.

Toda decisión técnica debe alinearse con el objetivo principal del producto:
**validar uso real y aprendizaje rápido**, evitando complejidad prematura.

---

### Tecnologías Base

#### Backend / BaaS
- **Supabase**  
  Se utiliza como Backend as a Service (BaaS).
  - Autenticación
  - Autorización
  - Base de datos
  - Storage (si aplica)

👉 **No se implementa backend custom en esta etapa.**

---

#### Base de Datos
- **PostgreSQL (vía Supabase)**
  - Base de datos relacional
  - Uso de Row Level Security (RLS) para control de acceso
  - Validaciones críticas a nivel de base de datos cuando corresponda

---

#### Frontend
- **React**
- **Vite** como herramienta de build y desarrollo

El frontend se implementa como un **monolito modular**.
- ❌ No micro-frontends
- ❌ No separación artificial de proyectos

---

#### UI / Estilos
- **Tailwind CSS**
- **Shadcn UI** para componentes base

La interfaz debe ser:
- Mobile-first
- Totalmente responsiva
- Clara y simple, priorizando legibilidad en contexto de uso real (cancha, celular, luz solar)

---

#### Lenguaje
- **JavaScript (ES6+)**
- JSDoc para documentar tipos críticos cuando sea necesario
- Migración a TypeScript solo si:
  - El código supera las 3000 líneas, O
  - Aparecen bugs recurrentes relacionados con tipos

Ejemplo de JSDoc cuando sea necesario:
/**
 * @param {number} alumnoId
 * @param {boolean} presente
 * @returns {Promise<Object>}
 */
async function registrarAsistencia(alumnoId, presente) {
  // ...
}

### Principios de Uso del Stack

- No se implementa backend propio mientras Supabase cubra el caso de uso.
- Toda autenticación y autorización **debe pasar por Supabase**.
- No se duplican mecanismos de auth, roles o permisos en el frontend.
- La lógica crítica del negocio:
  - Se valida en frontend para experiencia de usuario
  - **Se valida también en base de datos** para garantizar integridad
- La lógica de negocio **no debe vivir dentro de componentes UI**.
  - Los componentes React solo coordinan interacción y visualización.
- El sistema debe funcionar correctamente en dispositivos móviles como caso principal.

---

### Restricciones Explícitas (Límites No Negociables)

- ❌ No agregar frameworks adicionales sin justificación clara y explícita.
- ❌ No duplicar funcionalidades que Supabase ya provee.
- ❌ No introducir patrones o herramientas orientadas a:
  - escalabilidad futura
  - multi-tenancy
  - extensibilidad enterprise
- ❌ No optimizar antes de tener evidencia real de uso.

Cualquier propuesta técnica que:
- aumente la complejidad
- agregue abstracciones innecesarias
- no refuerce el objetivo de validación del MVP

**debe ser cuestionada o descartada.**

---

### Regla de Oro del Stack

> **Simplicidad > Elegancia**  
> **Aprendizaje real > Escalabilidad hipotética**

## 3. Arquitectura y Organización de Archivos

Este apartado define **cómo se organiza el código** para mantener claridad, evitar caos y permitir iterar rápido sin romper el sistema.

La arquitectura prioriza:
- Simplicidad
- Lectura fácil
- Separación clara de responsabilidades
- Decisiones reversibles propias de un MVP

---

### Principios Arquitectónicos

- El frontend es un **monolito modular**.
- No se utilizan microservicios ni micro-frontends.
- La UI, la lógica de negocio y el acceso a datos **no deben mezclarse**.
- Cada archivo debe tener **una responsabilidad clara**.
- Si algo no se sabe dónde va, probablemente **está mal definido**.

---

### Estructura de Carpetas Base

```txt
src/
├── components/        # Componentes UI reutilizables (presentacionales)
├── features/          # Funcionalidades del negocio agrupadas por dominio
├── services/          # Única capa autorizada para comunicarse con Supabase
├── hooks/             # Custom hooks reutilizables entre features
├── lib/               # Configuración y utilidades compartidas
├── pages/             # Vistas / pantallas (orquestadores)
├── styles/            # Estilos globales
├── assets/            # Imágenes y recursos estáticos
└── main.jsx           # Punto de entrada de la aplicación
```

---

### Reglas de Ubicación por Responsabilidad

#### `/components/` - Componentes UI Presentacionales

**Qué va aquí:**
- Componentes UI 100% reutilizables y tontos (sin lógica de negocio)
- No llaman a servicios ni acceden a Supabase
- Reciben **todos** sus datos vía props
- Son agnósticos al dominio del negocio

**Ejemplos:**
```txt
components/
├── ui/                    # Componentes base de Shadcn UI
│   ├── button.jsx
│   ├── card.jsx
│   └── input.jsx
├── layout/
│   ├── Header.jsx
│   ├── Sidebar.jsx
│   └── Container.jsx
└── shared/
    ├── LoadingSpinner.jsx
    ├── ErrorMessage.jsx
    └── EmptyState.jsx
```

**Regla de oro:** Si el componente necesita saber que "esto es un alumno" o "esto es una asistencia", **NO va aquí**.

---

#### `/features/` - Funcionalidades por Dominio

**Qué va aquí:**
- Componentes específicos de un dominio del negocio
- Hooks personalizados que solo usa ese dominio
- Lógica de validación y transformación de datos del dominio
- **NO acceso directo a Supabase** (eso lo hace `/services/`)

**Estructura interna recomendada:**
```txt
features/
├── asistencias/
│   ├── components/
│   │   ├── AsistenciaForm.jsx
│   │   ├── AsistenciaList.jsx
│   │   └── AsistenciaCard.jsx
│   ├── hooks/
│   │   ├── useAsistencias.js
│   │   └── useAsistenciaForm.js
│   └── utils/
│       └── asistenciaValidators.js
├── alumnos/
│   ├── components/
│   │   ├── AlumnoCard.jsx
│   │   ├── AlumnoForm.jsx
│   │   └── AlumnoAvatar.jsx
│   ├── hooks/
│   │   └── useAlumnos.js
│   └── utils/
│       └── alumnoHelpers.js
└── partidos/
    └── components/
        └── PartidoConvocatoria.jsx
```

**Regla de oro:** Si un componente/hook/utilidad solo se usa en UN dominio, vive dentro de `/features/[dominio]/`.

**Responsabilidades:**
- Orquestar llamadas a `/services/`
- Manejar estado local del dominio
- Validar datos antes de enviar a servicios
- Transformar datos de servicios para la UI

---

#### `/services/` - Acceso a Datos (Única Capa de Supabase)

**Qué va aquí:**
- **Única capa autorizada** para comunicarse con Supabase
- Funciones puras de acceso a datos (queries, inserts, updates, deletes)
- Sin lógica de negocio compleja
- Sin conocimiento de componentes React

**Estructura:**
```txt
services/
├── supabase.js           # Cliente configurado de Supabase
├── alumnoService.js      # CRUD de alumnos
├── asistenciaService.js  # CRUD de asistencias
├── authService.js        # Autenticación
└── storageService.js     # Manejo de archivos (fotos)
```

**Ejemplo de servicio correcto:**
```javascript
// services/asistenciaService.js
import { supabase } from './supabase';

export const asistenciaService = {
  async registrar(alumnoId, presente, fecha) {
    const { data, error } = await supabase
      .from('asistencias')
      .insert({ 
        alumno_id: alumnoId, 
        presente,
        fecha 
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async obtenerPorAlumno(alumnoId) {
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('fecha', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
```

**Regla de oro:** 
- ✅ `services/` solo habla con Supabase
- ❌ `services/` NO importa componentes de React
- ❌ `services/` NO contiene validaciones de negocio complejas
- ✅ Cualquier otro código que necesite datos llama a `services/`

---

#### `/hooks/` - Hooks Compartidos

**Qué va aquí:**
- Hooks que se usan en **2 o más features**
- Lógica reutilizable de React (efectos, estados, contextos)

**Ejemplos:**
```txt
hooks/
├── useAuth.js           # Hook de autenticación (usado globalmente)
├── useDebounce.js       # Utilidad de debounce
└── useLocalStorage.js   # Persistencia local
```

**Regla de oro:** Si un hook solo se usa en `/features/asistencias/`, **NO va aquí**, va en `/features/asistencias/hooks/`.

---

#### `/lib/` - Configuración y Utilidades

**Qué va aquí:**
- Configuración inicial de librerías externas
- Utilidades puras (sin efectos secundarios)
- Constantes globales
- Helpers compartidos

**Ejemplos:**
```txt
lib/
├── supabaseClient.js    # Configuración del cliente de Supabase
├── constants.js         # Constantes globales (roles, estados, etc.)
├── formatters.js        # Funciones de formato (fechas, números)
└── validators.js        # Validaciones genéricas (email, teléfono)
```

---

#### `/pages/` - Vistas/Pantallas (Orquestadores)

**Qué va aquí:**
- Componentes que representan **rutas completas**
- Orquestan features y componentes
- **No contienen lógica de negocio**
- Solo composición de UI

**Estructura:**
```txt
pages/
├── Login.jsx
├── Dashboard.jsx
├── Asistencias.jsx
├── Alumnos.jsx
└── NotFound.jsx
```

**Ejemplo de página correcta:**
```javascript
// pages/Asistencias.jsx
import { AsistenciaList } from '@/features/asistencias/components/AsistenciaList';
import { AsistenciaForm } from '@/features/asistencias/components/AsistenciaForm';
import { Container } from '@/components/layout/Container';

export function AsistenciasPage() {
  return (
    <Container>
      <h1>Asistencias</h1>
      <AsistenciaForm />
      <AsistenciaList />
    </Container>
  );
}
```

**Regla de oro:** Las páginas son "cajas tontas" que juntan piezas. No hacen más.

---

#### `/styles/` - Estilos Globales

**Qué va aquí:**
- Variables CSS globales (si se usan)
- Configuración de Tailwind (si se extiende)
- Estilos base y resets

```txt
styles/
└── globals.css
```

---

#### `/assets/` - Recursos Estáticos

**Qué va aquí:**
- Imágenes, íconos, logos
- Fuentes (si no vienen de CDN)
- Archivos estáticos que no cambian

```txt
assets/
├── images/
│   ├── logo.svg
│   └── placeholder-avatar.png
└── icons/
    └── custom-icon.svg
```

---

### Flujo de Datos (Arquitectura de Capas)

```
┌─────────────────────────────────────────────┐
│  /pages/                                    │  ← Orquestación
│  Compone features y componentes            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  /features/[dominio]/                       │  ← Lógica de Negocio
│  Usa hooks, valida, transforma datos       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  /services/                                 │  ← Acceso a Datos
│  Única capa que habla con Supabase         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Supabase (PostgreSQL)                      │  ← Base de Datos
└─────────────────────────────────────────────┘
```

**Reglas del flujo:**
1. `/pages/` **nunca** llama directamente a `/services/`
2. `/pages/` usa componentes de `/features/` o `/components/`
3. `/features/` llama a `/services/` para datos
4. `/services/` es la **única** capa que importa el cliente de Supabase
5. `/components/` **nunca** llama a `/services/` (solo recibe props)

---

### Reglas de Importación

**Imports permitidos por capa:**

```javascript
// ✅ /pages/ puede importar de:
import { Feature } from '@/features/asistencias/components/Feature';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// ✅ /features/ puede importar de:
import { asistenciaService } from '@/services/asistenciaService';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate } from '@/lib/formatters';

// ✅ /services/ puede importar de:
import { supabase } from '@/lib/supabaseClient';

// ❌ /components/ NO puede importar de:
import { asistenciaService } from '@/services/asistenciaService'; // ❌
import { useAsistencias } from '@/features/asistencias/hooks'; // ❌

// ❌ /services/ NO puede importar de:
import { SomeComponent } from '@/components/ui/button'; // ❌
import React from 'react'; // ❌ (servicios son funciones puras)
```

---

### Criterio de Decisión Rápida

**¿Dónde pongo este archivo?**

Pregúntate en orden:

1. **¿Es acceso directo a Supabase?**  
   → Va en `/services/`

2. **¿Es un componente UI genérico (botón, card, modal)?**  
   → Va en `/components/`

3. **¿Es específico de un dominio del negocio?**  
   → Va en `/features/[dominio]/`

4. **¿Es un hook que usan múltiples features?**  
   → Va en `/hooks/`

5. **¿Es configuración o utilidad pura?**  
   → Va en `/lib/`

6. **¿Es una ruta/pantalla completa?**  
   → Va en `/pages/`

Si después de estas preguntas **todavía no sabes**, el código probablemente está mal definido o mezclando responsabilidades.

---

### Ejemplo Completo: Feature de Asistencias

```txt
src/
├── services/
│   └── asistenciaService.js       # CRUD de asistencias en Supabase
│
├── features/
│   └── asistencias/
│       ├── components/
│       │   ├── AsistenciaForm.jsx      # Formulario de registro
│       │   └── AsistenciaList.jsx      # Lista de asistencias
│       ├── hooks/
│       │   └── useAsistencias.js       # Lógica: llama a asistenciaService
│       └── utils/
│           └── asistenciaValidators.js # Validaciones de negocio
│
├── components/
│   └── ui/
│       ├── button.jsx             # Botón genérico (Shadcn)
│       └── checkbox.jsx           # Checkbox genérico
│
└── pages/
    └── Asistencias.jsx            # Orquesta AsistenciaForm + AsistenciaList
```

**Flujo de una acción (registrar asistencia):**

1. Usuario hace clic en botón de `/components/ui/button.jsx`
2. `AsistenciaForm.jsx` (en `/features/asistencias/`) captura el evento
3. Llama a `useAsistencias.js` (hook del dominio)
4. El hook valida con `asistenciaValidators.js`
5. El hook llama a `asistenciaService.registrar()` (en `/services/`)
6. El servicio inserta en Supabase
7. El hook actualiza el estado y `AsistenciaList.jsx` se re-renderiza

---

### Excepciones y Casos Especiales

**¿Qué pasa si necesito compartir lógica entre features?**

- Si es **lógica de negocio compartida**: evalúa si realmente son 2 features o deberían ser 1
- Si es **acceso a datos compartido**: probablemente necesitas un servicio compartido en `/services/`
- Si es **UI compartida**: extrae a `/components/`
- Si es **lógica de React compartida**: extrae a `/hooks/`

**Regla de 3 usos:**  
Extrae a una ubicación compartida solo cuando **3 lugares diferentes** necesiten lo mismo. Antes de eso, duplica (DRY es menos importante que la claridad en un MVP).

---

### Nombres de Archivos

**Convenciones obligatorias:**

- **Componentes React**: PascalCase con extensión `.jsx`  
  Ejemplos: `AsistenciaForm.jsx`, `Button.jsx`

- **Servicios**: camelCase con sufijo `Service.js`  
  Ejemplos: `asistenciaService.js`, `authService.js`

- **Hooks**: camelCase con prefijo `use` y extensión `.js`  
  Ejemplos: `useAsistencias.js`, `useAuth.js`

- **Utilidades**: camelCase descriptivo con extensión `.js`  
  Ejemplos: `formatters.js`, `validators.js`

- **Constantes**: camelCase o UPPER_CASE según contexto  
  Ejemplos: `constants.js`, `ROLES.js`

---

### Regla de Oro Final

> **Si tienes que pensar más de 10 segundos dónde va un archivo, la arquitectura está fallando.**

La simplicidad es el objetivo. Cuando algo no encaje en esta estructura, **cuestiónalo antes de crear una carpeta nueva**.