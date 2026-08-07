# ADR-0005 — Layout desktop: grilla, no columna estirada

- **Fecha:** 2026-08-06
- **Estado:** Aceptada

> Este número quedó **reservado** desde el 2026-08-04, cuando
> [ADR-0002](./ADR-0002-figma-desktop-primero-en-diseno.md) decidió que la adaptación
> a desktop era una decisión de diseño y no de pulido. Se escribe recién ahora porque
> dependía de ver el Figma.

## Contexto

El correo con el diseño dice:

> "la propuesta actual está optimizada para mobile. El objetivo es tomar esta base
> como **referencia** y **adaptarla** al formato desktop/web."

Y el dato que define el tono de esta decisión: **el Figma no tiene ninguna pantalla de
desktop.** Solo mobile. Así que no hay un diseño que traducir — hay que decidirlo, y
ese es justamente el ejercicio que el enunciado plantea.

Restricciones que vienen de decisiones ya tomadas:

- **D1/D2 en `REQUIREMENTS.md`** pide explícitamente *"layout desktop propio (no mobile
  estirado)"*.
- La lista está **virtualizada** ([ADR-0004](./ADR-0004-estrategia-de-datos-y-escala.md)):
  cualquier layout tiene que seguir renderizando una ventana y no 1351 nodos.
- El diseño mobile tiene **barra de navegación inferior**, que es un patrón de teléfono
  y no de escritorio.

## Opciones consideradas

### 1. Columna mobile centrada

Dejar los 328 px de ancho y centrarlos en la ventana.

- Pros: cero trabajo.
- Contras: es exactamente lo que D2 llama **"mobile estirado"**. En 1440 px quedan dos
  franjas enormes de vacío a los lados. Y "adaptar" no puede significar "no hacer
  nada": si el enunciado solo quisiera que no se rompiera, diría "que funcione en
  web".

### 2. Grilla de tarjetas ✅

La lista pasa de una columna a varias según el ancho. La navegación sube de la barra
inferior a una barra superior. El detalle sigue siendo su propia ruta.

- Pros: usa el espacio horizontal de verdad; conserva las tarjetas del Figma tal como
  están diseñadas; el detalle no cambia de naturaleza entre formatos.
- Contras: `useVirtualList` tiene que razonar en filas de N columnas.

### 3. Dos paneles (master-detail)

Lista a la izquierda, detalle a la derecha, en la misma pantalla.

- Pros: es el patrón clásico de escritorio y aprovecha el ancho.
- Contras: obliga a rutas anidadas y a que `DetailView` funcione como ruta **y** como
  panel embebido. Además reabre una pregunta que esta decisión puede cerrar: si el
  detalle es panel en desktop y pantalla en mobile, hay dos comportamientos que
  mantener. Es más superficie por una ganancia estética.

## Decisión

**Grilla de tarjetas, con el detalle como ruta en los dos formatos.**

| Ancho | Columnas | Navegación |
|---|---|---|
| < 768 px | 1 | barra inferior (el Figma tal cual) |
| ≥ 768 px | 2 | barra superior |
| ≥ 1024 px | 3 | barra superior |
| ≥ 1440 px | 4 | barra superior |

La tarjeta **no cambia de tamaño**: mantiene sus 328×102 y su diseño del Figma. Lo que
cambia es cuántas caben. Así la adaptación no reinterpreta el diseño, lo redistribuye —
que es lo que "tomar como referencia" pide.

**La navegación cambia de lugar, no de contenido.** Una barra pegada al borde inferior
de una pantalla de escritorio es un patrón de pulgar, no de mouse: en desktop sube.

**El detalle sigue siendo una ruta** (`/pokemon/:name`) en ambos formatos. Cierra la
pregunta que este ADR tenía abierta —modal, panel o pantalla— con la respuesta más
simple: siempre pantalla. Se gana URL compartible y botón "atrás" en los dos casos, y
no hay dos comportamientos que mantener.

## Consecuencias

**Fácil:** el CSS de la tarjeta no se toca; la grilla es un `grid-template-columns` por
breakpoint; el router no cambia.

**Caro:** `useVirtualList` deja de asumir una columna. Pasa a recibir `itemsPerRow` y a
calcular `filas = ceil(items / columnas)`. Son pocas líneas, y tienen un efecto
secundario bueno: el composable deja de ser "el que virtualiza esta lista" y pasa a ser
uno que virtualiza cualquier grilla — que es la prueba de que la abstracción estaba
bien puesta.

**Riesgo declarado:** con 4 columnas, una "fila" son 4 tarjetas, y el overscan pasa a
costar 4 nodos por unidad en vez de 1. Sigue siendo un número chico y constante, pero
hay que volver a medir los nodos en el DOM en desktop y no dar por bueno el número
medido en mobile.

**Qué queda fuera:** el Figma no define desktop, así que espaciados, ancho máximo del
contenedor y la barra superior son decisiones propias. Se mantienen los tokens del
diseño mobile para que las dos versiones se vean de la misma familia.
