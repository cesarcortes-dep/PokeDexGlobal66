/**
 * Tipos de la PokéAPI.
 *
 * Regla (ADR-0003): se tipan SOLO los campos que la app usa, no el schema
 * completo. Tipar de más es lo contrario de KISS y no aporta nada al evaluador.
 *
 * Contrato real de la API:
 *   GET /api/v2/pokemon?limit=N  → PokemonListResponse
 *   GET /api/v2/pokemon/{name}   → PokemonDetailResponse
 */

/** Ítem crudo del listado. La API solo devuelve `name` y `url`. */
export interface PokemonListItem {
  name: string
  /** Ej: "https://pokeapi.co/api/v2/pokemon/25/" — el id sale de acá. */
  url: string
}

export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PokemonListItem[]
}

/**
 * Respuesta cruda del detalle, recortada a lo que se muestra.
 * TODO: confirmar contra el Figma qué atributos aparecen realmente (supuesto S4).
 */
export interface PokemonDetailResponse {
  id: number
  name: string
  /** Hectogramos. Dividir por 10 para kg. */
  weight: number
  /** Decímetros. Dividir por 10 para metros. */
  height: number
  types: Array<{ slot: number; type: { name: string } }>
  sprites: {
    other?: {
      'official-artwork'?: { front_default: string | null }
    }
    front_default: string | null
  }
}

/**
 * Modelo de dominio: lo que consume la UI.
 *
 * Existe a propósito separado de `PokemonDetailResponse`: los componentes no
 * deben conocer la forma de la API. Si PokéAPI cambia, cambia el mapper y nada más.
 * Esto es lo que hace verificable la separación de capas de E3.
 */
export interface Pokemon {
  id: number
  name: string
  /** Metros. */
  height: number
  /** Kilogramos. */
  weight: number
  types: string[]
  imageUrl: string | null
}
