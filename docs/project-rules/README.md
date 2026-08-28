# Reglas de Proyecto AsiSport (Antigravity Rules)

Este directorio contiene **la documentación completa de reglas y guías** para el desarrollo de AsiSport.

Estos documentos son la **fuente de verdad** que debe consultar cualquier agente de IA (como Antigravity) o desarrollador antes de implementar funcionalidades.

---

## 📋 Índice de Documentos

### 🎯 [proyect_rules.md](./proyect_rules.md)
**Pasos 1, 2 y 3 - Fundamentos del Proyecto**

Contiene:
- **Paso 1: Contexto y Visión del Producto** - El "Por Qué" existe AsiSport
- **Paso 2: Stack Tecnológico y Estándares** - El "Cómo" se construye (React, Vite, Supabase, Tailwind, Shadcn)
- **Paso 3: Arquitectura y Organización de Archivos** - El "Dónde" va cada cosa (/components, /features, /services, etc.)

**Cuándo consultarlo:**
- Antes de empezar cualquier desarrollo
- Al definir nuevas funcionalidades
- Al decidir qué tecnología usar
- Al organizar nuevos archivos/carpetas

---

### 🚨 [operational_rules.md](./operational_rules.md)
**Paso 4 - Reglas de Lógica de Negocio (Líneas Rojas)**

Contiene:
- 22 reglas críticas que NO se pueden romper
- Validaciones obligatorias (campos, formatos, permisos)
- Reglas de autenticación y seguridad
- Reglas de gestión de alumnos, asistencias y convocatorias
- Mensajes de error estandarizados

**Cuándo consultarlo:**
- Antes de implementar CUALQUIER funcionalidad
- Al escribir validaciones (frontend o backend)
- Al manejar permisos y roles
- Al crear formularios
- Cuando algo "no debería poder pasar"

**⚠️ CRÍTICO:** Si una regla del Paso 4 se viola, el sistema pierde integridad de datos.

---

### 🎨 [guia_estilo_ux_ui.md](./guia_estilo_ux_ui.md)
**Paso 5 - Guía de Estilo y Experiencia de Usuario**

Contiene:
- Sistema de diseño completo (paleta de colores, variables CSS)
- Tono de comunicación (mensajes amigables, no técnicos)
- Diseño de pantalla principal mobile y desktop
- Especificaciones de componentes (tarjetas, formularios, botones)
- Tipografía, iconografía, animaciones
- Reglas de accesibilidad y usabilidad

**Cuándo consultarlo:**
- Al crear cualquier componente UI
- Al escribir mensajes para el usuario
- Al definir colores, tamaños, espaciados
- Al diseñar pantallas nuevas
- Al probar usabilidad en móvil

**💡 Principio:** "Si no funciona en la cancha bajo el sol, no está bien diseñado"

---

### 🧪 [protocolo_pruebas_qa.md](./protocolo_pruebas_qa.md)
**Paso 6 - Protocolo de Pruebas y Calidad**

Contiene:
- Prioridades de testing (Usabilidad → Flujos → Performance → Seguridad → Datos)
- Enfoque híbrido (tests automatizados + manuales)
- Criterio de "terminado" (3 niveles: Funciona + Validaciones + UX)
- Checklists por funcionalidad (Registro, Asistencias, Convocatorias)
- Protocolo de manejo de bugs
- Ejemplos de tests automatizados y manuales

**Cuándo consultarlo:**
- Después de implementar una funcionalidad
- Antes de considerar algo "terminado"
- Al escribir tests
- Al probar manualmente en móvil
- Al reportar bugs

**✅ Regla:** Una funcionalidad no está terminada hasta que cumple los 3 niveles de QA.

---

## 🔄 Flujo de Trabajo Recomendado

Cuando implementes una nueva funcionalidad, sigue este orden:

```
1. Lee Paso 1 → Entiende el contexto y visión
   ↓
2. Lee Paso 2 y 3 → Confirma stack y arquitectura
   ↓
3. Lee Paso 4 → Identifica reglas de negocio que aplican
   ↓
4. Implementa la funcionalidad
   ↓
5. Lee Paso 5 → Aplica diseño y UX correctos
   ↓
6. Lee Paso 6 → Ejecuta protocolo de testing
   ↓
7. ✅ Funcionalidad terminada
```

---

## 📂 Archivos de Soporte

### `../design/mockups/`
Mockups visuales de referencia:
- `dashboard-desktop.png` - Pantalla principal en escritorio
- `dashboard-mobile.png` - Pantalla principal en móvil (con medidas)

**Uso:** Complementan las especificaciones del Paso 5. Si hay discrepancia entre mockup y texto, **el texto del Paso 5 tiene prioridad**.

---

