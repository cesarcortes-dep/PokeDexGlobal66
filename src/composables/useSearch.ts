// En cliente porque la PokéAPI no tiene búsqueda por texto parcial y el universo
// ya está en el store.

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { PokemonListItem } from '@/api/types'

// No ahorra requests, porque la búsqueda es local: ahorra renders.
const DEBOUNCE_MS = 200

/** `NFD` separa la letra de su acento; el rango borra el acento suelto. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export interface UseSearchReturn {
  /** Texto crudo del input (v-model). */
  query: Ref<string>
  /** Resultado ya filtrado. */
  results: Ref<PokemonListItem[]>
  /** Hay query y cero resultados. */
  isEmpty: Ref<boolean>
}

export function useSearch(source: Ref<PokemonListItem[]>): UseSearchReturn {
  const query = ref('')
  const debouncedQuery = ref('')

  let timer: ReturnType<typeof setTimeout> | undefined

  watch(query, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debouncedQuery.value = value
    }, DEBOUNCE_MS)
  })

  onBeforeUnmount(() => clearTimeout(timer))

  // Computed sobre `source`: se recalcula al cambiar la lista, no al teclear.
  const index = computed(() =>
    source.value.map((item) => ({ item, haystack: normalize(item.name) })),
  )

  const results = computed(() => {
    const needle = normalize(debouncedQuery.value)
    if (!needle) return source.value

    return index.value.filter((entry) => entry.haystack.includes(needle)).map((entry) => entry.item)
  })

  // Distingue "no busqué" de "busqué y no hay": solo el segundo es vacío.
  const isEmpty = computed(
    () => normalize(debouncedQuery.value).length > 0 && !results.value.length,
  )

  return { query, results, isEmpty }
}
