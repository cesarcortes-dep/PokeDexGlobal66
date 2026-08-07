/**
 * Tipos de la PokéAPI.
 *
 * Regla (README: stack): se tipan SOLO los campos que la app usa, no el schema
 * completo. Tipar de más es lo contrario de KISS y no aporta nada al evaluador.
 *
 * Contrato real de la API:
 *   GET /api/v2/pokemon?limit=N  → PokemonListResponse
 *   GET /api/v2/pokemon/{name}   → PokemonDetailResponse
 */

/** Ítem crudo del listado, tal como llega de la API: solo `name` y `url`. */
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

/**
 * Ítem del listado ya usable por la UI.
 *
 * El `id` se resuelve **una vez al cargar** y no en cada render: la lista lo
 * necesita para el `N°001` y para armar la URL del sprite, y son 1351 ítems.
 */
export interface PokemonListItem extends RawListItem {
  id: number
}

/**
 * Respuesta cruda del detalle, recortada a lo que se muestra.
 * El Figma no incluye el botón de compartir ni dice qué debería copiar, así que
 * el criterio es propio: se copian los atributos que la pantalla muestra.
 */
export interface PokemonDetailResponse {
  id: number
  name: string
  /** Hectogramos. Dividir por 10 para kg. */
  weight: number
  /** Decímetros. Dividir por 10 para metros. */
  height: number
  types: Array<{ slot: number; type: { name: string } }>
  /** El Figma muestra una sola habilidad; `is_hidden` marca las secundarias. */
  abilities: Array<{ ability: { name: string }; is_hidden: boolean; slot: number }>
  sprites: {
    other?: {
      'official-artwork'?: { front_default: string | null }
    }
    front_default: string | null
  }
}

/**
 * Respuesta de `GET /type/{n}`, recortada a lo que la app usa.
 *
 * Este endpoint entró al alcance por el conflicto entre el Figma y los "dos
 * llamados", y resuelve dos cosas de una: los
 * tipos de todos los Pokémon (que `GET /pokemon` no devuelve) y las debilidades
 * que el detalle muestra.
 */
export interface TypeResponse {
  name: string
  /** Cada Pokémon de este tipo, con el slot que ocupa (1 = tipo primario). */
  pokemon: Array<{ pokemon: RawListItem; slot: number }>
  damage_relations: {
    /** Tipos que le hacen daño doble → las "debilidades" del Figma. */
    double_damage_from: Array<{ name: string }>
  }
}

/**
 * Índice de tipos, construido una vez al arrancar.
 *
 * Vive como `Map` y no como objeto plano porque la lista pregunta por el tipo de
 * cada fila visible mientras scrollea: `get()` es O(1) y las claves son números.
 */
export interface TypeIndex {
  /** id de Pokémon → sus tipos, ya ordenados por slot. */
  byPokemon: Map<number, string[]>
  /** nombre de tipo → tipos que le hacen daño doble. */
  weaknesses: Map<string, string[]>
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
  /**
   * Habilidad principal, ya en singular. El Figma muestra una sola, así que el
   * mapper elige la no oculta de menor `slot` en vez de hacer que la UI decida.
   */
  ability: string | null
}
