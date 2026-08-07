// Datos y helpers compartidos por los specs.

import { createRouter, createWebHistory } from 'vue-router'
import type { Router } from 'vue-router'
import type { Pokemon, PokemonListItem } from '@/api/types'

export const TOTAL_POKEMON = 1351
export const ROW_HEIGHT = 114
export const DEBOUNCE_MS = 200

export const PIKACHU: Pokemon = {
  id: 25,
  name: 'pikachu',
  height: 0.4,
  weight: 6,
  types: ['electric'],
  imageUrl: 'https://img/artwork.png',
  ability: 'static',
}

/** Nombres predecibles: `pokemon-0`, `pokemon-1`, … */
export function makeListItems(n: number): PokemonListItem[] {
  return Array.from({ length: n }, (_, i) => ({
    name: `pokemon-${i}`,
    url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
    id: i + 1,
  }))
}

/** `pokemonIds` acepta `[id, slot]` para armar Pokémon de dos tipos. */
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

/** Router real: con un stub de `RouterLink` no se probaría que el `to` resuelve. */
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

/** jsdom no hace layout: sin esto `clientHeight` da 0 y no se renderiza nada. */
export function stubViewportHeight(px = 600): void {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: px,
  })
}

/** Decide las columnas de la grilla. jsdom arranca siempre en 1024. */
export function stubViewportWidth(px: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: px })
}
