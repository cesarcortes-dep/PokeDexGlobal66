/**
 * Búsqueda por nombre en cliente (F8).
 *
 * Por qué en cliente: PokéAPI no tiene búsqueda por texto parcial y el enunciado
 * acota a dos endpoints. Todo el universo ya está en el store (ADR-0004).
 *
 * Claves de rendimiento (E7):
 *  - debounce del input (~200 ms), no filtrar por tecla
 *  - normalizar una sola vez en un `computed`, no dentro del filter
 */

import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { PokemonListItem } from '@/api/types'

/**
 * Ventana de quietud antes de filtrar. No ahorra requests —la búsqueda es local—
 * sino renders: sin esto, escribir "charizard" recorre 1351 nombres nueve veces y
 * repinta la lista otras nueve, de las cuales ocho el usuario no llega a ver.
 */
const DEBOUNCE_MS = 200

/**
 * Baja a minúsculas y saca los diacríticos. `NFD` separa la letra de su acento y
 * el rango ̀-ͯ borra el acento suelto, así "Pokémon" y "pokemon" son la
 * misma búsqueda.
 */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export interface UseSearchReturn {
  /** Texto crudo del input (v-model). */
  query: Ref<string>
  /** Resultado ya filtrado. */
  results: Ref<PokemonListItem[]>
  /** true cuando hay query y cero resultados → estado vacío del Figma. */
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

  /**
   * Índice normalizado. Es un `computed` sobre `source`, así que se recalcula
   * cuando cambia la lista —una vez por sesión— y **no** cuando cambia la query.
   *
   * Es la diferencia entre normalizar 1351 nombres una vez o normalizarlos de
   * nuevo en cada tecla dentro del `filter`.
   */
  const index = computed(() =>
    source.value.map((item) => ({ item, haystack: normalize(item.name) })),
  )

  const results = computed(() => {
    const needle = normalize(debouncedQuery.value)
    if (!needle) return source.value

    return index.value.filter((entry) => entry.haystack.includes(needle)).map((entry) => entry.item)
  })

  /** Distingue "no busqué nada todavía" de "busqué y no hay". Solo el segundo es vacío. */
  const isEmpty = computed(() => normalize(debouncedQuery.value).length > 0 && !results.value.length)

  return { query, results, isEmpty }
}
