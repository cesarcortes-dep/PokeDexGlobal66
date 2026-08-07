/**
 * Store del índice de tipos (README: el conflicto grande).
 *
 * Existe separado del store `pokemon` porque responde otra pregunta: `pokemon`
 * sabe *qué Pokémon hay*, este sabe *de qué tipo es cada uno*. Se cargan en
 * paralelo y ninguno depende del otro.
 *
 * Es la pieza que el Figma vuelve obligatoria: la lista pinta cada tarjeta con el
 * color de su tipo primario, y `GET /pokemon` no devuelve tipos.
 */

import { defineStore } from 'pinia'
import { computed, shallowRef, ref } from 'vue'
import { PokeApiError, fetchTypeIndex } from '@/api/pokeApi'

/** Lo que se muestra cuando el índice todavía no cargó o el tipo no está. */
const NO_TYPES: string[] = []

export const useTypesStore = defineStore('types', () => {
  /**
   * `shallowRef` por el mismo motivo que el caché de detalle: los `Map` se
   * reemplazan enteros, nunca se mutan campo a campo, y hacer reactivo cada
   * entrada de 1351 sería trabajo puro para nada.
   */
  const byPokemon = shallowRef(new Map<number, string[]>())
  const weaknesses = shallowRef(new Map<string, string[]>())

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isLoaded = computed(() => byPokemon.value.size > 0)

  /** Misma promesa compartida que en `loadList`: dos llamadas, un solo arranque. */
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
   * Tipos de un Pokémon, ordenados por slot.
   *
   * Devuelve siempre un array —vacío si no hay dato— para que la UI no tenga que
   * chequear `undefined` en cada fila. Y siempre **el mismo** array vacío: uno
   * nuevo por llamada rompería la memoización de los `computed` que lo usen.
   */
  function typesOf(id: number): string[] {
    return byPokemon.value.get(id) ?? NO_TYPES
  }

  /** Tipo primario: el del slot 1. Es el que gobierna el color de la tarjeta. */
  function primaryTypeOf(id: number): string | undefined {
    return typesOf(id)[0]
  }

  /**
   * Debilidades de un Pokémon: la unión de las de todos sus tipos.
   *
   * Es una aproximación consciente. Las debilidades reales de un Pokémon de dos
   * tipos se calculan multiplicando los dos multiplicadores, así que un tipo que
   * uno resiste puede cancelar la debilidad del otro. Calcularlo bien exige
   * también `half_damage_from` y `no_damage_from`, y el Figma no muestra
   * multiplicadores. Queda anotado como simplificación, no como error.
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
