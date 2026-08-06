# ADR-0006 — Arquitectura por capas

- **Fecha:** 2026-08-06
- **Estado:** Aceptada

> Numeración: el 0005 quedó reservado para el layout desktop, que depende del Figma
> y todavía no se decidió. Ver [ADR-0002](./ADR-0002-figma-desktop-primero-en-diseno.md).

## Contexto

El enunciado evalúa la arquitectura de forma explícita —*"buena arquitectura y diseño
de código"*— y también pide KISS. Las dos cosas a la vez son la restricción real: hay
que poder defender la estructura **y** que no sea más pesada de lo que el problema
justifica.

Datos del problema que empujan la decisión:

- **Una sola entidad de dominio.** Todo lo que existe es el Pokémon. La lista, el
  detalle, los favoritos y la búsqueda son vistas de esa misma entidad.
- **Dos pantallas.** Listado y detalle.
- **Sin backend propio.** La API es de terceros y devuelve el modelo casi listo.
- **Tres dependencias de runtime** ([ADR-0003](./ADR-0003-stack.md)): Vue, Router y
  Pinia.

Esta decisión estaba implícita en ADR-0003, que ya fijaba la estructura de carpetas.
Se escribe aparte porque la estructura es la consecuencia, no la decisión: lo que hay
que poder defender es **por qué capas y no otra cosa**, y qué se descartó.

## Opciones consideradas

### 1. Arquitectura por capas ✅

Separar por responsabilidad técnica: acceso a datos, estado, comportamiento reusable,
presentación.

- Pros: cada capa se testea mockeando solo la de abajo; la frontera con la red queda
  en un archivo; se lee sin explicación previa.
- Contras: con muchas features, una capa termina siendo un cajón de cosas no
  relacionadas.

### 2. Feature-first (modular por características)

`features/pokemon-list/`, `features/favorites/`, cada una con su store, su API y sus
componentes.

- Pros: lo que cambia junto vive junto; escala a equipos grandes.
- Contras decisivos acá: **no hay features que separar.** Con una sola entidad, el
  corte deja carpetas de un archivo y una pregunta sin buena respuesta —¿favoritos es
  una feature o es estado compartido entre dos features?—. Además obliga a decidir dos
  ejes a la vez (capa **y** feature) para cada archivo nuevo, y esa ambigüedad se
  degrada sola.

### 3. Híbrido: features dentro de capas

Lo que se evaluó al final y también se descartó: mantener las capas y además cortar
por feature adentro de cada una. Suma la ambigüedad de la opción 2 sin resolver nada
que las capas no resuelvan ya con dos pantallas.

### 4. Clean architecture completa

Entidades, casos de uso, repositorios con interfaz, inversión de dependencias.

- Contras: ver abajo. Se toma la regla central y se descarta la maquinaria.

## Decisión

**Arquitectura por capas.** Cuatro, con una regla que las sostiene.

```
src/
  api/          pokeApi.ts, types.ts       ← única capa que hace fetch
  stores/       pokemon.ts, favorites.ts   ← Pinia: fuente de verdad + reglas
  composables/  useVirtualList, useSearch, useClipboard
  components/
    ui/         presentación pura
    features/   conectados al store
  views/        ListView, DetailView
```

**La regla: las dependencias van en un solo sentido.** `views → stores → api`, nunca
al revés. Y `components/ui/` no importa el cliente de API ni los stores.

Dónde vive cada cosa, para que "capas" no sea una palabra vacía:

| Capa | Sabe | No sabe |
|------|------|---------|
| `api/` | URLs, query params, status codes, la forma de la respuesta | Que existe Vue. No tiene estado |
| `stores/` | Cuándo pedir, qué cachear, qué significa "ya está cargado" | Qué es una URL ni un status code |
| `composables/` | Comportamiento reusable de UI (geometría, debounce, portapapeles) | Qué store existe |
| `components/ui/` | Cómo se ve algo dado un conjunto de props | Todo lo demás |
| `components/features/` | Cómo conectar un store con presentación | — |
| `views/` | Cómo se compone una pantalla | Cómo se piden los datos |

La prueba de fuego para `composables/`: **si un composable importa un store, no es un
composable, es una feature disfrazada.**

### La regla es ejecutable, no un acuerdo

`components/ui/` tiene un `no-restricted-imports` en `eslint.config.ts`. Importar
`@/stores/*` o `@/api/pokeApi` desde ahí **falla el lint**, por alias o por ruta
relativa. `@/api/types` queda permitido a propósito: tipar una prop con el modelo de
dominio no acopla el componente a la red.

Es la diferencia entre una arquitectura y un diagrama: se verifica con
`npm run lint`.

### Qué se tomó de clean architecture y qué no

**Tomado:**

- La **regla de dependencias en un solo sentido**. Es la idea central y la única que
  paga su costo acá.
- El **mapeo DTO → dominio**. `toPokemon()` es una función pura donde viven las
  conversiones de unidad (hectogramos a kg, decímetros a m) y el aplanado de tipos.
  Los componentes reciben `Pokemon`, no `PokemonDetailResponse`: si la PokéAPI cambia,
  cambia el mapper y nada más.

**Descartado, y el motivo importa más que la regla:**

- **Repositorios con interfaz e inyección de dependencias.** Hay una implementación y
  un consumidor. Una interfaz con un único implementador es ceremonia, no
  desacoplamiento.
- **Casos de uso como clases.** Los casos de uso son `toggleFavorite` y `getDetail`.
  Como acciones de Pinia ya se testean sin montar un componente. Envolverlos en clases
  no agrega nada verificable.
- **Una capa de dominio separada del store.** El dominio son 1351 pares nombre/url y
  un puñado de reglas. Separarlo agregaría una indirección sin lector.

Clean architecture paga cuando el dominio tiene que sobrevivir al framework. Acá el
dominio es chico y el framework no se va a ir.

## Consecuencias

**Fácil:**

- **Cada test mockea solo la capa de abajo**, y eso solo es posible si las capas
  existen: el del cliente mockea `fetch`, el del store mockea el cliente, el de los
  composables no mockea nada, el de las views mockea solo la red. La suite es la
  evidencia de que la separación es real.
- Cambiar de `fetch` a otra cosa, o meter reintentos, toca un archivo.
- La consistencia de favoritos entre listado y detalle **no necesitó código**: hay una
  sola fuente de verdad, no un mecanismo de sincronización.

**Caro:**

- Archivos chicos y muchos imports. En una app de dos pantallas se nota.
- La regla del lint hay que mantenerla si aparecen alias nuevos.

**Cuándo revisar esta decisión:** cuando aparezca una **segunda entidad de dominio** —
en concreto, cuando `stores/` tenga stores que no se hablen entre sí. Ahí feature-first
empieza a pagar y la migración es mecánica. Hoy sería estructura especulativa.
