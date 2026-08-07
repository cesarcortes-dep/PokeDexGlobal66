# `components/features/` — componentes conectados

Acá sí se puede usar el store y los composables. Son el pegamento entre los datos
y los componentes tontos de [`../ui/`](../ui/README.md).

Siguen sin llamar a `fetch` directo: eso es exclusivo de `@/api`.

Candidatos según el Figma:

- `PokemonList.vue` — la lista virtualizada (`useVirtualList`), conectada al store
- `PokemonListItem.vue` — una fila: nombre + estrella. Alto FIJO, lo exige el
  virtual scroll (README: escala)
- `PokemonDetailCard.vue` — atributos + favorito + compartir
- `FavoritesToggle.vue` — el switch Todos / Favoritos