### `../../src/styles/globals.css`
Variables CSS del sistema de diseño.

**Contenido:**
- Paleta de colores (primary, success, warning, error, etc.)
- Espaciados (xs, sm, md, lg, xl)
- Tipografía (tamaños, pesos)
- Bordes, radios, sombras, transiciones

**Regla:** SIEMPRE usar variables CSS. Nunca hardcodear colores o tamaños.

```css
/* ✅ Correcto */
background-color: var(--color-primary);

/* ❌ Incorrecto */
background-color: #FF6B35;
```

---

### `../../tailwind.config.js`
Configuración de Tailwind para usar las variables CSS.

**Ya configurado.** No requiere cambios a menos que se agreguen nuevas variables al sistema de diseño.

---

## 🎯 Principios Fundamentales

### 1. Mobile-First
AsiSport se usa principalmente en móvil, en la cancha, bajo el sol. **Siempre diseña y prueba primero para móvil.**

### 2. Contexto Real
No optimizar para "condiciones ideales". El entrenador tiene prisa, manos sudadas, está parado, hay luz solar. **Si no funciona en esas condiciones, no funciona.**

### 3. Simplicidad > Elegancia
Este es un MVP. **Prioriza que funcione sobre que sea perfecto.** Código simple y claro > código sofisticado.

### 4. La "Fuente de la Verdad" es Sagrada
Los datos en AsiSport deben ser confiables para conversaciones con padres. **Toda validación que proteja integridad de datos es crítica.**

### 5. Validar Rápido, Iterar Rápido
No construir todo y luego probar. **Probar cada funcionalidad completa antes de continuar.**

---

## ⚠️ Reglas de Oro por Paso

| Paso | Regla de Oro |
|------|--------------|
| **1** | Si no resuelve comunicación entrenador-padres, no va en el MVP |
| **2** | Simplicidad > Escalabilidad. Aprendizaje real > Hipótesis técnicas |
| **3** | Si tienes que pensar más de 10 segundos dónde va un archivo, la arquitectura está fallando |
| **4** | Si una validación afecta la "fuente de la verdad", es una línea roja |
| **5** | Si un entrenador no puede usarlo bajo el sol con una mano, el diseño está mal |
| **6** | Si no lo probaste en móvil bajo el sol, no está probado |

---

## 🚀 Para Agentes de IA (Antigravity)

Si eres un agente de IA trabajando en este proyecto:

### Antes de escribir código:
1. ✅ Lee los Pasos 1, 2, 3 (proyect_rules.md)
2. ✅ Lee el Paso 4 (operational_rules.md) y identifica reglas aplicables
3. ✅ Lee el Paso 5 (guia_estilo_ux_ui.md) para diseño y UX

### Mientras escribes código:
- Usa variables CSS (nunca hardcodear)
- Sigue arquitectura de carpetas (Paso 3)
- Implementa validaciones del Paso 4
- Usa mensajes amigables del Paso 5

### Después de escribir código:
1. ✅ Ejecuta tests automatizados
2. ✅ Prueba manualmente (browser tool)
3. ✅ Verifica checklist del Paso 6
4. ✅ Solo di "terminado" si cumple 3 niveles (Funciona + Validaciones + UX)

### Si encuentras un bug:
- Detente y documenta
- Pregunta al usuario qué hacer (Opción A, B o C del Paso 6)
- NO asumas, NO sigas sin confirmación

---

## 📝 Historial de Cambios

### v1.0 - 2026-02-02
- ✅ Creación de documentación completa (6 pasos)
- ✅ Sistema de diseño definido (colores, tipografía, componentes)
- ✅ 22 reglas de negocio documentadas
- ✅ Protocolo de QA establecido
- ✅ Mockups de referencia creados

---

## 🤝 Contribuciones

Si necesitas agregar o modificar reglas:

1. Discute el cambio antes de implementarlo
2. Actualiza el documento correspondiente
3. Actualiza este README si es necesario
4. Comunica cambios al equipo

**Recuerda:** Estos documentos son la fuente de verdad. Cambiarlos afecta a todo el proyecto.

---

## 📞 Contacto

Si tienes dudas sobre alguna regla o necesitas clarificación:
- Revisa primero el documento correspondiente
- Si la duda persiste, pregunta al líder del proyecto

---

## ✨ Visión Final

**AsiSport no es una app perfecta. Es una app que funciona cuando más se necesita.**

Bajo el sol, con prisa, en la cancha, con manos sudadas. Ahí es donde importa. Ahí es donde estos documentos te ayudarán a construir algo que realmente sirva.

---

**Última actualización:** 2 de febrero de 2026  
**Versión:** 1.0  
**Proyecto:** AsiSport MVP (camino a SaaSport)
