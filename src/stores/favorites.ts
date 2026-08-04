/**
 * Store de favoritos (F1, F7).
 *
 * Decisión (ADR-0003 / supuesto S2): SIN localStorage. El enunciado pide el store
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

  /** TODO: devolver true si el nombre está en el Set. */
  function isFavorite(name: string): boolean {
    throw new Error(`TODO: implementar isFavorite("${name}")`)
  }

  /**
   * TODO: agregar o quitar.
   * OJO con la reactividad: Vue 3 sí trackea Set, pero si reasignás
   * (`names.value = new Set(...)`) asegurate de que sea consistente en toda la app.
   */
  function toggle(name: string): void {
    throw new Error(`TODO: implementar toggle("${name}")`)
  }

  return { names, count, isFavorite, toggle }
})
