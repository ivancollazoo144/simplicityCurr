# Plan — simplicityCurr

## Qué es

Plataforma web interna (**solo maestros**) para Simplicity Learning Center que:

1. Guarda los **estándares y expectativas del DEPR** de forma estructurada.
2. Deja a los maestros construir el **mapa curricular** K–12 por materia/grado.
3. Genera **cuadernos** (workbooks imprimibles / PDF) con Claude alineados a cada estándar.

## Modelo de datos (el corazón)

- **Estándar** → materia, grado, código, descripción.
- **Expectativa** → pertenece a un estándar; código, descripción, indicadores.
- **Unidad** (scope & sequence) → secuencia de unidades por materia+grado, mapeadas a estándares.
- **Lección** → objetivos ligados a expectativas, actividades, duración.
- **Cuaderno** → artefacto generado (páginas de contenido + ejercicios para el estudiante),
  exportable a PDF.

## Fases

- **Fase 0 — Andamiaje:** repo, stack, README, esquema de base de datos, este documento. ✅ (en curso)
- **Fase 1 — Ingesta de estándares (piloto):** bajar los PDFs del DEPR y parsearlos a la base
  de datos, empezando por **una** materia+grado.
- **Fase 2 — Constructor curricular:** UI para que el maestro arme unidades y mapee
  estándares → scope & sequence.
- **Fase 3 — Generación con Claude:** dado un estándar/expectativa + grado, generar lección y
  páginas de cuaderno en español.
- **Fase 4 — Export PDF:** imprimir/exportar los cuadernos para el salón.
- **Fase 5 — Escalar:** repetir ingesta + generación para las demás materias y grados.

## Decisiones abiertas (resolver antes de Fase 1)

1. **Stack.**
   - Recomendado: **Next.js + TypeScript + Postgres (Prisma) + Claude API** con export a PDF
     (igual que `teacher-platform`, reusa conocimiento; los cuadernos se ven bien en web e impresión).
   - Alternativa Python: **FastAPI + SQLite + WeasyPrint**.
2. **Materia + grado piloto.**
   - Recomendado: **Matemáticas 5.º** (expectativas granulares, fáciles de validar generando ejercicios).
   - Alternativas: Español K, u otra.
3. **PDFs de estándares:** ¿los provee Ivan, o se bajan del DEPR para el piloto?

## Fuentes de estándares DEPR

- Estándares Español — https://www.de.pr.gov/wp-content/uploads/2019/06/espanol.pdf
- Estándares 2014 PES — https://www.de.pr.gov/wp-content/uploads/2014/01/estandares_y_expectativas_2014-pes.pdf
- DE Digital (SASA) — https://dedigital.dde.pr/course/view.php?id=234
- Nuevos documentos curriculares 2022 DEPR — http://profeicalderon.blogspot.com/2022/08/nuevos-documentos-curriculares-2022-depr.html
