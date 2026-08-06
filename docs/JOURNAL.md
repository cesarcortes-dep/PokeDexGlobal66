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

---

## 2026-08-05 — Capa de datos del listado (F3)

**Contexto:** primer requisito funcional que se implementa. Se acota a **traer el
listado**: nada de detalle, nada de UI. La capa de datos es lo único que no depende
del Figma, que sigue bloqueado.

**Hecho:**
- `request<T>()` — wrapper de `fetch`. Unifica los dos modos de falla: `fetch` solo
  rechaza cuando no hubo respuesta (sin red, DNS, CORS); un 404 o un 500 llegan
  resueltos con `ok === false`. Ambos salen como `PokeApiError`, y `status` presente
  o ausente es lo que deja a la UI distinguir "no existe" de "se cayó la red".
- `fetchPokemonList()` — una request con `?limit=2000`.
- `extractIdFromUrl()` — id desde la url del listado, sin gastar request.
- `pokemonStore.loadList()` — idempotente, con manejo de error y de carga.
- Tests: **14 pasando**, 6 `todo` (los del detalle). Nuevo `stores/__tests__/pokemon.spec.ts`.
- Verde: `type-check`, `lint`, `test:unit`.
- **F3 → `[~]`**: la capa de datos está y medida, pero verificarlo en Network exige
  la app corriendo. No se marca `[x]` sin poder demostrarlo.

**Decisiones menores:**
- **Se cerró la pregunta abierta de [ADR-0004](./decisions/ADR-0004-estrategia-de-datos-y-escala.md)
  midiendo, no opinando.** `count` real = 1351. `?limit` grande devuelve todo en
  **91 KB / ~190 ms** con `next: null`. Leer `count` primero para pedir el total
  exacto agregaba un round trip por 168 bytes. Gana una sola request.
- **Red de seguridad sobre el `limit` hardcodeado:** si `results.length < count`, se
  repite la request con el `count` real. En el caso normal no se dispara nunca. El
  motivo es que truncar en silencio daría falsos negativos en la búsqueda — el mismo
  bug por el que se descartó paginar. Un magic number que falla callado no es KISS,
  es una bomba de tiempo.
- **Concurrencia resuelta con una promesa en vuelo, no con un booleano.** Estaba
  anotado como pendiente en la entrada anterior. Un guard `if (isLoadingList) return`
  no alcanza: si dos vistas montan a la vez, la segunda llamada vuelve sin datos y
  **sin esperar**. Guardando la promesa, la segunda espera la request de la primera.
  Hay un test que lo cubre con `Promise.all`.

**Aprendido / fricción:**
- **Los ids no son contiguos con el índice.** El último ítem del listado es
  `meowstic-female-mega` con id **10326** sobre 1351 resultados: las formas alternativas
  viven en un rango alto. Cualquier cosa que dependa del id —una url de sprite armada
  a mano, por ejemplo— tiene que salir de `extractIdFromUrl`, nunca de la posición.
- `noUncheckedIndexedAccess` hace que `fetchMock.mock.calls[0][0]` no compile. Se
  resolvió con un helper `urlOfCall()` en el test en vez de aflojar el tsconfig.
- Se verificó contra la API real con un script de `vite-node` aparte, fuera del repo.
  Los tests mockean `fetch` a propósito, así que **no** prueban que el contrato sea el
  que asumo — solo que mi código hace lo que digo. Las dos cosas hacen falta.

**Siguiente:** renderizar el listado en `ListView`. Ahí aparece el virtual scroll de
E7 y recién ahí se puede verificar F3 en Network y medir nodos en DOM.

---

## 2026-08-05 — El listado en pantalla, virtualizado (E7)

**Contexto:** con la capa de datos lista, tocaba pintarla. Se decidió virtualizar
desde el principio en vez de arrancar con un `v-for` plano: el reemplazo posterior
tocaría el mismo markup dos veces y el commit intermedio mostraría justo lo que
ADR-0004 descarta.

