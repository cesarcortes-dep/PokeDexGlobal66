/**
 * Fixtures y helpers compartidos por los tests.
 *
 * No es un archivo de tests: Vitest solo recoge `*.spec.ts`, así que este no se
 * ejecuta como suite. Vive acá para que los datos de prueba tengan una sola
 * definición — los mismos objetos estaban repetidos en tres specs (E4, DRY).
 *
 * Lo que **no** se puede compartir es el `vi.mock` del cliente de API: se hoistea
 * al tope del archivo que lo declara, así que cada spec arma el suyo.
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { Router } from 'vue-router'
import type { Pokemon, PokemonListItem } from '@/api/types'

/** El universo real, medido contra la PokéAPI el 2026-08-05. */
export const TOTAL_POKEMON = 1351

/** Alto de fila y debounce, en sincronía con lo que usa la app. */
export const ROW_HEIGHT = 114 // tarjeta 102 + gap 12
export const DEBOUNCE_MS = 200

/** Modelo de dominio ya mapeado, tal como lo devuelve `toPokemon()`. */
export const PIKACHU: Pokemon = {
  id: 25,
  name: 'pikachu',
  height: 0.4,
  weight: 6,
  types: ['electric'],
  imageUrl: 'https://img/artwork.png',
  ability: 'static',
}

/** Ítems de listado con nombres predecibles: `pokemon-0`, `pokemon-1`, … */
export function makeListItems(n: number): PokemonListItem[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `pokemon-${i}`,
    url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
    id: i + 1,
  }))
}

/**
 * Respuesta de `/type/{n}` recortada a lo que usa el índice.
 *
 * `pokemonIds` acepta `[id, slot]` para poder armar Pokémon de dos tipos.
 */
export function makeTypeResponse(
  name: string,
  pokemonIds: Array<number | [number, number]>,
  doubleDamageFrom: string[] = [],
) {
  return {
    name,
    pokemon: pokemonIds.map((entry) => {
      const [id, slot] = Array.isArray(entry) ? entry : [entry, 1]
      return {
        pokemon: { name: `pokemon-${id}`, url: `https://pokeapi.co/api/v2/pokemon/${id}/` },
        slot,
      }
    }),
    damage_relations: { double_damage_from: doubleDamageFrom.map((n) => ({ name: n })) },
  }
}

/**
 * Router real y no un stub de `RouterLink`: las vistas arman `to` con nombres de
 * ruta y parámetros, y con un stub el test no probaría que ese `to` resuelve.
 * Los componentes son irrelevantes acá — lo que importa es que las rutas existan.
 */
export function makeTestRouter(): Router {
  const stub = { template: '<div />' }

  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'list', component: stub },
      { path: '/favoritos', name: 'favorites', component: stub },
      { path: '/pokemon/:name', name: 'detail', component: stub, props: true },
    ],
  })
}

/**
 * jsdom no hace layout: `clientHeight` siempre da 0 y el virtual scroll
 * calcularía cero filas visibles. Hay que falsearlo antes de montar.
 */
export function stubViewportHeight(px = 600): void {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: px,
  })
}

/**
 * Ancho de ventana, que es lo que decide cuántas columnas tiene la grilla
 * (README: adaptación a desktop). jsdom arranca en 1024, así que sin esto los tests medirían siempre
 * el mismo layout y nunca el de escritorio.
 */
export function stubViewportWidth(px: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: px })
}
