# Validacion: asistencias del SuperAdministrador

Fecha: 2026-09-11.

## Resultado

- Sin entrenador seleccionado, el SuperAdministrador consulta todos los alumnos
  elegibles de su escuela, incluso sin asignacion docente.
- Con entrenador seleccionado, se conserva el filtro de asignaciones.
- El estado de envio del SuperAdministrador cuenta las asistencias de los alumnos
  candidatos, aunque el autor sea otro usuario.
- Los otros roles conservan sus resultados previos.
- El selector de entrenador se oculta si no hay opciones. Los filtros administrativos
  permiten regresar a Todos y el mensaje vacio no exige asignacion al usuario.
- No cambia el servicio de guardado: usa el usuario actual por defecto y conserva
  autor y grupo originales en una correccion.

## Pruebas reproducibles

Desde AsiSportv2, con sus dependencias instaladas:

```powershell
npm.cmd install --prefix ../outputs/attendance-test-runtime --no-save --package-lock=false @electric-sql/pglite@0.5.8
node scripts/test-superadmin-asistencia.mjs ../outputs/attendance-test-runtime
node node_modules/vite/bin/vite.js build
node scripts/preview-superadmin-asistencia.mjs
```

La prueba SQL ejecuta la migracion real en PostgreSQL en memoria con datos sinteticos:
36 comparaciones antes/despues para Entrenador, Administrador, Asistente y
Entrenarqueros; SuperAdministrador con alumnos propios, ajenos y sin entrenador;
filtros; escuela vacia; aislamiento de escuelas; sesion ausente/inactiva; privilegios
authenticated/anon; autor, correccion, unicidad; rollback y reaplicacion.

El servicio real de guardado se ejecuta mediante un adaptador de prueba hacia esa
base. El esquema, los triggers y RLS del entorno de prueba son reducidos; no se
presentan como una copia completa de produccion.

El preview sirve la pantalla y hooks reales con servicios simulados:
- http://127.0.0.1:4318/?scenario=empty
- http://127.0.0.1:4318/?scenario=populated

Se verificaron escritorio y movil (390 x 844), lista vacia, ocultacion del selector,
filtro por entrenador, regreso a Todos y envio exitoso de un alumno sin entrenador.
No hubo errores de pagina ni desbordamiento horizontal. Capturas en ../outputs/.
Compilacion Vite satisfactoria; aviso preexistente de Browserslist desactualizado.
El documento operational_rules.md ya estaba modificado y no fue alterado.

## Produccion y publicacion

Solo se hicieron lecturas en produccion, incluida una transaccion READ ONLY con
rol authenticated y el identificador del superadministrador de Lokillos FC:
usuario activo, 2 grupos y 0 alumnos visibles. No se crearon usuarios ni asistencias.

La migracion y el frontend NO estan publicados. Aplicar exclusivamente
20260911180550_superadmin_asistencia_toda_escuela.sql y publicar el frontend.
Antes de aplicarla, comprobar que la definicion vigente de la RPC sigue coincidiendo
con la capturada en el rollback; si ha cambiado, integrar esos cambios primero.
La reversión restaura esa definicion anterior, incluidas las reglas de Entrenador.
No ejecutar un db push general con migraciones ajenas a esta entrega.
