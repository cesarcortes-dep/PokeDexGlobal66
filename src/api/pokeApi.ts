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
  TypeIndex,
  TypeResponse,
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

  const results =
    page.results.length < page.count
      ? (await request<PokemonListResponse>(`/pokemon?limit=${page.count}`)).results
      : page.results

  // El id se resuelve acá, una vez, y no en cada render de cada fila.
  return results.map((item) => ({ ...item, id: extractIdFromUrl(item.url) }))
}

/**
 * Cantidad de tipos reales. La API devuelve 21, pero `stellar`, `unknown` y
 * `shadow` no son tipos de Pokémon jugables y no aparecen en ningún diseño.
 * Los 18 primeros ids son exactamente los 18 que define el Figma.
 */
const REAL_TYPE_COUNT = 18

/**
 * Índice de tipos (ADR-0007).
 *
 * `GET /pokemon` no devuelve tipos, y el Figma pinta cada fila con el color de su
 * tipo primario. Pedir el detalle de cada Pokémon costaría 271 KB por fila; estos
 * 18 requests cuestan 383 KB **en total** y cubren los 1351.
 *
 * Van en paralelo a propósito: en serie tardan ~9 s, juntos ~220 ms.
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
      // Se indexa por slot y no con push: los 18 tipos llegan en paralelo, así que
      // el orden de resolución es arbitrario y "primario" no puede ser "el primero
      // que llegó". El slot es el único dato que dice cuál es cuál.
      current[entry.slot - 1] = type.name
      byPokemon.set(id, current)
    }
  }

  // El `filter` limpia los huecos que deja indexar por slot cuando un Pokémon
  // tiene solo tipo secundario en algún dato raro de la API.
  for (const [id, names] of byPokemon) {
    byPokemon.set(id, names.filter(Boolean))
  }

  return { byPokemon, weaknesses }
}

/**
 * URL del sprite a partir del id, sin gastar una llamada a la API (ADR-0007).
 *
 * PokéAPI sirve los sprites desde una ruta predecible en GitHub, así que el
 * `id` que ya se extrajo del listado alcanza. Es una request de imagen, no de
 * datos: no cuenta contra el presupuesto de llamadas y va lazy.
 */
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

/** Detalle de un Pokémon. Se llama solo al abrirlo, nunca en bucle sobre la lista. */
export async function fetchPokemonByName(name: string): Promise<Pokemon> {
  const raw = await request<PokemonDetailResponse>(`/pokemon/${encodeURIComponent(name)}`)
  return toPokemon(raw)
}

/**
 * Traduce la respuesta cruda al modelo de dominio.
 *
 * Función pura y exportada a propósito: se puede testear sin tocar la red,
 * y es donde viven las conversiones (hectogramos→kg, decímetros→m).
 */
export function toPokemon(raw: PokemonDetailResponse): Pokemon {
  return {
    id: raw.id,
    name: raw.name,
    // La API devuelve decímetros y hectogramos. Nadie dice que un Pokémon mide
    // 7 decímetros, así que la conversión vive acá y la UI recibe m y kg.
    height: raw.height / 10,
    weight: raw.weight / 10,
    // `slot` es el orden oficial (tipo primario, secundario). El array puede venir
    // en cualquier orden, así que se ordena en vez de confiar en la posición.
    types: [...raw.types].sort((a, b) => a.slot - b.slot).map((entry) => entry.type.name),
    // El artwork oficial es el grande del Figma; `front_default` es el sprite
    // chico de 96px. Se cae al segundo porque no todas las formas tienen artwork.
    imageUrl: raw.sprites.other?.['official-artwork']?.front_default ?? raw.sprites.front_default,
    // La habilidad visible es la primera no oculta. Las `is_hidden` son las que
    // en el juego solo aparecen en encuentros especiales, y el Figma no las
    // distingue: mostrarlas confundiría más de lo que aporta.
    ability:
      [...raw.abilities]
        .filter((entry) => !entry.is_hidden)
        .sort((a, b) => a.slot - b.slot)[0]?.ability.name ?? null,
  }
}

/** Extrae el id de la url del listado, sin gastar una request. Ej: ".../pokemon/25/" → 25 */
export function extractIdFromUrl(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\/?$/)

  if (!match) {
    throw new PokeApiError(`URL de listado con formato inesperado: "${url}"`)
  }

  return Number(match[1])
}
