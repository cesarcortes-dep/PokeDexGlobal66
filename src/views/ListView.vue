<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { spriteUrl } from '@/api/pokeApi'
import { usePokemonStore } from '@/stores/pokemon'
import { useFavoritesStore } from '@/stores/favorites'
import { useTypesStore } from '@/stores/types'
import { useMinimumDuration } from '@/composables/useMinimumDuration'
import { useSearch } from '@/composables/useSearch'
import { useVirtualList } from '@/composables/useVirtualList'
import AppNav from '@/components/ui/AppNav.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FavoriteStar from '@/components/ui/FavoriteStar.vue'
import PokeballLoader from '@/components/ui/PokeballLoader.vue'
import PokemonCard from '@/components/ui/PokemonCard.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

// Favoritos es una ruta propia y no un estado interno: la misma vista sirve
// para las dos porque lo único que cambia es la fuente de datos.
const props = withDefaults(defineProps<{ onlyFavorites?: boolean }>(), {
  onlyFavorites: false,
})

const NAV_ITEMS = [
  { to: '/', label: 'Pokédex', icon: 'home' as const },
  { to: '/favoritos', label: 'Favoritos', icon: 'favorites' as const },
]

// El CSS recibe estos valores como custom properties, no al revés:
// `useVirtualList` calcula offsets con ellos y dos fuentes se desincronizarían.
const CARD_HEIGHT = 140
const CARD_GAP = 16
const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP

// En JS y no solo en CSS: con 3 columnas, 1351 Pokémon son 451 filas.
const BREAKPOINTS: Array<{ min: number; columns: number }> = [
  { min: 1200, columns: 3 },
  { min: 800, columns: 2 },
  { min: 0, columns: 1 },
]

const viewportWidth = ref(typeof window === 'undefined' ? 0 : window.innerWidth)

function measureWidth(): void {
  viewportWidth.value = window.innerWidth
}

onMounted(() => window.addEventListener('resize', measureWidth))
onBeforeUnmount(() => window.removeEventListener('resize', measureWidth))

const columns = computed(
  () => BREAKPOINTS.find((bp) => viewportWidth.value >= bp.min)?.columns ?? 1,
)

const store = usePokemonStore()
const { list, isLoadingList, error } = storeToRefs(store)

// El listado responde en ~250 ms: sin un piso, el loader parpadea y se lee como
// glitch. `?loader=5000` lo estira para poder mirar la animación.
const LOADER_MIN_MS = 600
const LOADER_MAX_MS = 15_000

// De `location` y no de `useRoute()`: el router arranca en `START_LOCATION`, con
// la query vacía, justo cuando este número hace falta.
function readLoaderOverride(): number | null {
  if (typeof window === 'undefined') return null

  const raw = new URLSearchParams(window.location.search).get('loader')
  if (raw === null) return null

  const requested = Number(raw)
  if (!Number.isFinite(requested) || requested < 0) return null

  return Math.min(requested, LOADER_MAX_MS)
}

const loaderMinMs = readLoaderOverride() ?? LOADER_MIN_MS

// Sostiene lo que se muestra, no lo que se pide: la request no se demora.
const showLoader = useMinimumDuration(isLoadingList, loaderMinMs)

// En paralelo con el listado: son independientes, encadenarlas duplicaría el
// tiempo de arranque. Sin esto las tarjetas no tienen color ni chips.
const types = useTypesStore()
types.load()

// `results` es un computed sobre datos ya en memoria: filtrar no toca la red.
const { query, results, isEmpty } = useSearch(list)

const favorites = useFavoritesStore()

// El filtro va después de la búsqueda, para poder buscar dentro de favoritos.
const visible = computed(() =>
  props.onlyFavorites
    ? results.value.filter((pokemon) => favorites.isFavorite(pokemon.name))
    : results.value,
)

const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualList(visible, {
  itemHeight: ROW_HEIGHT,
  itemsPerRow: columns,
})

const hasNoFavorites = computed(() => props.onlyFavorites && favorites.count === 0)

// Sin esto, buscar con el scroll a la mitad deja mirando el final de una lista
// de tres resultados.
watch(visible, () => {
  if (containerRef.value) containerRef.value.scrollTop = 0
})

// En `setup` y no en `onMounted`: así el primer render ya sale con el loader
// puesto, sin un frame de lista vacía.
store.loadList()
</script>

