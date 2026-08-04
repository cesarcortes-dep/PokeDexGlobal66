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

import type { Ref } from 'vue'
import type { PokemonListItem } from '@/api/types'

export interface UseSearchReturn {
  /** Texto crudo del input (v-model). */
  query: Ref<string>
  /** Resultado ya filtrado. */
  results: Ref<PokemonListItem[]>
  /** true cuando hay query y cero resultados → estado vacío del Figma. */
  isEmpty: Ref<boolean>
}

/**
 * TODO: implementar.
 * - `query` con debounce hacia un `debouncedQuery` interno
 * - índice normalizado (lowercase, sin acentos) precomputado sobre `source`
 * - `results` = computed que filtra el índice
 */
export function useSearch(source: Ref<PokemonListItem[]>): UseSearchReturn {
  throw new Error(`TODO: implementar useSearch() sobre ${source.value.length} ítems`)
}
