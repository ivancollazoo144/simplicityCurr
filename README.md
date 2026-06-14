# simplicityCurr

Plataforma interna de currículo para **Simplicity Learning Center** (K–12), alineada a los
**Estándares de Contenido y Expectativas de Grado del Departamento de Educación de Puerto Rico (DEPR)**.

Herramienta **para maestros**: almacena los estándares del DEPR de forma estructurada, permite
construir el mapa curricular por materia/grado y genera **cuadernos** (workbooks imprimibles)
con IA alineados a cada estándar.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **Prisma 7 + SQLite** (driver adapter `better-sqlite3`)
- **Anthropic SDK** (`@anthropic-ai/sdk`) para generación de lecciones y cuadernos
- Export PDF vía vista de impresión (próximas tandas)

## Empezar

```bash
npm install
cp .env.example .env        # y completa los valores (ver abajo)
npm run db:migrate          # aplica las migraciones (crea dev.db)
npm run db:seed             # carga grados, materias y el piloto Mate 5.º
npm run dev                 # http://localhost:3000
```

Rutas: `/` (panel), `/standards` (estándares por materia/grado), `/curriculum` (mapa curricular:
crear unidades) y `/units/[id]` (mapear expectativas del DEPR a la unidad).
`npm run db:studio` abre Prisma Studio para inspeccionar la base.

## Variables de entorno (`.env`)

- `DATABASE_URL` — ruta de SQLite, p.ej. `file:./dev.db` (ya configurada por `prisma init`).
- `ANTHROPIC_API_KEY` — necesaria para la **ingesta por IA** y la **generación de cuadernos**
  (Tandas 3+). Sin ella, la app funciona con los datos del seed.

> El `.env` está en `.gitignore`; nunca lo subas al repo.

## Estándares del DEPR

- El seed (`prisma/seed.ts`) carga un set **representativo** de Matemáticas 5.º para validar el
  flujo. ⚠️ Los códigos y textos deben **verificarse/reemplazarse** contra el documento oficial.
- Para ingerir un PDF oficial (cuando tengas `ANTHROPIC_API_KEY`):

  ```bash
  npm run ingest -- --subject MAT --grade 5 --pdf data/raw/matematicas.pdf
  ```

  El script extrae el texto del PDF y usa Claude para estructurarlo en estándares/expectativas.

## Estado

- ✅ **Tanda 1 — Fundamentos:** scaffold, modelo de datos, seed del piloto, vista de estándares.
- ✅ **Tanda 2 — Constructor curricular:** unidades con código auto-descriptivo, scope &
  sequence de Mate 5.º, y mapeo de expectativas del DEPR (Server Actions).
- ⏳ Tanda 3 — Generación de cuadernos con Claude.
- ⏳ Tanda 4 — Export PDF.
- ⏳ Tanda 5 — Escalar a todas las materias y grados.

Plan completo en [`docs/PLAN.md`](docs/PLAN.md).
