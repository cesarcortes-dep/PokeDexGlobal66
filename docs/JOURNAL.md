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

---

## 2026-08-04 — Andamio: estructura vacía, lista para llenar

**Contexto:** decisión de trabajo — el esqueleto de archivos se arma completo de
una, con la responsabilidad de cada archivo documentada arriba, y la
implementación se escribe después archivo por archivo. Así las decisiones de
arquitectura de ADR-0003 y ADR-0004 quedan visibles en la estructura antes de que
haya una sola línea de lógica que las contradiga.

**Hecho:**
- Borrado todo el boilerplate de create-vue (`HelloWorld`, `TheWelcome`,
  `WelcomeItem`, `icons/`, `counter.ts`, `HomeView`, `AboutView`, `base.css`,
  `main.css`, `logo.svg`).
- Estructura creada, cada archivo con su responsabilidad y sus TODO:

  ```
  src/
    api/          types.ts, pokeApi.ts, __tests__/pokeApi.spec.ts
    stores/       pokemon.ts, favorites.ts
    composables/  useSearch.ts, useVirtualList.ts, useClipboard.ts
    components/   ui/README.md, features/README.md
    views/        ListView.vue, DetailView.vue
    styles/       _tokens.scss, _mixins.scss, main.scss
  ```

- Router con dos rutas (`/` y `/pokemon/:name`) más catch-all.
- `_tokens.scss` con la escala completa en placeholders, a reemplazar con los
  valores reales del Figma.
- `pokeApi.spec.ts` con 11 `it.todo` — checklist vivo de E5 que aparece en el
  reporte de Vitest sin romper el build.
- Verde: `npm run build`, `npm run lint`, `npm run test:unit` (11 todo).

**Decisiones menores:**
- **Modelo de dominio `Pokemon` separado de `PokemonDetailResponse`.** Los
  componentes no conocen la forma de la API; si PokéAPI cambia, cambia el mapper y
  nada más. Es lo que vuelve *verificable* la separación de capas de E3 en vez de
  declarativa.
- **`ui/` y `features/` llevan README con la regla, no `.gitkeep`.** La restricción
  que sostiene la arquitectura es "`ui/` no importa `api/` ni `stores/`", y escrita
  ahí se lee; una carpeta vacía no dice nada.
- **Breakpoints como variables SCSS, colores como custom properties.** Las media
  queries no aceptan `var()`. Los mixins `@include desktop` evitan que aparezca un
  `@media (min-width: 1024px)` suelto en cada componente — que es justo lo que
  haría inmanejable la adaptación de ADR-0002.
- **`prefers-reduced-motion` global desde el día uno**, incluido el loader de F5.
- **Se revirtió** poner extensión `.ts` en el import de `vitest.config.ts`: silencia
  un warning de Vite pero dispara `TS5097` salvo que se habilite
  `allowImportingTsExtensions`. No vale tocar el tsconfig por algo cosmético.

**Aprendido / fricción:** los stubs que lanzan `throw new Error('TODO')` tipan bien
(un `throw` satisface cualquier retorno declarado), pero ESLint marca los helpers
privados sin usar. `request()` quedó exportado por eso — igual se justifica: así se
puede testear el manejo de errores HTTP aislado.

**Pendiente conocido:** `getDetail` y `loadList` del store no tienen todavía control
de concurrencia. Si se abre el mismo Pokémon dos veces rápido salen dos requests.
Anotarlo al implementar.

**Siguiente:** fase 0 apenas llegue el Figma. Mientras, se puede implementar
`api/pokeApi.ts` con sus tests — es lo único que no depende del diseño.

---

## 2026-08-04 — Repo público arriba: E1 cerrado

**Contexto:** empieza el tachado de `REQUIREMENTS.md`. Primero E1, que no depende
del diseño ni de nada pendiente.

**Hecho:**
- Repo público: <https://github.com/cesarcortes-dep/PokeDexGlobal66>
- `git push -u origin main` — 4 commits, con `docs/` **antes** que el código.
- **E1 → `[x]`**.
- **F2 → `[~]`**, a medias a propósito: Vue 3.5 instalado, `npm run build` en verde
  y `vite preview` devuelve 200 sirviendo el HTML. Pero `curl` no ejecuta
  JavaScript, así que **no prueba que Vue monte**. Queda pendiente abrirlo en un
  navegador, o escribir un smoke test con Vue Test Utils que monte `App` y lo
  verifique de forma automatizada (que además suma a E5).

**Aprendido / fricción:** `Start-Process npm` falla en PowerShell —`npm` es un shim
`.cmd` y no lo resuelve. Se levantó el server con `npx vite preview` desde bash.

**Siguiente:** seguir tachando lo que no dependa del Figma. El candidato es
implementar `api/pokeApi.ts` (F3, F4) con sus 11 tests, que cierra también parte
de E5.
