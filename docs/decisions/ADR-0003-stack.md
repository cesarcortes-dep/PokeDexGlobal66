# ADR-0003 — Stack

- **Fecha:** 2026-08-04
- **Estado:** Aceptada

## Contexto

El enunciado fija una sola tecnología: *"debe ser creada usando Vue.js"*. Todo lo
demás es elección mía, y el enunciado avisa que **la elección misma se evalúa**:

> "Nos encantaría saber la forma en la que piensas y las elecciones que tomaste así
> que escribe un resumen de las tecnologías que utilizaste en el readme file"

Restricciones que empujan la decisión: app de superficie chica, sin backend, sin
SEO, con un Figma a replicar y adaptar a desktop ([ADR-0002](./ADR-0002-figma-desktop-primero-en-diseno.md)),
y con un requisito de escala en cliente ([ADR-0004](./ADR-0004-estrategia-de-datos-y-escala.md)).

Criterio transversal: **cada dependencia tiene que pagar su lugar.** En una prueba
donde evalúan KISS explícitamente, sumar una herramienta que no se usa a fondo
resta, no suma.

## Opciones consideradas

### Base

1. **Nuxt 3** — SSR, file-based routing, auto-imports.
   - Contras: no hay SEO ni backend en juego. Es peso muerto que hay que justificar,
     y el enunciado pide "proyecto de vue.js". Riesgo de leerse como sobre-ingeniería.
2. **Vite + Vue 3 + JavaScript** — mismo esqueleto, menos setup.
   - Contras: sin tipos, el contrato de la PokéAPI queda implícito y la separación
     de capas se vuelve una convención en vez de algo que el compilador sostiene.
3. **Vite + Vue 3 + TypeScript** ✅

### Estilos

1. **Tailwind** — rápido, consistente por defecto.
   - Contras: replicar un Figma pixel-a-pixel obliga a configurar el theme igual;
     el markup se llena de utilidades y el CSS propio queda invisible para quien
     evalúa E2.
2. **CSS plano + custom properties** — lo más liviano.
   - Contras: sin nesting ni mixins, que es justo lo que se extraña al escribir los
     breakpoints desktop de ADR-0002.
3. **SCSS + tokens propios** ✅

## Decisión

| Capa | Elección | Por qué |
|------|----------|---------|
| Build | **Vite** | Estándar actual de Vue 3, dev server instantáneo, cero config para lo que necesito |
| Framework | **Vue 3** + Composition API + `<script setup>` | Pedido por el enunciado. Composition API porque la lógica reusable (búsqueda, virtual list, clipboard) sale a composables testeables sin montar componentes |
| Lenguaje | **TypeScript** | Los tipos de la PokéAPI **son** la documentación del contrato, y hacen que la separación de capas de E3 sea verificable y no declarativa |
| Estado | **Pinia** | Store oficial de Vue 3 (Vuex en mantenimiento). Resuelve S1: "el store de vue" = Pinia. Stores tipados y testeables sin montar la app |
| Router | **Vue Router** | Lista y detalle como rutas → URL compartible y back del navegador funcionando |
| Estilos | **SCSS + design tokens** en custom properties | Fidelidad al Figma; los breakpoints desktop quedan en un solo archivo, no dispersos |
| Tests | **Vitest** + Vue Test Utils | Cubre E5. Comparte config con Vite, cero setup extra |
| Calidad | **ESLint + Prettier** | E4 pide buenas prácticas; que se pueda verificar con un comando vale más que afirmarlo |

**Dependencias de runtime: Vue, Vue Router, Pinia. Nada más.** Fetch con `fetch`
nativo — no entra axios para envolver lo que la plataforma ya hace. El virtual
scroll se evalúa como implementación propia primero (ver ADR-0004).

Estructura:

```
src/
  api/          pokeApi.ts, types.ts      ← única capa que hace fetch
  stores/       pokemon.ts, favorites.ts  ← Pinia
  composables/  useVirtualList.ts, useSearch.ts, useClipboard.ts
  components/
    ui/         presentación pura, sin store ni fetch
    features/   conectados al store
  views/        ListView.vue, DetailView.vue
  styles/       _tokens.scss, _mixins.scss
```

La regla que sostiene E3: **`components/ui/` no importa nada de `api/` ni de
`stores/`.** Es una línea verificable con un lint rule, no una intención.

## Consecuencias

- Fácil: testear store y composables sin DOM; cambiar la UI sin tocar datos.
- Caro: TS agrega fricción al tipar las respuestas de la PokéAPI (son anidadas y
  parciales). Mitigación: tipar **solo los campos que la app usa**, no el schema
  completo — tipar de más sería lo contrario de KISS.
- Decisión relacionada: favoritos **solo en el store, sin `localStorage`**
  (supuesto S2 resuelto). Se pierden al recargar; es lo que pide el enunciado y va
  documentado en el README como decisión consciente, no como omisión.