<template>
  <main
    class="list-view"
    :style="{
      '--row-height': `${CARD_HEIGHT}px`,
      '--row-gap': `${CARD_GAP}px`,
      '--columns': columns,
    }"
  >
    <h1 class="list-view__title">Pokédex</h1>

    <header class="list-view__header">
      <SearchInput
        v-model="query"
        class="list-view__search"
        label="Buscar Pokémon por nombre"
        placeholder="Buscar"
      />

      <AppNav :items="NAV_ITEMS" />
    </header>

    <!-- Se renderiza siempre, también mientras carga: es lo que mide `useVirtualList`. -->
    <div ref="containerRef" class="list-view__viewport" :aria-busy="showLoader">
      <!-- Dentro del viewport: ocupa el mismo hueco que la lista, sin salto de layout. -->
      <PokeballLoader v-if="showLoader" class="list-view__loader" />

      <div v-else-if="error" class="list-view__status" role="alert">
        <p>{{ error }}</p>
        <button type="button" @click="store.loadList()">Reintentar</button>
      </div>

      <!-- Antes que "no hay resultados": si nunca marcaste nada, "no encontramos" miente. -->
      <EmptyState
        v-else-if="hasNoFavorites"
        role="status"
        title="No has marcado ningún Pokémon como favorito"
        description="Haz clic en el ícono de corazón de tus Pokémon favoritos y aparecerán aquí."
      />

      <EmptyState
        v-else-if="isEmpty || !visible.length"
        role="status"
        title="No encontramos ningún Pokémon con ese nombre"
        description="Revisa que esté bien escrito o prueba con otro nombre."
      />

      <!-- Alto de la lista completa: es lo que le da recorrido real a la scrollbar. -->
      <div v-else class="list-view__sizer" :style="{ height: `${totalHeight}px` }">
        <ul class="list-view__window" :style="{ transform: `translateY(${offsetY}px)` }">
          <!-- La estrella es hermana del link: un <button> dentro de un <a> es inválido. -->
          <li v-for="{ item, index } in visibleItems" :key="item.name" class="list-view__item">
            <RouterLink
              class="list-view__link"
              :to="{
                name: 'detail',
                params: { name: item.name },
                query: { desde: onlyFavorites ? 'favoritos' : undefined },
              }"
            >
              <PokemonCard
                :id="item.id"
                :name="item.name"
                :types="types.typesOf(item.id)"
                :image-url="spriteUrl(item.id)"
                :aria-posinset="index + 1"
                :aria-setsize="visible.length"
              />
            </RouterLink>

            <FavoriteStar
              class="list-view__star"
              :active="favorites.isFavorite(item.name)"
              :label="item.name"
              @toggle="favorites.toggle(item.name)"
            />
          </li>
        </ul>
      </div>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.list-view {
  max-width: var(--content-max-width);
  padding: var(--sp-4);
  margin: 0 auto;

  &__title {
    font-size: var(--fs-title);
  }

  &__search {
    margin-bottom: var(--sp-4);
  }

  &__viewport {
    height: calc(100vh - 260px); // lo que queda tras el título y la barra
    min-height: 320px;
    overflow-y: auto;
    // Sin `size`: el sizer de adentro es quien define el recorrido del scroll.
    contain: layout paint;
  }

  &__sizer {
    position: relative;
  }

  &__window {
    position: absolute;
    inset-inline: 0;
    top: 0;
    display: grid;
    grid-template-columns: repeat(var(--columns), 1fr);
    gap: var(--row-gap);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__nav {
    margin-bottom: var(--sp-4);
  }

  &__item {
    position: relative;
    // Sin `margin`: ahora la separación la da el `gap` de la grilla, que es
    // exactamente el mismo valor que suma el paso de `useVirtualList`.
  }

  &__link {
    display: block;
    color: inherit;
    text-decoration: none;

    &:focus-visible {
      outline: 2px solid var(--c-tab-active);
      outline-offset: -2px;
    }
  }

  /* Encima del link, no adentro: son hermanos en el DOM y se superponen acá. */
  &__star {
    position: absolute;
    top: var(--sp-2);
    right: var(--sp-2);
  }

  /* Centrado en el hueco que va a ocupar la lista, no pegado arriba. */
  &__loader {
    height: 100%;
    align-content: center;
  }

  &__status {
    padding: var(--sp-6);
    color: var(--c-text-muted);
    text-align: center;
  }
}
</style>
