/**
 * Store del catálogo: la lista completa y el caché de detalles.
 *
 * Fuente única de verdad (ADR-0004). La lista se pide UNA vez y vive acá;
 * búsqueda y filtros son `computed` sobre ella, nunca requests nuevas.
 */

import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
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
   * TODO: pedir el listado una sola vez (idempotente: si ya está cargado, salir).
   * Manejar isLoadingList y error. Ver F3.
   */
  async function loadList(): Promise<void> {
    throw new Error('TODO: implementar loadList()')
  }

  /**
   * TODO: devolver del caché si existe; si no, pedir el detalle y cachearlo.
   * Reabrir un Pokémon ya visto NO debe disparar request (F4).
   */
  async function getDetail(name: string): Promise<Pokemon> {
    throw new Error(`TODO: implementar getDetail("${name}")`)
  }

  return { list, detailCache, isLoadingList, error, isLoaded, loadList, getDetail }
})
