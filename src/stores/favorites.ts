/**
 * Store de favoritos (F1, F7).
 *
 * Decisión (README: stack / supuesto S2): SIN localStorage. El enunciado pide el store
 * de Vue y aclara que no hay que persistir. Se pierden al recargar a propósito.
 *
 * Se guardan NOMBRES en un Set, no objetos Pokemon:
 *  - `has()` es O(1) — importa con ~1300 ítems (E7)
 *  - no duplica la entidad, que ya vive en el store `pokemon` (DRY, E4)
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const names = ref(new Set<string>())

  const count = computed(() => names.value.size)

  function isFavorite(name: string): boolean {
    return names.value.has(name)
  }

  /**
   * Vue 3 sí trackea las mutaciones de un `Set` reactivo, así que `add` y
   * `delete` alcanzan: no hace falta reasignar. Es lo contrario del caché de
   * detalle del store `pokemon`, que sí necesita reasignarse porque vive en un
   * `shallowRef`.
   */
  function toggle(name: string): void {
    if (!names.value.delete(name)) names.value.add(name)
  }

  return { names, count, isFavorite, toggle }
})
