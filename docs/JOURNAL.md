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

---

## 2026-08-06 — Detalle bajo demanda y cacheado (F4)

**Contexto:** el segundo de los dos llamados permitidos. Los 6 `it.todo` del cliente
de API venían esperando desde el andamio: era el momento de cobrarlos.

**Hecho:**
- `toPokemon()` — conversiones de unidad y aplanado de tipos.
- `fetchPokemonByName()` — detalle con el nombre escapado en la URL.
- `pokemonStore.getDetail()` — caché por nombre y deduplicación de requests.
- `DetailView` conectada: carga, 404, error de red, y vuelta al listado.
- Navegación desde el listado con `RouterLink` envolviendo la fila.
- **67 tests pasando y cero `it.todo`**: se cerraron los 6 que quedaban.
- **F4 → `[~]`**, a la espera de verlo en Network.

**Decisiones menores:**
- **El `RouterLink` envuelve `PokemonRow`, no vive adentro.** Así la fila sigue sin
  saber que existe el router y se puede reusar en un contexto sin navegación — que es
  exactamente lo que va a pedir la lista de favoritos de F1.
- **Los tipos se ordenan por `slot`, no por posición en el array.** La API trae el
  orden oficial en ese campo; confiar en la posición funciona hasta el día que no.
- **El caché de detalle se reasigna, no se muta.** `detailCache` es un `shallowRef`
  —a propósito, para no volver reactivo cada campo de cada Pokémon— y eso implica que
  mutar el `Map` no notifica a nadie. Es el precio de la decisión, y va explicado en
  el código para que no parezca un descuido.
- **Traducir el 404 a "no existe" vive en la view, no en el store.** Elegir la copy
  según el status es decisión de presentación: en esta pantalla un 404 significa
  "escribiste mal la URL", no "se rompió algo".
- **Un fallo no se cachea y no bloquea el nombre.** Se puede reintentar; hay test.

**Aprendido / fricción:**
- **Agregar el `RouterLink` rompió 8 tests de `ListView` de una.** No es ruido: es la
  señal de que el árbol de componentes ahora depende del router. Se resolvió montando
  un router real en vez de stubear `RouterLink` — con un stub, el test no probaría que
  el `to` está bien armado, que es justo lo que puede romperse.
- **Verificado contra la API real**, no solo contra mocks: `bulbasaur` vuelve con
  `["grass", "poison"]` en orden de slot, las unidades ya convertidas (0.7 m, 6.9 kg),
  el artwork oficial resuelto, y un nombre inexistente llega como `PokeApiError` con
  `status: 404`. Los mocks prueban que el código hace lo que digo; esto prueba que el
  contrato es el que asumo.

**Siguiente:** verificar F4 en Network —abrir un Pokémon, volver, reabrirlo y confirmar
que la segunda vez no hay request—. Después F1 y F7, favoritos.

---

## 2026-08-06 — README propio (E6)

**Contexto:** el README seguía siendo el boilerplate de `create-vue` —"This template
should help get you started"— y es el primer archivo que abre quien evalúa. E6 lo pide
explícito, así que no era un pendiente cosmético.

**Hecho:** README completo. **E6 → `[x]`**.

**Decisiones menores:**
- **El README indexa los ADRs, no los repite.** Dice *qué* se decidió y en una línea
  *por qué*; el razonamiento con las opciones descartadas se queda en el ADR. Copiarlo
  daría dos fuentes que se desincronizan y haría leer lo mismo dos veces.
- **La tabla de stack tiene una columna "qué descarté".** El enunciado no pregunta qué
  usé, pregunta cómo pienso. Nuxt, Tailwind, axios y Vuex comunican más que la lista
  de lo elegido.
- **Se escribió ahora y no al final.** Las secciones de stack, arquitectura y
  decisiones ya estaban cerradas y no van a cambiar; lo único volátil es el bloque de
  estado. Y elimina el riesgo de entregar con el boilerplate puesto.
- **No promete lo que la app todavía no hace.** Favoritos y fidelidad al Figma están en
  la tabla de pendientes, no descritos como si existieran.

**Siguiente:** sigue igual — verificar F4 en Network, después favoritos (F1, F7).

---

## 2026-08-06 — F4 cerrado en Network

**Contexto:** último requisito de datos pendiente de verificación en navegador.

