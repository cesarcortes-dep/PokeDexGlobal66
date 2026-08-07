// Separado del store `pokemon` porque responde otra pregunta: aquel sabe qué
// Pokémon hay, este de qué tipo es cada uno. Se cargan en paralelo.

import { defineStore } from 'pinia'
import { computed, shallowRef, ref } from 'vue'
import { PokeApiError, fetchTypeIndex } from '@/api/pokeApi'

const NO_TYPES: string[] = []

export const useTypesStore = defineStore('types', () => {
  // `shallowRef`: los Map se reemplazan enteros, nunca se mutan campo a campo.
  const byPokemon = shallowRef(new Map<number, string[]>())
  const weaknesses = shallowRef(new Map<string, string[]>())

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isLoaded = computed(() => byPokemon.value.size > 0)

  // Misma promesa compartida que en `loadList`: dos llamadas, un solo arranque.
  let inFlight: Promise<void> | null = null

  async function load(): Promise<void> {
    if (isLoaded.value) return
    if (inFlight) return inFlight

    isLoading.value = true
    error.value = null

    inFlight = (async () => {
      try {
        const index = await fetchTypeIndex()
        byPokemon.value = index.byPokemon
        weaknesses.value = index.weaknesses
      } catch (cause) {
        error.value =
          cause instanceof PokeApiError ? cause.message : 'No se pudieron cargar los tipos'
      } finally {
        isLoading.value = false
        inFlight = null
      }
    })()

    return inFlight
  }

  /**
   * Siempre devuelve un array, y siempre *el mismo* array vacío: uno nuevo por
   * llamada rompería la memoización de los computed que lo usen.
   */
  function typesOf(id: number): string[] {
    return byPokemon.value.get(id) ?? NO_TYPES
  }

  /** El del slot 1: es el que gobierna el color de la tarjeta. */
  function primaryTypeOf(id: number): string | undefined {
    return typesOf(id)[0]
  }

  /**
   * Unión de las debilidades de todos sus tipos. Es una aproximación: el cálculo
   * real multiplica multiplicadores, así que un tipo puede cancelar la debilidad
   * del otro, y para eso harían falta `half_damage_from` y `no_damage_from`.
   */
  function weaknessesOf(id: number): string[] {
    const own = new Set(typesOf(id))
    const result = new Set<string>()

    for (const type of own) {
      for (const weak of weaknesses.value.get(type) ?? []) {
        if (!own.has(weak)) result.add(weak)
      }
    }

    return [...result]
  }

  return {
    byPokemon,
    weaknesses,
    isLoading,
    error,
    isLoaded,
    load,
    typesOf,
    primaryTypeOf,
    weaknessesOf,
  }
})
