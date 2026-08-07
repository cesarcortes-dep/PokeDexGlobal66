// Cliente de la PokéAPI. Única capa de la app que hace `fetch`.

import type {
  Pokemon,
  PokemonDetailResponse,
  PokemonListItem,
  PokemonListResponse,
  TypeIndex,
  TypeResponse,
} from './types'

const BASE_URL = 'https://pokeapi.co/api/v2'

// Techo con holgura para traer el catálogo entero (1351) en una sola request.
// Leer `count` primero costaría un round trip extra por 168 bytes.
const LIST_LIMIT = 2000

/** Error tipado para que la UI distinga "no existe" de "se cayó la red". */
export class PokeApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'PokeApiError'
  }
}

/**
 * Normaliza los dos modos de falla: `fetch` solo rechaza si no hubo respuesta,
 * mientras que un 404 o un 500 llegan resueltos con `ok === false`.
 */
export async function request<T>(path: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${BASE_URL}${path}`)
  } catch {
    throw new PokeApiError(`No se pudo conectar con la PokéAPI (${path})`)
  }

  if (!response.ok) {
    throw new PokeApiError(`La PokéAPI respondió ${response.status} en ${path}`, response.status)
  }

  return (await response.json()) as T
}

/**
 * Listado completo en una request. Sin `limit` la API devuelve 20, y filtrar
 * sobre eso daría falsos negativos en la búsqueda.
 *
 * El segundo `request` es la red de seguridad de `LIST_LIMIT`, no el caso normal.
 */
export async function fetchPokemonList(): Promise<PokemonListItem[]> {
  const page = await request<PokemonListResponse>(`/pokemon?limit=${LIST_LIMIT}`)

  const results =
    page.results.length < page.count
      ? (await request<PokemonListResponse>(`/pokemon?limit=${page.count}`)).results
      : page.results

  // El id se resuelve acá, una vez, y no en cada render de cada fila.
  return results.map((item) => ({ ...item, id: extractIdFromUrl(item.url) }))
}

// La API devuelve 21, pero `stellar`, `unknown` y `shadow` no son jugables.
const REAL_TYPE_COUNT = 18

/**
 * Índice de tipos para toda la lista: `GET /pokemon` no los devuelve y el diseño
 * pinta cada fila con el color de su tipo primario.
 *
 * En paralelo a propósito: en serie tardan ~9 s, juntos ~220 ms.
 */
export async function fetchTypeIndex(): Promise<TypeIndex> {
  const types = await Promise.all(
    Array.from({ length: REAL_TYPE_COUNT }, (_, i) => request<TypeResponse>(`/type/${i + 1}`)),
  )

  const byPokemon = new Map<number, string[]>()
  const weaknesses = new Map<string, string[]>()

  for (const type of types) {
    weaknesses.set(
      type.name,
      type.damage_relations.double_damage_from.map((entry) => entry.name),
    )

    for (const entry of type.pokemon) {
      const id = extractIdFromUrl(entry.pokemon.url)
      const current = byPokemon.get(id) ?? []
      // Por slot y no con push: los 18 llegan en paralelo, así que el primario no
      // puede ser el primero que llegó.
      current[entry.slot - 1] = type.name
      byPokemon.set(id, current)
    }
  }

  // Limpia los huecos que deja indexar por slot.
  for (const [id, names] of byPokemon) {
    byPokemon.set(id, names.filter(Boolean))
  }

  return { byPokemon, weaknesses }
}

/** La ruta es predecible, así que el sprite no cuesta una llamada de datos. */
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

/** Detalle de un Pokémon. Se llama solo al abrirlo, nunca en bucle sobre la lista. */
export async function fetchPokemonByName(name: string): Promise<Pokemon> {
  const raw = await request<PokemonDetailResponse>(`/pokemon/${encodeURIComponent(name)}`)
  return toPokemon(raw)
}

/**
 * Traduce la respuesta cruda al modelo de dominio. Pura y exportada: se testea
 * sin tocar la red, y acá viven las conversiones de unidad.
 */
export function toPokemon(raw: PokemonDetailResponse): Pokemon {
  return {
    id: raw.id,
    name: raw.name,
    // La API devuelve decímetros y hectogramos.
    height: raw.height / 10,
    weight: raw.weight / 10,
    // Se ordena por `slot` en vez de confiar en la posición del array.
    types: [...raw.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
    // No todas las formas tienen artwork oficial; el fallback es el sprite chico.
    imageUrl: raw.sprites.other?.['official-artwork']?.front_default ?? raw.sprites.front_default,
    // La primera no oculta: las `is_hidden` no se distinguen en el diseño.
    ability:
      [...raw.abilities].filter((entry) => !entry.is_hidden).sort((a, b) => a.slot - b.slot)[0]
        ?.ability.name ?? null,
  }
}

/** ".../pokemon/25/" → 25 */
export function extractIdFromUrl(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\/?$/)

  if (!match) {
    throw new PokeApiError(`URL de listado con formato inesperado: "${url}"`)
  }

  return Number(match[1])
}