**Hecho:** recorrido completo con "Disable cache" activo — abrir `bulbasaur` dispara
una request 200; volver al listado no repite la del listado; reabrir el mismo Pokémon
no dispara ninguna. **F4 → `[x]`**.

**Aprendido / fricción:**
- **La vuelta al listado probó algo que F4 no pedía:** no se repite la request de la
  lista. Es `loadList()` siendo idempotente en el navegador y no solo en los tests —
  evidencia de uso real que refuerza F3.
- Los tres requisitos de red se verifican en el mismo lugar y con evidencia distinta:
  **F3 cuenta una llamada, F8 cuenta cero, F4 cuenta una la primera vez y cero la
  segunda.** Es la diferencia entre las dos aperturas, no una sola captura, lo que
  prueba el caché.
- El caché vive en memoria: recargar la página entera lo vacía y la request vuelve.
  Es correcto y es lo que pide el enunciado (sin persistencia), pero arruinaría la
  prueba si se recarga en lugar de navegar dentro de la app.

**Siguiente:** favoritos (F1, F7). Es el último bloque funcional que no depende del
Figma.

---

## 2026-08-06 — Favoritos (F1, F7)

**Contexto:** último bloque funcional que no depende del Figma. Después de esto, todo
lo que queda necesita el diseño.

**Hecho:**
- `favorites` store implementado: `Set` de nombres, `isFavorite` O(1), `toggle`.
- `components/ui/FavoriteStar.vue` — `<button>` con `aria-pressed`.
- `ListView`: estrella por fila, pestañas Todos/Favoritos, estado vacío propio.
- `DetailView`: la misma estrella, sobre el mismo store.
- Tests: 6 del store + 6 en `ListView` + 3 en `DetailView`. **81 pasando**.
- **F7 → `[x]`**, **F1 → `[~]`** hasta probarlo en navegador.

**Decisiones menores:**
- **La estrella es HERMANA del link, no está adentro.** Un `<button>` dentro de un
  `<a>` es HTML inválido y rompe la navegación por teclado: el foco no sabe a cuál de
  los dos ir. Se resolvió con la fila en `position: relative` y la estrella
  posicionada encima. Fue lo único de esta tanda que obligó a cambiar markup ya
  escrito.
- **`<button>` con `aria-pressed`, no un ícono con `@click`.** Entra en el orden de
  tabulación, responde a Enter y Espacio, y se anuncia como "activado"/"desactivado"
  en vez de leer el carácter de la estrella.
- **El filtro de favoritos va después de la búsqueda**, no antes: así buscar dentro de
  favoritos funciona. La cadena queda lista → búsqueda → favoritos → virtual scroll.
- **Dos estados vacíos distintos.** Si la lista está vacía porque nunca marcaste nada,
  decir "no encontramos ningún Pokémon con ese nombre" sería mentir. "Todavía no
  marcaste ninguno" se evalúa primero.
- **Dos botones con `aria-pressed` en vez de un checkbox** para Todos/Favoritos: son
  dos vistas excluyentes del mismo listado.

**Aprendido / fricción:**
- **La consistencia entre vistas que pide F1 no necesitó código.** Marcar en el detalle
  se ve en el listado porque hay un solo store, no porque haya un mecanismo de
  sincronización. Es el pago directo de la decisión de arquitectura: el test lo afirma
  montando el detalle y consultando el store, sin tocar la lista.
- **`Set` reactivo: `add` y `delete` alcanzan.** Vue 3 trackea las mutaciones de
  colecciones, así que no hace falta reasignar. Es lo contrario del caché de detalle
  del store `pokemon`, que sí necesita reasignarse porque vive en un `shallowRef`. Dos
  estructuras parecidas con reglas de reactividad opuestas, y el motivo es la decisión
  de performance de cada una.

**Verificado en navegador (mismo día):** el favorito marcado en la lista aparece
marcado al entrar al detalle, sigue marcado al volver, y sobrevive a navegar por el
detalle de otros Pokémon. **F1 → `[x]`**.

Surgió la pregunta esperable: **al recargar la página el favorito se pierde**. Es el
supuesto S2 funcionando como se decidió, no un bug. El enunciado pide persistir *"en el
store de vue"* y aclara que no hace falta base de datos; el store vive en memoria. Se
decidió **no** agregar `localStorage`: sumaría código que el enunciado no pide y haría
perder la oportunidad de mostrar que el requisito se leyó con precisión. Queda
documentado en ADR-0003, en el supuesto S2 y en el README para que no se lea como
olvido.

