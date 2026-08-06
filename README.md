# Pokédex

Prueba técnica Vue.js para Global66. Listado de Pokémon consumiendo la
[PokéAPI](https://pokeapi.co/), con búsqueda, detalle y favoritos.

El enunciado pide un resumen de las tecnologías usadas y avisa que **la elección misma
se evalúa**, así que acá está el qué y el por qué. El razonamiento largo —con las
opciones que descarté— vive en [`docs/decisions/`](./docs/decisions/).

## Cómo correrlo

```sh
npm install
npm run dev        # servidor de desarrollo
npm run build      # type-check + build de producción
npm run test:unit  # 67 tests
npm run lint       # ESLint
```

## Stack

Criterio transversal: **cada dependencia tiene que pagar su lugar.** El enunciado
evalúa KISS de forma explícita, así que sumar una herramienta que no se usa a fondo
resta en vez de sumar.

**Dependencias de runtime: tres.** Vue, Vue Router y Pinia.

| Capa | Elección | Por qué | Qué descarté |
|------|----------|---------|--------------|
| Build | **Vite** | Estándar actual de Vue 3, cero config para lo que necesito | **Nuxt**: no hay SEO ni backend en juego, sería peso muerto |
| Framework | **Vue 3** + Composition API + `<script setup>` | Pedido por el enunciado. Composition API porque la lógica reusable sale a composables testeables sin montar componentes | — |
| Lenguaje | **TypeScript** | Los tipos de la PokéAPI *son* la documentación del contrato, y hacen verificable la separación de capas | **JavaScript**: dejaría la separación como convención en vez de algo que el compilador sostiene |
| Estado | **Pinia** | Store oficial de Vue 3 | **Vuex**: en mantenimiento |
| Router | **Vue Router** | Lista y detalle como rutas → URL compartible y botón "atrás" funcionando | — |
| Estilos | **SCSS + design tokens** en custom properties | Fidelidad al Figma; los breakpoints viven en un solo archivo | **Tailwind**: replicar un Figma pixel a pixel obliga a configurar el theme igual, y llena el markup de utilidades |
| Red | **`fetch` nativo** | La plataforma ya lo hace | **axios**: envolver algo que ya existe |
| Tests | **Vitest** + Vue Test Utils | Comparte config con Vite, cero setup extra | — |
| Calidad | **ESLint + Prettier** | Que se pueda verificar con un comando vale más que afirmarlo | — |

Detalle completo en [ADR-0003](./docs/decisions/ADR-0003-stack.md).

## Arquitectura

**Por capas**, no organizada por features. La app tiene una sola entidad de dominio
—el Pokémon— y todo lo demás son vistas de esa misma entidad. Cortarla en features
dejaría carpetas de un archivo.

```
src/
  api/          pokeApi.ts, types.ts       ← única capa que hace fetch
  stores/       pokemon.ts, favorites.ts   ← Pinia: fuente de verdad + reglas
  composables/  useVirtualList, useSearch, useClipboard
  components/
    ui/         presentación pura
    features/   conectados al store
  views/        ListView, DetailView
  styles/       _tokens.scss, _mixins.scss
```

**La regla que la sostiene: las dependencias van en un solo sentido.**
`views → stores → api`, nunca al revés. Y `components/ui/` no importa nada de `api/`
ni de `stores/`.

Dónde vive cada cosa, para que "capas" no sea una palabra vacía:

- **`api/`** — transporte y forma del contrato. Sabe de URLs y status codes, no tiene
  estado y no sabe que existe Vue.
- **`stores/`** — reglas del dominio: cuándo pedir, qué cachear, qué significa "ya
  está cargado". No sabe qué es una URL.
- **`composables/`** — comportamiento reusable de UI que no sabe qué store existe.
  `useVirtualList` sirve para cualquier lista.
- **`components/ui/`** — presentación pura. **`components/features/`** — el pegamento.

De clean architecture tomé la regla de dependencias y el mapeo DTO→dominio
(`toPokemon()`, una función pura donde viven las conversiones de unidad). No
implementé repositorios con interfaz, casos de uso como clases ni una capa de dominio
separada del store: con una sola implementación y un solo consumidor, eso es ceremonia
y no desacoplamiento.

## Pensar en gran cantidad de data

El enunciado pide explícitamente pensar en escala. Lo primero fue medir qué devuelve
la API de verdad:

| Medición | Valor |
|---|---|
| Pokémon en el catálogo (`count`) | **1351** |
| Listado completo (`?limit=2000`) | **91 KB**, ~190 ms, **una sola request** |
| Filas en el DOM con la lista completa | **< 30** (vs. 1351 con un `v-for` plano) |
| INP al scrollear (DevTools Performance) | **6 ms** — el umbral "bueno" de Google es 200 ms |
| CLS | **0** |
| Filtrar con índice precomputado | **0.108 ms** por tecla |
| Filtrar normalizando dentro del `filter` | 0.188 ms por tecla |

*Medición de scroll sobre ~8 s de gesto continuo con la lista completa cargada. La
banda de Frames queda en verde salvo un grupo chico de frames caídos al arrancar el
gesto.*

Con esos números, "gran cantidad de data" no es un problema de red: **es un problema
de render y de filtrado en cliente.** Las decisiones que siguen de ahí:

- **Una sola request al arrancar, cacheada en el store.** Descarté paginar con
  `offset`/`limit` porque **rompe la búsqueda**: filtrar solo lo ya descargado devuelve
  "no existe" para un Pokémon que sí existe. Y la PokéAPI no ofrece búsqueda por texto
  parcial, así que o el universo está en el cliente o la búsqueda miente.
- **Virtual scrolling propio** (`useVirtualList`, ~90 líneas sin dependencias). Los
  nodos en el DOM son constantes sea la lista de 20 o de 100.000. Hay un test que
  cuenta filas reales y falla si alguien saca la virtualización.
- **Búsqueda en cliente con debounce de 200 ms**, sobre un índice normalizado que se
  arma una vez. El debounce no ahorra requests —no hay— sino renders.
- **Detalle bajo demanda, cacheado por nombre.** Reabrir un Pokémon ya visto no toca
  la red.
- **Favoritos como `Set` de nombres**, no como array de objetos: `has()` es O(1) y no
  duplica la entidad.

Razonamiento completo en [ADR-0004](./docs/decisions/ADR-0004-estrategia-de-datos-y-escala.md).

## Orden de trabajo: funcionalidad antes que interfaz

Fue una decisión explícita y tomada antes de escribir código
([ADR-0001](./docs/decisions/ADR-0001-funcionalidad-antes-que-ui.md)): primero que la
app **funcione y sea correcta**, después el refinamiento visual.

El motivo es de riesgo. Los problemas difíciles de este proyecto son de
comportamiento —traer 1351 Pokémon sin trabar el scroll, que la búsqueda no dé falsos
negativos, que el detalle no se vuelva a pedir— y ninguno se resuelve maquetando. Una
pantalla linda sobre datos mal resueltos hay que rehacerla; una pantalla fea sobre
datos bien resueltos solo hay que pintarla.

La consecuencia visible: **lo que está construido tiene estilos mínimos, no la maqueta
del Figma.** Eso es la fase pendiente, no un descuido.

Con una enmienda, que también está documentada
([ADR-0002](./docs/decisions/ADR-0002-figma-desktop-primero-en-diseno.md)): el
enunciado pide adaptar un diseño mobile a desktop, y **esa** parte no es pulido — es
una decisión de estructura, porque una lista full-width en mobile y dos paneles en
desktop no son los mismos componentes. Así que la *decisión* de layout sube antes del
código de UI, aunque la *implementación* visual siga yendo al final.

## Decisiones que parecen omisiones y no lo son

**Los favoritos se pierden al recargar.** Es deliberado. El enunciado pide
explícitamente persistir *"en el store de vue"* y aclara que no hace falta base de
datos, así que está implementado literal. Si el requisito fuera persistir, es un
plugin de Pinia y quince líneas.

**La lista no muestra imágenes.** Es lo único compatible con *"solo serán necesarios
dos llamados"*: los sprites viven en el endpoint de detalle, y mostrarlos en el
listado exigiría 1351 requests. La imagen aparece en el detalle.

## Tests

89 tests, corriendo en [CI](./.github/workflows/ci.yml) en cada push y cada pull
request: type-check, lint, tests y build. Ningún paso lleva `continue-on-error` — un
check que no puede fallar no verifica nada.

Cada test mockea **solo la capa de abajo**, que es algo que únicamente se puede hacer
si las capas existen de verdad.

| Test | Qué prueba | Qué mockea |
|---|---|---|
| `api/__tests__/pokeApi.spec.ts` | El contrato con la red: que se pide el universo completo, las conversiones de unidad, y que un 500 y una caída de red se distinguen | `fetch` |
| `stores/__tests__/pokemon.spec.ts` | Las reglas: que el listado se pide una sola vez incluso con llamadas concurrentes, y que el detalle se cachea | el cliente de API |
| `composables/__tests__/useVirtualList.spec.ts` | Que la ventana renderizada no crece con el tamaño de la lista | nada |
| `composables/__tests__/useSearch.spec.ts` | Debounce, normalización y estado vacío | nada |
| `composables/__tests__/useClipboard.spec.ts` | Los dos caminos que se rompen en producción: sin HTTPS y con permiso denegado | `navigator.clipboard` |
| `stores/__tests__/favorites.spec.ts` | Que se guardan nombres y no entidades | nada |
| `views/__tests__/ListView.spec.ts` | Que las piezas juntas dan menos de 30 filas en el DOM con 1351 Pokémon | solo la red |
| `views/__tests__/DetailView.spec.ts` | Que reabrir un Pokémon ya visto no dispara request | solo la red |

## Estado

| Hecho | Pendiente |
|---|---|
| Listado completo virtualizado | Loader de pokebola con animación CSS (F5) |
| Búsqueda en cliente | Botón compartir en el detalle (F6 — la lógica de copiado ya está) |
| Detalle cacheado por nombre | Maqueta fiel al Figma y adaptación a desktop (D1, D2) |
| Favoritos, con vista filtrada | |

## Documentación

El proceso está registrado, no reconstruido después:

- [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) — cada requisito del enunciado
  transcrito literal y convertido en ítems verificables. Nada pasa a hecho sin poder
  demostrarlo corriendo la app.
- [`docs/decisions/`](./docs/decisions/) — ADRs con las decisiones de peso y, sobre
  todo, las opciones que descarté.
- [`docs/JOURNAL.md`](./docs/JOURNAL.md) — bitácora cronológica, incluida la fricción
  y los errores que costaron tiempo.
