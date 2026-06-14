# Ideas tomadas de edufile (edusystem) para simplicityCurr

> Fuente: arquitectura extraída del **bundle JS público** de
> `edusystem.edufile.net` (la app de maestros). El contenido por-ítem del catálogo está tras
> login y no se extrajo (requiere credenciales). Lo de abajo es la **estructura, taxonomía y
> features** de su plataforma, que es de donde se "toman ideas".

## 1. Esquema de codificación jerárquico (lo más valioso)

edufile codifica cada nivel en el propio identificador, y el código de una lección describe su
ruta completa:

| Nivel    | Patrón          | Ejemplo          | Significado                          |
| -------- | --------------- | ---------------- | ------------------------------------ |
| Subject  | `C#`            | `C1`             | Materia                              |
| Course   | `C##G##`        | `C01G05`         | Materia **+ grado** (≈ "curso")      |
| Unit     | `##`            | `03`             | Unidad dentro del curso              |
| Lesson   | `C##G##U##L##`  | `C01G05U03L02`   | Materia+Grado+Unidad+Lección         |

**Idea para simplicityCurr:** darle a `Unit`/`Lesson` un código auto-descriptivo del mismo estilo
(p.ej. `MAT-G05-U03-L02`). Hoy solo las `Expectation` tienen código (el del DEPR); un código de
unidad/lección facilita navegación, búsqueda y export.

## 2. Jerarquía del catálogo (flujo de navegación)

`Catálogo → Materias → Cursos (materia×grado) → Unidades → Lecciones`

Componentes del flujo: `CatalogueSubjects` → `CatalogueCourses` → unidades/lecciones, más
`CatalogueSearch` / `catalogueSearchResults` (búsqueda transversal de lecciones).

**Idea:** el "curso = materia × grado" coincide exactamente con nuestro modelo (`Unit` ya tiene
`subjectId`+`gradeId`). Vale la pena exponer la navegación en ese orden y añadir **buscador de
lecciones** desde temprano.

## 3. Features del producto (páginas que tiene un maestro)

Extraídas de las rutas de la SPA:

- **catalogue** — explorar contenido; búsqueda de lecciones; `standards-search`.
- **my-courses / my-lessons** — los cursos/lecciones que el maestro adopta.
- **dashboard** — panel.
- **calendars** (mes/día/semana) + **agendar lección** a fecha y a grupos
  (`schedule_lesson_date/groups`).
- **quiz / assessment** — evaluaciones con `assessment_templates`, banco de preguntas
  (`question-bank`), banco de evaluaciones, asignadas; **alineadas a estándares**
  (`standards-search`, `standard_cluster`).
- **grading / rollbook** — libreta de calificaciones (crear año escolar, books/book) y asistencia.
- **monitoring** (grupos) — seguimiento de estudiantes.
- **resources / videos / chat / help**.
- **premium-required** — muro de pago (modelo de negocio).
- Lección con acciones: **schedule** (agendar) y **posts** (publicaciones/tareas).
- Etiquetas confirmadas: `subject_label`, `grade_label`, `unit_label`, `lesson(s)_label`,
  **`workbook_label`** (¡sí tienen "cuaderno"!), `assessment_*`, `standard_cluster`.

## 4. Qué adoptar en simplicityCurr (priorizado)

**Cercano (encaja con el plan actual):**
1. Navegación `Materia → Grado(curso) → Unidad → Lección` + **buscador de lecciones** (Tanda 2).
2. **Código auto-descriptivo** para unidades/lecciones/cuadernos (Tanda 2).
3. **Alineación explícita a estándares** en cada lección/cuaderno y **búsqueda por estándar**
   (`standards-search`) — ya tenemos `Expectation`/`UnitExpectation`/`LessonExpectation`; falta la
   UI de búsqueda por estándar (Tandas 2-3).
4. `workbook_label` valida nuestro concepto de **cuaderno** como entidad de primer nivel (Tanda 3).

**Mediano plazo (post-MVP):**
5. **Agendar lección** a calendario/grupos (planificador semanal del maestro).
6. **Evaluaciones** con banco de preguntas alineado a estándares y plantillas.
7. **Libreta/asistencia** (grading + rollbook) y **monitoreo** de grupos.

**Notas de modelo de negocio:**
8. Concepto `premium-required` → si algún día se ofrece a otras escuelas, hay precedente de muro de
   pago por features.

## Pendiente (requiere login)

Para extraer el **contenido real** del catálogo (nombres de materias/cursos, cómo estructuran una
lección/cuaderno por dentro, ejemplos de ejercicios), hace falta entrar con credenciales de maestro
o capturas de pantalla de las páginas.