**Siguiente:** todo lo que queda depende del Figma — F5 (loader), F6 (compartir),
D1 y D2 (maqueta y desktop). Fase 0 pasa a ser el bloqueante real del proyecto.

---

## 2026-08-06 — Cerrar las deudas antes de entrar al Figma

**Contexto:** tres pendientes que no dependían del diseño y llevaban varios pasos
abiertos. Se cierran antes de arrancar fase 0 para no acumularlos.

**Hecho:**
- **Regla de capas ejecutable.** `no-restricted-imports` en `eslint.config.ts`:
  `components/ui/` no puede importar `@/api/pokeApi` ni `@/stores/*`. **E3 → `[x]`**.
- **[ADR-0006](./decisions/ADR-0006-arquitectura-por-capas.md)** — arquitectura por
  capas, con lo descartado y qué se tomó de clean architecture.
- **`useClipboard`** con Clipboard API, fallback y feedback. 8 tests. **F6 → `[~]`**:
  falta el botón, que sí depende del Figma.
- ADR-0004 pasa de `Propuesta` a `Aceptada`: ya está implementada y medida.
- **89 tests pasando.**

**Decisiones menores:**
- **`@/api/types` queda permitido en `components/ui/`.** Tipar una prop con el modelo
  de dominio no acopla el componente a la red; lo que se prohíbe es depender del
  **cliente** y del **estado**.
- **El ADR de arquitectura es el 0006 y no el 0005.** El 0005 estaba reservado desde
  hace días para el layout desktop, y ya lo referenciaban `ui/README.md`, `ListView` y
  `DetailView`. Renumerar habría roto esos enlaces.
- **`document.execCommand` deprecado, usado igual.** Es el único camino sin HTTPS y
  sigue soportado en todos los navegadores: el caso de uso que justifica una API
  deprecada es justamente que la alternativa moderna no existe ahí.
- **El fallback cubre dos casos, no uno.** No solo "no hay Clipboard API" sino también
  "el usuario negó el permiso", que devuelve una promesa rechazada con la API presente.

**Aprendido / fricción:**
- **ESLint interpreta los patrones de `no-restricted-imports` con semántica de
  `.gitignore`.** El primer intento usaba `'@/api'` y bloqueaba también `@/api/types`,
  porque el patrón matchea todo lo que cuelga del prefijo. Se apuntó a `api/pokeApi`
  en vez de a `api/` entero.
- **La regla se verificó creando archivos que la violan a propósito**, con alias y con
  ruta relativa, confirmando que falla, y borrándolos después. Una regla de lint que
  nadie probó es indistinguible de una que no funciona.

**Siguiente:** fase 0 — el Figma. Es lo único que queda bloqueando F5, F6, D1, D2 y E2.

---

## 2026-08-06 — E7 cerrado con medición de scroll

**Contexto:** faltaba el único número de E7 que no se podía sacar de un test: el
comportamiento del scroll en un navegador real.

**Hecho:** grabación en DevTools Performance sobre ~8 s de scroll continuo con los
1351 Pokémon cargados. **INP 6 ms**, **CLS 0**, banda de Frames en verde, 18 *passed
insights*. **E7 → `[x]`**. Los números quedan en el README.

**Aprendido / fricción:**
- **CLS 0 no es casualidad, es el sizer.** El div que tiene el alto de la lista
  completa mantiene la altura del contenido constante mientras las filas se reciclan;
  sin él habría saltos de layout en cada recálculo de la ventana.
- **Se anota el defecto, no solo el número bueno:** hay un grupo chico de frames
  caídos al arrancar el gesto de scroll. Decir "60fps constante" sería más lindo y
  menos cierto, y es exactamente el tipo de afirmación que alguien puede verificar en
  vivo.
- **LCP salió vacío** porque la grabación empezó con la página ya cargada. No invalida
  nada: E7 pregunta por el scroll, no por la carga inicial.
- Corrección de rumbo: E7, E4 y E5 **no** dependían del Figma. Se habían agrupado por
  error con lo bloqueado por diseño, que es solo F5, F6 (el botón), D1, D2 y E2.

---

## 2026-08-06 — Revisar E4 y E5 en serio, no darlos por buenos

