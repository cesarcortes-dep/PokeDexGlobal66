# Pokédex

Prueba técnica Vue.js para Global66. Listado de Pokémon consumiendo la
[PokéAPI](https://pokeapi.co/), con búsqueda, detalle y favoritos.

El enunciado pide un resumen de las tecnologías usadas y avisa que **la elección misma
se evalúa**. Así que este README no es una guía de instalación: es el qué, el por qué
y —sobre todo— **qué descarté en cada punto**, que es lo que el código terminado no
puede mostrar.

## Cómo correrlo

```sh
npm install
npm run dev        # servidor de desarrollo
npm run build      # type-check + build de producción
npm run test:unit  # 128 tests
npm run lint       # ESLint
```

**Para ver la pantalla de carga:** el listado responde en ~250 ms, así que el loader
pasa casi sin verse. `http://localhost:5173/?loader=5000` lo sostiene cinco segundos.
Es una perilla de demo, no una función: la app no espera de más, solo mantiene puesto
lo que ya estaba en pantalla.

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

La pregunta que espero: *"¿por qué no axios o Tailwind, que usa todo el mundo?"*. La
respuesta está en la última columna. Ninguna de las dos me deja hacer nada que no pueda
hacer sin ellas, y las dos suman superficie que hay que mantener.

## Arquitectura

**Por capas**, no organizada por features. La app tiene una sola entidad de dominio
—el Pokémon— y todo lo demás son vistas de esa misma entidad. Cortarla en features
dejaría carpetas de un archivo.

```
src/
  api/          pokeApi.ts, types.ts               ← única capa que hace fetch
  stores/       pokemon.ts, favorites.ts, types.ts ← Pinia: fuente de verdad + reglas
  composables/  useVirtualList, useSearch, useClipboard, useMinimumDuration
  components/ui/  presentación pura, sin acceso a datos
  views/        ListView, DetailView          ← orquestan: piden al store y componen
  styles/       _tokens.scss, _mixins.scss
```

**La regla que la sostiene: las dependencias van en un solo sentido.**
`views → stores → api`, nunca al revés. Y `components/ui/` no importa el cliente de
API ni los stores — **lo hace cumplir el lint**, no un acuerdo: hay un
`no-restricted-imports` que falla el build si alguien lo intenta, por alias o por ruta
relativa. Lo verifiqué creando archivos que la violaban a propósito, en las dos formas,
antes de borrarlos.

Dónde vive cada cosa, para que "capas" no sea una palabra vacía:

- **`api/`** — transporte y forma del contrato. Sabe de URLs y status codes, no tiene
  estado y no sabe que existe Vue.
- **`stores/`** — reglas del dominio: cuándo pedir, qué cachear, qué significa "ya
  está cargado". No sabe qué es una URL.
- **`composables/`** — comportamiento reusable de UI que no sabe qué store existe.
  `useVirtualList` sirve para cualquier lista.
- **`components/ui/`** — presentación pura: reciben props, emiten eventos.
- **`views/`** — el pegamento. Piden datos al store y componen componentes. Empezaron
  como una capa `components/features/` aparte, pero con dos pantallas esa carpeta
  habría tenido un archivo por vista y nada más: una capa de un solo lector.

**De clean architecture tomé dos cosas y descarté tres**, y las tres a propósito:

Tomé la **regla de dependencias en un solo sentido** y el **mapeo DTO→dominio**
(`toPokemon()`, una función pura en la capa de API donde viven las conversiones de
hectogramos a kilos y de decímetros a metros, testeable sin tocar la red).

Descarté:

- **Repositorios con interfaz e inyección de dependencias.** Hay una implementación y
  un consumidor. Una interfaz con un único implementador es ceremonia, no desacople.
- **Casos de uso como clases.** Mis casos de uso son `toggleFavorite` y `getDetail`;
  como acciones de Pinia ya se testean sin montar un componente.
- **Una capa de dominio separada del store.** El dominio son 1351 pares nombre/url y un
  puñado de reglas. Separarlo agregaría una indirección sin lector.

Clean architecture paga cuando el dominio tiene que sobrevivir al framework. Acá el
dominio es chico y el framework no se va a ir.

**Por qué capas y no feature-first:** la migración es mecánica y el disparador es
concreto — cuando aparezca una segunda entidad de dominio, es decir cuando en `stores/`
haya stores que no se hablen entre sí. Hoy no la hay, así que sería estructura
especulativa.

## Pensar en gran cantidad de data

El enunciado pide explícitamente pensar en escala. Lo primero fue medir qué devuelve
la API de verdad:

| Medición | Valor |
|---|---|
| Pokémon en el catálogo (`count`) | **1351** |
| Listado completo (`?limit=2000`) | **91 KB**, ~190 ms, **una sola request** |
| Tarjetas en el DOM con la lista completa | **10** a 1 columna · **20** a 2 · **36** a 3 (vs. 1351 con un `v-for` plano) |
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

**Dos honestidades sobre esos números.** El índice precomputado ahorra un 43% de algo
que ya costaba dos décimas de milisegundo: no es lo que hace rápida la búsqueda. Lo que
sostiene la escala es el virtual scroll y no volver a la red; el índice se queda porque
escala, no porque hoy se note. Y el CLS en cero no es casualidad: es el sizer, el div
que mantiene el alto de la lista completa mientras las filas se reciclan — la mitad
menos obvia del virtual scroll, la que mucha implementación se olvida.

**Y el límite, que prefiero declarar yo:** el virtual scroll asume alto de fila fijo.
Con filas de alto variable esta decisión se cae y hay que medir cada una.

## Orden de trabajo: funcionalidad antes que interfaz

Fue una decisión explícita y tomada antes de escribir código: primero que la app
**funcione y sea correcta**, después el refinamiento visual.

El motivo es de riesgo. Los problemas difíciles de este proyecto son de
comportamiento —traer 1351 Pokémon sin trabar el scroll, que la búsqueda no dé falsos
negativos, que el detalle no se vuelva a pedir— y ninguno se resuelve maquetando. Una
pantalla linda sobre datos mal resueltos hay que rehacerla; una pantalla fea sobre
datos bien resueltos solo hay que pintarla.

Ese orden se cumplió: los ocho requisitos funcionales se cerraron y se verificaron en
el navegador **antes** de abrir el Figma. La maqueta vino después, con los datos ya
resueltos y medidos.

Con una enmienda, que muestra que la regla no se aplicó a ciegas: el
enunciado pide adaptar un diseño mobile a desktop, y **esa** parte no es pulido — es
una decisión de estructura, porque una lista full-width en mobile y dos paneles en
desktop no son los mismos componentes. Así que la *decisión* de layout sube antes del
código de UI, aunque la *implementación* visual siga yendo al final.

## Adaptar el mobile a desktop

El correo pide *"tomar esta base como referencia y adaptarla al formato desktop/web"*.
El dato que define el tono: **el Figma no tiene ninguna pantalla de desktop.** No hay
un diseño que traducir — hay que decidirlo, y ese es el ejercicio.

Tres opciones sobre la mesa:

| Opción | Por qué no / por qué sí |
|---|---|
| Columna mobile centrada | Es literalmente lo que el enunciado llama "mobile estirado". En 1440 px quedan dos franjas de vacío |
| **Grilla de tarjetas** ✅ | Usa el ancho de verdad y conserva la tarjeta del Figma tal como está diseñada |
| Dos paneles (master-detail) | Patrón clásico de escritorio, pero obliga a rutas anidadas y a que `DetailView` sea ruta **y** panel embebido: dos comportamientos que mantener por una ganancia estética |

Lo que quedó:

- **La lista pasa a grilla:** 1 columna, 2 desde 800 px, 3 desde 1200 px. Contenedor de
  1400 px máximo.
- **La navegación cambia de lugar, no de contenido.** El Figma la dibuja como barra
  inferior, que es un patrón de pulgar. En escritorio no hay pulgar, hay puntero: sube
  arriba y comparte fila con el buscador, para no gastar una banda entera de alto en
  dos controles que entran en una.
- **El detalle sigue siendo una ruta** (`/pokemon/:name`) en los dos formatos, no un
  modal ni un panel. Se gana URL compartible y botón "atrás", y no hay dos
  comportamientos que sostener.

**Lo que costó:** `useVirtualList` dejó de asumir una columna — recibe `itemsPerRow` y
calcula `filas = ceil(items / columnas)`. Son pocas líneas y tienen un efecto lateral
bueno: el composable dejó de ser "el que virtualiza esta lista" y pasó a virtualizar
cualquier grilla.

**Y obligó a re-medir.** Con 3 columnas una "fila" son 3 tarjetas, así que cada unidad
de overscan cuesta 3 nodos en vez de 1. El número de E7 estaba tomado a una columna y
se había quedado corto; hay un test por cada layout.

## Dónde me aparté del Figma, y por qué

El diseño llegó solo en mobile y con cuatro pantallas. Hay tres desviaciones, todas
deliberadas:

**Dos pestañas de navegación en vez de cuatro.** El Figma tiene Pokédex, Regiones,
favoritos y Perfil. Regiones y perfil no están en el enunciado y no hay datos detrás:
serían dos pestañas muertas, que se leen como app rota antes que como fidelidad.

**Un botón de compartir que el Figma no incluye.** F6 lo exige y el diseño no lo
contempla. Se construyó respetando el sistema visual existente.

**El listado pinta el color y los tipos de cada Pokémon, y eso obligó a un endpoint
más.** Es el conflicto más grande del proyecto y tiene sección propia acá abajo.

## El conflicto grande: el Figma pide datos que "dos llamados" no alcanzan

Dos requisitos del mismo cliente se contradicen:

- El enunciado dice *"solo serán necesarios dos llamados"*.
- El diseño muestra, en **cada una de las 1351 filas**: número, nombre, sprite, chips
  de tipo y **el color de la tarjeta según el tipo primario**.

`GET /pokemon` devuelve **solo `name` y `url`**. Ni sprite ni tipos. No es una
ambigüedad que se resuelva eligiendo bien: es una contradicción. Lo único que se puede
hacer es elegir con criterio y dejarlo escrito.

**Lo que medí antes de decidir:**

| Medición | Valor |
|---|---|
| `GET /pokemon/{name}` (detalle completo) | **271 KB** — trae movimientos, índices de juego, todo |
| Sprite pixel `sprites/pokemon/{id}.png` | 543 B – 3 KB |
| `GET /type/{n}` × 18 | **383 KB en total, 222 ms en paralelo** |
| Índice de tipos resultante | 1351 Pokémon cubiertos, 29 KB en memoria |

El dato que decide: **el detalle pesa 271 KB para dar dos strings de tipo.** Pintar la
primera pantalla pidiendo detalles costaría 5.4 MB — 60 veces el listado completo.

**Descartado:** recortar el catálogo a los primeros 100. Le responde que *no* al
criterio que el enunciado marca como central; con 100 ítems el virtual scroll deja de
tener sentido y se cae toda la evidencia de escala. Y rompe la búsqueda igual que
paginar: buscar algo que existe pero quedó fuera del corte devuelve "no existe".

**Descartado también:** lista sin tipos ni color, fiel al enunciado y no al diseño. El
color por tipo *es* la identidad visual de esa pantalla. Sin eso no es una
simplificación, es otra app.

**Elegido:** un índice construido con 18 `GET /type/{n}` en paralelo al arrancar.
Devuelven la lista completa de Pokémon de cada tipo **con su `slot`** —el slot 1 es el
que gobierna el color— y de regalo traen las relaciones de daño, que son las
debilidades del detalle. Los **sprites se derivan del `id`**, sin request de API: la
URL de PokéAPI es predecible y el `id` ya sale de la `url` del listado.

**El costo honesto:** el arranque pasa de 1 request a 19. Se defiende con la
comparación, no con la excusa — **19 requests constantes contra 1351 proporcionales**.
Es la desviación más barata posible del requisito, en vez de romper el diseño o romper
la escala.

**Si el evaluador lee "dos llamados" como límite duro** y no como descripción de los
endpoints necesarios, la respuesta es la lista sin color por tipo, y está a un
`computed` de distancia.

## Decisiones que parecen omisiones y no lo son

**Los favoritos se pierden al recargar.** Es deliberado. El enunciado pide
explícitamente persistir *"en el store de vue"* y aclara que no hace falta base de
datos, así que está implementado literal. Si el requisito fuera persistir, es un
plugin de Pinia y quince líneas.

**La lista no muestra imágenes.** Es lo único compatible con *"solo serán necesarios
dos llamados"*: los sprites viven en el endpoint de detalle, y mostrarlos en el
listado exigiría 1351 requests. La imagen aparece en el detalle.

## Tests

128 tests, corriendo en [CI](./.github/workflows/ci.yml) en cada push y cada pull
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
| `views/__tests__/ListView.spec.ts` | Que las piezas juntas dan 10/20/36 tarjetas en el DOM con 1351 Pokémon, según las columnas — falla si alguien saca el virtual scroll | solo la red |
| `views/__tests__/DetailView.spec.ts` | Que reabrir un Pokémon ya visto no dispara request, y qué copia el botón compartir | solo la red |
| `stores/__tests__/types.spec.ts` | Que el tipo primario sea el del slot 1 aunque los 18 requests lleguen en cualquier orden | el cliente de API |
| `components/ui/__tests__/PokeballLoader.spec.ts` | Lo que se rompe en silencio: que el SVG no reintroduzca un `id` global, y que el texto de carga no se vuelva `sr-only` | nada |
| `components/ui/__tests__/PokemonCard.spec.ts` | Que un sprite inexistente no deje el icono de imagen rota, y que el nodo reciclado por el virtual scroll no arrastre ese fallo al siguiente Pokémon | nada |
| `composables/__tests__/useMinimumDuration.spec.ts` | Que el loader se sostenga lo justo: descuenta el tiempo ya transcurrido, no encadena mínimos entre dos cargas seguidas y no deja timers vivos al desmontar | el reloj |

## Estado

| Hecho | Pendiente |
|---|---|
| Listado completo virtualizado, en grilla de 1/2/3 columnas | Navegación por teclado sobre nodos reciclados |
| Búsqueda en cliente | |
| Loader de pokebola con animación CSS, sin dependencias (F5) | |
| Detalle cacheado, con peso, altura, habilidad y debilidades | |
| Favoritos como ruta propia | |
| Copiar atributos al portapapeles | |
| Tokens, iconos y maqueta del Figma | |

## Cómo verifiqué cada requisito

La regla que seguí: **nada pasa a hecho sin poder demostrarlo corriendo la app.** No
alcanza con que el código parezca hacerlo.

- **Una sola request de listado** — pestaña Network, comprobando que navegar entre
  lista y detalle no la repite.
- **Detalle cacheado** — abrir `bulbasaur`, volver, reabrirlo: la segunda vez no
  aparece ninguna request.
- **Búsqueda sin request por tecla** — escribir con Network abierto y verificar que no
  registra nada. Esa ausencia *es* la prueba.
- **Nodos en el DOM** — contados en el inspector con el catálogo completo cargado, en
  los tres layouts, y fijados en un test que falla si alguien saca la virtualización.
- **Scroll** — DevTools Performance sobre ~8 s de gesto continuo: INP 6 ms, CLS 0.

Dos veces esa regla evitó darme por aprobado de más. Un requisito quedó a medias dos
días porque `npm run build` pasaba y `curl` devolvía 200 — pero `curl` no ejecuta
JavaScript, así que eso no probaba que Vue montara. Y el criterio de tests casi se
marca como cumplido con 109 pasando, hasta releer su propia checklist: decía "corren en
CI", y no había CI.
