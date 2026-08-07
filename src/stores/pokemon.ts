/**
 * Store del catálogo: la lista completa y el caché de detalles.
 *
 * Fuente única de verdad (README: escala). La lista se pide UNA vez y vive acá;
 * búsqueda y filtros son `computed` sobre ella, nunca requests nuevas.
 */

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { PokeApiError, fetchPokemonByName, fetchPokemonList } from '@/api/pokeApi'
import type { Pokemon, PokemonListItem } from '@/api/types'

export const usePokemonStore = defineStore('pokemon', () => {
  /** Universo completo de nombres. Se llena una sola vez. */
  const list = ref<PokemonListItem[]>([])

  /**
   * Caché de detalles por nombre. `shallowRef` a propósito: los Pokémon son
   * inmutables una vez traídos, no hace falta que Vue haga reactivo cada campo.
   */
  const detailCache = shallowRef(new Map<string, Pokemon>())

  const isLoadingList = ref(false)
  const error = ref<string | null>(null)

  const isLoaded = computed(() => list.value.length > 0)

  /**
   * Request en curso. No es estado reactivo ni sale del store: existe solo para
   * que dos llamadas concurrentes compartan la misma promesa.
   *
   * Un guard con un booleano no alcanza para F3: si la lista y el detalle montan
   * a la vez, el segundo `loadList()` vería `isLoadingList === true` y volvería
   * sin datos y sin esperar. Acá el segundo espera la request del primero.
   */
  let inFlight: Promise<void> | null = null

  /**
   * Trae el universo completo UNA sola vez por sesión (F3).
   *
   * Idempotente por diseño: se puede llamar desde cualquier vista sin coordinar
   * quién carga. Si ya está en memoria, no toca la red.
   */
  async function loadList(): Promise<void> {
    if (isLoaded.value) return
    if (inFlight) return inFlight

    isLoadingList.value = true
    error.value = null

    inFlight = (async () => {
      try {
        list.value = await fetchPokemonList()
      } catch (cause) {
        error.value =
          cause instanceof PokeApiError ? cause.message : 'No se pudo cargar el listado de Pokémon'
      } finally {
        isLoadingList.value = false
        inFlight = null
      }
    })()

    return inFlight
  }

  /**
   * Requests de detalle en curso, una por nombre. Mismo motivo que `inFlight` en
   * `loadList`: abrir dos veces rápido el mismo Pokémon dispararía dos requests.
   * Acá hace falta un Map porque puede haber varios detalles distintos en vuelo.
   */
  const pendingDetails = new Map<string, Promise<Pokemon>>()

  /**
   * Detalle bajo demanda, cacheado por nombre (F4).
   *
   * Reabrir un Pokémon ya visto no toca la red. Es la mitad del "solo dos
   * llamados": el listado se pide una vez, y el detalle una vez por Pokémon.
   */
  async function getDetail(name: string): Promise<Pokemon> {
    const cached = detailCache.value.get(name)
    if (cached) return cached

    const pending = pendingDetails.get(name)
    if (pending) return pending

    const request = fetchPokemonByName(name)
      .then((pokemon) => {
        // `shallowRef` no trackea mutaciones del Map: hay que reasignarlo para
        // que quien lo observe se entere. Es el precio de no hacer reactivo cada
        // campo de cada Pokémon, que es lo que se quiere evitar acá.
        detailCache.value = new Map(detailCache.value).set(name, pokemon)
        return pokemon
      })
      .finally(() => pendingDetails.delete(name))

    pendingDetails.set(name, request)
    return request
  }

  return { list, detailCache, isLoadingList, error, isLoaded, loadList, getDetail }
})
