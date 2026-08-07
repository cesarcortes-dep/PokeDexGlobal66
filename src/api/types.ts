// Se tipan solo los campos que la app usa, no el schema completo de la PokéAPI.

/** Lo que devuelve el listado: solo `name` y `url`. */
export interface RawListItem {
  name: string
  /** Ej: "https://pokeapi.co/api/v2/pokemon/25/" — el id sale de acá. */
  url: string
}

export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: RawListItem[]
}

/** El `id` se resuelve una vez al cargar, no en cada render de cada fila. */
export interface PokemonListItem extends RawListItem {
  id: number
}

export interface PokemonDetailResponse {
  id: number
  name: string
  /** Hectogramos. Dividir por 10 para kg. */
  weight: number
  /** Decímetros. Dividir por 10 para metros. */
  height: number
  types: Array<{ slot: number; type: { name: string } }>
  /** `is_hidden` marca las secundarias. */
  abilities: Array<{ ability: { name: string }; is_hidden: boolean; slot: number }>
  sprites: {
    other?: {
      'official-artwork'?: { front_default: string | null }
    }
    front_default: string | null
  }
}

/**
 * Resuelve dos cosas de una: los tipos de todos los Pokémon, que `GET /pokemon`
 * no devuelve, y las debilidades que muestra el detalle.
 */
export interface TypeResponse {
  name: string
  /** Cada Pokémon de este tipo, con el slot que ocupa (1 = tipo primario). */
  pokemon: Array<{ pokemon: RawListItem; slot: number }>
  damage_relations: {
    /** Tipos que le hacen daño doble: las debilidades del detalle. */
    double_damage_from: Array<{ name: string }>
  }
}

/** `Map` y no objeto plano: la lista pregunta por cada fila visible al scrollear. */
export interface TypeIndex {
  /** id de Pokémon → sus tipos, ya ordenados por slot. */
  byPokemon: Map<number, string[]>
  /** nombre de tipo → tipos que le hacen daño doble. */
  weaknesses: Map<string, string[]>
}

/**
 * Modelo de dominio. Separado de `PokemonDetailResponse` a propósito: si la
 * PokéAPI cambia, cambia el mapper y nada más.
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
  /** Ya en singular: el mapper elige la no oculta de menor `slot`. */
  ability: string | null
}
