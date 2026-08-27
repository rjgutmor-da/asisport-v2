import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = "https://uqrmmotcbnyazmadzfvd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxcm1tb3RjYm55YXptYWR6ZnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMjgyNjQsImV4cCI6MjA4NTcwNDI2NH0.CvUVYdpi0DtPUevceDHWRFggWE_cXHgSdkxYmVzRVl0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  // Fetch all students (non-archived)
  const { data: alumnos, error: errA } = await supabase
    .from('alumnos')
    .select('id, nombres, apellidos, fecha_nacimiento, escuela_id, sucursal_id, cancha_id, horario_id, estado, archivado')
    .or('archivado.is.null,archivado.eq.false');

  if (errA) {
    console.error(errA);
    return;
  }

  // Fetch names lookup
  const { data: escuelas } = await supabase.from('escuelas').select('id, nombre');
  const { data: sucursales } = await supabase.from('sucursales').select('id, nombre');
  const { data: canchas } = await supabase.from('canchas').select('id, nombre');
  const { data: horarios } = await supabase.from('horarios').select('id, hora');

  const escMap = Object.fromEntries((escuelas || []).map(e => [e.id, e.nombre]));
  const sucMap = Object.fromEntries((sucursales || []).map(s => [s.id, s.nombre]));
  const canMap = Object.fromEntries((canchas || []).map(c => [c.id, c.nombre]));
  const horMap = Object.fromEntries((horarios || []).map(h => [h.id, h.hora]));

  // Process age/birth year
  const getYear = (fn) => fn ? new Date(fn).getFullYear() : 'Desconocido';

  // Group students by key: `${escuela_id}|${sucursal_id}|${cancha_id}|${horario_id}`
  const groupMap = new Map();

  alumnos.forEach(a => {
    const key = `${a.escuela_id || 'null'}|${a.sucursal_id || 'null'}|${a.cancha_id || 'null'}|${a.horario_id || 'null'}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        escuela_id: a.escuela_id,
        sucursal_id: a.sucursal_id,
        cancha_id: a.cancha_id,
        horario_id: a.horario_id,
        escuelaNombre: escMap[a.escuela_id] || 'Sin Escuela',
        sucursalNombre: sucMap[a.sucursal_id] || 'Sin Sucursal',
        canchaNombre: canMap[a.cancha_id] || 'Sin Cancha/Grupo',
        horarioHora: horMap[a.horario_id] || 'Sin Horario',
        students: []
      });
    }
    groupMap.get(key).students.push(a);
  });

  console.log(`Total grupos únicos encontrados: ${groupMap.size}`);

  // Find orphaned groups (<= 3 students)
  const orphanGroups = [];
  const normalGroups = [];

  for (const [key, grp] of groupMap.entries()) {
    if (grp.students.length <= 3) {
      orphanGroups.push(grp);
    } else {
      normalGroups.push(grp);
    }
  }

  console.log(`Grupos huérfanos (<= 3 alumnos): ${orphanGroups.length}`);
  console.log(`Grupos normales (> 3 alumnos): ${normalGroups.length}`);

  // For each orphan group and student, analyze possible regular group
  const results = [];

  for (const orphanGrp of orphanGroups) {
    const totalEnGrupo = orphanGrp.students.length;
    
    for (const student of orphanGrp.students) {
      const birthYear = getYear(student.fecha_nacimiento);
      const studentName = `${student.nombres || ''} ${student.apellidos || ''}`.trim();

      // Find candidates in normal groups within same escuela & sucursal
      const candidates = normalGroups.filter(ng => 
        ng.escuela_id === student.escuela_id && 
        ng.sucursal_id === student.sucursal_id
      );

      // Score candidates to find the best match for this student:
      // Criteria:
      // 1. Same cancha + different horario (if students prefer same category)
      // 2. Same horario + different cancha (if students prefer same time slot)
      // 3. Concentration of students of the same birth year in candidate group
      let bestCandidate = null;
      let maxScore = -1;
      let rationale = "";

      for (const cand of candidates) {
        let score = 0;
        let reasons = [];

        // Same category/cancha
        if (cand.cancha_id === student.cancha_id) {
          score += 50;
          reasons.push("Misma Cancha/Grupo");
        }

        // Same schedule/horario
        if (cand.horario_id === student.horario_id) {
          score += 30;
          reasons.push("Mismo Horario");
        }

        // Count students in candidate group with same birth year
        const sameAgeCount = cand.students.filter(s => getYear(s.fecha_nacimiento) === birthYear).length;
        if (sameAgeCount > 0) {
          score += (sameAgeCount * 10);
          reasons.push(`${sameAgeCount} alumnos de nac. ${birthYear}`);
        }

        // Bonus for group size (more stable group)
        score += cand.students.length;

        if (score > maxScore) {
          maxScore = score;
          bestCandidate = cand;
          rationale = reasons.join(", ");
        }
      }

      // Also search if there is NO candidate in the same sucursal, look at other sucursales of same escuela
      if (!bestCandidate) {
        const escCandidates = normalGroups.filter(ng => ng.escuela_id === student.escuela_id);
        for (const cand of escCandidates) {
          let score = cand.students.length;
          let reasons = ["Otra sucursal de la misma escuela"];
          if (cand.cancha_id === student.cancha_id) score += 30;
          if (cand.horario_id === student.horario_id) score += 20;

          if (score > maxScore) {
            maxScore = score;
            bestCandidate = cand;
            rationale = reasons.join(", ");
          }
        }
      }

      results.push({
        escuela: orphanGrp.escuelaNombre,
        sucursal: orphanGrp.sucursalNombre,
        canchaActual: orphanGrp.canchaNombre,
        horarioActual: orphanGrp.horarioHora,
        totalAlumnosGrupoActual: totalEnGrupo,
        alumnoId: student.id,
        nombreAlumno: studentName,
        fechaNacimiento: student.fecha_nacimiento || 'No registrada',
        anioNacimiento: birthYear,
        estado: student.estado,
        grupoPropuesto: bestCandidate ? {
          sucursal: bestCandidate.sucursalNombre,
          cancha: bestCandidate.canchaNombre,
          horario: bestCandidate.horarioHora,
          totalAlumnos: bestCandidate.students.length,
          razon: rationale
        } : "Sin grupo alternativo disponible (> 3 alumnos) en la misma escuela"
      });
    }
  }

  console.log(`Reporte listo. Guardando ${results.length} resultados en ./scratch/orphans_report.json`);
  fs.writeFileSync('./scratch/orphans_report.json', JSON.stringify(results, null, 2), 'utf8');
}

run().catch(console.error);
