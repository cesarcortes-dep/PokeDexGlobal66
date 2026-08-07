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

import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePokemonStore } from '@/stores/pokemon'
import { useFavoritesStore } from '@/stores/favorites'
import { useSearch } from '@/composables/useSearch'
import { useVirtualList } from '@/composables/useVirtualList'
import FavoriteStar from '@/components/ui/FavoriteStar.vue'
import PokemonRow from '@/components/ui/PokemonRow.vue'
import SearchInput from '@/components/ui/SearchInput.vue'

/**
 * Fuente única del alto de fila. Lo define TypeScript y el CSS lo recibe como
 * custom property, no al revés: `useVirtualList` calcula offsets con este número
 * y si el CSS tuviera el suyo propio, los dos se desincronizarían en silencio y
 * la lista quedaría desalineada al scrollear.
 *
 * TODO: ajustar al valor real del Figma.
 */
const ROW_HEIGHT = 60

const store = usePokemonStore()
const { list, isLoadingList, error } = storeToRefs(store)

/**
 * La búsqueda se apoya en la lista del store, y el virtual scroll en el
 * resultado de la búsqueda. Encadenados así, filtrar no dispara ninguna request:
 * `results` es un `computed` sobre datos que ya están en memoria (F8, ADR-0004).
 */
const { query, results, isEmpty } = useSearch(list)

const favorites = useFavoritesStore()
const showOnlyFavorites = ref(false)

/**
 * Último eslabón de la cadena: lista → búsqueda → favoritos → virtual scroll.
 *
 * El filtro va **después** de la búsqueda para que buscar dentro de favoritos
 * funcione. Es un `computed` sobre un `Set`, así que cuesta O(1) por ítem y no
 * duplica la entidad Pokémon en ningún lado (F7).
 */
const visible = computed(() =>
  showOnlyFavorites.value
    ? results.value.filter((pokemon) => favorites.isFavorite(pokemon.name))
    : results.value,
)

const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualList(visible, {
  itemHeight: ROW_HEIGHT,
})

/** true solo si el usuario pidió favoritos y no tiene ninguno. */
const hasNoFavorites = computed(() => showOnlyFavorites.value && favorites.count === 0)

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
  <main class="list-view" :style="{ '--row-height': `${ROW_HEIGHT}px` }">
    <h1 class="list-view__title">Pokédex</h1>

    <SearchInput
      v-model="query"
      class="list-view__search"
      label="Buscar Pokémon por nombre"
      placeholder="Buscar"
    />

    <!--
      Dos botones con `aria-pressed` y no un checkbox: son dos vistas excluyentes
      del mismo listado, y así el estado activo se anuncia sin necesitar texto
      extra que lo explique.
    -->
    <div class="list-view__tabs">
      <button
        type="button"
        class="list-view__tab"
        :class="{ 'list-view__tab--active': !showOnlyFavorites }"
        :aria-pressed="!showOnlyFavorites"
        @click="showOnlyFavorites = false"
      >
        Todos
      </button>
      <button
        type="button"
        class="list-view__tab"
        :class="{ 'list-view__tab--active': showOnlyFavorites }"
        :aria-pressed="showOnlyFavorites"
        @click="showOnlyFavorites = true"
      >
        Favoritos
      </button>
    </div>

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
      <p v-else-if="hasNoFavorites" class="list-view__status" role="status">
        Todavía no marcaste ningún Pokémon como favorito.
      </p>

      <p v-else-if="isEmpty || !visible.length" class="list-view__status" role="status">
        No encontramos ningún Pokémon con ese nombre.
      </p>

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
              :to="{ name: 'detail', params: { name: item.name } }"
            >
              <PokemonRow
                :name="item.name"
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
  margin: 0 auto;
  padding: var(--sp-4);

  // El layout desktop se decide en ADR-0005, con el Figma a la vista.
  @include desktop {
    // TODO
  }

  &__title {
    font-size: var(--fs-title);
  }

  &__search {
    margin-bottom: var(--sp-4);
  }

  &__viewport {
    height: 70vh;
    overflow-y: auto;
    background-color: var(--c-bg);
    border-radius: var(--radius-card);

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
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__tabs {
    display: flex;
    gap: var(--sp-2);
    margin-bottom: var(--sp-4);
  }

  &__tab {
    padding: var(--sp-2) var(--sp-6);
    color: var(--c-text-muted);
    background-color: var(--c-bg);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-pill);

    &--active {
      color: var(--c-bg);
      background-color: var(--c-tab-active);
      border-color: var(--c-tab-active);
    }

    &:focus-visible {
      outline: 2px solid var(--c-tab-active);
      outline-offset: 2px;
    }
  }

  &__item {
    position: relative;
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
    top: 50%;
    right: var(--sp-4);
    transform: translateY(-50%);
  }

  &__status {
    padding: var(--sp-6);
    color: var(--c-text-muted);
    text-align: center;
  }
}
</style>