**Contexto:** los dos criterios que quedaban sin depender del Figma. La tentación era
marcarlos hechos porque "el lint pasa y hay tests"; la revisión encontró dos cosas.

**Hecho:**
- **Duplicación real, en los tests.** `PIKACHU` estaba definido en dos specs y el
  router de prueba en otros dos. Se extrajo todo a `src/__tests__/fixtures.ts`. **E4 →
  `[x]`**.
- **CI, que no existía.** El ítem de E5 dice literal "corren en CI" y no había
  workflow: la afirmación no tenía respaldo. Se agregó `.github/workflows/ci.yml` con
  type-check, lint, tests y build. **E5 → `[~]`** hasta la primera corrida verde.
- Script `lint:check` sin `--fix`, y el README con la sección de ADR-0001.

**Decisiones menores:**
- **`lint:check` separado de `lint`.** El script de desarrollo lleva `--fix`, que en CI
  arreglaría los errores en silencio y pasaría siempre. Un check que no puede fallar no
  verifica nada — por lo mismo, ningún paso lleva `continue-on-error`.
- **`npm ci` y no `npm install`** en el workflow: instala exactamente lo del lockfile y
  falla si `package.json` y `package-lock.json` divergen.
- **Los fixtures viven en `src/__tests__/`** y no en una carpeta nueva: Vitest solo
  recoge `*.spec.ts`, así que el archivo no se ejecuta como suite, y no hace falta
  inventar una capa que ADR-0006 no contempla.
- **El `vi.mock` del cliente de API no se puede compartir.** Se hoistea al tope del
  archivo que lo declara, así que cada spec arma el suyo. Queda anotado en el fixture
  para que no parezca un olvido.

**Aprendido / fricción:**
- **El código de `src/` estaba limpio; la duplicación estaba en los tests.** Es el
  lugar donde uno deja de aplicarse las reglas que predica, y E4 evalúa DRY sin
  distinguir entre código de producción y de prueba.
- **E5 se estaba por marcar hecho con un ítem incumplido.** "Corren en CI" era falso.
  Revisar el criterio contra su propia lista, y no contra la impresión general, es lo
  que lo detectó.
- E5 queda en `[~]` a propósito: el workflow existe y los cuatro comandos se
  verificaron localmente, pero hasta que GitHub Actions no corra en verde, decir que
  los tests corren en CI sería exactamente el tipo de afirmación sin respaldo que este
  documento existe para evitar.

**Siguiente:** push para que corra el CI, y fase 0 — el Figma.

---

## 2026-08-06 — Fase 0: el Figma contradice al enunciado

**Contexto:** al fin se abre el diseño. Aparece el conflicto más grande del proyecto, y
no es de maqueta: la lista muestra sprite, chips de tipo y **color de tarjeta según el
tipo primario** en cada una de las 1351 filas. `GET /pokemon` devuelve solo `name` y
`url`. **El diseño no se puede construir con los dos llamados que pide el enunciado.**

**Hecho:** [ADR-0007](./decisions/ADR-0007-conflicto-figma-vs-dos-llamados.md), con
todo medido antes de decidir.

**Lo que se midió:**

| | |
|---|---|
| `GET /pokemon/{name}` | **271 KB** — para dar dos strings de tipo |
| Sprite pixel `sprites/pokemon/{id}.png` | 543 B – 3 KB |
| Artwork oficial | 203 KB |
| 18 × `GET /type/{n}` | **383 KB / 222 ms en paralelo**, cubre los 1351 |

**Decisión:** índice de tipos desde `/type/{n}`, sprites derivados del `id` sin request
de API, y `/pokemon-species` fuera de alcance.

**Decisiones menores:**
- **S3 quedó refutado.** Se había asumido que la lista mostraba solo nombres, porque
  era lo único compatible con "dos llamados". El Figma dice lo contrario. Se marca como
  refutado en vez de reescribirlo: el supuesto era razonable con la información que
  había, y borrarlo escondería que hubo que corregir el rumbo.
- **Se recorta el detalle, no el catálogo.** Salió la propuesta de mostrar solo los
  primeros 100 Pokémon para simplificar. Se descartó con números: 1351 ya dan menos de
  30 nodos en el DOM e INP de 6 ms, así que no hay problema de render que simplificar;
  y cortar el catálogo rompe la búsqueda otra vez —falsos negativos— y elimina la
  evidencia entera de E7, que es el criterio que más pesa. Recortar `/pokemon-species`
  cuesta tres campos de una pantalla; recortar el catálogo cuesta el criterio.

