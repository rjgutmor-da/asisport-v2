## 5. Guía de Estilo y Experiencia de Usuario (UX/UI)

Este apartado define **la personalidad visual y comunicacional de AsiSport**.

No se trata solo de "cómo se ve", sino de **cómo se siente** usar la aplicación en contexto real: en la cancha, bajo el sol, con prisa, con las manos ocupadas.

Toda decisión de diseño debe priorizar:
1. **Legibilidad en condiciones adversas** (luz solar, movimiento, prisa)
2. **Interacción rápida** (botones grandes, acciones claras)
3. **Comunicación amigable** (tono cercano, mensajes orientados a solución)

---

## Principio Fundamental de Diseño

> **"Funciona cuando más lo necesitas"**

AsiSport no compite en estética sofisticada. Compite en **ser usable cuando otras apps fallan**: bajo el sol, con prisa, en la cancha, con manos sudadas.

El diseño es el **medio**, no el fin. La meta es que el entrenador pueda tomar asistencia en 10 segundos sin pensar.

---

## 5.1 - Sistema de Diseño (Design System)

### Paleta de Colores

#### Variables CSS Base

Todas las variables están definidas en `/src/styles/globals.css`:

```css
:root {
  /* ==================== */
  /* COLORES PRIMARIOS    */
  /* ==================== */
  --color-primary: #FF6B35;          /* Naranja deportivo (acciones principales) */
  --color-background: #0A0A0A;       /* Negro profundo (fondo general) */
  --color-surface: #1A1A1A;          /* Gris oscuro (tarjetas, contenedores) */
  --color-text-primary: #FFFFFF;     /* Blanco (textos principales) */
  --color-text-secondary: #A0A0A0;   /* Gris medio (textos secundarios) */
  
  /* ==================== */
  /* COLORES DE ESTADO    */
  /* ==================== */
  --color-success: #00D26A;          /* Verde (Presente, Aprobado, éxitos) */
  --color-warning: #FFB020;          /* Ámbar (Pendiente, Licencia, advertencias) */
  --color-error: #FF3B30;            /* Rojo (Ausente, errores críticos) */
  --color-info: #0A84FF;             /* Azul (información neutral) */
  
  /* ==================== */
  /* COLORES FUNCIONALES  */
  /* ==================== */
  --color-border: #2D2D2D;           /* Gris oscuro (bordes sutiles) */
  --color-border-active: #FF6B35;    /* Naranja (bordes activos/foco) */
  --color-disabled: #4A4A4A;         /* Gris medio-oscuro (elementos deshabilitados) */
  
  /* ==================== */
  /* ESPECÍFICOS ASISPORT */
  /* ==================== */
  --color-arquero: #9D4EDD;          /* Púrpura (distintivo para arqueros) */
  
  /* ==================== */
  /* ESPACIADOS           */
  /* ==================== */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  
  /* ==================== */
  /* BORDES               */
  /* ==================== */
  --border-thin: 1px;
  --border-regular: 2px;
  --border-thick: 3px;
  
  /* ==================== */
  /* RADIOS               */
  /* ==================== */
  --radius-none: 0px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
  
  /* ==================== */
  /* TIPOGRAFÍA           */
  /* ==================== */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;
  
  /* ==================== */
  /* SOMBRAS              */
  /* ==================== */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  
  /* ==================== */
  /* TRANSICIONES         */
  /* ==================== */
  --transition-fast: 150ms ease-in-out;
  --transition-normal: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
}
```

---

### Uso de Variables en Tailwind

