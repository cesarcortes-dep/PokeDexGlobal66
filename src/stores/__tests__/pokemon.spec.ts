// Lo que se prueba no es que el store guarde cosas, sino que el listado se pida
// una sola vez en toda la sesión.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePokemonStore } from '../pokemon'
import { PokeApiError } from '@/api/pokeApi'
import { PIKACHU, makeListItems } from '@/__tests__/fixtures'

const { fetchPokemonListMock, fetchPokemonByNameMock } = vi.hoisted(() => ({
  fetchPokemonListMock: vi.fn(),
  fetchPokemonByNameMock: vi.fn(),
}))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchPokemonList: fetchPokemonListMock,
  fetchPokemonByName: fetchPokemonByNameMock,
}))

const ITEMS = makeListItems(2)

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemonListMock.mockReset()
  fetchPokemonListMock.mockResolvedValue(ITEMS)
  fetchPokemonByNameMock.mockReset()
  fetchPokemonByNameMock.mockResolvedValue(PIKACHU)
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

describe('getDetail', () => {
  it('devuelve el modelo de dominio', async () => {
    const store = usePokemonStore()

    await expect(store.getDetail('pikachu')).resolves.toEqual(PIKACHU)
  })

  it('no vuelve a pedir un Pokémon ya visto (F4)', async () => {
    const store = usePokemonStore()

    await store.getDetail('pikachu')
    await store.getDetail('pikachu')

    expect(fetchPokemonByNameMock).toHaveBeenCalledTimes(1)
  })

  it('abrir el mismo dos veces rápido dispara una sola request', async () => {
    const store = usePokemonStore()

    await Promise.all([store.getDetail('pikachu'), store.getDetail('pikachu')])

    expect(fetchPokemonByNameMock).toHaveBeenCalledTimes(1)
  })

  it('cachea por nombre, no globalmente', async () => {
    const store = usePokemonStore()

    await store.getDetail('pikachu')
    fetchPokemonByNameMock.mockResolvedValueOnce({ ...PIKACHU, name: 'raichu' })
    await store.getDetail('raichu')

    expect(fetchPokemonByNameMock).toHaveBeenCalledTimes(2)
    expect(store.detailCache.size).toBe(2)
  })

  it('propaga el error y no lo cachea', async () => {
    fetchPokemonByNameMock.mockRejectedValueOnce(new PokeApiError('no existe', 404))
    const store = usePokemonStore()

    await expect(store.getDetail('missingno')).rejects.toThrow(PokeApiError)
    expect(store.detailCache.size).toBe(0)

    // Un fallo no debe dejar el nombre bloqueado: se puede reintentar.
    await expect(store.getDetail('missingno')).resolves.toEqual(PIKACHU)
    expect(fetchPokemonByNameMock).toHaveBeenCalledTimes(2)
  })
})
