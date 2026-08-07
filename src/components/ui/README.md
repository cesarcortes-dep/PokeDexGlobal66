# `components/ui/` — componentes de presentación

**Regla dura (sostiene E3 y el principio de responsabilidad única de SOLID):**

> Ningún archivo de esta carpeta importa nada de `@/api` ni de `@/stores`.

Reciben `props`, emiten eventos. No saben que existe la PokéAPI ni Pinia. Por eso
se testean sin montar la app y se pueden reordenar libremente cuando se adapte el
layout a desktop.

Candidatos según el Figma:

- `BaseButton.vue` — variantes primary / secondary, estados disabled y loading
- `SearchInput.vue` — input con ícono de lupa
- `FavoriteStar.vue` — estrella toggle (activa / inactiva)
- `PokeballLoader.vue` — el loader animado por CSS de F5
- `EmptyState.vue` — "no encontramos nada" + botón
