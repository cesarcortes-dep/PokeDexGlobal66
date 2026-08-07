// Sin `localStorage`: el enunciado pide el store de Vue y aclara que no hay que
// persistir, así que se pierden al recargar a propósito.
//
// Nombres en un Set y no objetos: `has()` es O(1) y no duplica la entidad, que
// ya vive en el store `pokemon`.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const names = ref(new Set<string>())

  const count = computed(() => names.value.size)

  function isFavorite(name: string): boolean {
    return names.value.has(name)
  }

  // Vue trackea las mutaciones de un `Set` reactivo: no hace falta reasignar,
  // al revés que el caché de detalle, que vive en un `shallowRef`.
  function toggle(name: string): void {
    if (!names.value.delete(name)) names.value.add(name)
  }

  return { names, count, isFavorite, toggle }
})
