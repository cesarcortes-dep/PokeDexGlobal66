# Requisitos — trazabilidad

Fuente: enunciado de la prueba (Global66) + correo con enlace a Figma.
Repo: <https://github.com/cesarcortes-dep/PokeDexGlobal66>
Cada requisito se transcribe **literal** y se convierte en ítems verificables.
Nada pasa a `[x]` sin poder demostrarlo corriendo la app.

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecho y verificado · `[!]` bloqueado o
cumplido con desvío documentado

## Funcionales

| ID | Requisito (literal) | Ítems verificables | Estado |
|----|---------------------|--------------------|--------|
| F1 | "hacer una lista de pokémons Favoritos" | Marcar/desmarcar favorito desde lista y desde detalle; vista filtrada solo-favoritos; estado consistente entre ambas vistas | `[x]` **Verificado en navegador:** el favorito marcado en la lista aparece marcado al entrar al detalle, y sigue marcado al volver, también navegando por el detalle de otros Pokémon. `FavoriteStar` en cada fila y en el detalle, pestañas Todos/Favoritos, estado vacío propio ("todavía no marcaste ninguno") distinto del de búsqueda sin resultados. La consistencia entre vistas es por construcción: un solo store, sin sincronización |
| F2 | "La aplicación debe ser creada usando Vue.js" | `package.json` con Vue 3; app monta y buildea | `[x]` Vue 3.5, `npm run build` en verde y **verificado en navegador**: la app monta y `ListView` pinta el listado. Lo que faltaba era justamente esto — `curl` no ejecuta JS |
| F3 | "solo serán necesarios dos llamados: `GET /api/v2/pokemon`" | Un solo request de listado en toda la sesión; verificado en Network | `[!]` **Cumplido para el listado, con un desvío consciente.** Una sola llamada a `/pokemon?limit=2000` (1351 ítems / 91 KB / ~190 ms), verificada en Network e idempotente incluso con llamadas concurrentes. **Pero el arranque hace 19 requests, no 1:** el Figma pinta cada fila con su tipo y su color, y `/pokemon` no devuelve tipos. Se agregan 18 `GET /type/{n}` (383 KB, 222 ms en paralelo, **costo constante**) — ver [ADR-0007](./decisions/ADR-0007-conflicto-figma-vs-dos-llamados.md). La alternativa fiel al literal es lista sin color por tipo, y está a un `computed` de distancia |
| F4 | "`GET /api/v2/pokemon/${name}`" para info específica | Detalle se pide solo al abrir un Pokémon; resultado cacheado (no re-pide al reabrir) | `[x]` **Verificado en Network:** abrir `bulbasaur` dispara una request 200; volver al listado no repite la del listado; **reabrir el mismo Pokémon no dispara ninguna**. `getDetail()` cachea por nombre en un `Map` y deduplica requests concurrentes; `toPokemon()` convierte a kg/m y ordena los tipos por `slot` |
| F5 | "pantalla de loading … efecto css sobre la imagen de la pokebola" | Loader con animación CSS (no GIF, no lib); visible en carga inicial | `[ ]` |
| F6 | "El botón compartir debe copiar en el portapapeles el nombre del pokemon con sus atributos separados por coma" | Click copia string `nombre,attr,attr,…`; feedback visible al usuario; fallback si Clipboard API no disponible | `[~]` `useClipboard` implementado con Clipboard API, fallback a `execCommand` para contexto sin HTTPS y para permiso denegado, y feedback que se apaga solo. **Falta el botón en el detalle** y confirmar contra el Figma qué atributos y en qué orden (supuesto S4) |
| F7 | "para la lista de favoritos … persistas la data en el store de vue" | Favoritos viven en store; sin backend ni DB | `[x]` Store Pinia con un `Set` de nombres. Sin backend, sin DB y **sin `localStorage`** (supuesto S2, decisión consciente documentada en el README). Marcar no dispara ninguna request — hay test que lo verifica |
| F8 | Búsqueda (implícita en el diseño Figma) | Filtro por nombre; estado vacío "sin resultados"; sin request por tecla | `[x]` **Verificado en navegador:** buscar filtra la lista, `zzz` muestra el estado vacío y **Network no registra ninguna llamada** al escribir — que es exactamente la prueba de "sin request por tecla". `useSearch` con debounce de 200 ms, índice normalizado precomputado, insensible a mayúsculas y acentos |

## Diseño

