<script setup lang="ts">
/**
 * Pantalla principal: lista de Pokémon + búsqueda + toggle Todos/Favoritos.
 *
 * Una View orquesta: pide datos al store y compone componentes.
 * No maqueta detalles ni hace fetch — eso vive en components/ y en api/.
 *
 * TODO:
 *  - PokeballLoader con animación CSS en lugar del texto de carga (F5)
 *  - maqueta real del Figma
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { spriteUrl } from '@/api/pokeApi'
import { usePokemonStore } from '@/stores/pokemon'
import { useFavoritesStore } from '@/stores/favorites'
import { useTypesStore } from '@/stores/types'
import { useSearch } from '@/composables/useSearch'
import { useVirtualList } from '@/composables/useVirtualList'
import AppNav from '@/components/ui/AppNav.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FavoriteStar from '@/components/ui/FavoriteStar.vue'
import PokemonCard from '@/components/ui/PokemonCard.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

/**
 * `onlyFavorites` llega del router, no de un botón interno: favoritos es una
 * ruta propia (`/favoritos`) y no un estado de esta pantalla. La misma vista
 * sirve para las dos porque lo único que cambia es la fuente de datos.
 */
const props = withDefaults(defineProps<{ onlyFavorites?: boolean }>(), {
  onlyFavorites: false,
})

const NAV_ITEMS = [
  { to: '/', label: 'Pokédex', icon: 'home' as const },
  { to: '/favoritos', label: 'Favoritos', icon: 'favorites' as const },
]

/**
 * Geometría de la lista. El paso del virtual scroll es alto + separación.
 *
 * Los 102 px del Figma son la medida **mobile de referencia**; el entregable es
 * desktop/web (ADR-0005), así que la tarjeta crece para que los nombres largos
 * entren sin truncar y el sprite respire.
 *
 * Lo define TypeScript y el CSS lo recibe como custom property, no al revés:
 * `useVirtualList` calcula offsets con este número, y si el CSS tuviera el suyo
 * propio los dos se desincronizarían en silencio y la lista quedaría desalineada
 * al scrollear.
 */
const CARD_HEIGHT = 140
const CARD_GAP = 16
const ROW_HEIGHT = CARD_HEIGHT + CARD_GAP

/**
 * Columnas por ancho de ventana (ADR-0005).
 *
 * Se calcula en JS y no solo en CSS porque `useVirtualList` necesita el número:
 * con 3 columnas, 1351 Pokémon son 451 filas, no 1351. Si el CSS supiera de
 * columnas y el cálculo no, los offsets quedarían mal.
 */
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

/**
 * El índice de tipos: sin él las tarjetas no tienen color ni chips (ADR-0007).
 *
 * Se pide en paralelo con el listado y no después: son dos requests
 * independientes, y encadenarlas duplicaría el tiempo de arranque por nada.
 */
const types = useTypesStore()
types.load()

/**
 * La búsqueda se apoya en la lista del store, y el virtual scroll en el
 * resultado de la búsqueda. Encadenados así, filtrar no dispara ninguna request:
 * `results` es un `computed` sobre datos que ya están en memoria (F8, ADR-0004).
 */
const { query, results, isEmpty } = useSearch(list)

const favorites = useFavoritesStore()

/**
 * Último eslabón de la cadena: lista → búsqueda → favoritos → virtual scroll.
 *
 * El filtro va **después** de la búsqueda para que buscar dentro de favoritos
 * funcione. Es un `computed` sobre un `Set`, así que cuesta O(1) por ítem y no
 * duplica la entidad Pokémon en ningún lado (F7).
 */
const visible = computed(() =>
  props.onlyFavorites
    ? results.value.filter((pokemon) => favorites.isFavorite(pokemon.name))
    : results.value,
)

const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualList(visible, {
  itemHeight: ROW_HEIGHT,
  itemsPerRow: columns,
})

/** true solo si el usuario está en favoritos y no marcó ninguno. */
const hasNoFavorites = computed(() => props.onlyFavorites && favorites.count === 0)

/**
 * Volver arriba al cambiar el resultado. Sin esto, buscar con el scroll a la
 * mitad deja al usuario mirando el final de una lista de tres — técnicamente
 * correcto y desconcertante.
 */
watch(visible, () => {
  if (containerRef.value) containerRef.value.scrollTop = 0
})

/**
 * Se dispara en `setup` y no en `onMounted`: la request no necesita que el DOM
 * exista, y arrancarla acá hace que el primer render ya salga con el estado de
 * carga puesto. Con `onMounted` habría un frame con la lista vacía antes del
 * loader — justo lo que F5 pide evitar.
 */
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

    <!--
      Buscador y navegación comparten una fila: en escritorio hay ancho de sobra
      y separarlos en dos bandas desperdiciaba altura de la lista.
    -->
    <header class="list-view__header">
      <SearchInput
        v-model="query"
        class="list-view__search"
        label="Buscar Pokémon por nombre"
        placeholder="Buscar"
      />

      <AppNav :items="NAV_ITEMS" />
    </header>

    <!--
      El contenedor se renderiza siempre, también mientras carga: es el elemento
      que mide `useVirtualList`. Si viviera detrás de un v-else, no existiría al
      montar y habría que esperar un tick para medirlo.
    -->
    <div ref="containerRef" class="list-view__viewport" :aria-busy="isLoadingList">
      <p v-if="isLoadingList" class="list-view__status" role="status">Cargando Pokémon…</p>

      <div v-else-if="error" class="list-view__status" role="alert">
        <p>{{ error }}</p>
        <button type="button" @click="store.loadList()">Reintentar</button>
      </div>

      <!-- "No tenés favoritos" antes que "no hay resultados": si la lista está
           vacía porque nunca marcaste nada, decir "no encontramos" sería mentir. -->
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

      <!--
        El sizer tiene el alto de la lista COMPLETA aunque solo se pinte la
        ventana visible: es lo que le da a la scrollbar el tamaño y el recorrido
        reales. Sin él, 1350 Pokémon se sentirían como 20.
      -->
      <div v-else class="list-view__sizer" :style="{ height: `${totalHeight}px` }">
        <ul class="list-view__window" :style="{ transform: `translateY(${offsetY}px)` }">
          <!--
            La estrella es HERMANA del link, no está adentro. Un <button> dentro
            de un <a> es HTML inválido y rompe la navegación por teclado: el foco
            no sabe a cuál de los dos ir.
          -->
          <li v-for="{ item, index } in visibleItems" :key="item.name" class="list-view__item">
            <!--
              El link envuelve la fila en vez de vivir adentro de PokemonRow: así
              la fila sigue sin saber que existe el router y se puede reusar en
              un contexto sin navegación.
            -->
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
    // Lo que queda de alto después del título, el buscador y las pestañas.
    height: calc(100vh - 260px);
    min-height: 320px;
    // Sin fondo ni borde: en el Figma las tarjetas flotan sobre el fondo de la
    // página, no viven dentro de un panel.
    overflow-y: auto;

    // Aísla el layout y el pintado del resto de la página. `size` queda fuera a
    // propósito: el sizer de adentro es quien define el recorrido del scroll.
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
    // El número lo pone el script, que es quien también se lo pasa a
    // `useVirtualList`. Una sola fuente para el CSS y para el cálculo.
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

  &__status {
    padding: var(--sp-6);
    color: var(--c-text-muted);
    text-align: center;
  }
}
</style>
