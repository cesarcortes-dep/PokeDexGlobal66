/**
 * Tests del store del catálogo (E5).
 *
 * Lo que se prueba acá no es "el store guarda cosas": es F3, el requisito de
 * que el listado se pida UNA sola vez en toda la sesión. El cliente de API se
 * mockea entero — el store no debe saber nada de la red.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePokemonStore } from '../pokemon'
import { PokeApiError } from '@/api/pokeApi'

const { fetchPokemonListMock } = vi.hoisted(() => ({ fetchPokemonListMock: vi.fn() }))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchPokemonList: fetchPokemonListMock,
}))

const ITEMS = [
  { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
  { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon/2/' },
]

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemonListMock.mockReset()
  fetchPokemonListMock.mockResolvedValue(ITEMS)
})

describe('loadList', () => {
  it('guarda el listado y marca isLoaded', async () => {
    const store = usePokemonStore()

    await store.loadList()

    expect(store.list).toEqual(ITEMS)
    expect(store.isLoaded).toBe(true)
    expect(store.error).toBeNull()
  })

  it('no vuelve a pedir el listado si ya está cargado (F3)', async () => {
    const store = usePokemonStore()

    await store.loadList()
    await store.loadList()

    expect(fetchPokemonListMock).toHaveBeenCalledTimes(1)
  })

  it('dos llamadas concurrentes comparten una sola request (F3)', async () => {
    const store = usePokemonStore()

    await Promise.all([store.loadList(), store.loadList()])

    expect(fetchPokemonListMock).toHaveBeenCalledTimes(1)
    expect(store.list).toEqual(ITEMS)
  })

  it('expone isLoadingList mientras la request está en vuelo', async () => {
    const store = usePokemonStore()

    const pending = store.loadList()
    expect(store.isLoadingList).toBe(true)

    await pending
    expect(store.isLoadingList).toBe(false)
  })

  it('guarda el mensaje del error de API sin romper la app', async () => {
    fetchPokemonListMock.mockRejectedValue(new PokeApiError('La PokéAPI respondió 500', 500))
    const store = usePokemonStore()

    await store.loadList()

    expect(store.error).toBe('La PokéAPI respondió 500')
    expect(store.list).toEqual([])
    expect(store.isLoadingList).toBe(false)
  })

  it('deja reintentar después de un error', async () => {
    fetchPokemonListMock.mockRejectedValueOnce(new PokeApiError('sin red'))
    const store = usePokemonStore()

    await store.loadList()
    await store.loadList()

    expect(fetchPokemonListMock).toHaveBeenCalledTimes(2)
    expect(store.list).toEqual(ITEMS)
    expect(store.error).toBeNull()
  })
})
