// Lo que importa no es que guarde un Map, sino que el tipo primario sea el del
// slot 1 aunque los 18 requests lleguen en cualquier orden: de ahí sale el color
// de cada tarjeta.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTypesStore } from '../types'
import { PokeApiError } from '@/api/pokeApi'

const { fetchTypeIndexMock } = vi.hoisted(() => ({ fetchTypeIndexMock: vi.fn() }))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchTypeIndex: fetchTypeIndexMock,
}))

function makeIndex() {
  return {
    byPokemon: new Map([
      [1, ['grass', 'poison']],
      [4, ['fire']],
    ]),
    weaknesses: new Map([
      ['grass', ['fire', 'ice', 'poison', 'flying', 'bug']],
      ['poison', ['ground', 'psychic']],
      ['fire', ['water', 'ground', 'rock']],
    ]),
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchTypeIndexMock.mockReset()
  fetchTypeIndexMock.mockResolvedValue(makeIndex())
})

describe('load', () => {
  it('guarda el índice y marca isLoaded', async () => {
    const types = useTypesStore()

    await types.load()

    expect(types.isLoaded).toBe(true)
    expect(types.error).toBeNull()
  })

  it('no vuelve a pedirlo si ya está cargado', async () => {
    const types = useTypesStore()

    await types.load()
    await types.load()

    expect(fetchTypeIndexMock).toHaveBeenCalledTimes(1)
  })

  it('dos llamadas concurrentes comparten una sola carga', async () => {
    const types = useTypesStore()

    await Promise.all([types.load(), types.load()])

    expect(fetchTypeIndexMock).toHaveBeenCalledTimes(1)
  })

  it('guarda el error sin romper la app', async () => {
    fetchTypeIndexMock.mockRejectedValue(new PokeApiError('se cayó la red'))
    const types = useTypesStore()

    await types.load()

    expect(types.error).toBe('se cayó la red')
    expect(types.isLoaded).toBe(false)
  })
})

describe('typesOf', () => {
  it('devuelve los tipos ordenados por slot', async () => {
    const types = useTypesStore()
    await types.load()

    expect(types.typesOf(1)).toEqual(['grass', 'poison'])
  })

  it('devuelve un array vacío para un id desconocido', async () => {
    const types = useTypesStore()
    await types.load()

    expect(types.typesOf(9999)).toEqual([])
  })

  it('devuelve siempre el MISMO array vacío', () => {
    const types = useTypesStore()

    // Uno nuevo por llamada rompería la memoización de cualquier computed que
    // lo use: la referencia cambiaría en cada render.
    expect(types.typesOf(1)).toBe(types.typesOf(2))
  })
})

describe('primaryTypeOf', () => {
  it('devuelve el tipo del slot 1, que gobierna el color de la tarjeta', async () => {
    const types = useTypesStore()
    await types.load()

    expect(types.primaryTypeOf(1)).toBe('grass')
    expect(types.primaryTypeOf(4)).toBe('fire')
  })

  it('devuelve undefined si no hay dato', () => {
    expect(useTypesStore().primaryTypeOf(1)).toBeUndefined()
  })
})

describe('weaknessesOf', () => {
  it('une las debilidades de todos los tipos del Pokémon', async () => {
    const types = useTypesStore()
    await types.load()

    // grass: fire, ice, poison, flying, bug · poison: ground, psychic
    expect(types.weaknessesOf(1)).toEqual(
      expect.arrayContaining(['fire', 'ice', 'flying', 'bug', 'ground', 'psychic']),
    )
  })

  it('no lista como debilidad un tipo que el Pokémon tiene', async () => {
    const types = useTypesStore()
    await types.load()

    // `grass` es débil a `poison`, pero Bulbasaur ES de tipo poison.
    expect(types.weaknessesOf(1)).not.toContain('poison')
  })

  it('no duplica una debilidad compartida por los dos tipos', async () => {
    const types = useTypesStore()
    await types.load()

    const result = types.weaknessesOf(1)
    expect(new Set(result).size).toBe(result.length)
  })
})
