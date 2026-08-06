<script setup lang="ts">
/**
 * Pantalla principal: lista de Pokémon + búsqueda + toggle Todos/Favoritos.
 *
 * Una View orquesta: pide datos al store y compone componentes.
 * No maqueta detalles ni hace fetch — eso vive en components/ y en api/.
 *
 * TODO:
 *  - toggle Todos / Favoritos (F1), con su estado vacío
 *  - PokeballLoader con animación CSS en lugar del texto de carga (F5)
 *  - navegación al detalle al click en una fila (F4)
 */

import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePokemonStore } from '@/stores/pokemon'
import { useSearch } from '@/composables/useSearch'
import { useVirtualList } from '@/composables/useVirtualList'
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

const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualList(results, {
  itemHeight: ROW_HEIGHT,
})

/**
 * Volver arriba al cambiar el resultado. Sin esto, buscar con el scroll a la
 * mitad deja al usuario mirando el final de una lista de tres — técnicamente
 * correcto y desconcertante.
 */
watch(results, () => {
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

      <p v-else-if="isEmpty" class="list-view__status" role="status">
        No encontramos ningún Pokémon con ese nombre.
      </p>

      <!--
        El sizer tiene el alto de la lista COMPLETA aunque solo se pinte la
        ventana visible: es lo que le da a la scrollbar el tamaño y el recorrido
        reales. Sin él, 1350 Pokémon se sentirían como 20.
      -->
      <div v-else class="list-view__sizer" :style="{ height: `${totalHeight}px` }">
        <ul class="list-view__window" :style="{ transform: `translateY(${offsetY}px)` }">
          <li v-for="{ item, index } in visibleItems" :key="item.name">
            <PokemonRow
              :name="item.name"
              :aria-posinset="index + 1"
              :aria-setsize="results.length"
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
    background-color: var(--c-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);

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

  &__status {
    padding: var(--sp-6);
    color: var(--c-text-muted);
    text-align: center;
  }
}
</style>
