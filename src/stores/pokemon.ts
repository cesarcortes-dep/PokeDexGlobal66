// Fuente única de verdad: la lista se pide una vez y vive acá; búsqueda y
// filtros son computed sobre ella, nunca requests nuevas.

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { PokeApiError, fetchPokemonByName, fetchPokemonList } from '@/api/pokeApi'
import type { Pokemon, PokemonListItem } from '@/api/types'

export const usePokemonStore = defineStore('pokemon', () => {
  const list = ref<PokemonListItem[]>([])

  // `shallowRef`: los Pokémon son inmutables una vez traídos, no hace falta que
  // Vue haga reactivo cada campo.
  const detailCache = shallowRef(new Map<string, Pokemon>())

  const isLoadingList = ref(false)
  const error = ref<string | null>(null)

  const isLoaded = computed(() => list.value.length > 0)

  // Una promesa y no un booleano: con un guard booleano, la segunda llamada
  // concurrente volvería sin datos y sin esperar. Acá espera a la primera.
  let inFlight: Promise<void> | null = null

  /** Idempotente: se puede llamar desde cualquier vista sin coordinar quién carga. */
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

  // Mismo motivo que `inFlight`, pero un Map: puede haber varios detalles en vuelo.
  const pendingDetails = new Map<string, Promise<Pokemon>>()

  /** Reabrir un Pokémon ya visto no toca la red. */
  async function getDetail(name: string): Promise<Pokemon> {
    const cached = detailCache.value.get(name)
    if (cached) return cached

    const pending = pendingDetails.get(name)
    if (pending) return pending

    const request = fetchPokemonByName(name)
      .then((pokemon) => {
        // `shallowRef` no trackea mutaciones del Map: hay que reasignarlo.
        detailCache.value = new Map(detailCache.value).set(name, pokemon)
        return pokemon
      })
      .finally(() => pendingDetails.delete(name))

    pendingDetails.set(name, request)
    return request
  }

  return { list, detailCache, isLoadingList, error, isLoaded, loadList, getDetail }
})