El archivo `tailwind.config.js` debe configurarse para reconocer estas variables:

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        border: 'var(--color-border)',
        'border-active': 'var(--color-border-active)',
        disabled: 'var(--color-disabled)',
        arquero: 'var(--color-arquero)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      borderWidth: {
        thin: 'var(--border-thin)',
        regular: 'var(--border-regular)',
        thick: 'var(--border-thick)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
    },
  },
  plugins: [],
}
```

---

### Reglas de Uso de Color

#### Cuándo usar cada color:

**Primary (Naranja #FF6B35):**
- Botones de acción principal ("Registrar Asistencia", "Guardar Alumno")
- Bordes de elementos interactivos principales
- Llamados a la acción (CTAs)
- Estados activos/seleccionados

**Success (Verde #00D26A):**
- Estado "Presente" en asistencias
- Estado "Aprobado" en alumnos
- Mensajes de confirmación exitosa
- Checkmarks, validaciones correctas

**Warning (Ámbar #FFB020):**
- Estado "Pendiente" en alumnos
- Estado "Licencia" en asistencias
- Advertencias no críticas
- Alertas que requieren atención pero no bloquean

**Error (Rojo #FF3B30):**
- Estado "Ausente" en asistencias
- Errores críticos
- Validaciones fallidas
- Acciones destructivas (eliminar)

**Info (Azul #0A84FF):**
- Información neutral
- Links/enlaces
- Tooltips, ayudas contextuales
- Notificaciones informativas

**Arquero (Púrpura #9D4EDD):**
- Badge "Arquero" en tarjetas de alumnos
- Indicadores de asistencias de arquero
- Cualquier elemento que distinga arqueros de jugadores normales

---

### Semántica de Estados Visuales

Cada estado de alumno/asistencia debe ser **inmediatamente reconocible** sin leer texto:

```jsx
// Ejemplo de badges semánticos
<Badge variant="success">Aprobado</Badge>      {/* Verde */}
<Badge variant="warning">Pendiente</Badge>     {/* Ámbar */}
<Badge variant="error">Ausente</Badge>         {/* Rojo */}
<Badge variant="info">Arquero</Badge>          {/* Púrpura */}
```

**Regla de oro:** Un entrenador debe poder escanear una lista de 30 alumnos y **identificar estados críticos en 3 segundos** solo por color.

---

## 5.2 - Tono de Comunicación

### Personalidad de AsiSport

**AsiSport habla como:**
- Un asistente técnico amigable
- Directo pero empático
- Orientado a la solución
- Profesional sin ser frío

**AsiSport NO habla como:**
- Un robot corporativo
- Un manual técnico
- Una aplicación bancaria
- Un videojuego casual

---

### Principios de Comunicación

#### 1. Amigable pero no infantil
✅ **Bien:** "¡Listo! Asistencia registrada ✓"  
❌ **Mal:** "¡Yupi! 🎉 Guardamos la asistencia 🎊"

#### 2. Orientado a solución, no a problema
✅ **Bien:** "No pudimos conectar. Revisa tu internet y vuelve a intentar."  
❌ **Mal:** "Error 500: Internal Server Error. Check network connection."

#### 3. Usa emojis con propósito
✅ **Bien:** "🎉 ¡Feliz cumpleaños a Juan Pérez!"  
✅ **Bien:** "¡Listo! Asistencia registrada ✓"  
❌ **Mal:** "❌ Error ⚠️ No se pudo guardar 😢"

#### 4. Evita jerga técnica
✅ **Bien:** "No encontramos este alumno"  
❌ **Mal:** "Error 404: Resource not found"

---

### Catálogo de Mensajes

#### Mensajes de Éxito

**Registro de asistencia:**
> "¡Listo! Asistencia de [Nombre Alumno] registrada ✓"

**Guardar alumno:**
> "¡Listo! [Nombre Alumno] registrado correctamente ✓"

**Aprobar alumno:**
> "¡Listo! [Nombre Alumno] aprobado ✓"

**Convocar a partido:**
> "¡Listo! Convocatoria guardada ✓"

**Eliminar/archivar:**
> "¡Listo! [Nombre Alumno] archivado ✓"

**Restaurar alumno:**
> "¡Listo! [Nombre Alumno] restaurado ✓"

---

#### Mensajes de Error

**Sin conexión a internet:**
> "No pudimos conectar. Revisa tu internet y vuelve a intentar."

**Error al guardar:**
> "No pudimos guardar los cambios. Intenta nuevamente."

**Sesión expirada:**
> "Tu sesión expiró. Por favor, inicia sesión nuevamente."

**Permiso denegado:**
> "No tienes permiso para realizar esta acción."

**Alumno no encontrado:**
> "No encontramos este alumno. Verifica e intenta nuevamente."

**Error al cargar datos:**
> "No pudimos cargar los datos. Intenta nuevamente."

---

#### Mensajes de Validación (Campos obligatorios)

**Campo vacío:**
> "Por favor, completa el [nombre del campo]"

**Formato incorrecto:**
> "El formato del [campo] no es válido. Ejemplo: [ejemplo]"

**Fecha futura:**
> "No puedes registrar asistencias para fechas futuras. Selecciona hoy o una fecha pasada."

**Ya existe registro:**
> "Ya existe un registro de asistencia para [Nombre Alumno] en esta fecha."

**Foto no cuadrada:**
> "La foto debe tener formato cuadrado (misma altura y anchura)."

**Representante legal faltante:**
> "Debe registrar al menos un representante legal completo (Padre o Madre con nombre y teléfono)."

**Faltan campos para aprobar:**
> "No se puede aprobar. Faltan los siguientes datos: [lista]"

---

#### Mensajes de Advertencia (Requieren decisión del usuario)

**Convocatoria sin asistencias suficientes:**
> "[Nombre Alumno] tiene solo [N] asistencias en los últimos 7 días (se requieren 3). ¿Deseas convocarlo de todas formas?"

**Convocar alumno pendiente:**
> "Este alumno aún no está aprobado por administración. ¿Deseas convocarlo de todas formas?"

**Eliminar con asistencias:**
> "Este alumno tiene [N] asistencias registradas. ¿Estás seguro de archivarlo?"

**Máximo de entrenadores:**
> "Ya tiene 3 entrenadores asignados (máximo permitido). ¿Deseas reemplazar a alguno?"

**Remover último entrenador:**
> "No puedes remover el único entrenador asignado. Debe haber al menos 1."

---

#### Mensajes de Carga/Espera

**Cargando datos:**
> "Cargando alumnos..."  
> "Cargando asistencias..."  
> "Cargando convocatorias..."

**Guardando:**
> "Guardando..."

**Procesando:**
> "Procesando..."

**Enviando:**
> "Enviando notificación..."

---

#### Mensajes de Estados Vacíos (Empty States)

**Sin alumnos registrados:**
> "Aún no hay alumnos registrados.  
> Haz clic en 'Registrar Alumno' para comenzar."

**Sin asistencias:**
> "Aún no hay asistencias registradas para hoy."

**Sin convocatorias:**
> "No hay convocatorias activas."

**Sin cumpleaños:**
> "No hay cumpleaños hoy."

**Sin alumnos archivados:**
> "No hay alumnos archivados."

---

### Reglas para Textos de Botones

#### Botones Primarios (Acciones principales)
Usar frases completas con verbo + objeto:

✅ **Bien:**
- "Registrar Asistencia"
- "Guardar Alumno"
- "Aprobar Alumno"
- "Convocar a Partido"

❌ **Mal:**
- "Registrar"
- "Guardar"
- "OK"
- "Submit"

---

#### Botones Secundarios (Acciones de cancelación/retroceso)
Usar verbos simples:

✅ **Bien:**
- "Cancelar"
- "Volver"
- "Cerrar"

---

#### Botones Destructivos (Eliminar/archivar)
Ser explícito sobre la acción:

✅ **Bien:**
- "Archivar Alumno"
- "Eliminar Registro"
- "Remover Entrenador"

❌ **Mal:**
- "Eliminar"
- "Borrar"
- "Delete"

---

### Títulos de Páginas y Secciones

**Formato:** Sustantivo o frase descriptiva (sin verbos)

✅ **Bien:**
- "Registro de Alumnos"
- "Asistencias del Día"
- "Convocatoria de Partido"
- "Configuración de Canchas"

❌ **Mal:**
- "Registrar Alumnos" (título de página, no de botón)
- "Tomar Asistencia"
- "Lista" (demasiado genérico)

---

## 5.3 - Diseño de Pantalla Principal (Grid Brutalista)

### Contexto de Uso

La pantalla principal es la **primera impresión** y el **hub de navegación**.

Debe ser:
- Escaneable en 2 segundos
- Usable con un solo dedo
- Funcional bajo luz solar directa
- Claramente jerárquica (acciones más comunes más grandes/arriba)

---

### Especificaciones Técnicas - Mobile

#### Layout Mobile (Prioridad #1)

**Estructura vertical:**
```
┌───────────────────────────────────┐
│ [16px padding top]                │
│                                   │
│  AsiSport          ⚙️ Configurar  │
│  [Logo]              [Icon]       │
│                                   │
│ [16px spacing]                    │
│                                   │
│ ┌─────────────────────────────┐   │
│ │    🧑✓ HERO CARD            │   │ ← Acción Principal
│ │                             │   │   (Hero Card)
│ │    Asistencia               │   │   Altura: Variable
│ │                             │   │   Borde naranja 3px
│ └─────────────────────────────┘   │
│                                   │
│ [16px spacing]                    │
│                                   │
│ ┌─────────────┐ ┌─────────────┐   │ ← Grid 2x2
│ │  📋         │ │  👥👥👥     │   │   (Acciones frecuentes)
│ │  Registro   │ │  Convocados │   │
│ │  Alumnos    │ │             │   │
│ └─────────────┘ └─────────────┘   │
│                                   │
│ [16px spacing]                    │
│                                   │
│ ┌─────────────┐ ┌─────────────┐   │
│ │  🎂         │ │  💪         │   │
│ │  Cumpleaños │ │  Estado     │   │
│ │             │ │  Físico     │   │
│ └─────────────┘ └─────────────┘   │
│                                   │
│ [16px bottom padding]             │
│                                   │
│ ┌───────────────────────────────┐ │ ← Tab Bar (Opcional)
│ │ 🏠  ✓  👥  ⚙️                 │ │   Altura: 72px
│ │ Inicio Asist. Alumnos Ajustes│ │   Padding: 16px top
│ └───────────────────────────────┘ │   Padding: 12px bottom
└───────────────────────────────────┘
```

#### Medidas Específicas (Mobile)

**Paddings y Márgenes:**
- Padding horizontal general: `16px` (ambos lados)
- Padding superior (debajo del notch): `16px`
- Espaciado entre Header y Hero Card: `16px`
- Espaciado entre Hero Card y Grid: `16px`
- Espaciado entre filas del Grid 2x2: `16px`
- Gap horizontal entre columnas del Grid: `16px`

**Header:**
- Logo "AsiSport": Izquierda, alineado con padding
- Ícono Configurar: Derecha, tamaño ~32x32px área táctil (44x44px)
- Altura total del header: ~60px

**Hero Card (Acción Principal - Asistencia):**
- Ancho: `calc(100vw - 32px)` (full width menos paddings)
- Altura: Automática según contenido (mínimo ~200px)
- Borde: `3px solid var(--color-primary)` (naranja)
- Border-radius: `8px`
- Padding interno: `24px`
- Ícono central: ~80-100px
- Label: `font-size: 24px`, `font-weight: 700`

**Grid 2x2 (Acciones Frecuentes):**
- 2 columnas, 2 filas
- Cada tarjeta:
  - Ancho: `calc((100vw - 32px - 16px) / 2)` (50% menos gaps)
  - Altura: Automática (mínimo ~160px para mantener proporción cuadrada)
  - Borde: `2px solid var(--color-border)` (gris sutil, no naranja)
  - Border-radius: `8px`
  - Padding interno: `16px`
  - Ícono: ~60-80px
  - Label: `font-size: 18px`, `font-weight: 600`

**Tab Bar (Opcional - Footer):**
- Altura total: `72px`
- Padding superior: `16px`
- Padding inferior: `12px` (para safe area en iPhones con notch)
- Fondo: `var(--color-surface)` o `var(--color-background)` con borde superior
- 4 tabs con íconos y labels
- Cada tab: Área táctil mínima 44x44px

---

### Especificaciones Técnicas - Desktop

#### Layout Desktop

**Estructura horizontal:**
```
┌─────────────────────────────────────────────┐
│  AsiSport                    ⚙️ Configurar  │
│  [Logo]                        [Button]     │
│                                             │
│  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │ Asistencia│  │  Registro │  │Convocad.│ │
│  │           │  │  Alumnos  │  │         │ │
│  │  [Hero]   │  └───────────┘  └─────────┘ │
│  │           │                              │
│  └───────────┘  ┌───────────┐  ┌─────────┐ │
│                 │ Cumpleaños│  │ Estado  │ │
│                 │           │  │ Físico  │ │
│                 └───────────┘  └─────────┘ │
└─────────────────────────────────────────────┘
```

**Medidas:**
- Fondo: `var(--color-background)` (#0A0A0A)
- Padding general: `var(--spacing-lg)` (24px)
- Grid: Asimétrico (Hero Card más grande + Grid 2x2 al lado)
- Gap entre tarjetas: `var(--spacing-lg)` (24px)
- Ancho máximo del contenedor: 1200px (centrado)

---

#### Tarjetas de Módulo

**Especificaciones:**
- Fondo: `var(--color-surface)` (#1A1A1A)
- Borde: `var(--border-thick)` (3px) solid `var(--color-primary)` (#FF6B35)
- Padding interno: `var(--spacing-xl)` (32px)
- Border-radius: `var(--radius-md)` (8px)
- Altura mínima: 200px
- Proporción: Cuadradas o ligeramente rectangulares

**Contenido de cada tarjeta:**
1. **Ícono:**
   - Tamaño: 80px-100px
   - Color: `var(--color-text-primary)` (blanco)
   - Stroke: 2px
   - Centrado horizontalmente

2. **Label/Texto:**
   - Tamaño: `var(--font-size-xl)` o `var(--font-size-2xl)` (20-24px)
   - Peso: `var(--font-weight-bold)` (700)
   - Color: `var(--color-text-primary)` (blanco)
   - Alineación: Centrado
   - Margen superior del ícono: `var(--spacing-md)` (16px)

**Estados interactivos:**

```css
/* Estado normal */
.module-card {
  background: var(--color-surface);
  border: var(--border-thick) solid var(--color-primary);
  transition: var(--transition-fast);
  cursor: pointer;
}