| ID | Requisito (literal) | Ítems verificables | Estado |
|----|---------------------|--------------------|--------|
| D1 | "las especificaciones del diseño están en este link" — [Figma](https://www.figma.com/design/edU7Pms8bvosgSYW23yOds/Pok%C3%A9dex?node-id=0-1) | Pantallas implementadas fieles al Figma en viewport mobile | `[ ]` |
| D2 | "la propuesta actual está optimizada para mobile. El objetivo es tomar esta base como referencia y adaptarla al formato desktop/web" | Layout desktop propio (no mobile estirado); breakpoints definidos y documentados; sin scroll horizontal | `[ ]` |

## Criterios de evaluación

| ID | Criterio (literal) | Ítems verificables | Estado |
|----|--------------------|--------------------|--------|
| E1 | "Crea proyecto de vue.js y subelo a un repositorio de código en github" | Repo público; historial de commits legible (no un único "initial commit") | `[x]` [PokeDexGlobal66](https://github.com/cesarcortes-dep/PokeDexGlobal66) · 4 commits, `docs/` antes que el código |
| E2 | "Buena implementación de los elementos UI tanto a nivel de código como visualmente" | Componentes de presentación reutilizables, sin lógica de datos adentro; estados hover/focus/disabled/vacío/error cubiertos | `[ ]` |
| E3 | "Buena arquitectura y diseño de código" | Capas separadas: API client → store → composables → componentes. Componente no llama `fetch` directo | `[x]` [ADR-0006](./decisions/ADR-0006-arquitectura-por-capas.md) documenta la decisión, lo descartado y qué se tomó de clean architecture. **La regla es ejecutable**: `no-restricted-imports` hace fallar `npm run lint` si `components/ui/` importa el cliente de API o un store, por alias o por ruta relativa. Verificado con archivos de violación deliberada |
| E4 | "Usar buenas prácticas … KISS, DRY, SOLID" | Sin duplicación de lógica de fetch/formateo; lint sin warnings; funciones con una responsabilidad | `[x]` `npm run lint:check` en verde sin `--fix`. **DRY:** `fetch` existe en un solo lugar (`request()`); el formateo de unidades solo en `toPokemon()`; la duplicación que sí había estaba en los tests (`PIKACHU` y el router repetidos en tres specs) y se extrajo a `src/__tests__/fixtures.ts`. **KISS:** 3 dependencias de runtime, y las descartadas quedan justificadas en ADR-0003. **SOLID:** la responsabilidad única está separada por capas y **verificada por lint**, no declarada — ver E3 |
| E5 | "Puntos extras si implementas unit test (no excluyente)" | Tests de store (favoritos), del cliente de API (mockeado) y de componentes clave; corren en CI | `[~]` **89 tests** en 8 archivos: los dos stores, el cliente de API mockeado, los tres composables y las dos views. Workflow de CI escrito (`type-check` + `lint:check` + tests + build, sin `continue-on-error`) y los cuatro comandos verificados localmente. **Falta la primera corrida verde en GitHub Actions** — hasta que exista, "corren en CI" es una afirmación sin respaldo |
| E6 | "escribe un resumen de las tecnologías que utilizaste en el readme" | README con stack, motivo de cada elección y enlace a los ADRs | `[x]` README propio en lugar del boilerplate de `create-vue`: stack con el motivo **y lo descartado** en cada capa, arquitectura, los números medidos de escala, las decisiones que parecen omisiones, y enlaces a ADRs / journal / requisitos |
| E7 | "si bien la aplicación es sencilla igual buscamos que pienses en gran cantidad de data al momento de decidir cómo implementarás tu solución" | Lista renderiza ~1300 ítems sin caída de FPS al scrollear; búsqueda sin recalcular todo el árbol; medición documentada | `[x]` **Render:** con 1351 Pokémon cargados hay **10 tarjetas en el DOM a 1 columna, 20 a 2 y 36 a 3** (ventana 1440×820) — la cantidad la fija el viewport, no el catálogo, y no cambia con una lista de 100.000. **Re-medido tras la grilla de ADR-0005:** el número anterior ("<30") se había tomado en una sola columna y en escritorio se quedaba corto, porque cada unidad de overscan cuesta una fila entera de tarjetas. Hay test por cada layout. **Scroll medido en DevTools Performance** sobre ~8 s continuos: **INP 6 ms** (umbral "bueno" de Google: 200 ms), **CLS 0**, Frames en verde salvo un grupo chico al inicio del gesto, 18 *passed insights*. **Búsqueda:** filtrar cuesta **0.108 ms** con índice precomputado vs **0.188 ms** normalizando dentro del `filter` |

**E7 es el criterio que más discrimina.** Es el único que no se cumple por prolijidad
sino por una decisión de arquitectura explícita → [ADR-0004](./decisions/ADR-0004-estrategia-de-datos-y-escala.md).

## Supuestos

Ambigüedades resueltas por mi cuenta. Documentadas para poder defenderlas.

- **S1 — "Store de vue" = Pinia.** Es el store oficial de Vue 3; Vuex está en
  mantenimiento. Ver [ADR-0003](./decisions/ADR-0003-stack.md).
- **S2 — Los favoritos se pierden al recargar. RESUELTO: sin `localStorage`.** El
  enunciado pide explícitamente store y aclara que no hay que persistir. Se
  implementa literal. Va documentado en el README como decisión consciente para que
  no se lea como omisión. Ver [ADR-0003](./decisions/ADR-0003-stack.md).
- **S3 — ~~La lista muestra solo nombres, no sprites.~~ REFUTADO por el Figma.** El
  diseño muestra sprite, chips de tipo y color por tipo en cada fila. El supuesto era
  razonable con la información que había y resultó equivocado al ver el diseño. Se
  resuelve así: el **sprite se deriva del `id`** (URL predecible de PokéAPI, cero
  requests de API) y los **tipos salen de un índice** construido con 18 `GET /type/{n}`
  al arrancar. Ver [ADR-0007](./decisions/ADR-0007-conflicto-figma-vs-dos-llamados.md).
- **S4 — "Sus atributos" en el botón compartir** = los que muestra la pantalla de
  detalle según el Figma (name, weight, height, types), en ese orden.
  *(Confirmar contra el Figma.)*
- **S5 — El detalle se implementa sin `/pokemon-species`.** El Figma pide descripción,
  categoría y ratio de género, que solo salen de ese endpoint. Se recortan
  conscientemente: quitan tres campos de una pantalla, contra la alternativa de
  recortar el catálogo, que quitaría la evidencia del criterio E7. Habilidad y
  debilidades **sí** se implementan — la primera viene en `/pokemon/{name}` y las
  segundas en el índice de tipos que ya se pide.

## Fuera de alcance (decidido explícitamente)

- Backend / base de datos — excluido por el enunciado.
- Autenticación, i18n, dark mode — no pedidos.
- Endpoints de PokéAPI más allá de los dos indicados (`/pokemon-species`,
  `/evolution-chain`, etc.) — el enunciado acota a dos llamados.