**Hecho:**
- `useVirtualList` implementado — ~90 líneas, sin dependencias.
- `components/ui/PokemonRow.vue` — primera pieza de presentación pura. No importa
  `@/api` ni `@/stores`: la regla de `ui/README.md` ahora tiene un caso real.
- `ListView` conectada: estados de carga, error con reintento y lista virtualizada.
- Tests nuevos: 8 de `useVirtualList` + 6 de `ListView`. **28 pasando**, 6 `todo`.
- Verde: `type-check`, `lint`, `build`.
- **E7 → `[~]`**: hay un test que cuenta filas reales en el DOM con 1351 Pokémon
  cargados y falla si alguien saca la virtualización.

**Decisiones menores:**
- **El alto de fila lo define TypeScript, no el token SCSS.** `--row-height` salió de
  `_tokens.scss` y ahora lo inyecta `ListView` como custom property desde la
  constante `ROW_HEIGHT`. Motivo: `useVirtualList` calcula offsets con ese número; si
  el CSS tuviera su propia copia, cambiar una sola desalinearía la lista al scrollear
  **sin romper ningún test**. Una fuente, y el CSS la recibe.
- **`loadList()` se dispara en `setup`, no en `onMounted`.** La request no necesita el
  DOM, y arrancarla antes hace que el primer render ya salga con el loader. Con
  `onMounted` había un frame con la lista vacía antes del estado de carga.
- **El contenedor del scroll se renderiza siempre**, también durante la carga: es el
  elemento que hay que medir. Y `useVirtualList` se engancha por `watch` sobre el
  `containerRef` en vez de por `onMounted`, para no obligar a quien lo use a tener el
  nodo montado desde el principio.
- **`contain: layout paint`** en el viewport, sin `size`: el sizer de adentro es quien
  define el recorrido del scroll y `contain: size` lo anularía.
- Se corrigió el draft de `ListView`, que llamaba `usePokemonStore()` **dentro del
  `v-for`**. Funciona porque Pinia devuelve siempre la misma instancia, pero resuelve
  el store en cada render y mezcla orquestación con template.

**Aprendido / fricción:**
- **Virtualizar obliga a renderizar dos veces y no hay forma de evitarlo:** para saber
  cuántas filas entran hay que medir el contenedor, y medir solo es posible después de
  montar. El primer render sale con el viewport en cero. En el navegador es un frame;
  en los tests hay que esperarlo con `flushPromises` explícito. El primer intento de
  test pasaba con 4 filas en vez de 14 justamente por esto.
- **Un test verde puede estar verde por el motivo equivocado.** El de "los nodos no
  crecen con la lista" comparaba 4 contra 4 y pasaba, cuando lo correcto era 14 contra
  14. Se cambió por una aserción contra el número esperado, no contra el otro caso.
- El tope `Math.min` sobre `startIndex` no es paranoia: cuando la búsqueda filtre 1351
  a 3 resultados, el `scrollTop` seguirá apuntando al fondo viejo y sin el tope la
  pantalla queda **en blanco con resultados que sí existen**. Hay un test que lo cubre
  antes de que exista la búsqueda.
- jsdom no hace layout: `clientHeight` siempre da 0. Hay que falsearlo o el viewport
  mide cero filas.

**Pendiente conocido:** accesibilidad del virtual scroll. Hay `aria-posinset` y
`aria-setsize`, pero navegar con teclado por una lista cuyos nodos se reciclan todavía
no está resuelto ni testeado.

**Siguiente:** verificar F3 en Network con la app corriendo en el navegador, que es lo
único que falta para cerrarlo. Después, búsqueda (F8) sobre la lista del store.

---

## 2026-08-05 — F2 y F3 cerrados en el navegador

**Contexto:** los dos requisitos estaban en `[~]` esperando lo mismo: ver la app
corriendo de verdad. Ningún test automatizado los cierra —jsdom no es un navegador y
`curl` no ejecuta JavaScript.

**Hecho:**
- App abierta en el navegador: monta y `ListView` pinta el listado. **F2 → `[x]`**.
- Network: **una sola** llamada a `pokeapi.co/api/v2/pokemon?limit=2000`, 200.
  **F3 → `[x]`**.

