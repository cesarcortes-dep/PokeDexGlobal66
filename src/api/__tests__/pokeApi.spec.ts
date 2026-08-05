/**
 * Tests del cliente de API (E5).
 *
 * `it.todo` deja listado en el reporte de Vitest lo que todavía no se implementó:
 * sirve de checklist vivo. Se van cambiando a `it` a medida que se avanza.
 *
 * La red se mockea siempre (`vi.stubGlobal('fetch', ...)`), nunca se pega a
 * PokéAPI de verdad: un test que depende de internet no es un test.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { PokeApiError, extractIdFromUrl, fetchPokemonList } from '../pokeApi'
import type { PokemonListResponse } from '../types'

/** Respuesta de listado mínima, con el `count` coherente con los `results`. */
function listResponse(names: string[], count = names.length): PokemonListResponse {
  return {
    count,
    next: null,
    previous: null,
    results: names.map((name, i) => ({
      name,
      url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
    })),
  }
}

/** Mockea `fetch` devolviendo, en orden, una respuesta ok por cada payload. */
function mockFetchOk(...payloads: unknown[]) {
  const fetchMock = vi.fn()
  payloads.forEach((payload) => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => payload })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** URL con la que se llamó a `fetch` en la enésima llamada. */
function urlOfCall(fetchMock: ReturnType<typeof vi.fn>, index: number): URL {
  const call = fetchMock.mock.calls[index]
  if (!call) throw new Error(`No hubo llamada a fetch en el índice ${index}`)
  return new URL(String(call[0]))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('extractIdFromUrl', () => {
  it('extrae el id de una url del listado', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25)
  })

  it('funciona con y sin barra final', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/151')).toBe(151)
  })

  it('lanza PokeApiError si la url no tiene el formato esperado', () => {
    expect(() => extractIdFromUrl('https://pokeapi.co/api/v2/berry/1/')).toThrow(PokeApiError)
  })
})

describe('fetchPokemonList', () => {
  it('pide el universo completo, no los 20 por defecto', async () => {
    const fetchMock = mockFetchOk(listResponse(['bulbasaur', 'ivysaur']))

    await fetchPokemonList()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const limit = Number(urlOfCall(fetchMock, 0).searchParams.get('limit'))
    expect(limit).toBeGreaterThan(1351) // count real medido el 2026-08-05
  })

  it('devuelve los results tal cual los da la API', async () => {
    mockFetchOk(listResponse(['bulbasaur', 'ivysaur']))

    const items = await fetchPokemonList()

    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' })
  })

  it('reintenta con el count real si el limit se quedó corto', async () => {
    // Primera respuesta truncada: dice que hay 3 pero devuelve 2.
    const fetchMock = mockFetchOk(
      listResponse(['bulbasaur', 'ivysaur'], 3),
      listResponse(['bulbasaur', 'ivysaur', 'venusaur']),
    )

    const items = await fetchPokemonList()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(urlOfCall(fetchMock, 1).searchParams.get('limit')).toBe('3')
    expect(items).toHaveLength(3)
  })

  it('lanza PokeApiError con el status cuando la respuesta no es ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    )

    await expect(fetchPokemonList()).rejects.toMatchObject({
      name: 'PokeApiError',
      status: 500,
    })
  })

  it('lanza PokeApiError cuando falla la red', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const error = await fetchPokemonList().catch((e) => e)

    expect(error).toBeInstanceOf(PokeApiError)
    expect(error.status).toBeUndefined() // sin respuesta no hay status: así la UI los distingue
  })
})

describe('toPokemon', () => {
  it.todo('convierte hectogramos a kilogramos')
  it.todo('convierte decímetros a metros')
  it.todo('aplana types a un array de strings')
  it.todo('cae al sprite por defecto si no hay official-artwork')
})

describe('fetchPokemonByName', () => {
  it.todo('devuelve el modelo de dominio, no la respuesta cruda')
  it.todo('propaga un 404 como PokeApiError con status 404')
})
