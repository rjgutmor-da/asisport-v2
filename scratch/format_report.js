import fs from 'fs';

const rawData = fs.readFileSync('./scratch/orphans_report.json', 'utf8');
const data = JSON.parse(rawData);

console.log(`Total alumnos en grupos huérfanos (<= 3 alumnos): ${data.length}`);

// Group by Escuela -> Sucursal -> Grupo Actual (Cancha + Horario)
const tree = {};

data.forEach(item => {
  const escKey = item.escuela;
  const sucKey = item.sucursal;
  const grpKey = `${item.canchaActual} @ ${item.horarioActual} (${item.totalAlumnosGrupoActual} alumno/s)`;

  if (!tree[escKey]) tree[escKey] = {};
  if (!tree[escKey][sucKey]) tree[escKey][sucKey] = {};
  if (!tree[escKey][sucKey][grpKey]) tree[escKey][sucKey][grpKey] = [];

  tree[escKey][sucKey][grpKey].push(item);
});

let summaryMd = `# Reporte de Alumnos en Grupos Huérfanos (<= 3 Alumnos)\n\n`;

for (const [esc, sucs] of Object.entries(tree)) {
  summaryMd += `## Escuela: ${esc}\n`;
  for (const [suc, grps] of Object.entries(sucs)) {
    summaryMd += `### Sucursal: ${suc}\n`;
    for (const [grp, alumnos] of Object.entries(grps)) {
      summaryMd += `\n#### Grupo Actual Huérfano: **${grp}**\n`;
      summaryMd += `| Alumno | F. Nac. / Año | Estado | Grupo Normal Sugerido / Posible | Alumnos en Grupo Sug. | Criterio / Razón |\n`;
      summaryMd += `| --- | --- | --- | --- | --- | --- |\n`;
      
      alumnos.forEach(a => {
        if (typeof a.grupoPropuesto === 'object') {
          const prop = `${a.grupoPropuesto.cancha} @ ${a.grupoPropuesto.horario} (${a.grupoPropuesto.sucursal})`;
          summaryMd += `| **${a.nombreAlumno}** | ${a.fechaNacimiento} (${a.anioNacimiento}) | ${a.estado} | ${prop} | ${a.grupoPropuesto.totalAlumnos} | ${a.grupoPropuesto.razon} |\n`;
        } else {
          summaryMd += `| **${a.nombreAlumno}** | ${a.fechaNacimiento} (${a.anioNacimiento}) | ${a.estado} | *${a.grupoPropuesto}* | - | - |\n`;
        }
      });
    }
  }
}

fs.writeFileSync('./scratch/reporte_huérfanos.md', summaryMd, 'utf8');
console.log("Reporte generado en ./scratch/reporte_huérfanos.md");
