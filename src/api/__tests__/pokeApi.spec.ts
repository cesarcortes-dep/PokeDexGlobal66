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
import {
  PokeApiError,
  extractIdFromUrl,
  fetchPokemonByName,
  fetchPokemonList,
  fetchTypeIndex,
  spriteUrl,
  toPokemon,
} from '../pokeApi'
import { makeTypeResponse } from '@/__tests__/fixtures'
import type { PokemonDetailResponse, PokemonListResponse } from '../types'

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

  it('agrega el id resolviéndolo una vez, no en cada render', async () => {
    mockFetchOk(listResponse(['bulbasaur', 'ivysaur']))

    const items = await fetchPokemonList()

    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({
      name: 'bulbasaur',
      url: 'https://pokeapi.co/api/v2/pokemon/1/',
      id: 1,
    })
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

/** Respuesta de detalle recortada a lo que la app usa. */
function detailResponse(overrides: Partial<PokemonDetailResponse> = {}): PokemonDetailResponse {
  return {
    id: 25,
    name: 'pikachu',
    weight: 60, // hectogramos → 6 kg
    height: 4, // decímetros → 0.4 m
    types: [{ slot: 1, type: { name: 'electric' } }],
    sprites: {
      other: { 'official-artwork': { front_default: 'https://img/artwork.png' } },
      front_default: 'https://img/sprite.png',
    },
    ...overrides,
  }
}

describe('spriteUrl', () => {
  it('arma la url del sprite desde el id, sin request a la API', () => {
    expect(spriteUrl(25)).toContain('/pokemon/25.png')
  })
})

describe('fetchTypeIndex', () => {
  /** Los 18 tipos reales, con solo unos pocos poblados. */
  function mockTypes() {
    const responses = Array.from({ length: 18 }, (_, i) => makeTypeResponse(`tipo-${i + 1}`, []))
    // grass: bulbasaur en slot 1 · poison: bulbasaur en slot 2 · fire: charmander
    responses[0] = makeTypeResponse('grass', [[1, 1]], ['fire', 'ice'])
    responses[1] = makeTypeResponse('poison', [[1, 2]], ['ground', 'psychic'])
    responses[2] = makeTypeResponse('fire', [4], ['water'])
    return responses
  }

  it('pide los 18 tipos reales, no los 21 que devuelve la API', async () => {
    const fetchMock = mockFetchOk(...mockTypes())

    await fetchTypeIndex()

    expect(fetchMock).toHaveBeenCalledTimes(18)
  })

  it('indexa los tipos por id de Pokémon, ordenados por slot', async () => {
    mockFetchOk(...mockTypes())

    const index = await fetchTypeIndex()

    expect(index.byPokemon.get(1)).toEqual(['grass', 'poison'])
    expect(index.byPokemon.get(4)).toEqual(['fire'])
  })

  it('respeta el slot aunque las respuestas lleguen en otro orden', async () => {
    // Los 18 van en paralelo: el orden de resolución es arbitrario, así que el
    // tipo primario no puede ser "el primero que llegó".
    const responses = mockTypes()
    ;[responses[0], responses[1]] = [responses[1]!, responses[0]!]
    mockFetchOk(...responses)

    const index = await fetchTypeIndex()

    expect(index.byPokemon.get(1)).toEqual(['grass', 'poison'])
  })

  it('guarda las debilidades de cada tipo', async () => {
    mockFetchOk(...mockTypes())

    const index = await fetchTypeIndex()

    expect(index.weaknesses.get('grass')).toEqual(['fire', 'ice'])
  })

  it('propaga el error si falla alguno de los 18', async () => {
    const responses = mockTypes()
    const fetchMock = vi.fn()
    responses.forEach((payload, i) => {
      fetchMock.mockResolvedValueOnce(
        i === 5
          ? { ok: false, status: 500, json: async () => ({}) }
          : { ok: true, status: 200, json: async () => payload },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTypeIndex()).rejects.toThrow(PokeApiError)
  })
})

describe('toPokemon', () => {
  it('convierte hectogramos a kilogramos', () => {
    expect(toPokemon(detailResponse({ weight: 60 })).weight).toBe(6)
  })

  it('convierte decímetros a metros', () => {
    expect(toPokemon(detailResponse({ height: 4 })).height).toBe(0.4)
  })

  it('aplana types a un array de strings', () => {
    const raw = detailResponse({
      types: [
        { slot: 1, type: { name: 'grass' } },
        { slot: 2, type: { name: 'poison' } },
      ],
    })

    expect(toPokemon(raw).types).toEqual(['grass', 'poison'])
  })

  it('ordena los types por slot y no por posición en el array', () => {
    const raw = detailResponse({
      types: [
        { slot: 2, type: { name: 'poison' } },
        { slot: 1, type: { name: 'grass' } },
      ],
    })

    expect(toPokemon(raw).types).toEqual(['grass', 'poison'])
  })

  it('prefiere el artwork oficial', () => {
    expect(toPokemon(detailResponse()).imageUrl).toBe('https://img/artwork.png')
  })

  it('cae al sprite por defecto si no hay official-artwork', () => {
    const raw = detailResponse({ sprites: { front_default: 'https://img/sprite.png' } })

    expect(toPokemon(raw).imageUrl).toBe('https://img/sprite.png')
  })

  it('devuelve null si no hay ninguna imagen', () => {
    const raw = detailResponse({ sprites: { front_default: null } })

    expect(toPokemon(raw).imageUrl).toBeNull()
  })
})

describe('fetchPokemonByName', () => {
  it('devuelve el modelo de dominio, no la respuesta cruda', async () => {
    mockFetchOk(detailResponse())

    const pokemon = await fetchPokemonByName('pikachu')

    // Las unidades ya convertidas y sin rastro de la forma de la API.
    expect(pokemon).toEqual({
      id: 25,
      name: 'pikachu',
      height: 0.4,
      weight: 6,
      types: ['electric'],
      imageUrl: 'https://img/artwork.png',
    })
    expect(pokemon).not.toHaveProperty('sprites')
  })

  it('propaga un 404 como PokeApiError con status 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    )

    await expect(fetchPokemonByName('missingno')).rejects.toMatchObject({
      name: 'PokeApiError',
      status: 404,
    })
  })

  it('escapa el nombre en la url', async () => {
    const fetchMock = mockFetchOk(detailResponse())

    await fetchPokemonByName('mr mime')

    expect(urlOfCall(fetchMock, 0).pathname).toContain('mr%20mime')
  })
})
