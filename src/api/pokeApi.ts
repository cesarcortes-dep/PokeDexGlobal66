/**
 * Cliente de la PokéAPI. ÚNICA capa de la app que hace `fetch`.
 *
 * Ni componentes ni stores llaman a la red directo (E3).
 * Solo dos endpoints permitidos por el enunciado (F3, F4).
 */

import type { Pokemon, PokemonDetailResponse, PokemonListItem } from './types'

const BASE_URL = 'https://pokeapi.co/api/v2'

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
 * TODO: wrapper de `fetch` con manejo de errores.
 * - lanzar PokeApiError si !response.ok (con el status)
 * - lanzar PokeApiError si el fetch falla (sin red)
 * - devolver el JSON tipado
 */
export async function request<T>(path: string): Promise<T> {
  throw new PokeApiError(`TODO: implementar request() para ${BASE_URL}${path}`)
}

/**
 * Listado completo en UNA request (ADR-0004).
 *
 * OJO: sin `limit` la API devuelve 20. Hay que pedir el universo entero para que
 * la búsqueda no dé falsos negativos.
 *
 * TODO: decidir entre pedir `?limit=1` para leer `count` y después el total,
 * o mandar un `?limit=` grande de una. Medir y anotar el resultado en el journal.
 */
export async function fetchPokemonList(): Promise<PokemonListItem[]> {
  throw new PokeApiError('TODO: implementar fetchPokemonList()')
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
  throw new Error(`TODO: implementar extractIdFromUrl() para "${url}"`)
}