/* Hover */
.module-card:hover {
  border-width: 4px;
  transform: translateY(-2px);
}

/* Active/Pressed */
.module-card:active {
  transform: scale(0.98);
}

/* Focus (teclado) */
.module-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 4px;
}
```

---

#### Logo/Título Principal

**Especificaciones:**
- Texto: "AsiSport"
- Posición: Esquina superior izquierda
- Tamaño: `var(--font-size-3xl)` (30px) o superior
- Peso: `var(--font-weight-black)` (900)
- Color: `var(--color-text-primary)` (blanco)
- Margen inferior: `var(--spacing-2xl)` (48px)

---

#### Código de Referencia - Mobile Layout

```jsx
// Ejemplo de implementación del Dashboard Mobile
// Archivo: /src/pages/Dashboard.jsx

import { SettingsIcon, UserPlusIcon, ClipboardCheckIcon, 
         UsersIcon, CakeIcon, HeartPulseIcon } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="flex items-center justify-between p-md">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          AsiSport
        </h1>
        <button 
          className="p-sm hover:bg-surface rounded-md transition-fast"
          onClick={() => navigate('/configurar')}
        >
          <SettingsIcon size={32} className="text-white" />
        </button>
      </header>
      
      {/* Contenedor principal */}
      <div className="px-md space-y-md">
        {/* Hero Card - Acción Principal (Asistencia) */}
        <HeroCard 
          icon={<ClipboardCheckIcon size={100} />}
          label="Asistencia"
          onClick={() => navigate('/asistencias')}
          className="min-h-[200px]"
        />
        
        {/* Grid 2x2 - Acciones Frecuentes */}
        <div className="grid grid-cols-2 gap-md">
          <ModuleCard 
            icon={<UserPlusIcon size={70} />}
            label="Registro Alumnos"
            onClick={() => navigate('/alumnos/registro')}
            size="compact"
          />
          
          <ModuleCard 
            icon={<UsersIcon size={70} />}
            label="Convocados"
            onClick={() => navigate('/convocatorias')}
            size="compact"
          />
          
          <ModuleCard 
            icon={<CakeIcon size={70} />}
            label="Cumpleaños"
            onClick={() => navigate('/cumpleanos')}
            size="compact"
          />
          
          <ModuleCard 
            icon={<HeartPulseIcon size={70} />}
            label="Estado Físico"
            onClick={() => navigate('/estado-fisico')}
            disabled={true}
            size="compact"
          />
        </div>
      </div>
      
      {/* Tab Bar (Opcional) */}
      <TabBar />
    </div>
  );
}