**Aprendido / fricción:**
- `LIST_LIMIT` había quedado en `0` mientras se exploraba el comportamiento del
  parámetro. Con ese valor la API devuelve `results: []` con `count: 1351`, se dispara
  la red de seguridad y salen **dos** requests. La UI se veía idéntica —los 1351
  Pokémon aparecían igual— así que el bug era invisible en pantalla y solo se notaba
  en Network. Buen recordatorio de por qué F3 pedía verificarlo ahí y no "a ojo".
- La captura de Network dice **`200 OK (from disk cache)`**: el navegador reusó la
  respuesta y ese request no midió red. No invalida F3 —lo que se evalúa es cuántas
  llamadas **emite** la app, y fue una— pero los 91 KB y los ~190 ms siguen viniendo
  de la medición directa contra la API, no de esa captura. Anotado para no citar un
  número que la evidencia no respalda.

**Siguiente:** búsqueda (F8) sobre la lista del store, que es lo que falta para poder
cerrar E7 completo.

---

## 2026-08-05 — Búsqueda en cliente (F8)

**Contexto:** el requisito que completa E7. La búsqueda es en cliente por obligación,
no por preferencia: PokéAPI no tiene búsqueda por texto parcial y el enunciado acota a
dos endpoints (ADR-0004).

**Hecho:**
- `useSearch`: debounce de 200 ms, índice normalizado precomputado, filtro por
  substring insensible a mayúsculas y acentos.
- `components/ui/SearchInput.vue` — presentación pura, con label accesible oculto.
- `ListView`: el virtual scroll pasa a operar sobre `results` en vez de sobre `list`,
  más el estado vacío "no encontramos ningún Pokémon".
- Tests: 10 de `useSearch` + 4 de búsqueda en `ListView`. **42 pasando**, 6 `todo`.
- **F8 → `[x]`**, verificado en navegador: filtra, el estado vacío aparece con `zzz` y
  **Network no registra nada** al escribir. Es un requisito que se prueba por ausencia
  —lo contrario de F3, donde había que contar una llamada—, así que la evidencia es
  una pestaña de Network vacía.
- **E7** ya con los dos números medidos.

**Decisiones menores:**
- **La lista vuelve arriba al cambiar el resultado.** Buscar con el scroll a la mitad
  dejaba al usuario mirando el final de una lista de tres: técnicamente correcto y
  desconcertante.
- **`isEmpty` distingue "no busqué todavía" de "busqué y no hay".** Cero resultados con
  la query vacía es la lista completa, no un estado vacío.

**Aprendido / fricción:**
- **El índice precomputado casi no se nota, y hay que decirlo.** Medido sobre los 1351
  reales: filtrar cuesta **0.108 ms** con índice contra **0.188 ms** normalizando
  dentro del `filter`. Un ~43% menos de algo que ya era despreciable. El índice se
  queda —cuesta 0.36 ms una sola vez y escala con el tamaño de la lista— pero **no es
  lo que hace rápida la búsqueda**. Lo que sostiene E7 es el virtual scroll y no
  volver a la red. Venderlo como la gran optimización sería exagerar un número que
  cualquiera puede pedir.
- **El debounce tampoco ahorra requests** —no hay ninguna— sino renders: sin él,
  escribir "charizard" recorre la lista nueve veces y repinta otras nueve, ocho de
  ellas invisibles para el usuario.
- Un test falló esperando 1 resultado para "pokemon-42" y devolvió 11: también matchea
  420…429. El test estaba mal, no el código — la búsqueda por substring es la correcta
  para un buscador. Se cambió por un nombre que no es prefijo de ningún otro.

**Pendiente conocido:** el estado vacío es texto plano. Cuando llegue el Figma sale a
un `EmptyState.vue` con su ilustración y su botón.

**Siguiente:** probar la búsqueda en el navegador para cerrar F8. Después, el detalle
(F4), que llena los 6 `it.todo` que siguen esperando.
