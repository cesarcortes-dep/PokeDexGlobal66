# ADR-0007 — El Figma pide datos que "dos llamados" no alcanzan

- **Fecha:** 2026-08-06
- **Estado:** Aceptada
- **Revisa:** [ADR-0004](./ADR-0004-estrategia-de-datos-y-escala.md) (no lo supersede: la
  estrategia de escala sigue vigente, se amplía la de datos)

## Contexto

Al abrir el Figma aparece un conflicto entre dos requisitos que vienen **del mismo
cliente**:

- El enunciado dice: *"solo serán necesarios dos llamados"* — `GET /pokemon` y
  `GET /pokemon/{name}`.
- El diseño de la lista muestra, en **cada una de las 1351 filas**: número, nombre,
  **sprite**, **chips de tipo**, y el **color de la tarjeta según el tipo primario**
  (verde para Planta, naranja para Fuego).

`GET /pokemon` devuelve **solo `name` y `url`**. Ni sprite ni tipos.

Y la pantalla de detalle pide además descripción, categoría, ratio de género y
debilidades — que tampoco salen de esos dos endpoints.

O sea: **el diseño no se puede construir con los dos llamados.** No es una
ambigüedad que se resuelva eligiendo bien; es una contradicción. Lo único que se puede
hacer es elegir con criterio y dejarlo escrito.

### Lo que se midió antes de decidir

| Medición | Valor |
|---|---|
| `GET /pokemon/{name}` (detalle completo) | **271 KB** — trae movimientos, índices de juego, todo |
| Sprite pixel `sprites/pokemon/{id}.png` | **543 B – 3 KB** |
| Artwork oficial | 203 KB |
| `GET /type/{n}` × 18 | **383 KB en total**, **222 ms en paralelo** |
| Índice de tipos resultante | 1351 Pokémon cubiertos, 29 KB serializado |

El dato que decide: **el detalle pesa 271 KB para dar dos strings de tipo.**

## Opciones consideradas

### 1. Pedir el detalle de cada fila visible, cacheado

El virtual scroll acota: solo ~20 filas existen a la vez.

- Contras: **271 KB por Pokémon.** Pintar la primera pantalla cuesta 5.4 MB — 60 veces
  el listado completo. Y crece con cada scroll.

### 2. Recortar el catálogo a los primeros 100

- Contras decisivos: **responde que no** al criterio que el enunciado marca como
  central (*"pensá en gran cantidad de data"*). Con 100 ítems el virtual scroll deja de
  tener sentido y se cae toda la evidencia de E7. Además **rompe la búsqueda**: buscar
  un Pokémon que existe pero quedó fuera del corte devuelve "no existe" — el mismo
  falso negativo por el que ADR-0004 descartó paginar.
- Y no ahorra nada del problema real: los tipos hacen falta igual.

### 3. Lista sin tipos ni color, fiel al enunciado y no al diseño

- Pros: cero costo extra, "dos llamados" literal.
- Contras: el color por tipo **es** la identidad visual de la pantalla. Sin eso no es
  una simplificación, es otra app.

### 4. Índice de tipos desde `/type/{n}` ✅

`GET /type/{n}` devuelve la lista completa de Pokémon de ese tipo, **con su `slot`**, y
además sus relaciones de daño.

- 18 requests, **una sola vez**, en paralelo: 383 KB / 222 ms.
- Cubre los **1351** Pokémon: `bulbasaur → ["grass","poison"]`,
  `charmander → ["fire"]`, verificado contra el Figma.
- `slot: 1` da el tipo primario, que es el que gobierna el color.
- **De regalo trae las debilidades** del detalle (`damage_relations`).
- Contras: son 18 llamadas más de las que el enunciado menciona.

## Decisión

**Opción 4, más dos decisiones que no cuestan requests.**

1. **Índice de tipos** construido con 18 `GET /type/{n}` en paralelo al arrancar.
   Costo **constante**: no crece con el catálogo ni con el scroll.
2. **Sprites derivados del `id`**, sin request de API. La URL de PokéAPI es
   predecible (`sprites/pokemon/{id}.png`) y el `id` ya se extrae de la `url` del
   listado. Son requests de imagen, lazy, no llamadas de datos.
3. **`/pokemon-species` queda fuera.** Descripción, categoría y ratio de género no se
   implementan. Es el recorte elegido conscientemente: quita tres campos de una
   pantalla, contra recortar el catálogo que quitaría el criterio de evaluación más
   pesado.
4. **La pantalla de carga (F5) cubre el arranque real.** Listado + índice de tipos en
   paralelo son ~475 KB / ~250 ms, y en conexión lenta son segundos. El loader espera
   **los datos**, no las imágenes: cuando la lista aparece, aparece completa —
   nombre, número, color y chips juntos— en vez de tarjetas grises que se colorean de
   a poco.

### Lo que NO se hace, y por qué

- **No se precargan las imágenes.** Serían 1351 descargas antes de mostrar nada, que
  es exactamente lo contrario del virtual scroll. Van con `loading="lazy"` y
  dimensiones fijas para que el CLS siga en 0.
- **No se congela el índice en el build.** Serializado son 29 KB y sería tentador,
  pero quedaría desactualizado y agregaría un paso de build. Se deja anotado como
  salida si alguna vez los 18 requests molestan.

## Consecuencias

**El costo honesto: F3 deja de cumplirse de forma literal.** El arranque pasa de 1
request a 19. Se documenta como desvío consciente y no se marca como cumplido sin
aclararlo. La regla de "dos llamados" **sí** se respeta para los datos de Pokémon —
listado una vez, detalle una vez por Pokémon y cacheado—; lo que se agrega es un
índice de tipos que el diseño vuelve obligatorio.

La forma de defenderlo es la comparación, no la excusa: **19 requests constantes
contra 1351 proporcionales.** Se eligió la desviación más barata posible del
requisito, en vez de romper el diseño o romper la escala.

**Fácil:** el color y los chips salen de un `Map` en memoria, sin request por fila; las
debilidades del detalle ya están cargadas; el detalle sigue costando una sola llamada.

**Caro:** hay un endpoint más que mantener y un store más. El arranque tarda ~250 ms en
vez de ~190 ms.

**Qué revisar:** si el evaluador considera "dos llamados" como límite duro y no como
descripción de los endpoints necesarios, la respuesta es la opción 3 — lista sin color
por tipo — y está a un `computed` de distancia.
