/**
 * Plantilla de tests del cliente de API (E5).
 *
 * `it.todo` los deja listados en el reporte de Vitest sin fallar: sirve de
 * checklist vivo. Se van cambiando a `it` a medida que se implementa.
 *
 * La red se mockea siempre (`vi.stubGlobal('fetch', ...)`), nunca se pega a
 * PokéAPI de verdad: un test que depende de internet no es un test.
 */

import { describe, it } from 'vitest'

describe('extractIdFromUrl', () => {
  it.todo('extrae el id de una url del listado')
  it.todo('funciona con y sin barra final')
})

describe('toPokemon', () => {
  it.todo('convierte hectogramos a kilogramos')
  it.todo('convierte decímetros a metros')
  it.todo('aplana types a un array de strings')
  it.todo('cae al sprite por defecto si no hay official-artwork')
})

describe('fetchPokemonList', () => {
  it.todo('pide el universo completo, no los 20 por defecto')
  it.todo('lanza PokeApiError con el status cuando la respuesta no es ok')
  it.todo('lanza PokeApiError cuando falla la red')
})

describe('fetchPokemonByName', () => {
  it.todo('devuelve el modelo de dominio, no la respuesta cruda')
  it.todo('propaga un 404 como PokeApiError con status 404')
})
