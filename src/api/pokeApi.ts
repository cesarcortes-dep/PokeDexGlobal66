/**
 * Cliente de la PokéAPI. ÚNICA capa de la app que hace `fetch`.
 *
 * Ni componentes ni stores llaman a la red directo (E3).
 * Solo dos endpoints permitidos por el enunciado (F3, F4).
 */

import type {
  Pokemon,
  PokemonDetailResponse,
  PokemonListItem,
  PokemonListResponse,
} from './types'

const BASE_URL = 'https://pokeapi.co/api/v2'

/**
 * Techo para pedir el universo entero en una sola request.
 *
 * Medido el 2026-08-05: `count` = 1351. Con `?limit=100000` la API devuelve todo
 * en 91 KB y `next: null`. Leer `count` primero costaría un round trip extra por
 * 168 bytes, así que se pide directo con holgura.
 *
 * Si algún día el catálogo supera este número, `fetchPokemonList` lo detecta y
 * corrige: truncar en silencio daría falsos negativos en la búsqueda.
 */
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
 * Wrapper de `fetch`. Todo lo que sale a la red pasa por acá.
 *
 * Normaliza los dos modos de falla en un único tipo de error: `fetch` solo
 * rechaza si no hubo respuesta (sin red, CORS, DNS); un 404 o un 500 llegan como
 * promesa resuelta con `ok === false`. La UI necesita distinguirlos, y con
 * `status` puede.
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
 * Listado completo en UNA request (ADR-0004, F3).
 *
 * OJO: sin `limit` la API devuelve 20. Hay que pedir el universo entero para que
 * la búsqueda no dé falsos negativos.
 *
 * El chequeo `results.length < count` es la red de seguridad de `LIST_LIMIT`:
 * en el caso normal no se cumple nunca y la función hace una sola request.
 */
export async function fetchPokemonList(): Promise<PokemonListItem[]> {
  const page = await request<PokemonListResponse>(`/pokemon?limit=${LIST_LIMIT}`)

  if (page.results.length < page.count) {
    const full = await request<PokemonListResponse>(`/pokemon?limit=${page.count}`)
    return full.results
  }

  return page.results
}

/** Detalle de un Pokémon. Se llama solo al abrirlo, nunca en bucle sobre la lista. */
export async function fetchPokemonByName(name: string): Promise<Pokemon> {
  throw new PokeApiError(`TODO: implementar fetchPokemonByName("${name}")`)
}

/**
 * Traduce la respuesta cruda al modelo de dominio.
 *
 * Función pura y exportada a propósito: se puede testear sin tocar la red,
 * y es donde viven las conversiones (hectogramos→kg, decímetros→m).
 */
export function toPokemon(raw: PokemonDetailResponse): Pokemon {
  throw new Error(`TODO: implementar toPokemon() para "${raw.name}"`)
}

/** Extrae el id de la url del listado, sin gastar una request. Ej: ".../pokemon/25/" → 25 */
export function extractIdFromUrl(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\/?$/)

  if (!match) {
    throw new PokeApiError(`URL de listado con formato inesperado: "${url}"`)
  }

  return Number(match[1])
}
