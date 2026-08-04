# Journal de desarrollo — Pokédex

Bitácora cronológica del proceso. Una entrada por sesión de trabajo.
Decisiones con peso arquitectónico se registran aparte en [decisions/](./decisions/) (ADRs) y aquí solo se enlazan.

**Formato de entrada:**

```
## YYYY-MM-DD — Título corto

**Contexto:** qué estaba pasando / qué disparó el trabajo.
**Hecho:** qué se construyó o cambió.
**Decisiones:** enlaces a ADR-XXXX si aplica, o decisiones menores en línea.
**Aprendido / fricción:** qué costó más de lo esperado, qué sorprendió de la API.
**Siguiente:** próximo paso concreto.
```

---

## 2026-08-04 — Arranque: proceso antes que código

**Contexto:** prueba técnica para perfil Vue.js. Construir una Pokédex web
consumiendo la [PokéAPI](https://pokeapi.co/). Antes de escribir interfaz,
quiero el registro de decisiones montado para que el proceso sea auditable.

**Hecho:** estructura de documentación (`JOURNAL.md`, `decisions/`, `REQUIREMENTS.md`).

**Decisiones:** [ADR-0001](./decisions/ADR-0001-funcionalidad-antes-que-ui.md) —
funcionalidad y comportamiento primero, refinamiento visual después.

**Aprendido / fricción:** —

**Siguiente:** volcar el enunciado de la prueba en `REQUIREMENTS.md` y convertir
cada requisito en un ítem verificable. Recién ahí, elegir stack.

---

## 2026-08-04 — Llega el enunciado y el Figma

**Contexto:** enunciado completo + correo con el Figma. Dos datos que cambian el
cuadro: (a) el diseño existe pero **está en mobile y hay que adaptarlo a desktop**;
(b) el enunciado pide explícitamente pensar en "gran cantidad de data" pese a que
la app es chica — con solo dos endpoints permitidos.

**Hecho:** `REQUIREMENTS.md` completo — 8 requisitos funcionales, 2 de diseño,
7 criterios de evaluación, 4 supuestos y el fuera de alcance.

**Decisiones:**
- [ADR-0002](./decisions/ADR-0002-figma-desktop-primero-en-diseno.md) — ADR-0001
  traía una condición de salida ("si entregan un Figma, se supersede"). Se cumplió,
  así que había que revisarlo. Conclusión: no se supersede, se **enmienda**. La
  *decisión* de layout desktop sube a una fase 0 previa al código, porque define
  qué componentes existen (lista full-width mobile ≠ dos paneles desktop). La
  *implementación* visual sigue al final.
- [ADR-0004](./decisions/ADR-0004-estrategia-de-datos-y-escala.md) — respuesta a
  "gran cantidad de data": una sola request con `?limit=count`, filtrado y
  virtual scrolling en cliente. La paginación por `offset` se descarta porque
  **rompe la búsqueda** (filtrar solo lo descargado da falsos negativos).

**Aprendido / fricción:**
- La restricción "solo dos llamados" no es una simplificación, es la que **fuerza**
  la arquitectura: sin búsqueda server-side, todo el universo tiene que estar en el
  cliente, y de ahí sale la necesidad de virtualizar.
- El Figma no es legible de forma automatizada (requiere sesión). Bloquea la fase 0.
- Numeración: se saltó el 0003 y se reservó para el stack, para que el índice no
  quede desordenado cuando se escriba.

**Siguiente:** ADR-0003 (stack) y acceso al Figma para arrancar fase 0. Mientras
tanto, la capa de datos (fase 1) no depende del diseño y puede empezar.

---

## 2026-08-04 — Stack cerrado

**Contexto:** con los requisitos ya trazados, tocaba elegir herramientas. El
enunciado avisa que la elección misma se evalúa ("escribe un resumen de las
tecnologías que utilizaste"), así que cada dependencia tiene que poder defenderse.

**Hecho:** [ADR-0003](./decisions/ADR-0003-stack.md).
Vite + Vue 3 (Composition API, `<script setup>`) + TypeScript · Pinia · Vue Router ·
SCSS con tokens propios · Vitest · ESLint/Prettier.
**Dependencias de runtime: tres.** Vue, Router, Pinia. `fetch` nativo, sin axios.

**Decisiones menores:**
- Se descartó Nuxt: sin SEO ni backend, se lee como sobre-ingeniería en una prueba
  que evalúa KISS.
- Se descartó Tailwind: replicar un Figma con utilidades esconde justo el CSS que
  E2 quiere ver.
- S2 resuelto: favoritos **sin** `localStorage`. Literal al enunciado, documentado
  en el README para que no parezca olvido.

**Aprendido / fricción:** la regla que hace verificable la "buena arquitectura" de
E3 no es la estructura de carpetas — es la restricción: `components/ui/` no importa
nada de `api/` ni de `stores/`. Eso se puede chequear con lint; una carpeta bonita, no.

**Siguiente:** fase 0 — leer el Figma y decidir el layout desktop. Bloqueada por
acceso. En paralelo se puede scaffoldear el proyecto y escribir la capa `api/`,
que no depende del diseño.

---

## 2026-08-04 — Scaffold y repo

**Contexto:** fase 0 bloqueada por el acceso al Figma, así que se avanza por lo que
no depende del diseño: repo y esqueleto del proyecto.

**Hecho:**
- `git init` + primer commit con `docs/` **antes** que el código. El historial
  muestra que las decisiones existieron antes que la implementación, que es
  justamente lo que pide el enunciado ("saber la forma en la que piensas").
- Scaffold con `create-vue`: Vite 8, Vue 3.5, TS, Pinia, Router, Vitest,
  ESLint + Prettier. Más `sass-embedded` para los tokens SCSS.
- Verificado en verde: `npm run build` (type-check + build) y `npm run lint`.

**Decisiones menores:**
- **Se quitó `oxlint`**, que `create-vue` mete por defecto. Dos motivos: rompía la
  instalación (`eslint-plugin-oxlint@1.73` pide `oxlint@~1.73` y el scaffold fijaba
  `~1.74`, ERESOLVE), y duplica el rol de ESLint que ya estaba decidido en ADR-0003.
  Se descartó `--legacy-peer-deps`: tapa el conflicto en vez de resolverlo, y deja
  el `npm install` frágil para quien clone el repo.
- Node 22.19 tira `EBADENGINE` sobre `npm-run-all2` (pide 22.22+). No rompe nada
  —build y lint pasan— pero queda anotado: si aparece un fallo raro en `npm run
  build`, actualizar Node es lo primero a probar.

**Aprendido / fricción:** `create-vue` no acepta el directorio actual (`.`) sin
preguntar el nombre del paquete de forma interactiva. Se scaffoldeó aparte y se
movió al root, para no perder el `.git` ni `docs/` ya commiteados.

**Siguiente:** limpiar el boilerplate de create-vue (`HelloWorld`, `TheWelcome`,
`icons/`, `stores/counter.ts`, `AboutView`) y escribir la capa `api/` con sus tipos
y sus tests. Fase 0 sigue esperando el Figma.
