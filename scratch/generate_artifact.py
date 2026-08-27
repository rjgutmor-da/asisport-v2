import json
from collections import defaultdict

with open(r'C:\Users\rjgut\.gemini\antigravity\brain\e096283a-8113-4e24-a636-8f0de95a9f6b\.system_generated\steps\50\output.txt', 'r', encoding='utf-8') as f:
    wrapper = json.load(f)

result_str = wrapper['result']
start_idx = result_str.find('[')
end_idx = result_str.rfind(']') + 1
data_json = result_str[start_idx:end_idx]
rows = json.loads(data_json)

# Group by Escuela -> Sucursal -> Combination
tree = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

for row in rows:
    esc = row['escuela_actual']
    suc = row['sucursal_actual']
    cancha = row['cancha_actual']
    horario = row['horario_actual']
    cnt = row['total_grupo_actual']
    comb_key = f"{cancha} | {horario} ({cnt} alumno/s en total)"
    tree[esc][suc][comb_key].append(row)

artifact_path = r'C:\Users\rjgut\.gemini\antigravity\brain\e096283a-8113-4e24-a636-8f0de95a9f6b\reporte_alumnos_huerfanos.md'

with open(artifact_path, 'w', encoding='utf-8') as out:
    out.write('# Reporte de Alumnos en Grupos Huérfanos (<= 3 Alumnos)\n\n')
    out.write('Este informe identifica a los alumnos asignados a combinaciones de **Grupo/Cancha** y **Horario** que tienen **3 o menos alumnos** en total. Además, propone para cada uno el grupo/horario principal al que deberían pertenecer según su categoría de edad (año de nacimiento), horario y mayor afluencia de compañeros.\n\n')
    
    out.write('## Resumen General\n')
    out.write(f'- **Total de Alumnos Huérfanos Encontrados:** {len(rows)}\n')
    
    total_combs = sum(len(combs) for esc in tree.values() for combs in esc.values())
    out.write(f'- **Total de Combinaciones Huérfanas:** {total_combs}\n\n')
    
    out.write('---\n\n')

    for esc, sucs in tree.items():
        out.write(f'## Escuela: {esc}\n\n')
        for suc, combs in sucs.items():
            out.write(f'### Sucursal: {suc}\n\n')
            for comb_title, students in combs.items():
                out.write(f'#### ⚠️ Grupo Huérfano: `{comb_title}`\n\n')
                out.write('| Alumno | Año Nac. | Estado | Grupo Normal Sugerido | Horario Sugerido | Alumnos en Grupo Sugerido | Criterio / Razón |\n')
                out.write('| --- | --- | --- | --- | --- | --- | --- |\n')
                
                for s in students:
                    nombre = f"{s['nombres']} {s['apellidos']}".title()
                    anio = s['anio_nac'] if s['anio_nac'] else 'N/D'
                    est = s['estado']
                    
                    if s['prop_cancha']:
                        p_cancha = s['prop_cancha']
                        p_horario = s['prop_horario']
                        p_total = s['prop_total_alumnos']
                        crit = s['criterio'] if s['criterio'] else 'Afluencia y categoría'
                    else:
                        p_cancha = '*Sin grupo activo >3 alumnos*'
                        p_horario = '-'
                        p_total = '-'
                        crit = 'No hay otros grupos en esta sucursal'
                        
                    out.write(f'| **{nombre}** | {anio} | {est} | {p_cancha} | {p_horario} | {p_total} | {crit} |\n')
                out.write('\n')

print('Artifact report created successfully.')