**Aprendido / fricción:**
- **El detalle pesa 271 KB.** Ese número solo dio vuelta la decisión: la idea inicial
  era pedir el detalle de cada fila visible, y pintar la primera pantalla habría
  costado 5.4 MB — 60 veces el listado completo. Medir antes de implementar evitó
  construir la opción cara.
- **`GET /type/{n}` resuelve dos problemas de una.** Trae los Pokémon de ese tipo con
  su `slot` —el tipo primario que gobierna el color— y además `damage_relations`, que
  son las debilidades del detalle. Un endpoint, dos requisitos.
- **F3 pasa de `[x]` a `[!]`.** El arranque va de 1 request a 19. No se deja el
  requisito marcado como cumplido con una nota escondida en un ADR: se cambia el estado
  y se explica arriba. La defensa es la comparación, no la excusa — **19 requests
  constantes contra 1351 proporcionales**, que es la desviación más barata posible del
  requisito sin romper el diseño ni la escala.
- **La idea del loader como precarga de imágenes se descartó, pero el instinto era
  bueno.** Precargar 1351 sprites anula el virtual scroll. Lo que sí hay ahora es una
  espera real de datos —~475 KB entre listado e índice de tipos— y ahí el loader de F5
  deja de tapar 190 ms y pasa a servir para algo: cuando la lista aparece, aparece
  completa en vez de con tarjetas grises que se colorean de a poco.
- Geometría de la lista, derivada del panel de Layout (328×558, gap 12, 5 tarjetas):
  **102 px por tarjeta, paso real de 114 px** con el gap. El `ROW_HEIGHT = 60` actual es
  un placeholder que hay que cambiar — gobierna el cálculo del virtual scroll.
- **"favoritos" es una pestaña de la barra inferior**, no un toggle dentro de la lista.
  Las pastillas Todos/Favoritos que se construyeron no son lo que pide el diseño.

**Siguiente:** implementar la capa de datos de ADR-0007 —índice de tipos y URL de
sprite—, que no depende de los tokens. Después, tokens, iconos y maqueta.

---

## 2026-08-06 — Tokens, iconos y la capa de datos de ADR-0007

**Contexto:** con el Figma abierto, se baja todo lo que no depende de maquetar:
tokens, iconos y los datos que el diseño vuelve obligatorios.