// Componente HeroCard - Tarjeta grande para acción principal
// Archivo: /src/components/shared/HeroCard.jsx

function HeroCard({ icon, label, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full
        bg-surface 
        border-thick border-primary 
        rounded-md 
        p-xl 
        flex flex-col items-center justify-center gap-md
        hover:border-4
        active:scale-[0.98]
        transition-fast
        ${className}
      `}
    >
      <div className="text-white">
        {icon}
      </div>
      <span className="text-2xl font-bold text-white">
        {label}
      </span>
    </button>
  );
}

// Componente ModuleCard - Tarjetas del grid 2x2
// Archivo: /src/components/shared/ModuleCard.jsx

function ModuleCard({ icon, label, onClick, disabled = false, size = 'default' }) {
  const sizeClasses = {
    default: 'min-h-[200px] p-xl',
    compact: 'min-h-[160px] p-md',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-surface 
        border-regular border-border 
        rounded-md 
        ${sizeClasses[size]}
        flex flex-col items-center justify-center gap-sm
        transition-fast
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:border-primary active:scale-[0.98] cursor-pointer'
        }
      `}
    >
      <div className="text-white">
        {icon}
      </div>
      <span className="text-lg font-semibold text-white text-center leading-tight">
        {label}
      </span>
      {disabled && (
        <span className="text-xs text-secondary mt-xs">
          Próximamente
        </span>
      )}
    </button>
  );
}

// Componente TabBar (Opcional)
// Archivo: /src/components/layout/TabBar.jsx

