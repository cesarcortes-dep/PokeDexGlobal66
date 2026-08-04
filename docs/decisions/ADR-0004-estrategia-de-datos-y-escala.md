# ADR-0004 — Estrategia de datos y escala

- **Fecha:** 2026-08-04
- **Estado:** Propuesta

## Contexto

El enunciado deja una frase que es la verdadera prueba de arquitectura:

> "si bien la aplicación es sencilla igual buscamos que pienses en gran cantidad de
> data al momento de decidir cómo implementarás tu solución."

Restricciones duras del enunciado: **solo dos llamados**, `GET /api/v2/pokemon` y
`GET /api/v2/pokemon/${name}`. Eso prohíbe resolver la búsqueda del lado del
servidor — y de todos modos PokéAPI no ofrece búsqueda por texto parcial.

Datos reales de la API:

- `GET /api/v2/pokemon` devuelve `{ count, next, previous, results: [{ name, url }] }`.
- `count` ≈ **1300** Pokémon. Sin `limit`, devuelve 20.
- Con `?limit=<count>` devuelve la lista completa: solo `name` + `url`. Payload del
  orden de ~100 KB. **Una sola request.**
- El `id` es derivable de la `url` (`…/pokemon/25/`) sin llamar al detalle.

Entonces "gran cantidad de data" no es un problema de red — es un problema de
**render y de filtrado en el cliente**: 1300 nodos en el DOM y un filtro que corre
en cada tecla.

## Opciones consideradas

### Cómo obtener la lista

1. **Paginación con `offset`/`limit` (scroll infinito).**
   - Pros: payload inicial mínimo.
   - Contras: **rompe la búsqueda.** Filtrar solo lo ya descargado da resultados
     falsos ("no existe" cuando sí existe). Además dispara N requests, contra el
     espíritu de "solo dos llamados".

2. **Una request con `?limit=count`, filtrado en cliente.** ✅
   - Pros: búsqueda correcta sobre el universo completo; cumple "dos llamados"
     literal; una sola fuente de verdad en el store.
   - Contras: ~100 KB iniciales y 1300 ítems que renderizar — lo que obliga a
     resolver el render (abajo).

### Cómo renderizar 1300 ítems

1. **Renderizar todo con `v-for`.**
   - Contras: ~1300 nodos + listeners. Jank al scrollear. Falla E7 justamente.

2. **Virtual scrolling (renderizar solo la ventana visible).** ✅
   - Pros: nodos en DOM constantes (~20) sea la lista de 20 o de 100.000. Es
     exactamente la respuesta a la pregunta que hace el enunciado.
   - Contras: una dependencia más, o ~60 líneas propias con `IndexedDB`-free
     `IntersectionObserver`/cálculo de offset.

3. **Paginación visual (páginas de 20).**
   - Pros: simple.
   - Contras: el Figma es una lista con scroll, no paginada. Contradice el diseño.

## Decisión (propuesta)

- **Un solo `GET /api/v2/pokemon?limit=${count}`** al arrancar, cacheado en el store.
  Se hacen 2 requests reales la primera vez (una para leer `count`, otra con el
  `limit`) o directamente `?limit=2000`; a definir al medir.
- **Virtual scrolling** en la lista. Preferencia por implementación propia en un
  composable `useVirtualList` — es el tipo de decisión que el evaluador quiere ver
  razonada, y evita sumar dependencia por 60 líneas. Si el tiempo aprieta,
  `vue-virtual-scroller`.
- **Búsqueda en cliente, debounced (~200 ms)**, sobre un índice de nombres normalizado
  precomputado una vez (`computed`), no recalculado por tecla.
- **Detalle bajo demanda y cacheado por nombre** en un `Map` dentro del store:
  reabrir un Pokémon ya visto no dispara request. Cubre F4.
- **Favoritos como `Set` de nombres**, no como array de objetos: `has()` es O(1) y
  evita duplicar la entidad Pokémon en dos lugares (DRY, E4).

## Consecuencias

- Fácil: búsqueda instantánea y correcta; favoritos y filtros son `computed` puros
  sobre una única fuente de verdad.
- Caro: el virtual scroll complica el markup de la lista y hay que cuidar la
  accesibilidad (foco, navegación por teclado) y los tests.
- **Medición obligatoria** para poder afirmar E7: registrar en el README el conteo
  de nodos en DOM y el tiempo de filtrado con la lista completa. Sin número medido,
  esta decisión es una afirmación sin respaldo.