**Hecho:**
- `_tokens.scss` reescrito con los valores reales: paleta de los 18 tipos, textos
  (#121212 / #424242), borde 1.5px #E0E0E0, radios de 16px, sin sombra.
- `typeIcons.ts` con los 18 iconos, `TypeChip.vue` y `AppIcon.vue`.
- `fetchTypeIndex()`, `spriteUrl()` y el store `types`. **107 tests pasando.**
- Verificado contra la API real: **1351 de 1351 con tipo asignado, cero huecos**, y
  el arranque completo —lista + índice en paralelo— en **213 ms**.

**Decisiones menores:**
- **El fondo claro de la tarjeta se deriva del color del chip**, no se guarda aparte.
  Una fuente por tipo en vez de 36 valores: si el Figma corrige un color, su tarjeta
  se corrige sola. Se resuelve en compilación con `color.mix`, no en runtime.
- **Los 18 iconos van como datos y no como 18 componentes.** Son un `path` cada uno
  (salvo `ice`) y los dibuja el mismo componente. El `fill` fijo del Figma pasó a
  `currentColor` para que el color lo decida quien lo use.
- **El `id` se resuelve al cargar la lista, no en cada render.** `PokemonListItem`
  ahora lo incluye: la lista lo necesita para el `N°001` y para la URL del sprite, y
  son 1351 filas.
- **El índice se arma por `slot`, no con `push`.** Los 18 requests van en paralelo, así
  que el orden de resolución es arbitrario y "tipo primario" no puede ser "el primero
  que llegó". Hay un test que invierte el orden de las respuestas y verifica que
  `bulbasaur` siga saliendo `['grass', 'poison']`.
- **`typesOf()` devuelve siempre el mismo array vacío**, no uno nuevo por llamada: una
  referencia distinta en cada render rompería la memoización de cualquier `computed`
  que lo use.
- **Las debilidades son una simplificación consciente.** Se unen las de todos los tipos
  del Pokémon y se quitan las que el propio Pokémon tiene. El cálculo real multiplica
  multiplicadores —un tipo puede cancelar la debilidad del otro— y exigiría también
  `half_damage_from` y `no_damage_from`. El Figma no muestra multiplicadores. Está
  anotado en el código como aproximación, no como error.

**Aprendido / fricción:**
- **Renombrar tokens dejó referencias muertas y nada avisó.** `--c-primary`,
  `--fs-small`, `--c-surface` y `--shadow-card` quedaron apuntando a la nada: un
  `var()` inexistente no rompe el build ni el lint, simplemente no aplica la
  propiedad. Se habrían visto como estilos que "no funcionan", sin ningún error. Hubo
  que barrerlas a mano.
- **Los tests pasaron y `type-check` falló.** Cambiar `PokemonListItem` para incluir
  `id` dejó un helper de test sin el campo; Vitest no chequea tipos, así que la suite
  quedó verde igual. Es exactamente el motivo por el que el CI corre los dos comandos
  y no solo los tests.
- Cuatro iconos venían del Figma como `Vector.svg`, `Vector-1.svg`… sin nombre. Se
  identificaron por la forma —puño, ala, antenas, gota— y se confirmaron después.

**Siguiente:** maquetar la tarjeta de la lista con todo esto junto. Ahí entra
`ROW_HEIGHT = 102` con gap de 12.

---

## 2026-08-07 — La lista, en desktop y con el diseño real

**Contexto:** con tokens, iconos y datos ya resueltos, tocaba maquetar. Y apareció un
error de rumbo propio que costó rehacer trabajo.

**Hecho:**
- `PokemonCard` reemplaza a `PokemonRow`: número, nombre, chips, sprite y color por
  tipo. `EmptyState` con ilustración para los dos casos vacíos. `AppNav` con dos
  pestañas. Favoritos pasa a ser la ruta `/favoritos`.
- `useVirtualList` virtualiza **filas** y no ítems: con 3 columnas, 1351 Pokémon son
  451 filas.
- Poppins auto-hospedada con `@fontsource`.
- **[ADR-0005](./decisions/ADR-0005-layout-desktop.md)**, que llevaba reservado desde
  el 2026-08-04: grilla de 1/2/3 columnas, no columna mobile estirada.
- **E5 → `[x]`**: primera corrida verde en GitHub Actions, 109 tests en 48 s.

**Aprendido / fricción:**
- **El error grande fue anclar todo a 328 px.** Ese número salió del panel de Layout
  del Figma, pero es el ancho **mobile de referencia**; el entregable es desktop/web.
  El resultado era una columna de teléfono centrada en una ventana de 1440 —
  exactamente lo que D2 llama "mobile estirado" y lo que ADR-0002 había decidido no
  hacer meses antes. Lo detectó el usuario mirando la pantalla, no yo leyendo el
  código. Leer la medida correcta del lugar correcto no alcanza si no se piensa para
  qué formato es.
- **Tres bugs de maqueta, y ninguno era lo que parecía.** El más ilustrativo: la `g`
  de "Pidgeot" se cortaba y la reacción natural era subir el alto de la tarjeta. La
  causa real era `line-height: 100%` —valor del Figma— combinado con el
  `overflow: hidden` que necesita el truncado con elipsis: el descendente cae fuera de
  la caja de línea. Subir la tarjeta no habría arreglado nada. Un token de diseño que
  no sobrevive al contacto con el truncado.
- **`preserveAspectRatio="slice"`** escalaba la forma del tipo hasta cubrir su
  recuadro, y un icono angosto como la gota de `water` se desbordaba sobre el nombre.
- **El fondo de tarjeta resultó ser una regla, no una lista.** El Figma daba
  `#RRGGBB80` por tipo: el mismo color del chip al 50%. Guardar 18 valores habría
  creado 18 pares que se pueden desincronizar.
- **Un `<a>` de más rompió un test.** Al sumar la barra de navegación, el test de F4
  que buscaba el primer enlace de la página empezó a encontrar el de la nav. Buena
  señal de que los selectores de test conviene atarlos a la clase del componente y no
  a la posición en el DOM.

**Pendiente conocido:** `src/assets/magikarp.svg` es un placeholder hasta que entre el
export real del Figma.

**Siguiente:** la pantalla de detalle, con el botón de compartir (F6) que el Figma no
contempla y hay que diseñar.