function TabBar() {
  const tabs = [
    { icon: <HomeIcon size={24} />, label: 'Inicio', path: '/' },
    { icon: <ClipboardCheckIcon size={24} />, label: 'Asistencia', path: '/asistencias' },
    { icon: <UsersIcon size={24} />, label: 'Alumnos', path: '/alumnos' },
    { icon: <SettingsIcon size={24} />, label: 'Ajustes', path: '/configurar' },
  ];
  
  return (
    <nav className="
      fixed bottom-0 left-0 right-0
      h-[72px]
      bg-surface border-t border-border
      px-md pt-md pb-3
      grid grid-cols-4 gap-sm
      md:hidden
    ">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className="
            flex flex-col items-center justify-center gap-1
            text-secondary
            hover:text-primary
            transition-fast
            min-h-[44px]
          "
        >
          {tab.icon}
          <span className="text-xs font-medium">
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
```

---

### Diferencias Hero Card vs Module Card

**Hero Card (Acción Principal):**
- ✅ Borde grueso naranja (`border-thick border-primary`)
- ✅ Más grande y prominente
- ✅ Ícono más grande (100px)
- ✅ Texto más grande (24px)
- ✅ Padding generoso (`p-xl`)
- **Uso:** Asistencia (la acción más frecuente)

**Module Card (Grid 2x2):**
- ✅ Borde sutil gris (`border-regular border-border`)
- ✅ Más compacta
- ✅ Ícono mediano (70px)
- ✅ Texto mediano (18px)
- ✅ Padding moderado (`p-md`)
- ✅ Hover cambia a borde naranja
- **Uso:** Acciones secundarias frecuentes

---

### Responsive Behavior

**Mobile (< 640px) - DISEÑO PRIMARIO:**
- Layout vertical con Hero Card arriba
- Hero Card (Asistencia): Full width, altura ~200px
- Grid 2x2 debajo: 2 columnas, tarjetas compactas (~160px altura)
- Padding lateral: `16px`
- Tab Bar fijo en bottom (opcional): 72px altura
- Espaciado entre elementos: `16px`

**Tablet (>= 640px, < 768px):**
- Mantener layout mobile
- Incrementar padding a `20px`
- Hero Card altura ~220px
- Grid 2x2 tarjetas ~180px altura
- Opcional: Tab Bar puede ocultarse, mostrar sidebar

**Desktop (>= 768px):**
- Cambiar a layout horizontal/grid asimétrico
- Hero Card al lado izquierdo (30-40% ancho)
- Grid 2x2 al lado derecho (60-70% ancho)
- Padding lateral: `24px`
- Ocultar Tab Bar
- Espaciado entre elementos: `24px`
- Header con logo más grande

```css
/* Breakpoints en Tailwind */
/* sm: 640px */
/* md: 768px */  ← Cambio a layout desktop
/* lg: 1024px */
/* xl: 1280px */
```

**Código Responsive:**

```jsx
// Layout que se adapta según breakpoint
<div className="min-h-screen bg-background pb-20 md:pb-0">
  {/* Header */}
  <header className="flex items-center justify-between p-md md:p-lg">
    <h1 className="text-2xl md:text-3xl font-black text-white">
      AsiSport
    </h1>
    <button className="p-sm md:p-md">
      <SettingsIcon size={32} />
    </button>
  </header>
  
  {/* Mobile: Vertical | Desktop: Horizontal */}
  <div className="
    px-md md:px-lg 
    space-y-md md:space-y-0 
    md:grid md:grid-cols-[1fr_2fr] md:gap-lg
  ">
    {/* Hero Card */}
    <HeroCard 
      className="min-h-[200px] md:min-h-[400px]" 
    />
    
    {/* Grid 2x2 */}
    <div className="grid grid-cols-2 gap-md md:gap-lg">
      {/* ... tarjetas ... */}
    </div>
  </div>
  
  {/* Tab Bar solo en mobile */}
  <TabBar className="md:hidden" />
</div>
```

---

## 5.4 - Diseño de Pantallas Secundarias (Listas y Formularios)

### Listas de Alumnos

**Contexto:** Pantalla más usada después del dashboard. Debe permitir escaneo rápido.

#### Especificaciones de Tarjeta de Alumno

**Estructura:**
```
┌─────────────────────────────────────────┐
│ [Foto] │ Juan Pérez Gómez         🟡 P  │
│  80x80 │ Cancha Norte - 17:00           │
│        │ 8 asistencias | 2 entrenadores │
└─────────────────────────────────────────┘
```

**Elementos:**

1. **Foto del alumno:**
   - Tamaño: 80x80px (64x64px en mobile)
   - Border-radius: `var(--radius-md)` (8px) o circular
   - Borde: `var(--border-thin)` (1px) solid `var(--color-primary)`
   - Fallback si no hay foto: Iniciales con fondo `var(--color-surface)`

2. **Nombre:**
   - Tamaño: `var(--font-size-lg)` (18px)
   - Peso: `var(--font-weight-semibold)` (600)
   - Color: `var(--color-text-primary)` (blanco)

3. **Badge de estado:**
   - Posición: Top-right de la tarjeta
   - Estados:
     - 🟢 "A" (Aprobado) - `var(--color-success)`
     - 🟡 "P" (Pendiente) - `var(--color-warning)`
     - 🟣 "Arq" (Arquero) - `var(--color-arquero)` (badge adicional)

4. **Información secundaria:**
   - Tamaño: `var(--font-size-sm)` (14px)
   - Color: `var(--color-text-secondary)` (gris medio)
   - Línea 1: Cancha + Horario
   - Línea 2: Estadísticas (asistencias, entrenadores, etc.)

**Tarjeta completa:**
- Fondo: `var(--color-surface)` (#1A1A1A)
- Borde: `var(--border-thin)` (1px) solid `var(--color-border)` (#2D2D2D)
- Border-radius: `var(--radius-md)` (8px)
- Padding: `var(--spacing-md)` (16px)
- Margin-bottom: `var(--spacing-sm)` (8px)

**Interactividad:**
```css
.alumno-card:hover {
  border-color: var(--color-primary);
  background: rgba(255, 107, 53, 0.05); /* Primary con 5% opacidad */
}

.alumno-card:active {
  transform: scale(0.99);
}
```

---

#### Código de Referencia - Tarjeta de Alumno

```jsx
// Archivo: /src/features/alumnos/components/AlumnoCard.jsx

function AlumnoCard({ alumno }) {
  return (
    <div className="
      bg-surface 
      border border-border 
      rounded-md 
      p-md 
      flex items-center gap-md
      hover:border-primary hover:bg-primary/5
      transition-fast
      cursor-pointer
    ">
      {/* Foto */}
      <div className="flex-shrink-0">
        {alumno.foto_url ? (
          <img 
            src={alumno.foto_url} 
            alt={alumno.nombres}
            className="w-20 h-20 rounded-md border border-primary object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-md border border-primary bg-surface flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">
              {alumno.nombres[0]}{alumno.apellidos[0]}
            </span>
          </div>
        )}
      </div>
      
      {/* Información */}
      <div className="flex-grow">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-white">
            {alumno.nombres} {alumno.apellidos}
          </h3>
          
          {/* Badges de estado */}
          <div className="flex gap-xs">
            {alumno.estado === 'Pendiente' && (
              <span className="px-2 py-1 bg-warning/20 text-warning text-xs font-bold rounded">
                P
              </span>
            )}
            {alumno.estado === 'Aprobado' && (
              <span className="px-2 py-1 bg-success/20 text-success text-xs font-bold rounded">
                A
              </span>
            )}
            {alumno.es_arquero && (
              <span className="px-2 py-1 bg-arquero/20 text-arquero text-xs font-bold rounded">
                Arq
              </span>
            )}
          </div>
        </div>
        
        {/* Info secundaria */}
        <p className="text-sm text-secondary mt-xs">
          {alumno.cancha?.nombre} - {alumno.horario?.hora}
        </p>
        <p className="text-sm text-secondary">
          {alumno.asistencias_count} asistencias | {alumno.entrenadores?.length} entrenadores
        </p>
      </div>
    </div>
  );
}
```

---

### Formularios

**Contexto:** Registro y edición de datos. Debe ser claro qué es obligatorio y qué opcional.

#### Especificaciones de Campos de Formulario

**Campo de texto básico:**

```jsx
<div className="space-y-xs">
  <label className="text-sm font-medium text-secondary">
    Nombres *
  </label>
  <input
    type="text"
    className="
      w-full
      bg-surface
      border-regular border-border
      rounded-sm
      px-md py-sm
      text-white
      focus:border-primary focus:outline-none
      transition-fast
    "
    placeholder="Ingresa el nombre"
  />
</div>
```

**Reglas:**
- Labels siempre arriba del campo
- Campos obligatorios con asterisco (*) después del label
- Placeholder descriptivo pero breve
- Color de fondo: `var(--color-surface)`
- Borde: `var(--border-regular)` en estado normal
- Borde activo: `var(--border-active)` (primary) en focus
- Border-radius: `var(--radius-sm)` (4px) - menos redondeado que tarjetas

**Estados de validación:**

```jsx
// Campo con error
<input className="... border-error focus:border-error" />
<p className="text-error text-xs mt-xs">
  Por favor, completa el nombre
</p>

// Campo válido
<input className="... border-success" />

// Campo deshabilitado
<input className="... bg-disabled text-secondary cursor-not-allowed" disabled />
```

---

#### Layout de Formulario

**Estructura:**
- 1 columna en mobile
- 2 columnas en desktop (para campos relacionados)
- Campos de texto completo (nombre, dirección) siempre en 1 columna
- Campos cortos (teléfono, CI) pueden ir en 2 columnas

**Espaciado:**
- Entre campos: `var(--spacing-md)` (16px)
- Entre secciones: `var(--spacing-xl)` (32px)
- Padding del formulario: `var(--spacing-lg)` (24px)

**Botones del formulario:**
- Alineados a la derecha (desktop) o full-width (mobile)
- Botón primario (guardar): Full style primary
- Botón secundario (cancelar): Outline style
- Gap entre botones: `var(--spacing-sm)` (8px)

---

#### Código de Referencia - Formulario

```jsx
// Archivo: /src/features/alumnos/components/AlumnoForm.jsx

function AlumnoForm({ onSubmit, onCancel }) {
  return (
    <form onSubmit={onSubmit} className="bg-surface rounded-md p-lg space-y-lg">
      {/* Sección: Datos Básicos */}
      <div className="space-y-md">
        <h2 className="text-xl font-bold text-white border-b border-border pb-sm">
          Datos Básicos
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {/* Nombres */}
          <div className="space-y-xs">
            <label className="text-sm font-medium text-secondary">
              Nombres *
            </label>
            <input
              type="text"
              required
              className="w-full bg-background border-regular border-border rounded-sm px-md py-sm text-white focus:border-primary focus:outline-none transition-fast"
              placeholder="Ej: Juan Carlos"
            />
          </div>
          
          {/* Apellidos */}
          <div className="space-y-xs">
            <label className="text-sm font-medium text-secondary">
              Apellidos *
            </label>
            <input
              type="text"
              required
              className="w-full bg-background border-regular border-border rounded-sm px-md py-sm text-white focus:border-primary focus:outline-none transition-fast"
              placeholder="Ej: Pérez Gómez"
            />
          </div>
        </div>
        
        {/* Fecha de Nacimiento */}
        <div className="space-y-xs">
          <label className="text-sm font-medium text-secondary">
            Fecha de Nacimiento *
          </label>
          <input
            type="date"
            required
            className="w-full bg-background border-regular border-border rounded-sm px-md py-sm text-white focus:border-primary focus:outline-none transition-fast"
          />
        </div>
        
        {/* Checkbox Arquero */}
        <div className="flex items-center gap-sm">
          <input
            type="checkbox"
            id="es_arquero"
            className="w-5 h-5 rounded border-border focus:ring-primary"
          />
          <label htmlFor="es_arquero" className="text-sm text-white">
            Es Arquero
          </label>
        </div>
      </div>
      
      {/* Sección: Representantes */}
      <div className="space-y-md">
        <h2 className="text-xl font-bold text-white border-b border-border pb-sm">
          Representantes (al menos uno completo)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <label className="text-sm font-medium text-secondary">
              Nombre del Padre
            </label>
            <input
              type="text"
              className="w-full bg-background border-regular border-border rounded-sm px-md py-sm text-white focus:border-primary focus:outline-none transition-fast"
            />
          </div>
          
          <div className="space-y-xs">
            <label className="text-sm font-medium text-secondary">
              Teléfono Padre
            </label>
            <input
              type="tel"
              className="w-full bg-background border-regular border-border rounded-sm px-md py-sm text-white focus:border-primary focus:outline-none transition-fast"
              placeholder="+591 77123456"
            />
          </div>
        </div>
      </div>
      
      {/* Botones de acción */}
      <div className="flex flex-col md:flex-row gap-sm justify-end pt-lg border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="px-lg py-sm border-regular border-border text-white rounded-sm hover:border-primary transition-fast"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-lg py-sm bg-primary text-white font-semibold rounded-sm hover:bg-primary/90 transition-fast"
        >
          Guardar Alumno
        </button>
      </div>
    </form>
  );
}
```

---

## 5.5 - Componentes de Feedback

### Notificaciones Toast

**Uso:** Confirmaciones rápidas de acciones (guardar, eliminar, etc.)

**Especificaciones:**
- Posición: Bottom-right (desktop) o bottom-center (mobile)
- Duración: 3 segundos
- Ancho: 320px (desktop), 90% (mobile)
- Padding: `var(--spacing-md)`
- Border-radius: `var(--radius-md)`
- Animación: Slide-in from bottom

**Variantes:**

```jsx
// Toast de éxito
<div className="bg-success/20 border-regular border-success text-white p-md rounded-md flex items-center gap-sm">
  <CheckCircleIcon className="text-success" size={20} />
  <span>¡Listo! Asistencia registrada ✓</span>
</div>

// Toast de error
<div className="bg-error/20 border-regular border-error text-white p-md rounded-md flex items-center gap-sm">
  <XCircleIcon className="text-error" size={20} />
  <span>No pudimos guardar los cambios. Intenta nuevamente.</span>
</div>

// Toast de advertencia
<div className="bg-warning/20 border-regular border-warning text-white p-md rounded-md flex items-center gap-sm">
  <AlertTriangleIcon className="text-warning" size={20} />
  <span>Este alumno aún está pendiente de aprobación.</span>
</div>
```

---

### Diálogos de Confirmación

**Uso:** Acciones destructivas o que requieren decisión explícita.

**Especificaciones:**
- Overlay: Fondo negro con 60% opacidad
- Modal centrado
- Ancho: 400px (desktop), 90% (mobile)
- Padding: `var(--spacing-lg)`
- Border-radius: `var(--radius-md)`
- Border: `var(--border-regular)` solid `var(--color-primary)`

**Estructura:**

```jsx
// Ejemplo: Confirmación de eliminación
<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-lg">
  <div className="bg-surface border-regular border-primary rounded-md p-lg max-w-md w-full">
    {/* Título */}
    <h2 className="text-xl font-bold text-white mb-md">
      ¿Archivar alumno?
    </h2>
    
    {/* Mensaje */}
    <p className="text-secondary mb-lg">
      Este alumno tiene 8 asistencias registradas. ¿Estás seguro de archivarlo?
    </p>
    
    {/* Botones */}
    <div className="flex gap-sm justify-end">
      <button className="px-lg py-sm border-regular border-border text-white rounded-sm hover:border-primary transition-fast">
        Cancelar
      </button>
      <button className="px-lg py-sm bg-error text-white font-semibold rounded-sm hover:bg-error/90 transition-fast">
        Archivar
      </button>
    </div>
  </div>
</div>
```

---

### Estados de Carga

**Spinners:**
- Color: `var(--color-primary)`
- Tamaño: 24px (inline), 48px (full-page)
- Animación: Rotación suave (1s)

**Skeleton Loaders (preferido para listas):**
- Fondo: `var(--color-surface)`
- Animación: Pulse suave
- Mantener estructura de la UI (tarjetas, campos)

```jsx
// Skeleton de tarjeta de alumno
<div className="bg-surface border border-border rounded-md p-md animate-pulse">
  <div className="flex items-center gap-md">
    <div className="w-20 h-20 bg-border rounded-md"></div>
    <div className="flex-grow space-y-sm">
      <div className="h-4 bg-border rounded w-3/4"></div>
      <div className="h-3 bg-border rounded w-1/2"></div>
    </div>
  </div>
</div>
```

---

## 5.6 - Accesibilidad y Usabilidad

### Tamaños Mínimos de Toque

**Regla fundamental:** Todo elemento interactivo debe tener **mínimo 44x44px** de área de toque.

Esto incluye:
- Botones
- Enlaces
- Checkboxes
- Íconos clickeables
- Elementos de lista

**Implementación:**
```css
.touchable {
  min-width: 44px;
  min-height: 44px;
  /* O usar padding para llegar a ese tamaño */
}
```

---

### Contraste de Color

Todos los textos deben cumplir **WCAG AA** como mínimo:

- Texto normal (16px+): Ratio de contraste 4.5:1
- Texto grande (24px+): Ratio de contraste 3:1

**Combinaciones aprobadas:**
- ✅ Blanco (#FFFFFF) sobre Negro (#0A0A0A) - Ratio: 19.56:1
- ✅ Blanco sobre Surface (#1A1A1A) - Ratio: 17.33:1
- ✅ Primary (#FF6B35) sobre Negro - Ratio: 5.12:1
- ✅ Success (#00D26A) sobre Negro - Ratio: 7.28:1

**Combinaciones NO permitidas:**
- ❌ Gris secundario (#A0A0A0) sobre Surface - Ratio insuficiente
- ❌ Primary sobre Success - Ratio insuficiente

---

### Navegación por Teclado

Todos los elementos interactivos deben ser accesibles vía teclado:

1. **Tab order lógico:**
   - De izquierda a derecha
   - De arriba a abajo
   - Secciones más importantes primero

2. **Focus visible:**
```css
.interactive:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

3. **Atajos de teclado (opcional en MVP):**
   - `Ctrl/Cmd + N`: Nuevo registro
   - `Esc`: Cerrar modal
   - `Enter`: Confirmar/Guardar

---

### Feedback Táctil

En dispositivos móviles, usar vibraciones sutiles:

```javascript
// Al hacer tap en botón principal
if ('vibrate' in navigator) {
  navigator.vibrate(10); // 10ms vibración suave
}

// Al ocurrir error
if ('vibrate' in navigator) {
  navigator.vibrate([50, 50, 50]); // Patrón: vibra-pausa-vibra-pausa-vibra
}
```

---

## 5.7 - Iconografía

### Librería de Íconos

**Usar:** [Lucide React](https://lucide.dev/) (ya incluido en Shadcn UI)

**Por qué:**
- Diseño consistente
- Optimizado para web
- Personalizable (tamaño, color, stroke)
- Incluido por defecto en Shadcn

---

### Íconos Recomendados por Módulo

**Configurar:** `Settings` o `Cog`  
**Registro Alumnos:** `UserPlus` o `UserCheck`  
**Asistencia:** `ClipboardCheck` o `CheckSquare`  
**Convocados:** `Users` o `UsersRound`  
**Cumpleaños:** `Cake` o `Gift`  
**Estado Físico:** `HeartPulse` o `Activity`  

**Estados de asistencia:**
- Presente: `CheckCircle` (verde)
- Ausente: `XCircle` (rojo)
- Licencia: `MinusCircle` (ámbar)

**Acciones comunes:**
- Editar: `Edit` o `Pencil`
- Eliminar: `Trash2` o `Archive`
- Guardar: `Check` o `Save`
- Cancelar: `X`
- Buscar: `Search`
- Filtrar: `Filter`
- Ordenar: `ArrowUpDown`

---

### Tamaños de Íconos

**Contexto de uso:**
- Íconos de módulo (dashboard): 80-100px
- Íconos en botones: 16-20px
- Íconos en tarjetas: 20-24px
- Íconos decorativos: 16px

**Implementación:**
```jsx
import { CheckCircle } from 'lucide-react';

// Ícono grande (dashboard)
<CheckCircle size={100} strokeWidth={2} />

// Ícono en botón
<CheckCircle size={18} strokeWidth={2} />

// Ícono inline con texto
<div className="flex items-center gap-xs">
  <CheckCircle size={16} />
  <span>Presente</span>
</div>
```

---

## 5.8 - Tipografía

### Fuente del Sistema

**No usar fuentes custom en MVP.** Usar system font stack para máximo rendimiento:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
  sans-serif;
```

**Por qué:**
- Carga instantánea (sin descarga)
- Nativa del sistema operativo
- Legibilidad optimizada para cada plataforma
- Cero impacto en performance

---

### Jerarquía Tipográfica

**Uso de tamaños:**

| Elemento | Variable | Tamaño | Peso | Uso |
|----------|----------|--------|------|-----|
| Logo/Marca | `--font-size-3xl` | 30px | 900 | "AsiSport" en dashboard |
| Título Página | `--font-size-2xl` | 24px | 700 | "Registro de Alumnos" |
| Título Sección | `--font-size-xl` | 20px | 700 | "Datos Básicos" en form |
| Nombre Alumno | `--font-size-lg` | 18px | 600 | En tarjetas de lista |
| Texto Normal | `--font-size-base` | 16px | 400 | Cuerpo de texto, labels |
| Texto Pequeño | `--font-size-sm` | 14px | 400 | Info secundaria, metadatos |
| Texto Mínimo | `--font-size-xs` | 12px | 400 | Badges, footnotes |

**Regla:** Nunca usar menos de 12px en elementos visibles. Para contexto móvil, incrementar +2px.

---

### Line-height (Interlineado)

```css
/* Títulos */
h1, h2, h3 {
  line-height: 1.2;
}

/* Texto normal */
p, span, label {
  line-height: 1.5;
}

/* Texto denso (tablas, listas) */
.compact {
  line-height: 1.4;
}
```

---

## 5.9 - Animaciones y Transiciones

### Principios de Movimiento

1. **Rápido pero perceptible:** 150-300ms para la mayoría de interacciones
2. **Ease-in-out:** Movimientos naturales (aceleración + desaceleración)
3. **Solo cuando aporta valor:** No animar por animar

---

### Transiciones Estándar

```css
/* Hover en elementos interactivos */
.interactive {
  transition: var(--transition-fast); /* 150ms */
}

/* Modales, overlays */
.modal {
  transition: var(--transition-normal); /* 300ms */
}

/* Grandes cambios de estado */
.state-change {
  transition: var(--transition-slow); /* 500ms */
}
```

---

### Animaciones Prohibidas

❌ **NO usar:**
- Animaciones automáticas en loop (distrae)
- Transiciones en scroll (causa mareo)
- Parallax effects (innecesario para el contexto)
- Animaciones largas (>500ms) para interacciones frecuentes

✅ **Sí usar:**
- Fade-in para contenido que carga
- Slide-in para modales/drawers
- Scale en botones al hacer click (feedback)
- Pulse sutil en skeleton loaders

---

## 5.10 - Modo Responsive

### Breakpoints

```javascript
// Tailwind breakpoints (usar estos)
const breakpoints = {
  'sm': '640px',   // Móvil grande / Tablet pequeña
  'md': '768px',   // Tablet
  'lg': '1024px',  // Desktop pequeño
  'xl': '1280px',  // Desktop grande
  '2xl': '1536px'  // Desktop extra grande
}
```

---

### Mobile-First Approach

**Diseñar primero para móvil**, luego expandir:

```jsx
// ✅ Correcto (mobile-first)
<div className="
  text-sm           {/* Mobile: 14px */}
  md:text-base      {/* Tablet+: 16px */}
  lg:text-lg        {/* Desktop+: 18px */}
">

// ❌ Incorrecto (desktop-first)
<div className="
  text-lg           
  md:text-base      
  sm:text-sm        
">
```

---

### Adaptaciones por Dispositivo

**Mobile (<768px):**
- Grid de 1 columna siempre
- Botones full-width
- Padding reducido (`spacing-md` en lugar de `spacing-lg`)
- Formularios apilados verticalmente
- Modales full-screen (o casi)

**Tablet (768px-1024px):**
- Grid de 2 columnas donde tenga sentido
- Botones con ancho fijo
- Padding intermedio
- Formularios en 2 columnas para campos cortos

**Desktop (>1024px):**
- Grid de 2-3 columnas según contenido
- Botones con ancho mínimo (no full-width)
- Padding generoso
- Formularios optimizados horizontalmente

---

### Especificaciones de Touch vs Mouse

**Touch (Mobile/Tablet):**
- Áreas de toque: 44x44px mínimo
- Espaciado entre elementos interactivos: 8px mínimo
- Hover states: No mostrar (no existe hover en touch)
- Focus states: Mostrar claramente

**Mouse (Desktop):**
- Áreas clickeables: 32x32px mínimo
- Hover states: Sí mostrar
- Cursor pointer en interactivos
- Tooltips en hover (opcional)

---

## 5.11 - Protocolo para el Agente AI

### Reglas de Oro al Diseñar Componentes

Cuando el agente cree cualquier componente UI, debe:

1. **Usar variables CSS SIEMPRE:**
   - ✅ `bg-primary` o `var(--color-primary)`
   - ❌ `bg-[#FF6B35]` (hardcoded)

2. **Seguir el tono de comunicación:**
   - Mensajes amigables y orientados a solución
   - Usar frases completas en botones primarios
   - Emojis solo en éxitos y cumpleaños

3. **Respetar el estilo brutalista en dashboard:**
   - Bordes gruesos (`border-thick`)
   - Contraste alto (negro/blanco)
   - Espaciado generoso
   - Botones grandes

4. **Ser flexible en pantallas secundarias:**
   - Brutalismo moderado (bordes más sutiles)
   - Jerarquía visual clara
   - Información densa pero legible

5. **Mobile-first:**
   - Diseñar para móvil primero
   - Probar que funcione en 375px de ancho (iPhone SE)
   - Expandir a desktop después

6. **Accesibilidad:**
   - Contraste mínimo 4.5:1
   - Áreas de toque 44x44px
   - Focus states visibles
   - Labels semánticos

---

### Checklist de Validación de Componente

Antes de dar por terminado un componente, el agente debe verificar:

- [ ] Usa variables CSS (no colores hardcoded)
- [ ] Mensajes de texto siguen el tono aprobado
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Estados interactivos (hover, active, focus, disabled)
- [ ] Áreas de toque mínimas (44x44px en mobile)
- [ ] Contraste de color adecuado
- [ ] Transiciones suaves (150-300ms)
- [ ] Íconos de Lucide React
- [ ] Accesible por teclado

---

### Ejemplo de Componente Completo Bien Hecho

```jsx
// Archivo: /src/components/shared/Button.jsx
// Botón que cumple todas las reglas de estilo de AsiSport

import { Loader2 } from 'lucide-react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'default',
  loading = false,
  disabled = false,
  icon,
  ...props 
}) {
  const baseStyles = "
    font-semibold 
    rounded-sm 
    transition-fast 
    flex items-center justify-center gap-sm
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  ";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 border-none",
    secondary: "bg-transparent border-regular border-border text-white hover:border-primary",
    destructive: "bg-error text-white hover:bg-error/90 border-none",
  };
  
  const sizes = {
    sm: "px-md py-xs text-sm min-h-[36px]",
    default: "px-lg py-sm text-base min-h-[44px]",
    lg: "px-xl py-md text-lg min-h-[52px]",
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
```

**Uso:**
```jsx
<Button variant="primary" size="default">
  Registrar Asistencia
</Button>

<Button variant="secondary" onClick={onCancel}>
  Cancelar
</Button>

<Button variant="destructive" icon={<Trash2 size={18} />}>
  Archivar Alumno
</Button>

<Button loading={true}>
  Guardando...
</Button>
```

---

## 5.12 - Referencias Visuales

### Mockups de Referencia

Para contexto visual complementario (no para replicar pixel-perfect), consultar:

**Ubicación:** `/docs/design/mockups/`

**Archivos disponibles:**
- `dashboard-desktop.png` - Pantalla principal en desktop
- `dashboard-mobile.png` - Pantalla principal en móvil


**Nota para el agente:** Estos mockups son referencias visuales. Las especificaciones técnicas en este documento tienen prioridad. Si hay discrepancia, seguir las specs escritas.

---

## Regla de Oro Final

> **"Si un entrenador no puede usarlo bajo el sol con una mano, el diseño está mal."**

Cada decisión de diseño debe pasar esta prueba de realidad:
- ¿Es legible bajo luz solar directa? (contraste alto)
- ¿Se puede tocar fácilmente con un dedo? (áreas grandes)
- ¿El mensaje es claro en 2 segundos? (comunicación directa)
- ¿Funciona cuando tienes prisa? (acciones obvias)

Si la respuesta es NO a cualquiera, rediseñar.