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

## 5. Datos reales extraídos (con login, cuenta demo `demo2`)

Se entró con credenciales de maestro y se recorrió la API real (`api.edufile.net`, JSON-RPC/REST,
auth por cookie `EduSystemAuthentication`). **No se copia el contenido propietario de edufile al
repo** — abajo solo va la estructura (factual) que sirve de referencia de diseño.

### Materias del catálogo (con # de lecciones)

| Cód | Materia       | Cursos | Lecciones |
| --- | ------------- | ------ | --------- |
| C1  | Español       | 13     | 1,247     |
| C3  | Matemáticas   | 17     | 2,713     |
| C4  | Ciencias      | 17     | 2,072     |
| C5  | Sociales      | 12     | 1,173     |
| C6  | Dreyfous Labs | 4      | 67        |
| C7  | Electivas     | 3      | 980       |
| C8  | D-Genius      | 2      | 685       |

- **Curso = materia × grado.** Cada curso codifica el grado (`G05`, `G0S`=secundaria/electiva).
  Ej.: Español tiene un curso por grado (serie "Aprendo a ser…", ~40 lecciones c/u, G…–G12);
  Matemáticas tiene "Matemáticas 1–6" por grado + cursos de secundaria (Precálculo, Álgebra II,
  Trigonometría, Geometría…).
- Cada curso expone flags: **`hasWorkbook`** (cuaderno), **`hasGuide`** (guía del maestro),
  **`hasOverview`**, `hasStudentWorkbook`.

### Cómo secuencian un curso (ejemplo: Matemáticas 5 = `C301G05`, 97 lecciones)

13 unidades, **cada una con su assessment**, en este orden (≈ scope & sequence real):

1. Los números · 2. Suma y resta · 3. La multiplicación · 4. Multiplicación y división ·
5. Más multiplicación · 6. Las fracciones · 7. Operaciones con fracciones ·
8. Expresiones numéricas y algebraicas · 9. Razones y proporciones · 10. La medición ·
11. La geometría · 12. Área y perímetro · 13. Probabilidad y estadística.

Cada **lección** trae: código auto-descriptivo (`C301G05U01L01`), **`hasKey`** (hoja de
respuestas), **`hasSummary`** (resumen), y opcionalmente su propio **assessment**.

### Mapeo a estándares

Existe `teacher/standards?planId=<uuid>`: los estándares se atan a un **plan** (instancia de
planificación que el maestro crea al agendar una lección), no a la lección "de catálogo". O sea:
el maestro toma una lección del catálogo → crea un plan → ese plan se alinea a estándares.

## 6. Ideas adicionales a partir de los datos reales

1. **Estructura de curso = Overview + Guía del maestro + Cuaderno** (tres artefactos por
   materia×grado). En `simplicityCurr` esto se traduce a: por cada `Unit`/curso, generar
   *overview*, *guía docente* y *cuaderno del estudiante* como salidas separadas.
2. **Unidad con assessment propio** y **lección con assessment opcional** → añadir un modelo
   `Assessment` ligado a `Unit`/`Lesson` (post-MVP, alinea con su quiz/banco de preguntas).
3. **Hoja de respuestas (`hasKey`)** y **resumen (`hasSummary`)** por lección → al generar un
   cuaderno con Claude, producir también *clave de respuestas* y *resumen* como variantes.
4. **Plan = capa entre catálogo y estándares.** Interesante: separan el "contenido maestro"
   (catálogo, reusable) del "plan del maestro" (instancia con fecha/grupo/estándares). Vale
   considerar esa separación: `Lesson` (plantilla) vs. una futura `LessonPlan` (instancia agendada).
5. **Una unidad ≈ 7–10 lecciones**, curso ≈ 40 (humanidades) a ~97 (matemáticas) lecciones —
   referencia útil de granularidad para nuestra generación.

## Pendiente / no extraído (a propósito)

- Contenido interno de lecciones/cuadernos (ejercicios, textos): es **material propietario de
  edufile**; no se copia al repo. Sirve solo como referencia de formato.
- Estándares por lección concreta: requeriría **crear planes** en su sistema (no se hizo en la
  cuenta demo).
